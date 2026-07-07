import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getSection } from "@/lib/sections.functions";
import { startExamSession, submitExamSession } from "@/lib/exam.functions";

export const Route = createFileRoute("/_authenticated/exam/$sectionId")({
  head: () => ({ meta: [{ title: "محاكي نمر — اختبار المِقْيَاس" }] }),
  component: ExamPage,
});

type Question = { id: string; prompt: string; choices: string[]; order_index: number };
type SectionLite = { id: string; title: string; timer_seconds: number };

function ExamPage() {
  const { sectionId } = Route.useParams();
  const navigate = useNavigate();
  const getSectionFn = useServerFn(getSection);
  const startFn = useServerFn(startExamSession);
  const submitFn = useServerFn(submitExamSession);

  const [section, setSection] = useState<SectionLite | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timerSec, setTimerSec] = useState<number>(0);
  const [remaining, setRemaining] = useState<number>(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const { section: s, questions: qs } = await getSectionFn({ data: { id: sectionId } });
        if (!qs || qs.length === 0) { setError("لا توجد أسئلة في هذا القسم بعد."); return; }
        setSection({ id: s.id, title: s.title, timer_seconds: s.timer_seconds });
        setQuestions(qs as Question[]);
        setAnswers(new Array(qs.length).fill(null));
        const start = await startFn({ data: { section_id: sectionId } });
        setSessionId(start.session_id);
        setTimerSec(start.timer_seconds);
        setRemaining(start.timer_seconds);
      } catch (e: any) { setError(e.message); }
    })();
  }, [sectionId, getSectionFn, startFn]);

  // Countdown
  useEffect(() => {
    if (!sessionId || locked) return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          void autoSubmit();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, locked]);

  const progressPct = useMemo(() => timerSec ? (remaining / timerSec) * 100 : 0, [remaining, timerSec]);

  async function autoSubmit() {
    if (submittingRef.current || !sessionId) return;
    submittingRef.current = true;
    setLocked(true);
    try {
      const r = await submitFn({ data: { session_id: sessionId, answers, auto_submitted: true } });
      navigate({ to: "/report/$sessionId", params: { sessionId: r.session_id } });
    } catch (e: any) { setError(e.message); }
  }

  async function manualSubmit() {
    if (submittingRef.current || !sessionId) return;
    submittingRef.current = true;
    try {
      const r = await submitFn({ data: { session_id: sessionId, answers, auto_submitted: false } });
      navigate({ to: "/report/$sessionId", params: { sessionId: r.session_id } });
    } catch (e: any) { setError(e.message); submittingRef.current = false; }
  }

  function pick(idx: number, val: number) {
    setAnswers((prev) => prev.map((a, i) => i === idx ? val : a));
  }

  if (error) return <div className="mx-auto max-w-2xl px-6 py-16"><div className="glass-card p-6 text-sm">{error}</div></div>;
  if (!section || !sessionId) return <div className="mx-auto max-w-2xl px-6 py-16 text-muted-foreground">جاري تجهيز الاختبار…</div>;

  const q = questions[current];
  const answeredCount = answers.filter((a) => a !== null).length;

  return (
    <div>
      {/* Nimar top bar */}
      <div className="sticky top-[65px] z-30 border-y border-gold/20 bg-gradient-to-l from-teal to-teal-deep">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="text-xs uppercase tracking-widest text-gold-soft">محاكي نمر</div>
            <div className="font-display font-bold">{section.title}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-muted-foreground">{answeredCount}/{questions.length}</div>
            <div className={`rounded-full border px-4 py-1.5 font-display text-lg font-black tabular-nums transition ${
              remaining < 60 ? "border-destructive/60 bg-destructive/10 text-destructive-foreground animate-pulse" : "border-gold/40 bg-gold/10 text-gold"
            }`}>{formatMMSS(remaining)}</div>
            <button onClick={manualSubmit} className="rounded-full bg-gradient-to-l from-gold to-gold-soft px-4 py-1.5 text-xs font-bold text-primary-foreground">
              تسليم
            </button>
          </div>
        </div>
        <div className="h-1 bg-teal-deep/60"><div className="h-full bg-gold transition-all duration-1000" style={{ width: `${progressPct}%` }} /></div>
      </div>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_260px]">
        <div className="glass-card p-8">
          <div className="text-xs text-gold-soft">سؤال {current + 1} من {questions.length}</div>
          <h2 className="mt-3 font-display text-2xl font-bold leading-relaxed">{q.prompt}</h2>
          <div className="mt-6 space-y-3">
            {q.choices.map((c, i) => {
              const selected = answers[current] === i;
              return (
                <button key={i} onClick={() => pick(current, i)}
                  className={`w-full rounded-xl border p-4 text-right transition ${
                    selected ? "border-gold/70 bg-gold/10" : "border-white/10 bg-teal-deep/40 hover:border-gold/40"
                  }`}>
                  <span className="ml-3 inline-block h-6 w-6 rounded-full border border-gold/40 text-center text-xs leading-6 text-gold">{["أ","ب","ج","د","هـ"][i]}</span>
                  {c}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}
              className="rounded-full border border-white/10 px-5 py-2 text-sm disabled:opacity-40">السابق</button>
            {current < questions.length - 1 ? (
              <button onClick={() => setCurrent(current + 1)}
                className="rounded-full bg-gradient-to-l from-gold to-gold-soft px-5 py-2 text-sm font-bold text-primary-foreground">التالي</button>
            ) : (
              <button onClick={manualSubmit}
                className="rounded-full bg-gradient-to-l from-gold to-gold-soft px-6 py-2 text-sm font-bold text-primary-foreground">إنهاء وتسليم</button>
            )}
          </div>
        </div>

        <aside className="glass-card p-4">
          <div className="mb-3 text-xs uppercase tracking-widest text-gold-soft">خارطة الأسئلة</div>
          <div className="grid grid-cols-6 gap-2">
            {questions.map((_, i) => {
              const a = answers[i];
              return (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`h-9 w-9 rounded-lg text-xs transition ${
                    i === current ? "border-2 border-gold bg-gold/10 text-gold" :
                    a !== null ? "border border-gold/30 bg-gold/5 text-gold-soft" :
                    "border border-white/10 bg-teal-deep/50 text-muted-foreground"
                  }`}>{i + 1}</button>
              );
            })}
          </div>
        </aside>
      </main>

      {locked && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-teal-deep/90 backdrop-blur-lg">
          <div className="glass-card max-w-md p-8 text-center">
            <div className="text-4xl">⏰</div>
            <h3 className="mt-4 font-display text-2xl font-black">انتهى الوقت</h3>
            <p className="mt-2 text-sm text-muted-foreground">تم تسليم الاختبار تلقائيًا وجاري إعداد تقريرك الذكي…</p>
          </div>
        </div>
      )}
    </div>
  );
}

function formatMMSS(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}