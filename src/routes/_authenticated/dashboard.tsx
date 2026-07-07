import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { readSession } from "@/lib/session";
import { loadSections, formatTimer, type SectionConfig } from "@/lib/platform-config";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "الـ 150 قسم — منصة المِقْيَاس" },
      { name: "description", content: "لوحة تحكم الطالب: 150 قسم مسلسل مع بحث فوري لبدء اختبار نمر التفاعلي." },
    ],
  }),
  component: DashboardGate,
});

function DashboardGate() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    const s = readSession();
    if (!s) { setOk(false); window.location.replace("/auth"); return; }
    setOk(true);
  }, []);
  if (ok) return <SectionsDashboard />;
  return <div dir="rtl" className="min-h-[60vh] grid place-items-center text-muted-foreground">جارٍ التحميل...</div>;
}

function SectionsDashboard() {
  const navigate = useNavigate();
  const [sections, setSections] = useState<SectionConfig[]>([]);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setSections(loadSections()); }, []);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return sections;
    const n = Number(q);
    if (!Number.isNaN(n)) return sections.filter((s) => String(s.number).includes(String(n)));
    return sections.filter((s) => s.title.includes(q));
  }, [sections, query]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(query.trim());
    if (!Number.isNaN(n) && n >= 1 && n <= 150) {
      navigate({ to: "/exam", search: { section: n } });
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10" dir="rtl">
      <section className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-soft text-teal-deep px-3 py-1 text-[11px] font-semibold mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
              150 قسم تدريبي مسلسل
            </div>
            <h1 className="text-3xl font-bold text-foreground">لوحة الأقسام</h1>
            <p className="text-sm text-muted-foreground mt-1">اختر رقم القسم أو ابحث للانتقال المباشر إلى اختبار نمر التفاعلي.</p>
          </div>
          <form onSubmit={onSubmit} className="flex items-center gap-2 w-full max-w-md">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="اكتب رقم القسم (1 - 150) واضغط Enter"
                inputMode="numeric"
                className="w-full rounded-2xl bg-white border border-border pr-11 pl-4 py-3 text-sm focus:border-teal focus:ring-2 focus:ring-teal/30 outline-none transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">⌕</span>
            </div>
            <button type="submit" className="rounded-2xl bg-teal text-white px-5 py-3 text-sm font-semibold hover:bg-teal-deep transition-colors shadow-sm">
              اذهب
            </button>
          </form>
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filtered.map((s) => (
          <button
            key={s.number}
            type="button"
            onClick={() => navigate({ to: "/exam", search: { section: s.number } })}
            className="group luxury-card p-4 text-right hover:border-teal/50 hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-soft to-white border border-border grid place-items-center text-teal-deep font-bold text-sm">
                {s.number}
              </div>
              {s.videoUrl ? (
                <span className="text-[10px] rounded-full bg-gold-soft text-foreground px-2 py-0.5 font-semibold border border-gold/40">فيديو</span>
              ) : (
                <span className="text-[10px] rounded-full bg-surface-2 text-muted-foreground px-2 py-0.5">—</span>
              )}
            </div>
            <div className="font-display font-bold text-foreground mb-1 text-sm">{s.title}</div>
            <div className="text-[11px] text-muted-foreground">مؤقّت {formatTimer(s.timerSeconds)}</div>
            <div className="mt-3 text-[11px] text-teal-deep font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              ابدأ اختبار نمر ←
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground text-sm">
            لا يوجد قسم يطابق البحث.
          </div>
        )}
      </section>
    </main>
  );
}