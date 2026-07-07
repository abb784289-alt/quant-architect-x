import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { BlockMath, InlineMath } from "react-katex";
import { readSession, type Session } from "@/lib/session";
import { getSection, formatTimer, getQuestions, computeTimerSeconds, type SectionConfig, type Question } from "@/lib/platform-config";

export const Route = createFileRoute("/_authenticated/exam")({
  ssr: false,
  validateSearch: (s) => z.object({ section: z.coerce.number().int().min(1).max(150).optional() }).parse(s),
  head: () => ({
    meta: [
      { title: "نظام نمر — منصة المِقْيَاس" },
      { name: "description", content: "محرّك اختبار نمر التفاعلي: سبورة رقمية، أسئلة رياضية، ومؤقّت." },
    ],
  }),
  component: ExamGate,
});

function ExamGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const s = readSession();
    if (!s) { window.location.replace("/auth"); return; }
    setSession(s); setReady(true);
  }, []);
  if (!ready || !session) {
    return <div dir="rtl" className="min-h-[60vh] grid place-items-center text-muted-foreground">جارٍ تحميل محرك الاختبار...</div>;
  }
  return <NemrExamEngine session={session} />;
}

function NemrExamEngine({ session }: { session: Session }) {
  const navigate = useNavigate();
  const { section: sectionNumber } = Route.useSearch();
  const [config, setConfig] = useState<SectionConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [fontScale, setFontScale] = useState(1);
  const [modal, setModal] = useState<null | "section-inst" | "exam-inst" | "rules">(null);
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    const n = sectionNumber ?? 1;
    const c = getSection(n);
    const qs = getQuestions(n);
    setConfig(c);
    setQuestions(qs);
    setCurrent(0);
    setAnswers({});
    setBookmarks({});
    setFlagged({});
    setRemaining(computeTimerSeconds(c, qs.length));
  }, [sectionNumber]);

  useEffect(() => {
    if (!config) return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [config]);

  if (questions.length === 0) {
    return (
      <div dir="rtl" className="min-h-[60vh] grid place-items-center px-6">
        <div className="luxury-card p-8 max-w-md text-center">
          <div className="text-3xl mb-3">📝</div>
          <h2 className="font-display font-bold text-lg text-foreground mb-2">لا توجد أسئلة في هذا القسم بعد</h2>
          <p className="text-sm text-muted-foreground mb-5">يمكن للمدرّب إضافة أسئلة القسم رقم {sectionNumber ?? 1} من مركز التحكم.</p>
          <button onClick={() => navigate({ to: "/dashboard" })} className="rounded-xl bg-teal text-white px-5 py-2.5 text-sm font-bold hover:bg-teal-deep transition-colors">
            العودة للأقسام
          </button>
        </div>
      </div>
    );
  }

  const solved = Object.keys(answers).length;
  const unsolved = questions.length - solved;
  const active = questions[current];

  function finish() {
    if (confirm("هل أنت متأكد من إنهاء هذا القسم؟")) {
      navigate({ to: "/dashboard" });
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-surface-1 text-foreground">
      {/* Top ribbon */}
      <div className="sticky top-0 z-30 border-b border-teal/20 bg-gradient-to-l from-teal-soft to-white">
        <div className="mx-auto max-w-[1400px] flex items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-xl bg-white border border-teal/30 px-3 py-1.5 shadow-sm">
              <span className="text-[10px] font-semibold text-muted-foreground">كود الاختبار</span>
              <span className="font-mono font-bold text-teal-deep">نمر — قسم {config?.number ?? "…"}</span>
            </div>
            <div className="text-xs text-muted-foreground">مجموع الأسئلة <span className="font-bold text-foreground">{questions.length}</span></div>
            <div className="text-xs text-muted-foreground">تم الحلّ <span className="font-bold text-teal-deep">{solved}</span></div>
            <div className="text-xs text-muted-foreground">متبقّي <span className="font-bold text-foreground">{unsolved}</span></div>
          </div>
          <div className={"flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-lg font-bold shadow-md border " +
            (remaining < 60 ? "bg-red-50 border-red-300 text-red-700 animate-pulse" : "bg-white border-teal/40 text-teal-deep")}>
            <span className="text-xs font-sans font-semibold text-muted-foreground">⏱</span>
            {formatTimer(remaining)}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] grid grid-cols-12 gap-4 px-5 py-5">
        {/* Scratchpad */}
        <aside className="col-span-12 lg:col-span-4">
          <Scratchpad questionId={active.id} />
        </aside>

        {/* Question + choices */}
        <section className="col-span-12 lg:col-span-5">
          <div className="luxury-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold text-teal-deep">سؤال {current + 1} / {questions.length}</div>
              <div className="flex items-center gap-1">
                <button onClick={() => setFontScale((s) => Math.max(0.8, s - 0.1))} className="h-8 w-8 rounded-lg border border-border bg-white hover:border-teal transition-colors text-sm font-bold">A-</button>
                <button onClick={() => setFontScale(1)} className="h-8 w-8 rounded-lg border border-border bg-white hover:border-teal transition-colors text-sm font-bold">A</button>
                <button onClick={() => setFontScale((s) => Math.min(1.6, s + 0.1))} className="h-8 w-8 rounded-lg border border-border bg-white hover:border-teal transition-colors text-sm font-bold">A+</button>
              </div>
            </div>

            <div style={{ fontSize: `${fontScale}rem` }}>
              <p className="text-foreground mb-4 leading-8">{active.prompt}</p>
              {active.imageUrl && (
                <div className="rounded-xl bg-white border border-border p-3 mb-4 text-center">
                  <img src={active.imageUrl} alt="رسم السؤال" className="max-h-72 mx-auto rounded-lg" />
                </div>
              )}
              {active.latex && (
                <div className="rounded-xl bg-surface-1 border border-border p-4 mb-6 text-center">
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
                        <span className="text-foreground"><InlineMath math={choice} /></span>
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
                <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold hover:border-teal transition-colors">← السؤال السابق</button>
                <button onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))} className="rounded-xl bg-teal text-white px-4 py-2 text-sm font-bold hover:bg-teal-deep transition-colors">التالي →</button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setBookmarks((b) => ({ ...b, [active.id]: !b[active.id] }))}
                  className={"rounded-xl px-3 py-2 text-xs font-semibold border transition-colors " +
                    (bookmarks[active.id] ? "border-gold bg-gold-soft text-foreground" : "border-border bg-white text-foreground hover:border-gold")}
                >
                  ★ إضافة لمجلد
                </button>
                <button
                  onClick={() => setFlagged((f) => ({ ...f, [active.id]: !f[active.id] }))}
                  className={"rounded-xl px-3 py-2 text-xs font-semibold border transition-colors " +
                    (flagged[active.id] ? "border-teal bg-teal-soft text-teal-deep" : "border-border bg-white text-foreground hover:border-teal")}
                >
                  ⚑ علامة مرجعية
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <div className="luxury-card p-4">
            <div className="text-xs font-semibold text-muted-foreground mb-2">هوية الطالب</div>
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-teal to-teal-deep text-white grid place-items-center font-bold">
                {session.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-foreground truncate" dir="ltr">{session.email}</div>
                <div className="text-[11px] text-muted-foreground">{session.role === "admin" ? "مدرّب" : "طالب"}</div>
              </div>
            </div>
          </div>

          <div className="luxury-card p-4">
            <div className="text-xs font-semibold text-muted-foreground mb-3">شبكة الأسئلة</div>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((q, i) => {
                const answered = answers[q.id] !== undefined;
                const isActive = i === current;
                const isFlag = flagged[q.id];
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrent(i)}
                    className={"h-9 rounded-lg text-xs font-bold transition-all border " +
                      (isActive
                        ? "gold-ring bg-white text-teal-deep border-transparent"
                        : answered
                          ? "bg-answered text-white border-transparent hover:opacity-90"
                          : isFlag
                            ? "bg-teal-soft text-teal-deep border-teal/40"
                            : "bg-surface-2 text-foreground border-border hover:bg-white")}
                  >{i + 1}</button>
                );
              })}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
              <Legend color="bg-answered" label="مُجاب" />
              <Legend color="bg-teal-soft border border-teal/40" label="مرجعي" />
              <Legend color="bg-surface-2 border border-border" label="لم يُزَر" />
            </div>
          </div>

          {/* Floating utility panel */}
          <div className="luxury-card p-3 space-y-2">
            <UtilBtn onClick={() => setModal("section-inst")}>تعليمات القسم</UtilBtn>
            <UtilBtn onClick={() => setModal("exam-inst")}>تعليمات الاختبار</UtilBtn>
            <UtilBtn onClick={() => setModal("rules")}>القوانين</UtilBtn>
            <button
              onClick={finish}
              className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-sm shadow-md transition-colors"
            >
              إنهاء القسم
            </button>
          </div>
        </aside>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" onClick={() => setModal(null)}>
          <div className="luxury-card p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-bold text-lg mb-3 text-foreground">
              {modal === "section-inst" ? "تعليمات القسم" : modal === "exam-inst" ? "تعليمات الاختبار" : "القوانين"}
            </h3>
            <p className="text-sm text-muted-foreground leading-7">
              {modal === "section-inst" && "اقرأ كل سؤال بعناية، استعن بالسبورة للحسابات، ثم اختر الإجابة الصحيحة من الخيارات الأربعة."}
              {modal === "exam-inst" && "لن يمكنك تعديل إجاباتك بعد إنهاء القسم. راقب المؤقّت في الأعلى؛ سينتهي القسم تلقائياً عند صفر."}
              {modal === "rules" && "لا يُسمح بأي مساعدة خارجية. أي محاولة غش تؤدي لإلغاء المحاولة."}
            </p>
            <button onClick={() => setModal(null)} className="mt-5 rounded-xl bg-teal text-white px-5 py-2 text-sm font-bold hover:bg-teal-deep transition-colors">
              فهمت
            </button>
          </div>
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
    <button onClick={onClick} className="w-full text-right rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground hover:border-teal hover:bg-teal-soft transition-colors">
      {children}
    </button>
  );
}

