import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SkillSetting = { skill_id: number; title: string | null; hidden: boolean };
export type SkillQuestionSetting = {
  question_id: string;
  skill_id: number;
  correct_index: number | null;
  hidden: boolean;
};

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const getSkillSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [skills, questions] = await Promise.all([
      context.supabase.from("skill_settings").select("skill_id,title,hidden"),
      context.supabase.from("skill_question_settings").select("question_id,skill_id,correct_index,hidden"),
    ]);
    if (skills.error) throw new Error(skills.error.message);
    if (questions.error) throw new Error(questions.error.message);
    return {
      skills: (skills.data ?? []) as SkillSetting[],
      questions: (questions.data ?? []) as SkillQuestionSetting[],
    };
  });

export const saveSkillSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      skill_id: z.number().int().min(1).max(500),
      title: z.string().max(160).nullable().optional(),
      hidden: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("skill_settings")
      .upsert(
        { skill_id: data.skill_id, title: data.title ?? null, hidden: data.hidden, updated_at: new Date().toISOString() },
        { onConflict: "skill_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveSkillQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      question_id: z.string().min(1).max(80),
      skill_id: z.number().int().min(1).max(500),
      correct_index: z.number().int().min(0).max(3).nullable(),
      hidden: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("skill_question_settings")
      .upsert(
        {
          question_id: data.question_id,
          skill_id: data.skill_id,
          correct_index: data.correct_index,
          hidden: data.hidden,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "question_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
