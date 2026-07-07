import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { readSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/foundation")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "قسم التأسيس الشامل — منصة المِقْيَاس" },
      { name: "description", content: "قسم التأسيس قيد العمل — سيتم إطلاقه قريباً بمحاور الأستاذ أسامة فتح الدين." },
    ],
  }),
  component: FoundationGate,
});

function FoundationGate() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    const s = readSession();
    if (!s) { setOk(false); window.location.replace("/auth"); return; }
    setOk(true);
  }, []);
  if (ok) return <FoundationComingSoon />;
  return <div dir="rtl" className="min-h-[60vh] grid place-items-center text-muted-foreground">جارٍ التحميل...</div>;
}

function FoundationComingSoon() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16" dir="rtl">
      <div className="luxury-card p-10 text-center">
        <div className="mx-auto mb-6 h-20 w-20 rounded-3xl bg-gradient-to-br from-gold-soft to-white border border-gold/40 grid place-items-center text-4xl">
          🛠️
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-gold-soft text-foreground px-3 py-1 text-[11px] font-semibold mb-4 border border-gold/40">
          قيد العمل
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">قسم التأسيس الشامل</h1>
        <p className="text-sm text-muted-foreground leading-7 max-w-lg mx-auto mb-6">
          يجهّز الأستاذ أسامة فتح الدين حالياً محاور التأسيس (النسبة والتناسب، الهندسة، الإحصاء، المتوسطات). سيتم إطلاقها قريباً بشكل متكامل.
        </p>
        <a href="/dashboard" className="inline-block rounded-xl bg-teal text-white px-6 py-3 text-sm font-bold hover:bg-teal-deep transition-colors">
          الذهاب للأقسام الـ 150
        </a>
      </div>
    </main>
  );
}