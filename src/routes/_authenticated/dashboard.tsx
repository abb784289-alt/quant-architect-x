import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { readSession } from "@/lib/session";
import { loadSections, loadAllQuestions, computeTimerSeconds, formatTimer, toArabic, TRACKS, isTrackId, type SectionConfig, type TrackId } from "@/lib/platform-config";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  validateSearch: (s) => z.object({ track: z.enum(["quantitative", "verbal"]).optional() }).parse(s),
  head: () => ({
    meta: [
      { title: "الأقسام — منصة المِقْيَاس" },
      { name: "description", content: "لوحة تحكم الطالب: أقسام مسلسلة مع بحث فوري لبدء اختبار نمر التفاعلي." },
      { property: "og:title", content: "لوحة تحكم الأقسام — منصة المِقْيَاس الذكية" },
      { property: "og:description", content: "تصفّح أقسام التدريب الكمي واللفظي وابدأ اختبار نمر التفاعلي من لوحة الطالب." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DashboardGate,
});

function DashboardGate() {
  const { track } = Route.useSearch();
  const { t, dir } = useI18n();
  const [ok, setOk] = useState<boolean | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const s = readSession();
    if (!s) { setOk(false); window.location.replace("/auth"); return; }
    if (!isTrackId(track)) { navigate({ to: "/tracks" }); return; }
    setOk(true);
  }, [track]);
  if (ok && isTrackId(track)) return <SectionsDashboard track={track} />;
  return <div dir={dir} className="min-h-[60vh] grid place-items-center text-muted-foreground">{t("common.loading")}</div>;
}

function SectionsDashboard({ track }: { track: TrackId }) {
  const navigate = useNavigate();
  const { t, n: num, dir } = useI18n();
  const trackMeta = TRACKS[track];
  const trackLabel = t(`track.${track}.label`);
  const [sections, setSections] = useState<SectionConfig[]>([]);
  const [qCounts, setQCounts] = useState<Record<number, number>>({});
  const [query, setQuery] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSections(loadSections(track));
    const all = loadAllQuestions(track);
    import("@/lib/platform-config").then(({ SEED_QUESTIONS }) => {
      const c: Record<number, number> = {};
      if (track === "quantitative") {
        Object.entries(SEED_QUESTIONS).forEach(([k, v]) => { c[Number(k)] = v.length; });
      }
      Object.entries(all).forEach(([k, v]) => { c[Number(k)] = v.length; });
      setQCounts(c);
    });
  }, [track]);
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
    if (!Number.isNaN(n) && n >= 1 && n <= trackMeta.total) {
      navigate({ to: "/exam", search: { section: n, track } });
    }
  }

  const readyCount = Object.values(qCounts).filter((c) => c > 0).length;
  const isTeal = trackMeta.accent === "teal";

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 md:py-12" dir={dir}>
      <h1 className="sr-only">{t("dash.h1", { track: trackLabel })}</h1>
      {/* Track badge + switch */}
      <div className="flex items-center justify-between mb-4">
        <div className={"inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold border " +
          (isTeal ? "bg-teal-soft text-teal-deep border-teal/30" : "bg-gold-soft text-foreground border-gold/40")}>
          <span className="text-base">{trackMeta.icon}</span>
          <span>{t("dash.youAreIn")} {trackLabel}</span>
          <span className="text-[10px] opacity-70">({num(trackMeta.total)} {t("dash.sectionWord")})</span>
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: "/tracks" })}
          className="text-xs rounded-full border border-border bg-white px-3 py-1.5 text-muted-foreground hover:border-teal hover:text-teal-deep transition-colors"
        >
          {t("dash.switchTrack")}
        </button>
      </div>

      {/* Sticky compact search — الأقسام أول حاجة */}
      <div className="sticky top-0 z-20 -mx-6 px-6 pt-2 pb-4 mb-8 bg-surface/85 backdrop-blur-md">
        <form onSubmit={onSubmit} className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="search"
              aria-label={t("dash.searchAria")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("dash.searchPlaceholder", { n: num(trackMeta.total) })}
              className="w-full rounded-2xl bg-white border border-border pr-12 pl-4 py-4 text-base focus:border-teal focus:ring-2 focus:ring-teal/30 outline-none transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xl">⌕</span>
          </div>
          <button type="button" onClick={() => navigate({ to: "/mistakes", search: { track } })} className="rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-4 text-sm font-bold hover:border-red-400 transition-colors" title={t("dash.mistakes")}>
            ⚑
          </button>
          <button type="button" onClick={() => navigate({ to: "/ask" })} className="rounded-2xl border border-gold/40 bg-gold-soft text-foreground px-4 py-4 text-sm font-bold hover:border-gold transition-colors" title={t("dash.ask")}>
            ✎
          </button>
        </form>

        {/* الإحصائيات مطويّة */}
        <button
          type="button"
          onClick={() => setShowInfo((v) => !v)}
          className="mt-3 text-xs text-muted-foreground hover:text-teal-deep flex items-center gap-1.5 transition-colors"
        >
          <span>{showInfo ? "▾" : "▸"}</span>
          <span>{t("dash.ready", { a: num(readyCount), b: num(trackMeta.total) })}</span>
        </button>
        {showInfo && (
          <div className="mt-3 rounded-2xl bg-teal-soft/40 border border-teal/20 p-4 text-sm text-teal-deep leading-relaxed">
            <strong className="font-bold">{t("dash.panelTitle")}</strong>{" "}
            {t("dash.panelBody")}
          </div>
        )}
      </div>

      {/* الأقسام — أكبر وأوسع */}
      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
        {filtered.map((s) => {
          const count = qCounts[s.number] ?? 0;
          const ready = count > 0;
          const timer = ready ? computeTimerSeconds(s, count) : 0;
          return (
            <button
              key={s.number}
              type="button"
              onClick={() => navigate({ to: "/exam", search: { section: s.number, track } })}
              className={"group luxury-card p-5 md:p-6 text-start transition-all " +
                (ready ? "hover:border-teal/50 hover:-translate-y-0.5 hover:shadow-lg" : "opacity-60 hover:opacity-90")}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={"h-11 w-11 rounded-2xl border grid place-items-center font-bold text-base " +
                  (ready ? "bg-gradient-to-br from-teal-soft to-white border-border text-teal-deep" : "bg-surface-2 border-border text-muted-foreground")}>
                  {num(s.number)}
                </div>
                {ready ? (
                  <span className="text-[11px] rounded-full bg-teal-soft text-teal-deep px-2.5 py-1 font-bold border border-teal/30">{num(count)}</span>
                ) : (
                  <span className="text-[11px] rounded-full bg-gold-soft text-foreground px-2.5 py-1 font-semibold border border-gold/40">{t("dash.soon")}</span>
                )}
              </div>
              <div className="font-display font-bold text-foreground mb-1.5 text-[15px] leading-snug line-clamp-2">{s.title}</div>
              <div className="text-xs text-muted-foreground">{ready ? num(formatTimer(timer)) : t("dash.preparing")}</div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-20 text-muted-foreground">
            {t("dash.noMatch")}
          </div>
        )}
      </section>
    </main>
  );
}