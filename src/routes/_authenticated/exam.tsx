'use client';

import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { readSession, type Session } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/exam")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "نظام نمر — اختبار 113 | منصة المِقْيَاس" },
      { name: "description", content: "محرك اختبار نمر التفاعلي: سبورة رسم، أسئلة LaTeX، مؤقت، وشبكة تنقل بين الأسئلة." },
    ],
  }),
  component: ExamGate,
});

function ExamGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const s = readSession();
    if (!s) {
      window.location.replace("/auth");
      return;
    }
    setSession(s);
    setReady(true);
  }, []);
  if (!ready || !session) {
    return (
      <div dir="rtl" className="min-h-[60vh] grid place-items-center text-muted-foreground">
        جارٍ تحميل محرك الاختبار...
      </div>
    );
  }
  return <NimarExamEngine session={session} />;
}

// ─────────────────────────────────────────────────────────────
// Question bank (LaTeX-lite; math rendered with simple styles)
// ─────────────────────────────────────────────────────────────

type Choice = { key: "أ" | "ب" | "ج" | "د"; text: string };
type Question = {
  id: number;
  prompt: string;
  latex?: string;
  choices: Choice[];
  correct: "أ" | "ب" | "ج" | "د";
};

const QUESTIONS: Question[] = [
  {
    id: 1,
    prompt: "إذا كان س + 3 = 10، فما قيمة س² − 4؟",
    latex: "س = 10 - 3 = 7   ⇒   س² − 4 = 49 − 4",
    choices: [
      { key: "أ", text: "41" },
      { key: "ب", text: "45" },
      { key: "ج", text: "49" },
      { key: "د", text: "53" },
    ],
    correct: "أ",
  },
  {
    id: 2,
    prompt: "ما مساحة مثلث قاعدته 12 وارتفاعه 8؟",
    latex: "المساحة = ½ × 12 × 8",
    choices: [
      { key: "أ", text: "40" },
      { key: "ب", text: "48" },
      { key: "ج", text: "56" },
      { key: "د", text: "96" },
    ],
    correct: "ب",
  },
  {
    id: 3,
    prompt: "ما النسبة المئوية للعدد 45 من 180؟",
    choices: [
      { key: "أ", text: "20٪" },
      { key: "ب", text: "22.5٪" },
      { key: "ج", text: "25٪" },
      { key: "د", text: "30٪" },
    ],
    correct: "ج",
  },
  {
    id: 4,
    prompt: "احسب: (3/4) ÷ (1/2)",
    choices: [
      { key: "أ", text: "3/8" },
      { key: "ب", text: "3/2" },
      { key: "ج", text: "2/3" },
      { key: "د", text: "1" },
    ],
    correct: "ب",
  },
  {
    id: 5,
    prompt: "الوسط الحسابي للأعداد: 6، 9، 12، 15، 18",
    choices: [
      { key: "أ", text: "9" },
      { key: "ب", text: "11" },
      { key: "ج", text: "12" },
      { key: "د", text: "13" },
    ],
    correct: "ج",
  },
  ...Array.from({ length: 20 }, (_, i): Question => ({
    id: i + 6,
    prompt: `سؤال تجريبي رقم ${i + 6}: أوجد قيمة العبارة الجبرية عند س = ${i + 2}`,
    latex: `2س² + 3س − 5   عند   س = ${i + 2}`,
    choices: [
      { key: "أ", text: `${2 * (i + 2) ** 2 + 3 * (i + 2) - 5}` },
      { key: "ب", text: `${2 * (i + 2) ** 2 + 3 * (i + 2) - 3}` },
      { key: "ج", text: `${2 * (i + 2) ** 2 + 3 * (i + 2) - 7}` },
      { key: "د", text: `${2 * (i + 2) ** 2 + 3 * (i + 2) + 1}` },
    ],
    correct: "أ",
  })),
];

const TOTAL = QUESTIONS.length;
const DURATION_SECONDS = 25 * 60; // 25 minutes

