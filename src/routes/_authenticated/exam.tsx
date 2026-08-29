import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { BlockMath, InlineMath } from "react-katex";
import DOMPurify from "dompurify";
import { readSession, loadSession, type Session } from "@/lib/session";
import { getSection, formatTimer, getQuestions, computeTimerSeconds, toArabic, hydrateQuestionBankFromServer, serverSectionNumber, resultsKey, TRACKS, isTrackId, type SectionConfig, type Question, type TrackId } from "@/lib/platform-config";
import { gradeSectionAttempt } from "@/lib/question-bank.functions";
import { loadSections } from "@/lib/platform-config";
import { getSectionVideoSignedUrl } from "@/lib/section-videos.functions";
import { getMediaAsset } from "@/lib/media-assets.functions";
import { useI18n } from "@/lib/i18n";

const SVG_PURIFY_CONFIG = { USE_PROFILES: { svg: true, svgFilters: true } } as const;
function sanitizeSvg(html: string): string {
  return DOMPurify.sanitize(html, SVG_PURIFY_CONFIG) as unknown as string;
}
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html) as unknown as string;
}

// Render text that may contain $...$ (inline) or $$...$$ (block) KaTeX segments
function MathText({ text }: { text?: string | null }) {
  const parts = String(text ?? "").split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          return <BlockMath key={i} math={part.slice(2, -2)} />;
        }
        if (part.startsWith("$") && part.endsWith("$") && part.length > 1) {
          return <InlineMath key={i} math={part.slice(1, -1)} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export const Route = createFileRoute("/_authenticated/exam")({
  ssr: false,
  validateSearch: (s) =>
    z.object({
      section: z.coerce.number().int().min(1).max(500).optional(),
      mode: z.enum(["exam", "practice"]).optional(),
      track: z.enum(["quantitative", "verbal"]).optional(),
    }).parse(s),
  head: () => ({
    meta: [
      { title: "نظام نمر — منصة المِقْيَاس" },
      { name: "description", content: "محرّك اختبار نمر التفاعلي: سبورة رقمية، أسئلة رياضية، ومؤقّت." },
    ],
  }),
  component: ExamGate,
});

function ExamGate() {
  const { t, dir } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    loadSession().then((s) => {
      if (!s) { window.location.replace("/auth"); return; }
      setSession(s); setReady(true);
    });
  }, []);
  if (!ready || !session) {
    return <div dir={dir} className="min-h-[60vh] grid place-items-center text-muted-foreground">{t("exam.loadingEngine")}</div>;
  }
  return <ExamOrPicker session={session} />;
}

