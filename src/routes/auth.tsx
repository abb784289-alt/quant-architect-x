import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "بوابة الدخول — منصة المِقْيَاس الذكية" },
      { name: "description", content: "تسجيل الدخول وإنشاء حساب في منصة المِقْيَاس الذكية للأستاذ أسامة فتح الدين." },
      { property: "og:title", content: "بوابة الدخول — منصة المِقْيَاس الذكية" },
      { property: "og:description", content: "سجّل دخولك أو أنشئ حساباً للوصول إلى أقسام القدرات ومحاكي نمر التفاعلي." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://miqyas.info/auth" },
    ],
    links: [{ rel: "canonical", href: "https://miqyas.info/auth" }],
  }),
  component: LightAuthPage,
});

type Tab = "login" | "register";
type Banner = { kind: "success" | "error" | "info"; text: string } | null;

function LightAuthPage() {
  const [tab, setTab] = useState<Tab>("login");
  const [banner, setBanner] = useState<Banner>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      setBanner({ kind: "error", text: "تعذّر تسجيل الدخول عبر جوجل. حاول مجدداً." });
      return;
    }
    if (result.redirected) return;
    window.location.href = "/tracks";
  }

  // Sweep any legacy plaintext credentials/session left by the old client-side auth.
  useEffect(() => {
    try {
      localStorage.removeItem("user_account");
      localStorage.removeItem("session");
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (banner) {
      const t = setTimeout(() => setBanner(null), 5000);
      return () => clearTimeout(t);
    }
  }, [banner]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    const email = loginEmail.trim();
    const password = loginPassword;
    if (!email || !password) { setBanner({ kind: "error", text: "من فضلك أدخل البريد وكلمة المرور." }); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setBanner({ kind: "error", text: "بيانات الدخول غير صحيحة." }); return; }
    // Role (admin vs student) is resolved server-side via user_roles; go to dashboard,
    // admins can navigate to /admin from the header link.
    window.location.href = "/tracks";
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    const fullName = regName.trim();
    const email = regEmail.trim();
    const password = regPassword;
    const mobile = regMobile.trim();
    if (!fullName || !email || !password || !mobile) { setBanner({ kind: "error", text: "من فضلك أكمل جميع الحقول." }); return; }
    if (!email.includes("@") || email.length < 5) { setBanner({ kind: "error", text: "صيغة البريد الإلكتروني غير صحيحة." }); return; }
    if (password.length < 6) { setBanner({ kind: "error", text: "كلمة المرور يجب أن تكون 6 أحرف فأكثر." }); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/tracks`,
        data: { full_name: fullName, mobile },
      },
    });
    setBusy(false);
    if (error) {
      setBanner({ kind: "error", text: error.message.includes("registered") ? "هذا البريد مسجل بالفعل." : "تعذّر إنشاء الحساب." });
      return;
    }
    setBanner({ kind: "success", text: "تم إنشاء الحساب. تحقّق من بريدك لتأكيد الحساب ثم سجّل الدخول." });
    setTab("login");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="luxury-card w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-teal to-teal-deep text-white font-display text-2xl font-bold shadow-lg">م</div>
          <h1 className="font-display text-2xl font-bold text-teal-gradient mb-1">منصة المِقْيَاس الذكية</h1>
          <p className="text-xs text-muted-foreground">بوابة الدخول الرسمية — أ. أسامة فتح الدين</p>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-surface-2 border border-border mb-6">
          <button type="button" onClick={() => { setTab("login"); setBanner(null); }}
            className={"py-2.5 rounded-xl text-sm font-semibold transition-all " + (tab === "login" ? "bg-white text-teal-deep shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            تسجيل الدخول
          </button>
          <button type="button" onClick={() => { setTab("register"); setBanner(null); }}
            className={"py-2.5 rounded-xl text-sm font-semibold transition-all " + (tab === "register" ? "bg-white text-teal-deep shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            إنشاء حساب
          </button>
        </div>

        {banner && (
          <div role="status" className={"mb-4 text-sm rounded-xl px-4 py-3 border " +
            (banner.kind === "success" ? "bg-gold-soft border-gold/50 text-foreground"
              : banner.kind === "error" ? "bg-red-50 border-red-200 text-red-700"
              : "bg-surface-1 border-border text-foreground")}>{banner.text}</div>
        )}

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <Field label="البريد الإلكتروني" type="email" value={loginEmail} onChange={setLoginEmail} placeholder="name@example.com" autoComplete="email" />
            <Field label="كلمة المرور" type="password" value={loginPassword} onChange={setLoginPassword} placeholder="••••••••" autoComplete="current-password" />
            <button type="submit" disabled={busy} className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-l from-teal to-teal-deep hover:opacity-95 transition-all shadow-md hover:shadow-lg disabled:opacity-60">
              {busy ? "جارٍ الدخول..." : "دخول"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            <Field label="الاسم بالكامل" type="text" value={regName} onChange={setRegName} placeholder="محمد أحمد" autoComplete="name" />
            <Field label="البريد الإلكتروني" type="email" value={regEmail} onChange={setRegEmail} placeholder="name@example.com" autoComplete="email" />
            <Field label="كلمة المرور" type="password" value={regPassword} onChange={setRegPassword} placeholder="6 أحرف فأكثر" autoComplete="new-password" />
            <Field label="رقم الجوال" type="tel" value={regMobile} onChange={setRegMobile} placeholder="05xxxxxxxx" autoComplete="tel" />
            <button type="submit" disabled={busy} className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-l from-teal to-teal-deep hover:opacity-95 transition-all shadow-md hover:shadow-lg disabled:opacity-60">
              {busy ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
            </button>
          </form>
        )}

        <p className="text-[11px] text-muted-foreground mt-6 text-center">
          الدخول محمي عبر بروتوكولات آمنة — كلمة المرور لا تُخزَّن على جهازك.
        </p>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder, autoComplete }: {
  label: string; type: "email" | "password" | "text" | "tel"; value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-foreground mb-1.5">{label}</span>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete}
        dir={type === "email" || type === "tel" ? "ltr" : "rtl"}
        className="w-full rounded-xl bg-surface-1 border border-border focus:border-teal focus:ring-2 focus:ring-teal/30 outline-none px-4 py-3 text-foreground placeholder:text-muted-foreground/60 transition-all"
      />
    </label>
  );
}