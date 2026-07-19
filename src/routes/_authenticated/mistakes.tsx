import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { BlockMath, InlineMath } from "react-katex";
import { loadAllQuestions, SEED_QUESTIONS, toArabic, resultsKey, TRACKS, isTrackId, type Question, type TrackId } from "@/lib/platform-config";

function MathText({ text }: { text: string }) {
  const parts = text.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("$$") && p.endsWith("$$") ? <BlockMath key={i} math={p.slice(2, -2)} />
        : p.startsWith("$") && p.endsWith("$") && p.length > 1 ? <InlineMath key={i} math={p.slice(1, -1)} />
        : <span key={i}>{p}</span>
      )}
    </>
  );
}

type Attempt = {
  at: number;
  section: number;
  sectionTitle: string;
  total: number;
  correct: number;
  answers: Record<string, number>;
  wrongIds: string[];
  correctByQid?: Record<string, number>;
};

export const Route = createFileRoute("/_authenticated/mistakes")({
  ssr: false,
  validateSearch: (s) => z.object({ track: z.enum(["quantitative", "verbal"]).optional() }).parse(s),
  head: () => ({ meta: [{ title: "أخطائي — منصة المِقْيَاس" }, { name: "description", content: "مراجعة كل الأسئلة التي أخطأت فيها عبر جميع الأقسام." }] }),
  component: MistakesPage,
});

function MistakesPage() {
  const navigate = useNavigate();
  const { track } = Route.useSearch();
  const activeTrack: TrackId = isTrackId(track) ? track : "quantitative";
  const meta = TRACKS[activeTrack];
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [bank, setBank] = useState<Record<string, Question>>({});

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(resultsKey(activeTrack)) || "[]");
      setAttempts(raw as Attempt[]);
    } catch { setAttempts([]); }
    const b: Record<string, Question> = {};
    const all = activeTrack === "quantitative"
      ? { ...SEED_QUESTIONS, ...loadAllQuestions("quantitative") }
      : { ...loadAllQuestions("verbal") };
    Object.values(all).forEach((arr) => arr.forEach((q) => (b[q.id] = q)));
    setBank(b);
  }, [activeTrack]);

  const totals = useMemo(() => {
    const total = attempts.reduce((s, a) => s + a.total, 0);
    const correct = attempts.reduce((s, a) => s + a.correct, 0);
    return { total, correct, wrong: total - correct, sessions: attempts.length };
  }, [attempts]);

  const letters = ["أ", "ب", "ج", "د"];

  function clearAll() {
    if (confirm("مسح كل السجل؟")) { localStorage.removeItem(resultsKey(activeTrack)); setAttempts([]); }
  }

  return (
    <main dir="rtl" className="mx-auto max-w-4xl px-5 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">مكان الأخطاء — {meta.shortLabel}</h1>
          <p className="text-sm text-muted-foreground mt-1">مراجعة أخطاء مسار {meta.label} — مرتّبة حسب أحدث محاولة.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate({ to: "/dashboard", search: { track: activeTrack } })} className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-bold hover:border-teal">← الأقسام</button>
          {attempts.length > 0 && <button onClick={clearAll} className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-xs font-bold hover:border-red-400">مسح السجل</button>}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="محاولات" value={toArabic(totals.sessions)} />
        <StatCard label="أسئلة" value={toArabic(totals.total)} />
        <StatCard label="صحيحة" value={toArabic(totals.correct)} tone="teal" />
        <StatCard label="خاطئة" value={toArabic(totals.wrong)} tone="red" />
      </div>

      {attempts.length === 0 && (
        <div className="luxury-card p-10 text-center text-muted-foreground">لا توجد محاولات محفوظة بعد.</div>
      )}

      {[...attempts].reverse().map((a, idx) => (
        <div key={idx} className="luxury-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-muted-foreground">قسم {toArabic(a.section)} — {new Date(a.at).toLocaleString("ar-EG")}</div>
              <div className="font-display font-bold text-foreground">{a.sectionTitle}</div>
            </div>
            <div className="text-sm font-bold text-teal-deep">{toArabic(a.correct)} / {toArabic(a.total)}</div>
          </div>
          {a.wrongIds.length === 0 ? (
            <div className="text-teal-deep text-sm font-semibold">🎉 لا أخطاء في هذه المحاولة.</div>
          ) : (
            <div className="space-y-3">
              {a.wrongIds.map((qid) => {
                const q = bank[qid]; if (!q) return null;
                const chosen = a.answers[qid];
                const correctIdx = a.correctByQid?.[qid] ?? (q as any).correctIndex;
                return (
                  <div key={qid} className="rounded-xl border border-red-200 bg-red-50/40 p-3">
                    <div className="text-sm text-foreground mb-2 leading-7"><MathText text={q.prompt} /></div>
                    <div className="text-xs text-red-700"><b>إجابتك:</b> {letters[chosen] ?? "—"} — {chosen !== undefined ? <MathText text={q.choices[chosen]} /> : "لم تُجَب"}</div>
                    {typeof correctIdx === "number" && (
                      <div className="text-xs text-teal-deep"><b>الصحيحة:</b> {letters[correctIdx]} — <MathText text={q.choices[correctIdx]} /></div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </main>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "teal" | "red" }) {
  const cls = tone === "teal" ? "text-teal-deep" : tone === "red" ? "text-red-600" : "text-foreground";
  return (
    <div className="luxury-card p-4 text-center">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={"text-2xl font-bold " + cls}>{value}</div>
    </div>
  );
}