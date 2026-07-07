import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { createLovableAI } from "./ai-gateway.server";

export const startExamSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ section_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: section, error: sErr } = await context.supabase
      .from("sections")
      .select("id,title,timer_seconds")
      .eq("id", data.section_id)
      .maybeSingle();
    if (sErr || !section) throw new Error(sErr?.message || "Section not found");

    const { count } = await context.supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("section_id", data.section_id);

    const { data: session, error } = await context.supabase
      .from("exam_sessions")
      .insert({
        user_id: context.userId,
        section_id: data.section_id,
        total_questions: count ?? 0,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { session_id: session.id, timer_seconds: section.timer_seconds };
  });

const SubmitInput = z.object({
  session_id: z.string().uuid(),
  answers: z.array(z.number().int().nullable()),
  auto_submitted: z.boolean().optional(),
});

export const submitExamSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SubmitInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: session, error: sErr } = await context.supabase
      .from("exam_sessions")
      .select("id, user_id, section_id, started_at, submitted_at")
      .eq("id", data.session_id)
      .maybeSingle();
    if (sErr || !session) throw new Error(sErr?.message || "Session not found");
    if (session.user_id !== context.userId) throw new Error("Forbidden");
    if (session.submitted_at) throw new Error("Already submitted");

    const { data: section } = await context.supabase
      .from("sections")
      .select("id,title,category")
      .eq("id", session.section_id)
      .single();

    const { data: questions } = await context.supabase
      .from("questions")
      .select("id,prompt,correct_index,order_index")
      .eq("section_id", session.section_id)
      .order("order_index");

    const qs = questions ?? [];
    let score = 0;
    const skipped: number[] = [];
    const wrong: { idx: number; prompt: string }[] = [];
    qs.forEach((q, i) => {
      const ans = data.answers[i];
      if (ans === null || ans === undefined) skipped.push(i + 1);
      else if (ans === q.correct_index) score += 1;
      else wrong.push({ idx: i + 1, prompt: q.prompt });
    });

    const startedMs = new Date(session.started_at).getTime();
    const timeTaken = Math.max(0, Math.floor((Date.now() - startedMs) / 1000));

    // AI report
    let aiReport: unknown = null;
    try {
      aiReport = await generateAiReport({
        sectionTitle: section?.title ?? "",
        category: section?.category ?? "algebra",
        score,
        total: qs.length,
        timeTakenSeconds: timeTaken,
        skippedCount: skipped.length,
        wrongSamples: wrong.slice(0, 6).map((w) => w.prompt),
      });
    } catch (e) {
      console.error("AI report generation failed", e);
      aiReport = { fallback: true, message: "تعذّر توليد التقرير الذكي حاليًا." };
    }

    const { error: uErr } = await context.supabase
      .from("exam_sessions")
      .update({
        submitted_at: new Date().toISOString(),
        auto_submitted: data.auto_submitted ?? false,
        score,
        total_questions: qs.length,
        time_taken_seconds: timeTaken,
        answers: data.answers,
        ai_report: aiReport as never,
      })
      .eq("id", session.id);
    if (uErr) throw new Error(uErr.message);

    return { session_id: session.id, score, total: qs.length };
  });

async function generateAiReport(input: {
  sectionTitle: string;
  category: string;
  score: number;
  total: number;
  timeTakenSeconds: number;
  skippedCount: number;
  wrongSamples: string[];
}) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");

  const gateway = createLovableAI(key);
  const model = gateway("google/gemini-2.5-flash");

  const schema = z.object({
    mastery_percent: z.number(),
    mastery_label: z.string(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    roadmap: z.array(z.object({ section: z.string(), reason: z.string() })),
    coaching: z.string(),
  });

  const prompt = `أنت مساعد تدريبي داخلي لأكاديمية "المِقْيَاس" للأستاذ أسامة فتح الدين محمد.
حلّل نتيجة اختبار الطالب وأصدر تقريرًا احترافيًا بصياغة عربية فصيحة موجّه للطالب.

البيانات:
- القسم: ${input.sectionTitle} (${input.category})
- الدرجة: ${input.score} من ${input.total}
- الزمن المستغرق: ${input.timeTakenSeconds} ثانية
- الأسئلة المتجاوَزة: ${input.skippedCount}
- عيّنة من الأسئلة التي أخطأ فيها:
${input.wrongSamples.map((p, i) => `  ${i + 1}. ${p}`).join("\n") || "  (لا شيء)"}

أعِد النتيجة كـ JSON مطابق للمخطط. اجعل mastery_percent رقمًا من 0 إلى 100،
وroadmap قائمة بأسماء أقسام محددة يحتاج الطالب لإعادة مشاهدتها،
وcoaching فقرة تحفيزية قصيرة من صوت "الأستاذ أسامة" (٣-٤ جمل).`;

  try {
    const { output } = await generateText({
      model,
      output: Output.object({ schema }),
      prompt,
    });
    return output;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      return { fallback: true, raw: error.text ?? "" };
    }
    throw error;
  }
}

export const getExamReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ session_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: session, error } = await context.supabase
      .from("exam_sessions")
      .select("id,user_id,section_id,score,total_questions,time_taken_seconds,auto_submitted,submitted_at,ai_report")
      .eq("id", data.session_id)
      .maybeSingle();
    if (error || !session) throw new Error(error?.message || "Session not found");
    if (session.user_id !== context.userId) throw new Error("Forbidden");
    const { data: section } = await context.supabase
      .from("sections").select("title,category").eq("id", session.section_id).single();
    return { session, section };
  });