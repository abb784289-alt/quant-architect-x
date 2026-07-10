import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadSession, clearSession, type Session } from "@/lib/session";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: RoleAwareShell,
});

function RoleAwareShell() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => { loadSession().then(setSession); }, []);
  const isAdmin = session?.role === "admin";

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal to-teal-deep text-white font-display font-bold shadow-md">م</div>
            <div className="leading-tight">
              <div className="font-display font-bold text-foreground">المِقْيَاس</div>
              <div className="text-[10px] text-muted-foreground">أ. أسامة فتح الدين</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link to="/dashboard" className="rounded-lg px-3 py-2 text-foreground/80 hover:bg-surface-2 hover:text-teal-deep transition-colors">
              الـ 150 قسم
            </Link>
            <Link to="/foundation" className="rounded-lg px-3 py-2 text-foreground/80 hover:bg-surface-2 hover:text-teal-deep transition-colors">
              قسم التأسيس
            </Link>
            {isAdmin && (
              <Link to="/admin" className="rounded-lg px-3 py-2 text-gold hover:bg-gold-soft transition-colors font-semibold">
                لوحة التحكم
              </Link>
            )}
            {session ? (
              <button
                type="button"
                onClick={async () => { await clearSession(); window.location.href = "/auth"; }}
                className="mr-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-teal hover:text-teal-deep transition-colors"
              >
                تسجيل الخروج
              </button>
            ) : (
              <Link to="/auth" className="mr-2 rounded-full bg-teal text-white px-3 py-1.5 text-xs hover:bg-teal-deep transition-colors">
                تسجيل الدخول
              </Link>
            )}
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}