function ExamOrPicker({ session }: { session: Session }) {
  const { mode, section, track } = Route.useSearch();
  const { t, n: num, dir } = useI18n();
  const activeTrack: TrackId = isTrackId(track) ? track : "quantitative";
  const navigate = useNavigate();
  const fetchSignedUrl = useServerFn(getSectionVideoSignedUrl);
  const fetchMediaAsset = useServerFn(getMediaAsset);
  const [videoModal, setVideoModal] = useState<null | { loading: boolean; url: string | null; error: string | null }>(null);

  async function openVideo() {
    setVideoModal({ loading: true, url: null, error: null });
    try {
      const asset = await fetchMediaAsset({ data: { scope: "section", track: activeTrack, key: String(section ?? 1) } });
      let path = asset?.video_path?.trim() || "";
      if (!path) {
        // Legacy fallback: check localStorage from older admin uploads
        const list = loadSections(activeTrack);
        const sec = list.find((s) => s.number === (section ?? 1));
        path = sec?.videoUrl?.trim() || "";
      }
      if (!path) {
        setVideoModal({ loading: false, url: null, error: t("exam.videoNone") });
        return;
      }
      if (/^https?:\/\//i.test(path)) {
        setVideoModal({ loading: false, url: path, error: null });
        return;
      }
      const res = await fetchSignedUrl({ data: { path } });
      if (!res?.url) throw new Error(t("exam.videoFailed"));
      setVideoModal({ loading: false, url: res.url, error: null });
    } catch (e: any) {
      setVideoModal({ loading: false, url: null, error: e?.message || t("exam.videoFailed") });
    }
  }

  if (!mode) {
    return (
      <div dir={dir} className="min-h-[70vh] grid place-items-center px-6 py-10">
        <div className="luxury-card p-8 max-w-2xl w-full text-center">
          <div className="text-xs font-semibold text-teal-deep mb-2">
            {t(`track.${activeTrack}.label`)} — {t("common.section")} {num(section ?? 1)}
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">{t("exam.pickTitle")}</h1>
          <p className="text-sm text-muted-foreground mb-6">{t("exam.pickLead")}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate({ to: "/exam", search: { section, mode: "exam", track: activeTrack } })}
              className="group rounded-2xl border-2 border-teal/40 bg-gradient-to-br from-teal-soft to-white p-6 text-start hover:border-teal hover:shadow-lg transition-all"
            >
              <div className="text-3xl mb-2">⏱</div>
              <div className="font-display font-bold text-lg text-teal-deep mb-1">{t("exam.timedTitle")}</div>
              <div className="text-xs text-muted-foreground leading-6">{t("exam.timedDesc")}</div>
            </button>
            <button
              onClick={() => navigate({ to: "/exam", search: { section, mode: "practice", track: activeTrack } })}
              className="group rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-gold-soft to-white p-6 text-start hover:border-gold hover:shadow-lg transition-all"
            >
              <div className="text-3xl mb-2">🧘</div>
              <div className="font-display font-bold text-lg text-foreground mb-1">{t("exam.practiceTitle")}</div>
              <div className="text-xs text-muted-foreground leading-6">{t("exam.practiceDesc")}</div>
            </button>
            <button
              onClick={openVideo}
              className="group rounded-2xl border-2 border-teal/40 bg-gradient-to-br from-white to-teal-soft/60 p-6 text-start hover:border-teal-deep hover:shadow-lg transition-all"
            >
              <div className="text-3xl mb-2">🎬</div>
              <div className="font-display font-bold text-lg text-teal-deep mb-1">{t("exam.videoTitle")}</div>
              <div className="text-xs text-muted-foreground leading-6">{t("exam.videoDesc")}</div>
            </button>
          </div>
        </div>

        {videoModal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4" onClick={() => setVideoModal(null)}>
            <div className="luxury-card p-6 max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-lg text-foreground">
                  {t("exam.videoModalTitle", { n: num(section ?? 1) })}
                </h3>
                <button onClick={() => setVideoModal(null)} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
              </div>
              {videoModal.loading && (
                <div className="py-10 text-center text-sm text-muted-foreground">{t("exam.videoPreparing")}</div>
              )}
              {!videoModal.loading && videoModal.error && (
                <div className="py-8 text-center text-sm text-destructive font-semibold">{videoModal.error}</div>
              )}
              {!videoModal.loading && videoModal.url && (
                <video src={videoModal.url} controls autoPlay className="w-full rounded-xl bg-black aspect-video" />
              )}
              <div className="mt-4 text-end">
                <button onClick={() => setVideoModal(null)} className="rounded-xl bg-teal text-white px-5 py-2 text-sm font-bold hover:bg-teal-deep transition-colors">
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  return <NemrExamEngine session={session} mode={mode} track={activeTrack} />;
}

function NemrExamEngine({ session, mode, track }: { session: Session; mode: "exam" | "practice"; track: TrackId }) {
  const navigate = useNavigate();
  const { t, n: num, dir } = useI18n();
  const gradeAttempt = useServerFn(gradeSectionAttempt);
  const { section: sectionNumber } = Route.useSearch();
  const isPractice = mode === "practice";
  const [config, setConfig] = useState<SectionConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [fontScale, setFontScale] = useState(1);
  const [modal, setModal] = useState<null | "section-inst" | "exam-inst" | "rules">(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [warned4, setWarned4] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [correctByQid, setCorrectByQid] = useState<Record<string, number>>({});
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    const n = sectionNumber ?? 1;
    let cancelled = false;
    // Ensure we have the freshest question bank from the shared server before starting.
    hydrateQuestionBankFromServer().finally(() => {
      if (cancelled) return;
      const c = getSection(n, track);
      const qs = getQuestions(n, track);
      setConfig(c);
      setQuestions(qs);
      setCurrent(0);
      setAnswers({});
      setBookmarks({});
      setFlagged({});
      setRemaining(computeTimerSeconds(c, qs.length));
      setWarned4(false);
      setFinished(false);
    });
    return () => { cancelled = true; };
  }, [sectionNumber, track]);

  useEffect(() => {
    if (!config || isPractice) return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [config, isPractice]);

  // إشعار عند تبقّي ٤ دقائق
  useEffect(() => {
    if (!config || isPractice) return;
    if (!warned4 && remaining > 0 && remaining <= 240) {
      setWarned4(true);
      setToast(t("exam.warn4"));
      setTimeout(() => setToast(null), 8000);
    }
  }, [remaining, warned4, config, isPractice]);

  if (questions.length === 0) {
    return (
      <div dir={dir} className="min-h-[60vh] grid place-items-center px-6">
        <div className="luxury-card p-8 max-w-md text-center">
          <div className="text-3xl mb-3">📝</div>
          <h2 className="font-display font-bold text-lg text-foreground mb-2">{t("exam.noQuestions")}</h2>
          <p className="text-sm text-muted-foreground mb-5">{t("exam.noQuestionsBody", { n: num(sectionNumber ?? 1) })}</p>
          <button onClick={() => navigate({ to: "/dashboard", search: { track } })} className="rounded-xl bg-teal text-white px-5 py-2.5 text-sm font-bold hover:bg-teal-deep transition-colors">
            {t("common.backToSections")}
          </button>
        </div>
      </div>
    );
  }

  const solved = Object.keys(answers).length;
  const unsolved = questions.length - solved;
  const active = questions[current];

  async function finish() {
    if (!isPractice && unsolved > 0) {
      setToast(t("exam.mustSolveAll", { n: num(unsolved) }));
      setTimeout(() => setToast(null), 5000);
      return;
    }
    const msg = isPractice
      ? (unsolved > 0 ? t("exam.confirmPracticeLeft", { n: num(unsolved) }) : t("exam.confirmPractice"))
      : t("exam.confirmExam");
    if (!confirm(msg)) return;
    // Grade server-side — answer keys never live in the browser bundle.
    setGrading(true);
    try {
      const answersByQid: Record<string, number> = {};
      for (const q of questions) {
        const a = answers[q.id];
        if (typeof a === "number") answersByQid[q.id] = a;
      }
      const graded = await gradeAttempt({
        data: { section_number: serverSectionNumber(track, sectionNumber ?? 1), answers: answersByQid },
      });
      const correctMap: Record<string, number> = {};
      for (const [qid, r] of Object.entries(graded.results)) correctMap[qid] = (r as any).correctIndex;
      setCorrectByQid(correctMap);
      const wrongIds = questions
        .filter((q) => !graded.results[q.id] || !(graded.results[q.id] as any).ok)
        .map((q) => q.id);
      const attempt = {
        at: Date.now(),
        section: sectionNumber ?? 1,
        sectionTitle: config?.title ?? "",
        mode,
        track,
        total: questions.length,
        correct: graded.correct,
        answers,
        wrongIds,
        correctByQid: correctMap,
      };
      try {
        const key = resultsKey(track);
        const prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.push(attempt);
        localStorage.setItem(key, JSON.stringify(prev));
      } catch {}
      setFinished(true);
    } catch (e: any) {
      setToast(t("exam.gradeFailed") + (e?.message ?? t("exam.unknownError")));
      setTimeout(() => setToast(null), 6000);
    } finally {
      setGrading(false);
    }
  }

  if (finished) {
    return (
      <ResultsView
        questions={questions}
        answers={answers}
        correctByQid={correctByQid}
        sectionNumber={sectionNumber ?? 1}
        sectionTitle={config?.title ?? ""}
        mode={mode}
        onRestart={() => {
          setAnswers({});
          setCurrent(0);
          setFinished(false);
          setCorrectByQid({});
          setRemaining(computeTimerSeconds(config!, questions.length));
          setWarned4(false);
        }}
        onBack={() => navigate({ to: "/dashboard", search: { track } })}
      />
    );
  }

  return (
    <div dir={dir} className="min-h-screen bg-surface-1 text-foreground">
      {/* Top ribbon */}
      <div className="sticky top-0 z-30 border-b border-teal/20 bg-gradient-to-l from-teal-soft to-white">
        <div className="mx-auto max-w-[1400px] flex flex-wrap items-center justify-between gap-2 sm:gap-4 px-3 sm:px-5 py-2 sm:py-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
            <div className="flex items-center gap-2 rounded-xl bg-white border border-teal/30 px-2.5 sm:px-3 py-1.5 shadow-sm min-w-0">
              <span className="hidden sm:inline text-[10px] font-semibold text-muted-foreground">{isPractice ? t("exam.modeLabel") : t("exam.codeLabel")}</span>
              <span className="font-bold text-teal-deep text-xs sm:text-base truncate">{isPractice ? t("exam.practice") : t("exam.exam")} — {t("common.section")} {config?.number ? num(config.number) : "…"}</span>
            </div>
            <div className="text-[11px] sm:text-xs text-muted-foreground">{t("exam.totalQuestions")} <span className="font-bold text-foreground">{num(questions.length)}</span></div>
            <div className="text-[11px] sm:text-xs text-muted-foreground">{t("exam.solved")} <span className="font-bold text-teal-deep">{num(solved)}</span></div>
            <div className="text-[11px] sm:text-xs text-muted-foreground">{t("exam.remaining")} <span className="font-bold text-foreground">{num(unsolved)}</span></div>
          </div>

          {isPractice ? (
            <div className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold shadow-md border bg-gold-soft border-gold/40 text-foreground">
              <span>🧘</span>
              <span>{t("exam.practiceNoTimer")}</span>
            </div>
          ) : (
            <div className={"flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-lg font-bold shadow-md border " +
              (remaining < 60 ? "bg-red-50 border-red-300 text-red-700 animate-pulse" : "bg-white border-teal/40 text-teal-deep")}>
              <span className="text-xs font-sans font-semibold text-muted-foreground">⏱</span>
              {num(formatTimer(remaining))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] grid grid-cols-12 gap-3 sm:gap-4 px-3 sm:px-5 py-4 sm:py-5">
        {/* Sidebar (right in RTL) */}
        <aside className="col-span-12 lg:col-span-2 space-y-3 order-2 lg:order-1">

          <div className="luxury-card p-3">
            <div className="text-[10px] font-semibold text-muted-foreground mb-1.5">{t("exam.studentId")}</div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal to-teal-deep text-white grid place-items-center font-bold text-xs">
                {session.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-foreground truncate" dir="ltr">{session.email}</div>
                <div className="text-[10px] text-muted-foreground">{session.role === "admin" ? t("exam.roleAdmin") : t("exam.roleStudent")}</div>
              </div>
            </div>
          </div>

          <div className="luxury-card p-3">
            <div className="text-[10px] font-semibold text-muted-foreground mb-2">{t("exam.grid")}</div>
            <div className="grid grid-cols-8 sm:grid-cols-10 lg:grid-cols-5 gap-1">
              {questions.map((q, i) => {
                const answered = answers[q.id] !== undefined;
                const isActive = i === current;
                const isFlag = flagged[q.id];
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrent(i)}
                    className={"h-9 lg:h-7 rounded-md text-[11px] lg:text-[10px] font-bold transition-all border " +
                      (isActive
                        ? "gold-ring bg-white text-teal-deep border-transparent"
                        : answered
                          ? "bg-answered text-white border-transparent hover:opacity-90"
                          : isFlag
                            ? "bg-teal-soft text-teal-deep border-teal/40"
                            : "bg-surface-2 text-foreground border-border hover:bg-white")}
                  >{num(i + 1)}</button>
                );
              })}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1 text-[9px]">
              <Legend color="bg-answered" label={t("exam.legendAnswered")} />
              <Legend color="bg-teal-soft border border-teal/40" label={t("exam.legendFlagged")} />
              <Legend color="bg-surface-2 border border-border" label={t("exam.legendUnvisited")} />
            </div>
          </div>

          <div className="luxury-card p-2.5 space-y-1.5">
            <UtilBtn onClick={() => setModal("section-inst")}>{t("exam.sectionInst")}</UtilBtn>
            <UtilBtn onClick={() => setModal("exam-inst")}>{t("exam.examInst")}</UtilBtn>
            <UtilBtn onClick={() => setModal("rules")}>{t("exam.rules")}</UtilBtn>
            <button
              onClick={finish}
              disabled={!isPractice && unsolved > 0}
              title={!isPractice && unsolved > 0 ? t("exam.mustSolveFirst", { n: num(unsolved) }) : (isPractice ? t("exam.finishPracticeTitle") : t("exam.finishExamTitle"))}
              className={
                "w-full rounded-lg font-bold py-2.5 text-xs shadow-md transition-colors " +
                (!isPractice && unsolved > 0
                  ? "bg-surface-2 text-muted-foreground cursor-not-allowed border border-border"
                  : "bg-red-600 hover:bg-red-700 text-white")
              }
            >
              {isPractice
                ? t("exam.finishPractice")
                : (unsolved > 0 ? t("exam.finishSectionLeft", { n: num(unsolved) }) : t("exam.finishSection"))}
            </button>
          </div>
        </aside>

        {/* Question + choices (middle, larger) */}
        <section className="col-span-12 lg:col-span-6 order-1 lg:order-2">
          <div className="luxury-card p-4 sm:p-6">

            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold text-teal-deep">{t("common.question")} {num(current + 1)} / {num(questions.length)}</div>
              <div className="flex items-center gap-1">
                <button onClick={() => setFontScale((s) => Math.max(0.8, s - 0.1))} className="h-8 w-8 rounded-lg border border-border bg-white hover:border-teal transition-colors text-sm font-bold">A-</button>
                <button onClick={() => setFontScale(1)} className="h-8 w-8 rounded-lg border border-border bg-white hover:border-teal transition-colors text-sm font-bold">A</button>
                <button onClick={() => setFontScale((s) => Math.min(1.6, s + 0.1))} className="h-8 w-8 rounded-lg border border-border bg-white hover:border-teal transition-colors text-sm font-bold">A+</button>
              </div>
            </div>

            <div style={{ fontSize: `${fontScale * 1.12}rem` }}>
              {active.passage && (
                <div className="rounded-xl border-2 border-teal/40 bg-teal-soft/40 p-4 mb-4 max-h-72 overflow-y-auto">
                  <div className="text-[11px] font-bold text-teal-deep mb-2">
                    {active.passageTitle ?? t("exam.passageDefault")}
                  </div>
                  <p className="text-foreground leading-8 whitespace-pre-line text-[0.95em]">{active.passage}</p>
                </div>
              )}
              <p className="text-foreground mb-4 leading-8"><MathText text={active.prompt} /></p>
              {active.tableHtml && (
                <div className="rounded-xl bg-white border border-border p-2 sm:p-4 mb-4 overflow-x-auto [&_table]:min-w-[18rem] [&_table]:text-[0.85em] sm:[&_table]:text-[1em]"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(active.tableHtml) }} />
              )}
              {!active.tableHtml && active.svg && (
                <div className="rounded-xl bg-white border border-border p-2 sm:p-4 mb-4 flex justify-center overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:max-h-56 sm:[&_svg]:max-h-64"
                  dangerouslySetInnerHTML={{ __html: sanitizeSvg(active.svg) }} />
              )}
              {active.imageUrl && (
                <div className="rounded-xl bg-white border border-border p-2 sm:p-3 mb-4 text-center">
                  <img src={active.imageUrl} alt={t("exam.figureAlt")} loading="lazy" className="w-full max-w-full h-auto max-h-[45vh] sm:max-h-72 object-contain mx-auto rounded-lg" />
                </div>
              )}

              {active.latex && (
                <div className="rounded-xl bg-surface-1 border border-border p-3 sm:p-4 mb-6 text-center overflow-x-auto">
                  <BlockMath math={active.latex} />
                </div>
              )}


              <div className="space-y-2.5">
                {active.choices.map((choice, idx) => {
                  const letters = ["أ", "ب", "ج", "د"];
                  const chosen = answers[active.id] === idx;
                  return (
                    <label
                      key={idx}
                      className={"flex items-center justify-between gap-3 rounded-xl border p-3.5 cursor-pointer transition-all " +
                        (chosen ? "border-teal bg-teal-soft" : "border-border bg-white hover:border-teal/50")}
                    >
                      <div className="flex items-center gap-3">
                        <div className={"h-8 w-8 rounded-lg grid place-items-center font-bold text-sm " +
                          (chosen ? "bg-teal text-white" : "bg-surface-2 text-foreground")}>{letters[idx]}</div>
                        <span className="text-foreground"><MathText text={choice} /></span>
                      </div>
                      <input
                        type="radio"
                        name={`q-${active.id}`}
                        checked={chosen}
                        onChange={() => setAnswers((prev) => ({ ...prev, [active.id]: idx }))}
                        className="h-5 w-5 accent-teal cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Bottom nav */}
            <div className="mt-6 flex flex-wrap gap-2 justify-between border-t border-border pt-4">
              <div className="flex gap-2">
                <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold hover:border-teal transition-colors">{t("exam.prev")}</button>
                <button onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))} className="rounded-xl bg-teal text-white px-4 py-2 text-sm font-bold hover:bg-teal-deep transition-colors">{t("exam.next")}</button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setBookmarks((b) => ({ ...b, [active.id]: !b[active.id] }))}
                  className={"rounded-xl px-3 py-2 text-xs font-semibold border transition-colors " +
                    (bookmarks[active.id] ? "border-gold bg-gold-soft text-foreground" : "border-border bg-white text-foreground hover:border-gold")}
                >
                  {t("exam.bookmark")}
                </button>
                <button
                  onClick={() => setFlagged((f) => ({ ...f, [active.id]: !f[active.id] }))}
                  className={"rounded-xl px-3 py-2 text-xs font-semibold border transition-colors " +
                    (flagged[active.id] ? "border-teal bg-teal-soft text-teal-deep" : "border-border bg-white text-foreground hover:border-teal")}
                >
                  {t("exam.flag")}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Scratchpad (left in RTL) */}
        <aside className="col-span-12 lg:col-span-4 order-3">
          <Scratchpad questionId={active.id} />
        </aside>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" onClick={() => setModal(null)}>
          <div className="luxury-card p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-bold text-lg mb-3 text-foreground">
              {modal === "section-inst" ? t("exam.sectionInst") : modal === "exam-inst" ? t("exam.examInst") : t("exam.rules")}
            </h3>
            <p className="text-sm text-muted-foreground leading-7">
              {modal === "section-inst" && t("exam.sectionInstBody")}
              {modal === "exam-inst" && t("exam.examInstBody")}
              {modal === "rules" && t("exam.rulesBody")}
            </p>
            <button onClick={() => setModal(null)} className="mt-5 rounded-xl bg-teal text-white px-5 py-2 text-sm font-bold hover:bg-teal-deep transition-colors">
              {t("common.understood")}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-foreground text-white px-5 py-3 text-sm font-semibold shadow-2xl border border-gold/40 max-w-md text-center animate-in fade-in slide-in-from-bottom-4">
          {toast}
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={"h-3 w-3 rounded " + color} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function UtilBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-start rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground hover:border-teal hover:bg-teal-soft transition-colors">
      {children}
    </button>
  );
}

