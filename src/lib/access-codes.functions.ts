import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

function randomCode(len = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars
  let out = "";
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  for (let i = 0; i < len; i++) out += alphabet[buf[i] % alphabet.length];
  return out;
}

export const hasRedeemedCode = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("code_redemptions").select("code").eq("user_id", context.userId).maybeSingle();
    if (error) throw new Error(error.message);
    // Admins bypass the gate.
    const { data: role } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    return { redeemed: !!data || !!role, isAdmin: !!role };
  });

export const redeemCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ code: z.string().min(3).max(64) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: res, error } = await supabaseAdmin.rpc("redeem_access_code", {
      _uid: context.userId,
      _code: data.code,
    });
    if (error) throw new Error(error.message);
    return res as { ok: boolean; error?: string; already?: boolean };
  });

export const listAccessCodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: codes, error } = await context.supabase
      .from("access_codes")
      .select("code, expires_at, disabled, note, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const { data: reds } = await context.supabase
      .from("code_redemptions").select("code, user_id, redeemed_at");
    const counts = new Map<string, number>();
    (reds ?? []).forEach((r: any) => counts.set(r.code, (counts.get(r.code) ?? 0) + 1));
    return (codes ?? []).map((c: any) => ({ ...c, redemptions: counts.get(c.code) ?? 0 }));
  });

export const createAccessCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      expires_at: z.string().datetime().nullable().optional(),
      note: z.string().max(200).optional().nullable(),
      count: z.number().int().min(1).max(50).default(1),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const rows = Array.from({ length: data.count }, () => ({
      code: randomCode(8),
      expires_at: data.expires_at ?? null,
      note: data.note ?? null,
      created_by: context.userId,
    }));
    const { data: inserted, error } = await context.supabase
      .from("access_codes").insert(rows).select("code");
    if (error) throw new Error(error.message);
    return inserted ?? [];
  });

export const setCodeDisabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ code: z.string().min(3), disabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("access_codes").update({ disabled: data.disabled }).eq("code", data.code);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAccessCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ code: z.string().min(3) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    // remove redemptions first (FK RESTRICT)
    await context.supabase.from("code_redemptions").delete().eq("code", data.code);
    const { error } = await context.supabase.from("access_codes").delete().eq("code", data.code);
    if (error) throw new Error(error.message);
    return { ok: true };
  });