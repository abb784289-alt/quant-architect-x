import { createFileRoute, Link } from "@tanstack/react-router";
import { TRACKS, toArabic } from "@/lib/platform-config";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/tracks")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "اختر المسار — الكمي أو اللفظي — منصة المِقْيَاس" },
      { name: "description", content: "اختر المسار الذي تريد التدرّب عليه: القسم الكمي (90 قسمًا) أو القسم اللفظي (260 قسمًا)." },
    ],
  }),
  component: TracksPicker,
});

function TracksPicker() {
  const { t, dir, lang } = useI18n();
  return (
    <main dir={dir} className="mx-auto max-w-5xl px-6 py-14">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-soft text-teal-deep px-3 py-1 text-[11px] font-semibold border border-teal/30 mb-3">
          {t("tracks.kicker")}
        </div>
        <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-2">{t("tracks.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("tracks.lead")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(Object.values(TRACKS)).map((t) => {
          const isTeal = t.accent === "teal";
          return (
            <Link
              key={t.id}
              to="/dashboard"
              search={{ track: t.id } as any}
              className={
                "group luxury-card p-8 text-right transition-all hover:-translate-y-1 hover:shadow-xl border-2 " +
                (isTeal ? "border-teal/30 hover:border-teal bg-gradient-to-br from-teal-soft/60 to-white"
                       : "border-gold/40 hover:border-gold bg-gradient-to-br from-gold-soft/60 to-white")
              }
            >
              <div className="flex items-center justify-between mb-6">
                <div className={"h-16 w-16 rounded-2xl grid place-items-center text-3xl font-bold shadow-md " +
                  (isTeal ? "bg-teal text-white" : "bg-gold text-foreground")}>
                  {t.icon}
                </div>
                <span className={"text-[11px] rounded-full px-3 py-1 font-bold border " +
                  (isTeal ? "bg-white border-teal/40 text-teal-deep" : "bg-white border-gold/50 text-foreground")}>
                  {lang === "ar" ? `${toArabic(t.total)} قسم` : `${t.total} sections`}
                </span>
              </div>
              <div className="font-display font-bold text-2xl text-foreground mb-1">
                {lang === "ar" ? t.label : t.id === "quantitative" ? "Quantitative" : "Verbal"}
              </div>
              <div className="text-sm text-muted-foreground mb-5">{t.subtitle}</div>
              <div className={"inline-flex items-center gap-2 text-sm font-bold " +
                (isTeal ? "text-teal-deep" : "text-foreground")}>
                {tr("tracks.start")} <span className="group-hover:-translate-x-1 transition-transform">←</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-10 text-center text-xs text-muted-foreground">
        {t("tracks.hint")}
      </div>
    </main>
  );
}