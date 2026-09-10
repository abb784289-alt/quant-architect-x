import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ProMaxChapterSetting = { slug: string; title: string | null; parts: number; hidden: boolean };
export type ProMaxQuestionSetting = { question_id: string; chapter_slug: string; correct_index: number | null; hidden: boolean };

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const getProMaxSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [chapters, questions] = await Promise.all([
      context.supabase.from("pro_max_chapter_settings").select("slug,title,parts,hidden"),
      context.supabase.from("pro_max_question_settings").select("question_id,chapter_slug,correct_index,hidden"),
    ]);
    if (chapters.error) throw new Error(chapters.error.message);
    if (questions.error) throw new Error(questions.error.message);
    return {
      chapters: (chapters.data ?? []) as ProMaxChapterSetting[],
      questions: (questions.data ?? []) as ProMaxQuestionSetting[],
    };
  });

export const saveProMaxChapter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      slug: z.string().min(1).max(80),
      title: z.string().max(160).nullable().optional(),
      parts: z.number().int().min(1).max(8),
      hidden: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("pro_max_chapter_settings")
      .upsert(
        { slug: data.slug, title: data.title ?? null, parts: data.parts, hidden: data.hidden, updated_at: new Date().toISOString() },
        { onConflict: "slug" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveProMaxQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      question_id: z.string().min(1).max(80),
      chapter_slug: z.string().min(1).max(80),
      correct_index: z.number().int().min(0).max(3).nullable(),
      hidden: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("pro_max_question_settings")
      .upsert(
        {
          question_id: data.question_id,
          chapter_slug: data.chapter_slug,
          correct_index: data.correct_index,
          hidden: data.hidden,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "question_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
