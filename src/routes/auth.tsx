import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "بوابة الدخول — منصة المِقْيَاس الذكية" },
      { name: "description", content: "تسجيل الدخول وإنشاء حساب جديد في منصة المِقْيَاس الذكية للأستاذ أسامة فتح الدين — دخول فوري وآمن." },
    ],
  }),
  component: LuxuryAuthPage,
});

const ADMIN_EMAIL = "admin@miqyas.com";
const ADMIN_PASSWORD = "admin@100percent";
const ACCOUNT_KEY = "user_account";
const SESSION_KEY = "session";

type StoredAccount = {
  fullName: string;
  email: string;
  password: string;
  mobile: string;
  createdAt: string;
};

type Tab = "login" | "register";
type Banner = { kind: "success" | "error" | "info"; text: string } | null;

function LuxuryAuthPage() {
  const [tab, setTab] = useState<Tab>("login");
  const [banner, setBanner] = useState<Banner>(null);

  // login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regMobile, setRegMobile] = useState("");

  useEffect(() => {
    if (banner) {
      const t = setTimeout(() => setBanner(null), 5000);
      return () => clearTimeout(t);
    }
  }, [banner]);

  function handleLogin(e: FormEvent) {
    e.preventDefault();
    const email = loginEmail.trim();
    const password = loginPassword;

    if (!email || !password) {
      setBanner({ kind: "error", text: "من فضلك أدخل البريد وكلمة المرور." });
      return;
    }

    // Admin bypass
    if (email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ role: "admin", email, at: new Date().toISOString() }),
      );
      window.location.href = "/admin";
      return;
    }

    let account: StoredAccount | null = null;
    try {
      const raw = localStorage.getItem(ACCOUNT_KEY);
      account = raw ? (JSON.parse(raw) as StoredAccount) : null;
    } catch {
      account = null;
    }

    if (!account || account.email.toLowerCase() !== email.toLowerCase()) {
      setBanner({
        kind: "error",
        text: "لا يوجد حساب بهذا البريد — أنشئ حساباً جديداً أولاً.",
      });
      return;
    }
    if (account.password !== password) {
      setBanner({ kind: "error", text: "كلمة المرور غير صحيحة." });
      return;
    }

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ role: "student", email, at: new Date().toISOString() }),
    );
    window.location.href = "/dashboard";
  }

  function handleRegister(e: FormEvent) {
    e.preventDefault();
    const fullName = regName.trim();
    const email = regEmail.trim();
    const password = regPassword;
    const mobile = regMobile.trim();

    if (!fullName || !email || !password || !mobile) {
      setBanner({ kind: "error", text: "من فضلك أكمل جميع الحقول." });
      return;
    }
    if (!email.includes("@") || email.length < 5) {
      setBanner({ kind: "error", text: "صيغة البريد الإلكتروني غير صحيحة." });
      return;
    }
    if (password.length < 6) {
      setBanner({ kind: "error", text: "كلمة المرور يجب أن تكون 6 أحرف فأكثر." });
      return;
    }
    if (mobile.replace(/\D/g, "").length < 8) {
      setBanner({ kind: "error", text: "رقم الجوال غير صحيح." });
      return;
    }

    const account: StoredAccount = {
      fullName,
      email,
      password,
      mobile,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));

    // switch to login, prefill email, show success
    setLoginEmail(email);
    setLoginPassword("");
    setRegName("");
    setRegEmail("");
    setRegPassword("");
    setRegMobile("");
    setTab("login");
    setBanner({
      kind: "success",
      text: "تم إنشاء حسابك بنجاح — سجّل الدخول الآن.",
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="glass-card gold-ring w-full max-w-md p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl font-bold text-gold-gradient mb-1">
            منصة المِقْيَاس الذكية
          </h1>
          <p className="text-sm text-muted-foreground">
            بوابة الدخول الرسمية — أ. أسامة فتح الدين
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/5 border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => { setTab("login"); setBanner(null); }}
            className={
              "py-2.5 rounded-xl text-sm font-semibold transition-all " +
              (tab === "login"
                ? "bg-gold text-[color:var(--primary-foreground)] shadow-lg"
                : "text-foreground/80 hover:bg-white/5")
            }
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => { setTab("register"); setBanner(null); }}
            className={
              "py-2.5 rounded-xl text-sm font-semibold transition-all " +
              (tab === "register"
                ? "bg-gold text-[color:var(--primary-foreground)] shadow-lg"
                : "text-foreground/80 hover:bg-white/5")
            }
          >
            إنشاء حساب جديد
          </button>
        </div>

        {banner && (
          <div
            role="status"
            className={
              "mb-4 text-sm rounded-xl px-4 py-3 border " +
              (banner.kind === "success"
                ? "bg-gold/15 border-gold/40 text-gold-soft"
                : banner.kind === "error"
                ? "bg-destructive/15 border-destructive/40 text-destructive-foreground"
                : "bg-white/10 border-white/20 text-foreground")
            }
          >
            {banner.text}
          </div>
        )}

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <Field
              label="البريد الإلكتروني"
              type="email"
              value={loginEmail}
              onChange={setLoginEmail}
              placeholder="name@example.com"
              autoComplete="email"
            />
            <Field
              label="كلمة المرور"
              type="password"
              value={loginPassword}
              onChange={setLoginPassword}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-bold text-[color:var(--primary-foreground)] bg-gradient-to-l from-gold to-gold-soft hover:opacity-95 transition-all shadow-lg hover:shadow-xl"
            >
              دخول
            </button>
            <p className="text-[11px] text-muted-foreground text-center pt-2">
              للأدمن: admin@miqyas.com
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            <Field
              label="الاسم بالكامل"
              type="text"
              value={regName}
              onChange={setRegName}
              placeholder="محمد أحمد"
              autoComplete="name"
            />
            <Field
              label="البريد الإلكتروني"
              type="email"
              value={regEmail}
              onChange={setRegEmail}
              placeholder="name@example.com"
              autoComplete="email"
            />
            <Field
              label="كلمة المرور"
              type="password"
              value={regPassword}
              onChange={setRegPassword}
              placeholder="6 أحرف فأكثر"
              autoComplete="new-password"
            />
            <Field
              label="رقم الجوال"
              type="tel"
              value={regMobile}
              onChange={setRegMobile}
              placeholder="05xxxxxxxx"
              autoComplete="tel"
            />
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-bold text-[color:var(--primary-foreground)] bg-gradient-to-l from-gold to-gold-soft hover:opacity-95 transition-all shadow-lg hover:shadow-xl"
            >
              إنشاء حساب
            </button>
          </form>
        )}

        <p className="text-[11px] text-muted-foreground mt-6 text-center">
          الدخول التجريبي محلي — يتم حفظ الحساب على جهازك دون الاتصال بقاعدة بيانات.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  type: "email" | "password" | "text" | "tel";
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-foreground/80 mb-1.5">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        dir={type === "email" || type === "tel" ? "ltr" : "rtl"}
        className="w-full rounded-xl bg-white/10 border border-white/15 focus:border-gold/60 focus:ring-2 focus:ring-gold/40 outline-none px-4 py-3 text-foreground placeholder:text-foreground/40 transition-all"
      />
    </label>
  );
}