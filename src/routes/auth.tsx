import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — منصة المِقْيَاس" },
      { name: "description", content: "سجّل دخولك أو أنشئ حسابًا لبدء رحلتك في منصة المِقْيَاس مع أ. أسامة فتح الدين." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err.message || "حدث خطأ. حاول مرة أخرى.");
    } finally { setLoading(false); }
  }

  return (
    <main dir="rtl" className="relative min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6">
        <div className="glass-card w-full p-8">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <span>←</span> الرئيسية
          </Link>
          <h1 className="font-display text-3xl font-black">
            {mode === "signin" ? "أهلاً بك مجدداً" : "أنشئ حسابك"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin" ? "ادخل لمواصلة رحلتك في المِقْيَاس." : "ابدأ رحلة التميّز في القسم الكمي."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <div>
                <label className="mb-1.5 block text-xs text-gold-soft">الاسم الكامل</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full rounded-xl border border-white/10 bg-teal-deep/60 px-4 py-3 outline-none focus:border-gold/60" />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs text-gold-soft">البريد الإلكتروني</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-teal-deep/60 px-4 py-3 outline-none focus:border-gold/60" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-gold-soft">كلمة المرور</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="w-full rounded-xl border border-white/10 bg-teal-deep/60 px-4 py-3 outline-none focus:border-gold/60" />
            </div>

            {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive-foreground">{error}</div>}

            <button type="submit" disabled={loading}
              className="w-full rounded-full bg-gradient-to-l from-gold to-gold-soft px-6 py-3.5 font-display font-bold text-primary-foreground transition hover:scale-[1.01] disabled:opacity-60">
              {loading ? "..." : mode === "signin" ? "تسجيل الدخول" : "إنشاء الحساب"}
            </button>
          </form>

          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-6 w-full text-center text-xs text-muted-foreground hover:text-foreground">
            {mode === "signin" ? "ليس لديك حساب؟ أنشئ حسابًا الآن" : "لديك حساب بالفعل؟ سجّل الدخول"}
          </button>
        </div>
      </div>
    </main>
  );
}