function fmtClock(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────
// The engine
// ─────────────────────────────────────────────────────────────

function NimarExamEngine({ session }: { session: Session }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Choice["key"]>>({});
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [fontStep, setFontStep] = useState<-1 | 0 | 1>(0);
  const [remaining, setRemaining] = useState(DURATION_SECONDS);
  const [modal, setModal] = useState<null | "section" | "test" | "rules" | "finish">(null);

  useEffect(() => {
    const t = setInterval(() => setRemaining((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const q = QUESTIONS[current];
  const solved = Object.keys(answers).length;
  const unsolved = TOTAL - solved;

  const pick = useCallback(
    (key: Choice["key"]) => setAnswers((a) => ({ ...a, [q.id]: key })),
    [q.id],
  );

  const goto = useCallback((i: number) => {
    if (i < 0 || i >= TOTAL) return;
    setCurrent(i);
    setVisited((v) => new Set(v).add(i));
  }, []);

  const toggleBookmark = useCallback(
    () => setBookmarks((b) => {
      const n = new Set(b);
      if (n.has(q.id)) n.delete(q.id);
      else n.add(q.id);
      return n;
    }),
    [q.id],
  );

  const fontSizeClass =
    fontStep === -1 ? "text-base" : fontStep === 1 ? "text-2xl" : "text-xl";

  const studentName = useMemo(() => {
    if (session.role === "admin") return "الأستاذ / أسامة";
    try {
      const raw = localStorage.getItem("user_account");
      if (raw) {
        const acc = JSON.parse(raw) as { fullName?: string };
        if (acc.fullName) return acc.fullName;
      }
    } catch { /* noop */ }
    return session.email.split("@")[0];
  }, [session]);

  const studentId = useMemo(
    () => "STD-" + Math.abs(hashString(session.email)).toString().slice(0, 6),
    [session.email],
  );

  return (
    <div dir="rtl" className="mx-auto max-w-[1400px] px-4 py-4 space-y-4">
      {/* ── Top Velvet Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-gold/25 gold-ring">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.18 0.05 175) 0%, oklch(0.28 0.08 172) 50%, oklch(0.18 0.05 175) 100%)",
          }}
        />
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <div className="text-xs text-gold/80 tracking-widest">نظام نمر التفاعلي</div>
            <div className="font-display text-xl md:text-2xl font-bold text-gold-gradient">
              اختبار 113 — أ/أسامة فتح الدين
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Stat label="إجمالي" value={TOTAL} tone="ice" />
            <Stat label="محلولة" value={solved} tone="gold" />
            <Stat label="متبقية" value={unsolved} tone="warn" />
            <div className="rounded-xl border border-gold/40 bg-teal-deep/70 px-4 py-2 text-center min-w-[110px]">
              <div className="text-[10px] text-gold/70">الوقت المتبقي</div>
              <div className="font-mono text-2xl font-bold text-gold-gradient tabular-nums">
                {fmtClock(remaining)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main grid: workspace + sidebar ── */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left column: Question + Scratchpad */}
        <div className="col-span-12 lg:col-span-9 space-y-4">
          {/* Question card */}
          <div className="glass-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFontStep(1)}
                  className="h-8 w-8 grid place-items-center rounded-lg border border-white/15 bg-white/5 hover:border-gold/50 text-sm font-bold"
                  title="تكبير الخط"
                >A+</button>
                <button
                  onClick={() => setFontStep(0)}
                  className="h-8 w-8 grid place-items-center rounded-lg border border-white/15 bg-white/5 hover:border-gold/50 text-sm font-bold"
                  title="حجم افتراضي"
                >A</button>
                <button
                  onClick={() => setFontStep(-1)}
                  className="h-8 w-8 grid place-items-center rounded-lg border border-white/15 bg-white/5 hover:border-gold/50 text-sm font-bold"
                  title="تصغير الخط"
                >A-</button>
              </div>
              <div className="text-sm text-muted-foreground">
                السؤال <span className="text-gold font-bold">{current + 1}</span> من {TOTAL}
              </div>
            </div>

            <div className={`${fontSizeClass} leading-loose text-foreground font-medium`}>
              {q.prompt}
            </div>
            {q.latex && (
              <div className="mt-4 rounded-xl border border-gold/20 bg-teal-deep/40 px-5 py-4 font-mono text-lg text-gold-soft tracking-wide">
                {q.latex}
              </div>
            )}

            {/* MCQ */}
            <div className="mt-6 space-y-2.5">
              {q.choices.map((c) => {
                const active = answers[q.id] === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => pick(c.key)}
                    className={
                      "w-full flex items-center gap-4 rounded-xl border px-4 py-3 text-right transition-all " +
                      (active
                        ? "border-gold bg-gold/15 shadow-[0_0_0_1px_var(--gold)]"
                        : "border-white/10 bg-white/5 hover:border-gold/40 hover:bg-white/10")
                    }
                  >
                    <span className={`flex-1 ${fontSizeClass === "text-2xl" ? "text-lg" : "text-base"}`}>
                      {c.text}
                    </span>
                    <span
                      className={
                        "grid h-8 w-8 place-items-center rounded-full border font-bold shrink-0 " +
                        (active
                          ? "border-gold bg-gold text-[color:var(--primary-foreground)]"
                          : "border-white/25 text-foreground/70")
                      }
                    >
                      {c.key}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scratchpad */}
          <Scratchpad />

          {/* Bottom actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => goto(current - 1)}
              disabled={current === 0}
              className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:border-gold/50 text-sm font-semibold disabled:opacity-40"
            >
              ← السؤال السابق
            </button>
            <button
              onClick={toggleBookmark}
              className={
                "px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all " +
                (bookmarks.has(q.id)
                  ? "border-gold bg-gold/20 text-gold-soft"
                  : "border-white/15 bg-white/5 hover:border-gold/50")
              }
            >
              ☆ وضع مؤشر كعلامة مرجعية
            </button>
            <button
              className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:border-gold/50 text-sm font-semibold"
            >
              📁 إضافة لمجلد
            </button>
            <button
              onClick={() => goto(current + 1)}
              disabled={current === TOTAL - 1}
              className="px-6 py-2.5 rounded-xl bg-teal-glow hover:bg-teal text-white text-sm font-bold shadow-lg disabled:opacity-40"
            >
              التالي →
            </button>
          </div>
        </div>

        {/* Right sidebar: identity + grid */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <div className="glass-card p-5 text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-gold bg-teal-deep font-display text-2xl font-bold text-gold-gradient">
              {studentName.slice(0, 1)}
            </div>
            <div className="mt-3 font-display text-base font-bold">{studentName}</div>
            <div className="text-xs text-muted-foreground mt-1">رقم الطالب: {studentId}</div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] text-gold-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
              جلسة اختبار نشطة
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-bold">شبكة الأسئلة</div>
              <div className="text-[10px] text-muted-foreground">{solved}/{TOTAL}</div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {QUESTIONS.map((qq, i) => {
                const isActive = i === current;
                const isAnswered = answers[qq.id] !== undefined;
                const isBookmarked = bookmarks.has(qq.id);
                const wasVisited = visited.has(i);
                return (
                  <button
                    key={qq.id}
                    onClick={() => goto(i)}
                    className={
                      "relative h-10 rounded-lg text-sm font-bold transition-all border " +
                      (isActive
                        ? "border-gold text-[color:var(--primary-foreground)] bg-gold shadow-[0_0_18px_var(--gold)]"
                        : isAnswered
                        ? "border-transparent bg-orange-500 text-white hover:brightness-110"
                        : wasVisited
                        ? "border-white/15 bg-white/10 text-foreground/80 hover:border-gold/50"
                        : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-gold/40")
                    }
                  >
                    {i + 1}
                    {isBookmarked && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-gold shadow-md" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
              <Legend swatch="bg-gold" label="السؤال الحالي" />
              <Legend swatch="bg-orange-500" label="تمت الإجابة" />
              <Legend swatch="bg-white/10" label="تمت الزيارة" />
              <Legend swatch="bg-white/[0.03] border border-white/10" label="لم تُزَر" />
            </div>
          </div>
        </aside>
      </div>

      {/* ── Floating utility palette (bottom-right) ── */}
      <div className="fixed bottom-6 left-6 z-30 flex flex-col gap-2">
        <PaletteBtn onClick={() => setModal("section")} icon="📘">تعليمات القسم</PaletteBtn>
        <PaletteBtn onClick={() => setModal("test")} icon="📗">تعليمات الاختبار</PaletteBtn>
        <PaletteBtn onClick={() => setModal("rules")} icon="📕">القوانين</PaletteBtn>
        <button
          onClick={() => setModal("finish")}
          className="mt-2 rounded-xl px-4 py-3 text-sm font-bold text-white bg-gradient-to-l from-red-700 to-red-500 shadow-[0_10px_30px_-10px_rgba(220,38,38,0.6)] hover:brightness-110 border border-red-400/40"
        >
          ⏹ إنهاء القسم
        </button>
      </div>

      {/* Modal */}
      {modal && <Modal kind={modal} onClose={() => setModal(null)} answers={answers} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function Stat({ label, value, tone }: { label: string; value: number; tone: "gold" | "ice" | "warn" }) {
  const cls =
    tone === "gold" ? "border-gold/40 text-gold-gradient"
    : tone === "warn" ? "border-orange-400/40 text-orange-300"
    : "border-white/20 text-foreground";
  return (
    <div className={`rounded-xl border ${cls} bg-teal-deep/60 px-4 py-2 text-center min-w-[86px]`}>
      <div className="text-[10px] opacity-70">{label}</div>
      <div className="font-display text-lg font-bold tabular-nums">{value}</div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded ${swatch}`} />
      <span>{label}</span>
    </div>
  );
}

function PaletteBtn({
  onClick,
  icon,
  children,
}: { onClick: () => void; icon: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-gold/30 bg-teal-deep/85 backdrop-blur-md px-4 py-3 text-sm text-foreground hover:border-gold hover:bg-teal-deep flex items-center gap-2 shadow-lg min-w-[170px]"
    >
      <span className="text-lg">{icon}</span>
      <span className="font-semibold">{children}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// HTML5 Canvas scratchpad — draw, erase, colors, undo/redo, clear
// ─────────────────────────────────────────────────────────────

type Stroke = {
  color: string;
  size: number;
  mode: "pen" | "erase";
  points: { x: number; y: number }[];
};

const PEN_COLORS = ["#F5D67A", "#ffffff", "#ff6b6b", "#4dd4ac", "#6ab8ff", "#f4b8ff"];

function Scratchpad() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [mode, setMode] = useState<"pen" | "erase">("pen");
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [size, setSize] = useState(3);
  const drawingRef = useRef<Stroke | null>(null);

  // Redraw
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // subtle grid
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 24) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 24) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    ctx.restore();

    const all = drawingRef.current ? [...strokes, drawingRef.current] : strokes;
    for (const s of all) {
      if (s.points.length === 0) continue;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.lineWidth = s.mode === "erase" ? s.size * 4 : s.size;
      ctx.strokeStyle = s.mode === "erase" ? "rgba(0,0,0,1)" : s.color;
      ctx.globalCompositeOperation = s.mode === "erase" ? "destination-out" : "source-over";
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  }, [strokes]);

  // Resize canvas to container width
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const setSizeFn = () => {
      const w = wrap.clientWidth;
      const h = 320;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        redraw();
      }
    };
    setSizeFn();
    const ro = new ResizeObserver(setSizeFn);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [redraw]);

  useEffect(() => { redraw(); }, [strokes, redraw]);

  function pointerPos(e: React.PointerEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    drawingRef.current = { color, size, mode, points: [pointerPos(e)] };
    setRedoStack([]);
    redraw();
  }
  function onMove(e: React.PointerEvent) {
    if (!drawingRef.current) return;
    drawingRef.current.points.push(pointerPos(e));
    redraw();
  }
  function onUp() {
    if (!drawingRef.current) return;
    const s = drawingRef.current;
    drawingRef.current = null;
    if (s.points.length > 1) setStrokes((prev) => [...prev, s]);
    else redraw();
  }

  function undo() {
    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const next = prev.slice(0, -1);
      setRedoStack((r) => [...r, prev[prev.length - 1]]);
      return next;
    });
  }
  function redo() {
    setRedoStack((r) => {
      if (r.length === 0) return r;
      const s = r[r.length - 1];
      setStrokes((prev) => [...prev, s]);
      return r.slice(0, -1);
    });
  }
  function clearAll() {
    setStrokes([]);
    setRedoStack([]);
  }

  return (
    <div className="glass-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm font-bold">
          <span className="text-gold">✎</span> السبورة التفاعلية
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setMode("pen")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${mode === "pen" ? "border-gold bg-gold/15 text-gold-soft" : "border-white/15 bg-white/5"}`}
          >قلم</button>
          <button
            onClick={() => setMode("erase")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${mode === "erase" ? "border-gold bg-gold/15 text-gold-soft" : "border-white/15 bg-white/5"}`}
          >ممحاة</button>
          <div className="mx-2 h-5 w-px bg-white/15" />
          {PEN_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setMode("pen"); }}
              className={`h-6 w-6 rounded-full border-2 ${color === c ? "border-gold scale-110" : "border-white/25"}`}
              style={{ background: c }}
              title={c}
            />
          ))}
          <div className="mx-2 h-5 w-px bg-white/15" />
          <input
            type="range" min={1} max={12} value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-20 accent-[color:var(--gold)]"
            title="حجم القلم"
          />
          <div className="mx-2 h-5 w-px bg-white/15" />
          <button onClick={undo} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/15 bg-white/5 hover:border-gold/50">↶ تراجع</button>
          <button onClick={redo} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/15 bg-white/5 hover:border-gold/50">↷ إعادة</button>
          <button onClick={clearAll} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-400/40 bg-red-500/10 text-red-200 hover:bg-red-500/20">✕ مسح</button>
        </div>
      </div>
      <div
        ref={wrapRef}
        className="rounded-xl border border-white/10 bg-teal-deep/40 overflow-hidden"
        style={{ touchAction: "none" }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="block w-full h-[320px] cursor-crosshair"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────

function Modal({
  kind,
  onClose,
  answers,
}: {
  kind: "section" | "test" | "rules" | "finish";
  onClose: () => void;
  answers: Record<number, Choice["key"]>;
}) {
  const titles: Record<string, string> = {
    section: "تعليمات القسم",
    test: "تعليمات الاختبار",
    rules: "القوانين والملاحظات",
    finish: "إنهاء القسم",
  };
  const bodies: Record<string, React.ReactNode> = {
    section: (
      <ul className="list-disc pr-5 space-y-2 text-sm text-foreground/85">
        <li>القسم الكمي يحتوي على {TOTAL} سؤالاً متنوعاً بين الجبر، الهندسة، الحساب، والنسب.</li>
        <li>مدة القسم 25 دقيقة تبدأ فور فتح أول سؤال.</li>
        <li>يمكن الانتقال بين الأسئلة عبر شبكة الأسئلة على اليمين.</li>
      </ul>
    ),
    test: (
      <ul className="list-disc pr-5 space-y-2 text-sm text-foreground/85">
        <li>اختر إجابة واحدة لكل سؤال من الخيارات (أ، ب، ج، د).</li>
        <li>يمكنك وضع علامة مرجعية لأي سؤال والعودة إليه لاحقًا.</li>
        <li>السبورة التفاعلية أسفل السؤال متاحة للحسابات الجانبية.</li>
      </ul>
    ),
    rules: (
      <ul className="list-disc pr-5 space-y-2 text-sm text-foreground/85">
        <li>لا يُسمح باستخدام الآلة الحاسبة.</li>
        <li>الاختبار فردي ولا يُسمح بالاستعانة بأي جهة خارجية.</li>
        <li>عند نفاد الوقت يتم تسليم الإجابات تلقائيًا.</li>
      </ul>
    ),
    finish: (
      <div className="text-sm space-y-3">
        <p>أنت على وشك إنهاء القسم. عدد الأسئلة التي أجبتَ عليها: <strong className="text-gold">{Object.keys(answers).length}</strong> من {TOTAL}.</p>
        <p className="text-muted-foreground">هل ترغب فعلًا في الإنهاء الآن؟</p>
      </div>
    ),
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="glass-card gold-ring max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold text-gold-gradient">{titles[kind]}</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-full border border-white/15 hover:border-gold/50">✕</button>
        </div>
        {bodies[kind]}
        <div className="mt-6 flex justify-end gap-2">
          {kind === "finish" ? (
            <>
              <button onClick={onClose} className="px-4 py-2 rounded-lg border border-white/15 text-sm">إلغاء</button>
              <button
                onClick={() => { window.location.href = "/dashboard"; }}
                className="px-4 py-2 rounded-lg bg-gradient-to-l from-red-700 to-red-500 text-white text-sm font-bold"
              >تأكيد الإنهاء</button>
            </>
          ) : (
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gold text-[color:var(--primary-foreground)] text-sm font-bold">فهمت</button>
          )}
        </div>
      </div>
    </div>
  );
}

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}