import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

export const submitQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        question_text: z.string().trim().max(4000).optional().nullable(),
        question_image_path: z.string().trim().max(500).optional().nullable(),
      })
      .refine(
        (v) =>
          (v.question_text && v.question_text.length > 0) ||
          (v.question_image_path && v.question_image_path.length > 0),
        { message: "اكتب سؤالك أو ارفع صورة" },
      )
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Enforce path prefix if image supplied
    if (data.question_image_path) {
      const prefix = `${context.userId}/`;
      if (!data.question_image_path.startsWith(prefix)) {
        throw new Error("مسار الصورة غير صالح");
      }
    }
    const { data: row, error } = await supabaseAdmin
      .from("student_questions")
      .insert({
        user_id: context.userId,
        question_text: data.question_text || null,
        question_image_path: data.question_image_path || null,
      })
      .select("id, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, created_at: row.created_at };
  });

export const listMyQuestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("student_questions")
      .select("id, question_text, question_image_path, reply_text, reply_video_path, replied_at, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listAllQuestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) {
      throw new Error("Forbidden: admin only");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("student_questions")
      .select("id, user_id, question_text, question_image_path, reply_text, reply_video_path, replied_at, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const replyToQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        reply_text: z.string().trim().max(8000).optional().nullable(),
        reply_video_path: z.string().trim().max(500).optional().nullable(),
      })
      .refine(
        (v) =>
          (v.reply_text && v.reply_text.length > 0) ||
          (v.reply_video_path && v.reply_video_path.length > 0),
        { message: "أضِف رسالة أو فيديو للرد" },
      )
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) {
      throw new Error("Forbidden: admin only");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("student_questions")
      .update({
        reply_text: data.reply_text || null,
        reply_video_path: data.reply_video_path || null,
        replied_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) {
      throw new Error("Forbidden: admin only");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("student_questions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Return a signed URL for either a question image or a reply video.
// Students can only fetch URLs for their own question rows; admins can fetch any.
export const getMediaSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        question_id: z.string().uuid(),
        kind: z.enum(["image", "video"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("student_questions")
      .select("user_id, question_image_path, reply_video_path")
      .eq("id", data.question_id)
      .maybeSingle();
    if (error || !row) throw new Error(error?.message || "غير موجود");
    const admin = await isAdmin(context.supabase, context.userId);
    if (!admin && row.user_id !== context.userId) throw new Error("Forbidden");
    const path = data.kind === "image" ? row.question_image_path : row.reply_video_path;
    if (!path) return { url: null };
    const bucket = data.kind === "image" ? "question-images" : "reply-videos";
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60);
    if (sErr) throw new Error(sErr.message);
    return { url: signed?.signedUrl ?? null };
  });