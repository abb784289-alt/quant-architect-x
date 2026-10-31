import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type OAuthResult = { data: any; error: { message: string } | null };
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  head: () => ({ meta: [{ title: "ربط تطبيق — منصة المِقْيَاس" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("طلب الربط غير صالح أو منتهي.");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ href: "/auth?next=" + encodeURIComponent(next) });
    return { email: data.session.user.email ?? "" };
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(id);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main dir="rtl" className="mx-auto max-w-md px-6 py-16 text-center">
      <div className="luxury-card p-8">
        <h1 className="font-display text-xl font-bold mb-2">تعذّر تحميل طلب الربط</h1>
        <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { email } = Route.useRouteContext();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = details?.client?.name ?? "تطبيق خارجي";
  const scopes = String(details?.scope ?? "").split(" ").filter(Boolean);
  const label: Record<string, string> = { openid: "تأكيد هويتك", email: "مشاركة بريدك الإلكتروني", profile: "مشاركة ملفك الأساسي" };

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve ? await oauth().approveAuthorization(authorization_id) : await oauth().denyAuthorization(authorization_id);
    if (error) { setBusy(false); setError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError("لم يُرجع الخادم رابط العودة."); return; }
    window.location.href = target;
  }

  return (
    <main dir="rtl" className="min-h-screen grid place-items-center bg-background px-6">
      <div className="luxury-card w-full max-w-md p-8 space-y-4">
        <h1 className="font-display text-2xl font-bold">ربط {client} بمنصة المِقْيَاس</h1>
        <p className="text-sm text-muted-foreground">سيتمكن {client} من استخدام أدوات المنصة باسمك ({email}).</p>
        {details?.redirect_uri && <p className="text-xs text-muted-foreground break-all" dir="ltr">{details.redirect_uri}</p>}
        <ul className="text-sm list-disc pe-5 space-y-1">
          {scopes.map((s) => <li key={s}>{label[s] ?? `صلاحية إضافية: ${s}`}</li>)}
        </ul>
        <p className="text-xs text-muted-foreground">لا يتجاوز هذا صلاحيات المنصة وحماية البيانات.</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button disabled={busy} onClick={() => decide(true)} className="flex-1 rounded-xl bg-primary text-primary-foreground py-3 font-bold disabled:opacity-60">موافقة</button>
          <button disabled={busy} onClick={() => decide(false)} className="flex-1 rounded-xl border border-border py-3 disabled:opacity-60">إلغاء الربط</button>
        </div>
      </div>
    </main>
  );
}
