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

const CategoryEnum = z.enum(["algebra", "geometry", "arithmetic", "statistics"]);

const BulkRow = z.object({
  title: z.string().min(1),
  category: CategoryEnum,
  order_index: z.number().int().optional().default(0),
  timer_seconds: z.number().int().min(30).max(24 * 3600).optional().default(1500),
  description: z.string().optional().nullable(),
});

export const bulkUpsertSections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ rows: z.array(BulkRow).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const payload = data.rows.map((r) => ({
      title: r.title,
      category: r.category,
      order_index: r.order_index ?? 0,
      timer_seconds: r.timer_seconds ?? 1500,
      description: r.description ?? null,
      published: true,
    }));
    const { error, data: inserted } = await context.supabase
      .from("sections")
      .insert(payload)
      .select("id");
    if (error) throw new Error(error.message);
    return { inserted: inserted?.length ?? 0 };
  });

export const setSectionTimer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), timer_seconds: z.number().int().min(30).max(24 * 3600) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("sections").update({ timer_seconds: data.timer_seconds }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const attachSectionVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), video_path: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("sections").update({ video_path: data.video_path }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("sections").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const grantSelfAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Bootstrap: if there are ZERO admins, allow the caller to become the first admin.
    const { data: existing, error: eErr } = await context.supabase
      .from("user_roles").select("id").eq("role", "admin").limit(1);
    if (eErr) throw new Error(eErr.message);
    if (existing && existing.length > 0) throw new Error("An admin already exists.");
    const { error } = await context.supabase
      .from("user_roles").insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { roles: (data ?? []).map((r) => r.role) };
  });

// Sample section seeder for empty databases (admin only)
export const seedSampleSections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const cats = ["algebra", "geometry", "arithmetic", "statistics"] as const;
    const rows: Array<{title:string; category:typeof cats[number]; order_index:number; timer_seconds:number}> = [];
    const names: Record<typeof cats[number], string[]> = {
      algebra: ["المعادلات الخطية", "المتباينات", "الأسس واللوغاريتمات", "كثيرات الحدود"],
      geometry: ["الزوايا والمستقيمات", "المثلثات", "الدوائر", "المساحات والحجوم"],
      arithmetic: ["النسبة والتناسب", "النسبة المئوية", "الأعداد الأولية", "القسمة والباقي"],
      statistics: ["الوسط الحسابي", "الوسيط والمنوال", "الاحتمالات", "قراءة الجداول"],
    };
    cats.forEach((c) => names[c].forEach((n, i) =>
      rows.push({ title: n, category: c, order_index: i, timer_seconds: 900 })));
    const { data, error } = await context.supabase.from("sections").insert(rows).select("id");
    if (error) throw new Error(error.message);
    return { inserted: data?.length ?? 0 };
  });