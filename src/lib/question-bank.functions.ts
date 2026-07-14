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
    const { data, error } = await context.supabase
      .from("question_bank")
      .select("section_number, questions, updated_at");
    if (error) throw new Error(error.message);
    return data ?? [];
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
        section_number: z.number().int().min(1).max(500),
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