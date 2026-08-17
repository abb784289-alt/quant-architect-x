import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadSession, clearSession, type Session } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { hydrateQuestionBankFromServer } from "@/lib/platform-config";
import { hasRedeemedCode, redeemCode } from "@/lib/access-codes.functions";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: RoleAwareShell,
});

function RoleAwareShell() {
  const { t, dir } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [gate, setGate] = useState<"checking" | "locked" | "open">("checking");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Ensure a Supabase session exists before calling authenticated server
      // functions, otherwise the bearer attacher sends no Authorization header.
      const { data: { session: sbSession } } = await supabase.auth.getSession();
      if (!sbSession) { window.location.replace("/auth"); return; }
      if (cancelled) return;
      loadSession().then((s) => { if (!cancelled) setSession(s); });
      hydrateQuestionBankFromServer();
      try {
        const r = await hasRedeemedCode();
        if (!cancelled) setGate(r?.redeemed ? "open" : "locked");
      } catch {
        if (!cancelled) setGate("locked");
      }
    })();
    return () => { cancelled = true; };
  }, []);
  const isAdmin = session?.role === "admin";

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link to="/tracks" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal to-teal-deep text-white font-display font-bold shadow-md">م</div>
            <div className="leading-tight">
              <div className="font-display font-bold text-foreground">{t("brand.name")}</div>
              <div className="text-[10px] text-muted-foreground">{t("brand.sub")}</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <LanguageToggle className="ms-1" />
            <Link to="/tracks" className="rounded-lg px-3 py-2 text-foreground/80 hover:bg-surface-2 hover:text-teal-deep transition-colors">
              {t("nav.tracks")}
            </Link>
            <Link to="/dashboard" search={{ track: "quantitative" } as any} className="rounded-lg px-3 py-2 text-teal-deep hover:bg-teal-soft transition-colors">
              {t("nav.quant")}
            </Link>
            <Link to="/dashboard" search={{ track: "verbal" } as any} className="rounded-lg px-3 py-2 text-foreground hover:bg-gold-soft transition-colors">
              {t("nav.verbal")}
            </Link>
            {isAdmin && (
              <Link to="/admin" className="rounded-lg px-3 py-2 text-gold hover:bg-gold-soft transition-colors font-semibold">
                {t("nav.admin")}
              </Link>
            )}
            {session ? (
              <button
                type="button"
                onClick={async () => { await clearSession(); window.location.href = "/auth"; }}
                className="mr-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-teal hover:text-teal-deep transition-colors"
              >
                {t("nav.logout")}
              </button>
            ) : (
              <Link to="/auth" className="mr-2 rounded-full bg-teal text-white px-3 py-1.5 text-xs hover:bg-teal-deep transition-colors">
                {t("nav.login")}
              </Link>
            )}
          </nav>
        </div>
      </header>
      {gate === "checking" ? (
        <div dir={dir} className="min-h-[60vh] grid place-items-center text-muted-foreground">{t("common.verifying")}</div>
      ) : gate === "locked" ? (
        <CodeGate onUnlocked={() => setGate("open")} />
      ) : (
        <Outlet />
      )}
    </div>
  );
}

function CodeGate({ onUnlocked }: { onUnlocked: () => void }) {
  const { t, dir } = useI18n();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await redeemCode({ data: { code: code.trim().toUpperCase() } });
      if (res?.ok) { onUnlocked(); return; }
      const map: Record<string, string> = {
        invalid: t("gate.invalid"),
        disabled: t("gate.disabled"),
        expired: t("gate.expired"),
        not_authenticated: t("gate.notAuth"),
      };
      setErr(map[res?.error ?? ""] ?? t("gate.failed"));
    } catch (e: any) {
      setErr(e?.message ?? t("gate.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main dir={dir} className="mx-auto max-w-md px-6 py-16">
      <div className="luxury-card p-8 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-teal to-teal-deep text-white text-2xl font-bold shadow-lg">🔑</div>
        <h1 className="font-display text-2xl font-bold text-teal-gradient mb-2">{t("gate.title")}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t("gate.lead")}</p>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXXXXXX"
            dir="ltr"
            autoFocus
            className="w-full text-center tracking-[0.4em] font-mono text-xl rounded-xl bg-surface-1 border border-border focus:border-teal focus:ring-2 focus:ring-teal/30 outline-none px-4 py-4 text-foreground uppercase"
          />
          {err && <div className="text-sm rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2">{err}</div>}
          <button type="submit" disabled={busy || code.trim().length < 3}
            className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-l from-teal to-teal-deep hover:opacity-95 transition-all shadow-md hover:shadow-lg disabled:opacity-60">
            {busy ? t("gate.checking") : t("gate.submit")}
          </button>
        </form>
        <p className="text-[11px] text-muted-foreground mt-6">
          {t("gate.note")}
        </p>
      </div>
    </main>
  );
}