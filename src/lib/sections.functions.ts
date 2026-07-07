import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listSections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("sections")
      .select("id,title,description,category,order_index,video_path,timer_seconds,published")
      .order("category")
      .order("order_index");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: section, error } = await context.supabase
      .from("sections")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!section) throw new Error("Section not found");

    const { data: questions, error: qErr } = await context.supabase
      .from("questions")
      .select("id,prompt,choices,correct_index,explanation,order_index")
      .eq("section_id", data.id)
      .order("order_index");
    if (qErr) throw new Error(qErr.message);

    let videoUrl: string | null = null;
    if (section.video_path) {
      const { data: signed } = await context.supabase.storage
        .from("lecture-videos")
        .createSignedUrl(section.video_path, 60 * 60);
      videoUrl = signed?.signedUrl ?? null;
    }
    return { section, questions: questions ?? [], videoUrl };
  });