import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getExamReport } from "@/lib/exam.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/report/$sessionId")({
  head: () => ({ meta: [{ title: "تقرير التقييم الذكي — المِقْيَاس" }] }),
  component: ReportPage,
});

type Report = {
  mastery_percent?: number; mastery_label?: string;
  strengths?: string[]; weaknesses?: string[];
  roadmap?: { section: string; reason: string }[];
  coaching?: string;
  fallback?: boolean; message?: string; raw?: string;
};

function ReportPage() {
  const { sessionId } = Route.useParams();
  const { t, n: num, dir } = useI18n();
  const call = useServerFn(getExamReport);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    call({ data: { session_id: sessionId } }).then(setData).catch((e) => setErr(e.message));
  }, [sessionId, call]);

  if (err) return <div className="mx-auto max-w-2xl px-6 py-16"><div className="glass-card p-6">{err}</div></div>;
  if (!data) return <div className="mx-auto max-w-2xl px-6 py-16 text-muted-foreground">{t("rep.loading")}</div>;

  const { session, section } = data;
  const report: Report = session.ai_report ?? {};
  const total = session.total_questions ?? 0;
  const scorePct = total ? Math.round((session.score / total) * 100) : 0;
  const mastery = Math.round(report.mastery_percent ?? scorePct);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10" dir={dir}>
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.3em] text-gold-soft">{t("rep.kicker")}</div>
        <h1 className="mt-2 font-display text-4xl font-black">{section?.title}</h1>
        <div className="mt-2 text-sm text-muted-foreground">
          {session.auto_submitted ? t("rep.auto") : t("rep.manual")}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard label={t("rep.score")} value={num(`${session.score}/${total}`)} accent />
        <StatCard label={t("rep.mastery")} value={`${num(mastery)}%`} />
        <StatCard label={t("rep.time")} value={num(formatMMSS(session.time_taken_seconds ?? 0))} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-card p-6">
          <div className="text-xs uppercase tracking-widest text-gold-soft">{t("rep.masteryLevel")}</div>
          <div className="mt-2 font-display text-2xl font-bold">{report.mastery_label ?? t(masteryLabelKey(mastery))}</div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-teal-deep/60">
            <div className="h-full bg-gradient-to-l from-gold to-gold-soft transition-all" style={{ width: `${mastery}%` }} />
          </div>

          {report.strengths && report.strengths.length > 0 && (
            <div className="mt-6">
              <div className="text-xs text-gold-soft">{t("rep.strengths")}</div>
              <ul className="mt-2 space-y-1 text-sm">{report.strengths.map((s, i) => <li key={i}>✓ {s}</li>)}</ul>
            </div>
          )}
          {report.weaknesses && report.weaknesses.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-destructive-foreground">{t("rep.weaknesses")}</div>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">{report.weaknesses.map((s, i) => <li key={i}>◦ {s}</li>)}</ul>
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <div className="text-xs uppercase tracking-widest text-gold-soft">{t("rep.roadmap")}</div>
          {report.roadmap && report.roadmap.length > 0 ? (
            <ol className="mt-3 space-y-3">
              {report.roadmap.map((r, i) => (
                <li key={i} className="rounded-xl border border-white/5 bg-teal-deep/40 p-3">
                  <div className="font-display font-bold">{i + 1}. {r.section}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{r.reason}</div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">{t("rep.noRoadmap")}</p>
          )}
        </div>
      </div>

      <div className="mt-8 glass-card p-8">
        <div className="mb-3 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full border border-gold/40 bg-teal-deep/60 text-gold">أ.</div>
          <div>
            <div className="font-display font-bold">{t("rep.messageFrom")}</div>
            <div className="text-xs text-muted-foreground">{t("rep.expert")}</div>
          </div>
        </div>
        <p className="text-base leading-relaxed">
          {report.coaching ?? report.message ?? t("rep.defaultCoaching")}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/dashboard" className="rounded-full bg-gradient-to-l from-gold to-gold-soft px-6 py-3 font-display text-sm font-bold text-primary-foreground">
          {t("rep.backAcademy")}
        </Link>
      </div>
    </main>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`glass-card p-6 text-center ${accent ? "border-gold/40 gold-ring" : ""}`}>
      <div className="text-xs uppercase tracking-widest text-gold-soft">{label}</div>
      <div className="mt-2 font-display text-4xl font-black text-gold-gradient tabular-nums">{value}</div>
    </div>
  );
}
function masteryLabelKey(p: number) {
  if (p >= 90) return "rep.m90";
  if (p >= 75) return "rep.m75";
  if (p >= 60) return "rep.m60";
  if (p >= 40) return "rep.m40";
  return "rep.m0";
}
function formatMMSS(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}