// ────────────── Results ──────────────
function ResultsView({
  questions,
  answers,
  correctByQid,
  sectionNumber,
  sectionTitle,
  mode,
  onRestart,
  onBack,
}: {
  questions: Question[];
  answers: Record<string, number>;
  correctByQid: Record<string, number>;
  sectionNumber: number;
  sectionTitle: string;
  mode: "exam" | "practice";
  onRestart: () => void;
  onBack: () => void;
}) {
  const { t, n: num, dir } = useI18n();
  const letters = ["أ", "ب", "ج", "د"];
  const isCorrect = (q: Question) =>
    typeof correctByQid[q.id] === "number" && answers[q.id] === correctByQid[q.id];
  const correctCount = questions.reduce((n, q) => n + (isCorrect(q) ? 1 : 0), 0);
  const total = questions.length;
  const pct = Math.round((correctCount / Math.max(1, total)) * 100);
  const wrongs = questions.filter((q) => !isCorrect(q));

  return (
    <div dir={dir} className="min-h-screen bg-surface-1">
      <div className="mx-auto max-w-4xl px-5 py-8 space-y-6">
        {/* Header */}
        <div className="luxury-card p-6 text-center">
          <div className="text-xs font-semibold text-teal-deep mb-2">
            {t("res.title", { mode: mode === "practice" ? t("res.practiceWord") : t("res.examWord"), n: num(sectionNumber) })}
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground mb-1">{sectionTitle}</h1>
          <div className="mt-6 flex items-center justify-center gap-6">
            <div className={"h-32 w-32 rounded-full grid place-items-center border-8 " +
              (pct >= 70 ? "border-teal bg-teal-soft text-teal-deep" :
                pct >= 50 ? "border-gold bg-gold-soft text-foreground" : "border-red-300 bg-red-50 text-red-700")}>
              <div className="text-center">
                <div className="text-3xl font-bold">{num(correctCount)}</div>
                <div className="text-xs">{t("common.of")} {num(total)}</div>
              </div>
            </div>
            <div className="text-start space-y-2">
              <div className="text-sm"><span className="text-muted-foreground">{t("res.percent")}</span> <span className="font-bold text-lg text-foreground">{num(pct)}%</span></div>
              <div className="text-sm"><span className="text-muted-foreground">{t("res.correct")}</span> <span className="font-bold text-teal-deep">{num(correctCount)}</span></div>
              <div className="text-sm"><span className="text-muted-foreground">{t("res.wrong")}</span> <span className="font-bold text-red-600">{num(total - correctCount)}</span></div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            <button onClick={onRestart} className="rounded-xl bg-teal text-white px-5 py-2.5 text-sm font-bold hover:bg-teal-deep transition-colors">{t("res.retry")}</button>
            <button onClick={onBack} className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-bold hover:border-teal transition-colors">{t("common.backToSections")}</button>
          </div>
        </div>

        {/* Mistakes area */}
        <div className="luxury-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-foreground">{t("res.mistakes")}</h2>
            <span className="text-xs font-semibold rounded-full bg-red-50 text-red-700 px-3 py-1 border border-red-200">{t("res.mistakeCount", { n: num(wrongs.length) })}</span>
          </div>
          {wrongs.length === 0 ? (
            <div className="text-center py-8 text-teal-deep font-semibold">{t("res.perfect")}</div>
          ) : (
            <div className="space-y-4">
              {wrongs.map((q) => {
                const chosen = answers[q.id];
                const correctIndex = correctByQid[q.id];
                const hasCorrectAnswer = typeof correctIndex === "number" && correctIndex >= 0 && correctIndex < q.choices.length;
                const qNumber = questions.findIndex((x) => x.id === q.id) + 1;
                return (
                  <div key={q.id} className="rounded-xl border border-red-200 bg-red-50/40 p-4">
                    <div className="text-[11px] font-bold text-red-700 mb-2">{t("common.question")} {num(qNumber)}</div>
                    {q.passage && (
                      <div className="rounded-lg border border-teal/30 bg-white p-3 mb-3 max-h-40 overflow-y-auto text-xs leading-6 whitespace-pre-line text-muted-foreground">
                        {q.passage}
                      </div>
                    )}
                    <div className="text-sm text-foreground mb-3 leading-7"><MathText text={q.prompt} /></div>
                    {q.tableHtml
                      ? <div className="rounded-lg bg-white border border-border p-2 sm:p-3 mb-3 overflow-x-auto [&_table]:min-w-[18rem] [&_table]:text-[0.85em] sm:[&_table]:text-[1em]" dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.tableHtml) }} />
                      : q.svg && <div className="rounded-lg bg-white border border-border p-2 sm:p-3 mb-3 flex justify-center overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:max-h-48" dangerouslySetInnerHTML={{ __html: sanitizeSvg(q.svg) }} />}

                    {q.imageUrl && (
                      <div className="rounded-lg bg-white border border-border p-2 sm:p-3 mb-3 text-center">
                        <img src={q.imageUrl} alt={`${t("common.question")} ${num(qNumber)}`} loading="lazy" className="w-full h-auto max-h-[45vh] sm:max-h-72 object-contain mx-auto rounded-lg" />
                      </div>
                    )}

                    {q.latex && (
                      <div className="rounded-lg bg-white border border-border p-3 mb-3 text-center">
                        <BlockMath math={q.latex} />
                      </div>
                    )}
                    <div className="space-y-1.5 mb-3">
                      {q.choices.map((choice, ci) => {
                        const isChosen = chosen === ci;
                        const isRight = hasCorrectAnswer && correctIndex === ci;
                        return (
                          <div key={ci} className={"flex items-center gap-2 rounded-lg border p-2 text-xs " +
                            (isRight ? "border-teal bg-teal-soft/60" : isChosen ? "border-red-400 bg-red-100/70" : "border-border bg-white")}>
                            <span className={"h-6 w-6 shrink-0 rounded-md grid place-items-center font-bold " +
                              (isRight ? "bg-teal text-white" : isChosen ? "bg-red-500 text-white" : "bg-surface-2 text-foreground")}>{letters[ci]}</span>
                            <span className="text-foreground leading-6"><MathText text={choice} /></span>
                            {isRight && <span className="ms-auto text-teal-deep font-bold">✓</span>}
                            {isChosen && !isRight && <span className="ms-auto text-red-600 font-bold">✕</span>}
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid gap-1.5 text-xs">
                      <div className="text-red-700"><span className="font-bold">{t("common.yourAnswer")}</span> {letters[chosen] ?? "—"} — {chosen !== undefined ? <MathText text={q.choices[chosen]} /> : t("common.notAnswered")}</div>
                      <div className="text-teal-deep">
                        <span className="font-bold">{t("common.correctAnswer")}</span>{" "}
                        {hasCorrectAnswer ? (
                          <>{letters[correctIndex]} — <MathText text={q.choices[correctIndex]} /></>
                        ) : (
                          <span className="text-muted-foreground">{t("res.loadFailed")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Full review */}
        <div className="luxury-card p-6">
          <h2 className="font-display font-bold text-lg text-foreground mb-4">{t("res.fullReview")}</h2>
          <div className="grid grid-cols-10 gap-1.5">
            {questions.map((q, i) => {
              const ok = isCorrect(q);
              return (
                <div key={q.id} title={`${t("common.question")} ${num(i + 1)} — ${ok ? t("common.correct") : t("common.wrong")}`}
                  className={"h-9 rounded-lg grid place-items-center text-xs font-bold border " +
                    (ok ? "bg-teal text-white border-transparent" : "bg-red-500 text-white border-transparent")}>
                  {num(i + 1)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────── Scratchpad ──────────────
type Stroke = { color: string; size: number; points: { x: number; y: number }[]; erase: boolean };

function Scratchpad({ questionId }: { questionId: string }) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [full, setFull] = useState(false);
  const [color, setColor] = useState("#0F766E");

  const [size, setSize] = useState(3);
  const cacheRef = useRef<Map<string, Stroke[]>>(new Map());
  const strokesRef = useRef<Stroke[]>([]);
  const redoRef = useRef<Stroke[]>([]);
  const drawing = useRef(false);
  const current = useRef<Stroke | null>(null);
  const rafRef = useRef<number | null>(null);
  const dprRef = useRef(1);
  const toolRef = useRef(tool); toolRef.current = tool;
  const colorRef = useRef(color); colorRef.current = color;
  const sizeRef = useRef(size); sizeRef.current = size;

  const paintStroke = useCallback((ctx: CanvasRenderingContext2D, s: Stroke) => {
    const pts = s.points;
    if (pts.length === 0) return;
    ctx.strokeStyle = s.erase ? "#FFFFFF" : s.color;
    ctx.lineWidth = s.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (pts.length === 1) {
      ctx.arc(pts[0].x, pts[0].y, s.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = s.erase ? "#FFFFFF" : s.color;
      ctx.fill();
      return;
    }
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
  }, []);

  const redraw = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const w = c.width / dprRef.current;
    const h = c.height / dprRef.current;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#E9EEF4"; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 24) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
    for (let y = 0; y <= h; y += 24) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
    ctx.stroke();
    for (const s of strokesRef.current) paintStroke(ctx, s);
    if (current.current) paintStroke(ctx, current.current);
  }, [paintStroke]);

  const schedule = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      redraw();
    });
  }, [redraw]);

  // High-DPI sizing + resize handling
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const fit = () => {
      const rect = c.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;
      c.width = Math.round(rect.width * dpr);
      c.height = Math.round(rect.height * dpr);
      const ctx = c.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redraw();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);
    return () => { ro.disconnect(); if (rafRef.current != null) cancelAnimationFrame(rafRef.current); };
  }, [redraw]);

  // Swap cached strokes when the question changes
  useEffect(() => {
    const prevId = questionId;
    strokesRef.current = cacheRef.current.get(questionId) ?? [];
    redoRef.current = [];
    redraw();
    return () => { cacheRef.current.set(prevId, strokesRef.current); };
  }, [questionId, redraw]);

  function pos(e: PointerEvent | React.PointerEvent<HTMLCanvasElement>, rect: DOMRect) {
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = e.currentTarget;
    c.setPointerCapture(e.pointerId);
    drawing.current = true;
    const erase = toolRef.current === "eraser";
    current.current = {
      color: colorRef.current,
      size: erase ? sizeRef.current * 5 : sizeRef.current,
      points: [pos(e, c.getBoundingClientRect())],
      erase,
    };
    schedule();
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !current.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const native = e.nativeEvent as PointerEvent & { getCoalescedEvents?: () => PointerEvent[] };
    const events = native.getCoalescedEvents ? native.getCoalescedEvents() : [native];
    const pts = current.current.points;
    for (const ev of events.length ? events : [native]) {
      const p = pos(ev, rect);
      const last = pts[pts.length - 1];
      if (last && Math.abs(last.x - p.x) < 0.6 && Math.abs(last.y - p.y) < 0.6) continue;
      pts.push(p);
    }
    schedule();
  }

  function up(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    drawing.current = false;
    if (current.current) {
      strokesRef.current = [...strokesRef.current, current.current];
      cacheRef.current.set(questionId, strokesRef.current);
      current.current = null;
    }
    redoRef.current = [];
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    schedule();
  }

  function undo() {
    if (strokesRef.current.length === 0) return;
    const last = strokesRef.current[strokesRef.current.length - 1];
    strokesRef.current = strokesRef.current.slice(0, -1);
    redoRef.current = [...redoRef.current, last];
    cacheRef.current.set(questionId, strokesRef.current);
    schedule();
  }
  function redoStroke() {
    if (redoRef.current.length === 0) return;
    const last = redoRef.current[redoRef.current.length - 1];
    redoRef.current = redoRef.current.slice(0, -1);
    strokesRef.current = [...strokesRef.current, last];
    cacheRef.current.set(questionId, strokesRef.current);
    schedule();
  }
  function clear() {
    strokesRef.current = [];
    redoRef.current = [];
    cacheRef.current.set(questionId, []);
    schedule();
  }

  const colors = ["#0F766E", "#F59E0B", "#DC2626", "#2563EB", "#16A34A", "#111827"];

  return (
    <div className={full
      ? "fixed inset-0 z-[60] bg-white p-3 flex flex-col"
      : "luxury-card p-3"}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-xs font-semibold text-teal-deep truncate">{t("exam.boardTitle")}</div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:block text-[10px] text-muted-foreground">{t("exam.boardHint")}</div>
          <button
            onClick={() => setFull((f) => !f)}
            aria-label={full ? "تصغير السبورة" : "تكبير السبورة"}
            className="rounded-lg border border-border bg-white px-2 py-1 text-xs font-semibold hover:border-teal"
          >{full ? "⤡" : "⤢"}</button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button onClick={() => setTool("pen")} className={"px-3 py-2 sm:py-1.5 text-xs font-semibold " + (tool === "pen" ? "bg-teal text-white" : "bg-white text-foreground hover:bg-surface-2")}>{t("exam.pen")}</button>
          <button onClick={() => setTool("eraser")} className={"px-3 py-2 sm:py-1.5 text-xs font-semibold " + (tool === "eraser" ? "bg-teal text-white" : "bg-white text-foreground hover:bg-surface-2")}>{t("exam.eraser")}</button>
        </div>
        <div className="flex gap-1.5 items-center">
          {colors.map((c) => (
            <button key={c} onClick={() => { setColor(c); setTool("pen"); }} aria-label={`color ${c}`}
              className={"h-7 w-7 sm:h-6 sm:w-6 rounded-full border-2 transition-transform " + (color === c ? "border-foreground scale-110" : "border-white")}
              style={{ backgroundColor: c }} />
          ))}
        </div>
        <input type="range" min={1} max={12} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-16 sm:w-20 accent-teal" />
        <button onClick={undo} aria-label={t("exam.undo")} title={t("exam.undo")} className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold hover:border-teal">↺</button>
        <button onClick={redoStroke} aria-label={t("exam.redo")} title={t("exam.redo")} className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold hover:border-teal">↻</button>
        <button onClick={clear} aria-label={t("exam.clear")} className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:border-red-400">{t("exam.clear")}</button>
      </div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={t("exam.boardAria")}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        style={{ touchAction: "none" }}
        className={"w-full rounded-xl bg-white border border-border touch-none cursor-crosshair select-none " +
          (full ? "flex-1 min-h-0" : "h-[55vh] min-h-[320px] sm:h-[520px] lg:h-[640px]")}
      />
    </div>
  );
}
