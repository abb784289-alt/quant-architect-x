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
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-gold-soft text-foreground px-3 py-1 text-[11px] font-semibold mb-3 border border-gold/30">
          مرحلة التأسيس · قبل الأقسام
        </div>
        <h1 className="text-3xl font-bold text-foreground">قسم التأسيس الشامل</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          أربعة محاور جوهرية يشرحها أ. أسامة فتح الدين لبناء قاعدة رياضية صلبة قبل الدخول للأقسام الـ 150.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {FOUNDATION_CATEGORIES.map((c, i) => {
          const asset = assets?.[c.id];
          const ready = Boolean(asset?.videoUrl || asset?.formulas);
          return (
            <Link
              key={c.id}
              to="/foundation/$categoryId"
              params={{ categoryId: c.id }}
              className="luxury-card p-6 hover:-translate-y-0.5 hover:shadow-lg hover:border-teal/50 transition-all block"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal to-teal-deep text-white grid place-items-center text-2xl font-bold shadow-md">
                  {c.icon}
                </div>
                <span className="text-xs text-muted-foreground">المحور {i + 1} / 4</span>
              </div>
              <h2 className="font-display text-xl font-bold text-foreground mb-1">{c.title}</h2>
              <p className="text-xs text-muted-foreground mb-4">{c.subtitle}</p>
              <div className="flex items-center justify-between text-xs">
                <span className={ready ? "text-teal-deep font-semibold" : "text-muted-foreground"}>
                  {ready ? "المحتوى جاهز" : "بانتظار المحتوى"}
                </span>
                <span className="text-teal-deep font-semibold">ابدأ الشرح ←</span>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}