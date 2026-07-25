import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ScopeEnum = z.enum(["section", "foundation"]);
const TrackEnum = z.enum(["quantitative", "verbal"]);

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const listMediaAssets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("media_assets")
      .select("scope,track,key,video_path,updated_at");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertMediaAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      scope: ScopeEnum,
      track: TrackEnum.default("quantitative"),
      key: z.string().min(1).max(100),
      video_path: z.string().min(1).max(500),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("media_assets")
      .upsert(
        { scope: data.scope, track: data.track, key: data.key, video_path: data.video_path, updated_at: new Date().toISOString() },
        { onConflict: "scope,track,key" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMediaAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      scope: ScopeEnum,
      track: TrackEnum.default("quantitative"),
      key: z.string().min(1).max(100),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("media_assets")
      .select("video_path")
      .eq("scope", data.scope).eq("track", data.track).eq("key", data.key)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { video_path: row?.video_path ?? null };
  });