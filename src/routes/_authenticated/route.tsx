import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedShell,
});

function AuthedShell() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin")
      .maybeSingle().then(({ data }) => setIsAdmin(!!data));
  }, [user.id]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div dir="rtl" className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-teal-deep/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-gold/40 bg-teal-deep/60 font-display text-gold-gradient">م</div>
            <span className="font-display font-bold">المِقْيَاس</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">لوحتي</Link>
            {isAdmin && <Link to="/admin" className="text-gold hover:text-gold-soft">لوحة التحكم</Link>}
            <span className="hidden text-xs text-muted-foreground md:inline">{user.email}</span>
            <button onClick={signOut} className="rounded-full border border-white/10 px-3 py-1.5 text-xs hover:border-gold/40">
              خروج
            </button>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}