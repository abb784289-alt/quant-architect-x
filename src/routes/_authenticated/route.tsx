import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  component: PublicBypassShell,
});

function PublicBypassShell() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-teal-deep/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-gold/40 bg-teal-deep/60 font-display text-gold-gradient">
              م
            </div>
            <span className="font-display font-bold">المِقْيَاس</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
              لوحة الـ 150 قسم
            </Link>
            <Link to="/admin" className="text-gold hover:text-gold-soft">
              لوحة التحكم
            </Link>
            <Link to="/auth" className="rounded-full border border-white/10 px-3 py-1.5 text-xs hover:border-gold/40">
              صفحة الاختيار
            </Link>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}