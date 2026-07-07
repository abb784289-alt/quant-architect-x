import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listSections } from "@/lib/sections.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "لوحة الأكاديمية — المِقْيَاس" }] }),
  component: Dashboard,
});

type Section = {
  id: string; title: string; description: string | null;
  category: "algebra" | "geometry" | "arithmetic" | "statistics";
  order_index: number; timer_seconds: number; video_path: string | null; published: boolean;
};

const CATS: Record<Section["category"], { ar: string; icon: string; hint: string }> = {
  algebra:    { ar: "الجبر",       icon: "∑", hint: "معادلات ومتباينات وأسس" },
  geometry:   { ar: "الهندسة",     icon: "△", hint: "زوايا ومثلثات ودوائر" },
  arithmetic: { ar: "الحساب",      icon: "÷", hint: "نسب وأعداد وقواسم" },
  statistics: { ar: "الإحصاء",     icon: "≈", hint: "متوسطات واحتمالات" },
};

function Dashboard() {
  const call = useServerFn(listSections);
  const [sections, setSections] = useState<Section[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({ algebra: true, geometry: true, arithmetic: true, statistics: true });

  useEffect(() => {
    call().then((d) => setSections(d as Section[])).catch((e) => setErr(e.message));
  }, [call]);

  const grouped = (sections ?? []).reduce<Record<string, Section[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s); return acc;
  }, {});

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-[0.3em] text-gold-soft">أكاديمية المِقْيَاس</div>
        <h1 className="mt-2 font-display text-4xl font-black">اختر قسمك وابدأ التدريب</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          مكتبة الأقسام منظّمة تلقائيًا حسب المجال. اضغط أي قسم لبدء اختبار محاكي نمر بالمؤقّت المُخصّص له.
        </p>
      </div>

      {err && <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">{err}</div>}
      {!sections && !err && <SkeletonList />}
      {sections && sections.length === 0 && (
        <div className="glass-card p-10 text-center">
          <div className="mb-3 text-5xl">📚</div>
          <h2 className="font-display text-xl font-bold">لا توجد أقسام بعد</h2>
          <p className="mt-2 text-sm text-muted-foreground">اطلب من الأدمن رفع ملف الأقسام من لوحة التحكم.</p>
        </div>
      )}

      <div className="space-y-4">
        {(Object.keys(CATS) as Section["category"][]).map((cat) => {
          const items = grouped[cat] ?? [];
          if (!sections || items.length === 0) return null;
          const meta = CATS[cat];
          const isOpen = open[cat];
          return (
            <section key={cat} className="glass-card overflow-hidden">
              <button onClick={() => setOpen({ ...open, [cat]: !isOpen })}
                className="flex w-full items-center justify-between px-6 py-5 text-right">
                <div className="flex items-center gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-xl border border-gold/40 bg-teal-deep/60 font-display text-2xl text-gold">{meta.icon}</div>
                  <div>
                    <div className="font-display text-xl font-bold">{meta.ar}</div>
                    <div className="text-xs text-muted-foreground">{items.length} قسم · {meta.hint}</div>
                  </div>
                </div>
                <span className={`text-gold transition ${isOpen ? "rotate-180" : ""}`}>▾</span>
              </button>
              {isOpen && (
                <div className="grid grid-cols-1 gap-3 border-t border-white/5 bg-teal-deep/20 p-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((s) => (
                    <div key={s.id} className="group rounded-xl border border-white/5 bg-teal-deep/40 p-4 transition hover:border-gold/40">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs text-muted-foreground">قسم رقم {s.order_index + 1}</div>
                          <div className="mt-1 font-display font-bold">{s.title}</div>
                        </div>
                        <div className="rounded-lg border border-gold/30 bg-gold/5 px-2 py-1 text-[10px] text-gold-soft">
                          {formatMMSS(s.timer_seconds)}
                        </div>
                      </div>
                      {s.description && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{s.description}</p>}
                      <Link to="/exam/$sectionId" params={{ sectionId: s.id }}
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-gold to-gold-soft px-4 py-2 text-xs font-bold text-primary-foreground">
                        ابدأ الاختبار <span>←</span>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}

function SkeletonList() {
  return <div className="space-y-4">{[0,1,2,3].map((i) => <div key={i} className="glass-card h-24 animate-pulse" />)}</div>;
}

function formatMMSS(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}