// ────────────── Scratchpad ──────────────
type Stroke = { color: string; size: number; points: { x: number; y: number }[]; erase: boolean };

function Scratchpad({ questionId }: { questionId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState("#0F766E");
  const [size, setSize] = useState(3);
  const cacheRef = useRef<Map<string, Stroke[]>>(new Map());
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redo, setRedo] = useState<Stroke[]>([]);
  const [, forceTick] = useState(0);
  const drawing = useRef(false);
  const current = useRef<Stroke | null>(null);

  // Swap in cached strokes when question changes
  useEffect(() => {
    cacheRef.current.set(questionId, strokes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  useEffect(() => {
    const cached = cacheRef.current.get(questionId) ?? [];
    setStrokes(cached);
    setRedo([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  const redraw = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    // grid
    ctx.strokeStyle = "#E2E8F0"; ctx.lineWidth = 1;
    for (let x = 0; x < c.width; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.height); ctx.stroke(); }
    for (let y = 0; y < c.height; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(c.width, y); ctx.stroke(); }
    // strokes
    for (const s of strokes) {
      ctx.strokeStyle = s.erase ? "#FFFFFF" : s.color;
      ctx.lineWidth = s.size;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      s.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
    }
  }, [strokes]);

  useEffect(() => { redraw(); }, [redraw]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    const s: Stroke = { color, size: tool === "eraser" ? size * 4 : size, points: [pos(e)], erase: tool === "eraser" };
    current.current = s;
    setStrokes((prev) => [...prev, s]);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !current.current) return;
    current.current.points.push(pos(e));
    forceTick((n) => n + 1);
  }
  function up() {
    if (!drawing.current) return;
    setRedo([]);
    drawing.current = false;
    current.current = null;
  }

  function undo() {
    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedo((r) => [...r, last]);
      return prev.slice(0, -1);
    });
  }
  function redoStroke() {
    setRedo((r) => {
      if (r.length === 0) return r;
      const last = r[r.length - 1];
      setStrokes((prev) => [...prev, last]);
      return r.slice(0, -1);
    });
  }
  function clear() { setStrokes([]); setRedo([]); }

  const colors = ["#0F766E", "#F59E0B", "#DC2626", "#2563EB", "#16A34A", "#111827"];

  return (
    <div className="luxury-card p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-teal-deep">السبورة التفاعلية</div>
        <div className="text-[10px] text-muted-foreground">تُحفظ مع كل سؤال</div>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button onClick={() => setTool("pen")} className={"px-3 py-1.5 text-xs font-semibold " + (tool === "pen" ? "bg-teal text-white" : "bg-white text-foreground hover:bg-surface-2")}>قلم</button>
          <button onClick={() => setTool("eraser")} className={"px-3 py-1.5 text-xs font-semibold " + (tool === "eraser" ? "bg-teal text-white" : "bg-white text-foreground hover:bg-surface-2")}>ممحاة</button>
        </div>
        <div className="flex gap-1 items-center">
          {colors.map((c) => (
            <button key={c} onClick={() => { setColor(c); setTool("pen"); }} aria-label={`color ${c}`}
              className={"h-6 w-6 rounded-full border-2 transition-transform " + (color === c ? "border-foreground scale-110" : "border-white")}
              style={{ backgroundColor: c }} />
          ))}
        </div>
        <input type="range" min={1} max={12} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-20 accent-teal" />
        <button onClick={undo} className="rounded-lg border border-border bg-white px-2 py-1 text-xs font-semibold hover:border-teal">↺</button>
        <button onClick={redoStroke} className="rounded-lg border border-border bg-white px-2 py-1 text-xs font-semibold hover:border-teal">↻</button>
        <button onClick={clear} className="rounded-lg border border-border bg-white px-2 py-1 text-xs font-semibold text-red-600 hover:border-red-400">مسح</button>
      </div>
      <canvas
        ref={canvasRef}
        width={520}
        height={520}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        className="w-full h-[520px] rounded-xl bg-white border border-border touch-none cursor-crosshair"
      />
    </div>
  );
}