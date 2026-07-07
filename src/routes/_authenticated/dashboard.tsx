'use client';

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { readSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "لوحة الـ 150 قسم — منصة المِقْيَاس" },
      { name: "description", content: "داشبورد عامة منظمة لكل أقسام القدرات الكمي مع أزرار المشاهدة والاختبار والتدريب." },
    ],
  }),
  component: DashboardGate,
});

function DashboardGate() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    const s = readSession();
    if (!s) {
      setOk(false);
      window.location.replace("/auth");
      return;
    }
    setOk(true);
  }, []);
  if (ok) return <PublicDashboardPage />;
  return (
    <div dir="rtl" className="min-h-[60vh] grid place-items-center text-muted-foreground">
      جارٍ فتح لوحة الأقسام...
    </div>
  );
}

type QuantSection = {
  id: string;
  order: number;
  title: string;
  category: string;
  description: string;
  duration: number;
  level: "تأسيس" | "متوسط" | "متقدم";
};

const categories = [
  { name: "الجبر", icon: "∑", hint: "معادلات، متباينات، أنماط، ودوال" },
  { name: "الهندسة", icon: "△", hint: "زوايا، مثلثات، دوائر، ومساحات" },
  { name: "الحساب", icon: "÷", hint: "أعداد، قواسم، مضاعفات، وعمليات" },
  { name: "النسب والتناسب", icon: "%", hint: "نسب مئوية، تناسب طردي وعكسي" },
  { name: "الإحصاء والاحتمالات", icon: "≈", hint: "متوسطات، احتمالات، جداول وقراءة بيانات" },
  { name: "المقارنات الكمية", icon: "◇", hint: "تحليل سريع، تقدير، واختيار العلاقة الصحيحة" },
  { name: "الهندسة التحليلية", icon: "⟂", hint: "إحداثيات، ميل، مسافة، ومستقيمات" },
  { name: "المسائل اللفظية", icon: "؟", hint: "سرعة، عمل، أعمار، ومزيج مسائل القدرات" },
];

const sections: QuantSection[] = Array.from({ length: 150 }, (_, index) => {
  const category = categories[index % categories.length];
  const level = index % 3 === 0 ? "تأسيس" : index % 3 === 1 ? "متوسط" : "متقدم";
  return {
    id: `q-${index + 1}`,
    order: index + 1,
    title: `${category.name} — نموذج ${index + 1}`,
    category: category.name,
    description: `${category.hint} ضمن تدريب كمي مركز لاختبار القدرات.` ,
    duration: 20 + (index % 6) * 5,
    level,
  };
});

function PublicDashboardPage() {
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [selectedSection, setSelectedSection] = useState<QuantSection | null>(sections[0]);

  const filteredSections = useMemo(() => {
    if (activeCategory === "الكل") return sections;
    return sections.filter((section) => section.category === activeCategory);
  }, [activeCategory]);

  const groupedCounts = useMemo(
    () => categories.map((category) => ({ ...category, count: sections.filter((section) => section.category === category.name).length })),
    [],
  );

  return (
    <main className="min-h-screen bg-background text-foreground" dir="rtl">
      <section className="border-b border-white/10 bg-gradient-to-l from-teal-deep via-teal to-teal-deep px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-xs uppercase tracking-[0.3em] text-gold-soft">150 Quantitative Sections Dashboard</div>
          <h1 className="mt-3 font-display text-4xl font-black sm:text-5xl">لوحة أقسام القدرات الكمي</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
            خريطة عامة مفتوحة لكل الأقسام: الجبر، الهندسة، الحساب، الإحصاء، النسب، المقارنات، والمسائل اللفظية — بدون أي تحقق أو تحويلات.
          </p>
          <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">
            <HeroMetric label="إجمالي الأقسام" value="150" />
            <HeroMetric label="التصنيفات" value={String(categories.length)} />
            <HeroMetric label="اختبارات نمر" value="150" />
            <HeroMetric label="الوصول" value="مفتوح" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex gap-3 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setActiveCategory("الكل")}
            className={`shrink-0 rounded-full border px-5 py-2 text-sm transition ${activeCategory === "الكل" ? "border-gold bg-gold/15 text-gold-soft" : "border-white/10 bg-teal-deep/45 text-muted-foreground hover:border-gold/40"}`}
          >
            الكل · 150
          </button>
          {groupedCounts.map((category) => (
            <button
              key={category.name}
              type="button"
              onClick={() => setActiveCategory(category.name)}
              className={`shrink-0 rounded-full border px-5 py-2 text-sm transition ${activeCategory === category.name ? "border-gold bg-gold/15 text-gold-soft" : "border-white/10 bg-teal-deep/45 text-muted-foreground hover:border-gold/40"}`}
            >
              {category.icon} {category.name} · {category.count}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 pb-12 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {categories.map((category) => {
            const count = groupedCounts.find((item) => item.name === category.name)?.count ?? 0;
            return (
              <button
                key={category.name}
                type="button"
                onClick={() => setActiveCategory(category.name)}
                className="glass-card flex w-full items-center gap-4 p-4 text-right transition hover:border-gold/40"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl border border-gold/40 bg-teal-deep/60 font-display text-2xl text-gold">
                  {category.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-bold">{category.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{count} قسم · {category.hint}</div>
                </div>
              </button>
            );
          })}
        </aside>

        <div>
          {selectedSection && (
            <div className="mb-6 glass-card grid grid-cols-1 gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="text-xs text-gold-soft">القسم المحدد الآن</div>
                <h2 className="mt-1 font-display text-2xl font-black">{selectedSection.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{selectedSection.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton label="شاهد الشرح" />
                <ActionButton label="ابدأ اختبار نمر" primary />
                <ActionButton label="دفتر الأخطاء" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredSections.map((section) => (
              <article key={section.id} className="glass-card p-5 transition hover:-translate-y-1 hover:border-gold/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">قسم رقم {section.order}</div>
                    <h3 className="mt-1 font-display text-lg font-bold leading-7">{section.title}</h3>
                  </div>
                  <span className="rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs text-gold-soft">{section.level}</span>
                </div>
                <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{section.description}</p>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-teal-deep/45 px-3 py-2 text-xs text-muted-foreground">
                  <span>{section.category}</span>
                  <span className="font-display text-gold-soft">{section.duration} دقيقة</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSection(section)}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs transition hover:border-gold/40"
                  >
                    شاهد الشرح
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSection(section)}
                    className="rounded-xl bg-gradient-to-l from-gold to-gold-soft px-3 py-2 text-xs font-bold text-primary-foreground transition hover:scale-[1.02]"
                  >
                    ابدأ اختبار نمر
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-teal-deep/45 p-4 text-center">
      <div className="font-display text-3xl font-black text-gold-gradient">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function ActionButton({ label, primary = false }: { label: string; primary?: boolean }) {
  return (
    <button
      type="button"
      className={
        primary
          ? "rounded-xl bg-gradient-to-l from-gold to-gold-soft px-4 py-2 text-xs font-bold text-primary-foreground transition hover:scale-[1.02]"
          : "rounded-xl border border-gold/30 bg-gold/10 px-4 py-2 text-xs text-gold-soft transition hover:bg-gold/15"
      }
    >
      {label}
    </button>
  );
}