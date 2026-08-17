import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { readSession } from "@/lib/session";
import { TRACKS, isTrackId, type TrackId } from "@/lib/platform-config";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/foundation")({
  ssr: false,
  validateSearch: (s) => z.object({ track: z.enum(["quantitative", "verbal"]).optional() }).parse(s),
  head: () => ({
    meta: [
      { title: "قسم التأسيس الشامل — منصة المِقْيَاس" },
      { name: "description", content: "قسم التأسيس قيد العمل — سيتم إطلاقه قريباً بمحاور الأستاذ أسامة فتح الدين." },
    ],
  }),
  component: FoundationGate,
});

function FoundationGate() {
  const { track } = Route.useSearch();
  const { t, dir } = useI18n();
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    const s = readSession();
    if (!s) { setOk(false); window.location.replace("/auth"); return; }
    setOk(true);
  }, []);
  const activeTrack: TrackId = isTrackId(track) ? track : "quantitative";
  if (ok) return <FoundationComingSoon track={activeTrack} />;
  return <div dir={dir} className="min-h-[60vh] grid place-items-center text-muted-foreground">{t("common.loading")}</div>;
}

function FoundationComingSoon({ track }: { track: TrackId }) {
  const { t, dir } = useI18n();
  const meta = TRACKS[track];
  const trackLabel = t(`track.${track}.label`);
  const trackShort = t(`track.${track}.short`);
  const isTeal = meta.accent === "teal";
  return (
    <main className="mx-auto max-w-3xl px-6 py-16" dir={dir}>
      <div className="luxury-card p-10 text-center">
        <div className={"inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold border mb-4 " +
          (isTeal ? "bg-teal-soft text-teal-deep border-teal/30" : "bg-gold-soft text-foreground border-gold/40")}>
          <span>{meta.icon}</span>
          <span>{t("found.badge", { track: trackLabel })}</span>
        </div>
        <div className="mx-auto mb-6 h-20 w-20 rounded-3xl bg-gradient-to-br from-gold-soft to-white border border-gold/40 grid place-items-center text-4xl">
          🛠️
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-gold-soft text-foreground px-3 py-1 text-[11px] font-semibold mb-4 border border-gold/40">
          {t("found.wip")}
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">{t("found.title", { track: trackShort })}</h1>
        <p className="text-sm text-muted-foreground leading-7 max-w-lg mx-auto mb-6">
          {t("found.body", { track: trackLabel })}
        </p>
        <a href={`/dashboard?track=${track}`} className="inline-block rounded-xl bg-teal text-white px-6 py-3 text-sm font-bold hover:bg-teal-deep transition-colors">
          {t("found.goSections", { track: trackShort })}
        </a>
      </div>
    </main>
  );
}