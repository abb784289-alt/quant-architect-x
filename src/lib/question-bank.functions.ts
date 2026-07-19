import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const fetchAllQuestionBank = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Answer keys are not returned to non-admin callers. Strip correctIndex
    // and explanation before returning; grading runs server-side via
    // gradeSectionAttempt below.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("question_bank")
      .select("section_number, questions, updated_at");
    if (error) throw new Error(error.message);
    const { data: adminRow } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    const isAdmin = !!adminRow;
    if (isAdmin) return data ?? [];
    return (data ?? []).map((row: any) => ({
      ...row,
      questions: Array.isArray(row.questions)
        ? row.questions.map((q: any) => {
            const { correctIndex, explanation, ...rest } = q ?? {};
            void correctIndex; void explanation;
            return rest;
          })
        : row.questions,
    }));
  });

// Server-side grading: takes the student's answers keyed by question id and
// returns per-question correctness plus the correct index for review. Never
// exposes the entire answer key up front.
export const gradeSectionAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        section_number: z.number().int().min(1).max(3000),
        answers: z.record(z.string(), z.number().int().min(0).max(3)),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("question_bank")
      .select("questions")
      .eq("section_number", data.section_number)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const questions = (row?.questions ?? []) as Array<{ id: string; correctIndex: 0 | 1 | 2 | 3 }>;
    let correct = 0;
    const results: Record<string, { correctIndex: 0 | 1 | 2 | 3; ok: boolean }> = {};
    for (const q of questions) {
      const ans = data.answers[q.id];
      const ok = ans === q.correctIndex;
      if (ok) correct += 1;
      results[q.id] = { correctIndex: q.correctIndex, ok };
    }
    return { correct, total: questions.length, results };
  });

const QuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  latex: z.string().optional(),
  imageUrl: z.string().optional(),
  svg: z.string().optional(),
  tableHtml: z.string().optional(),
  choices: z.array(z.string()).length(4),
  correctIndex: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
});

export const saveSectionQuestionBank = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        section_number: z.number().int().min(1).max(3000),
        questions: z.array(QuestionSchema).max(500),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("question_bank")
      .upsert({
        section_number: data.section_number,
        questions: data.questions,
        updated_by: context.userId,
        updated_at: new Date().toISOString(),
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });