import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSkill, SKILL_SECONDS_PER_QUESTION, SKILL_RESULTS_KEY, type Skill } from "@/lib/skills-config";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/skills/$skillId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "اختبار مهارة تأسيسية — منصة المِقْيَاس" },
      { name: "description", content: "اختبار مهارة من مهارات التأسيس الكمي بوقت أو تدريب حر مع عرض النتيجة والأخطاء." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SkillExamPage,
});

type Mode = "exam" | "practice";

function SkillExamPage() {
  const { skillId } = Route.useParams();
  const { dir } = useI18n();
  const skill = getSkill(Number(skillId));
  const [mode, setMode] = useState<Mode | null>(null);

  if (!skill) {
    return <main dir={dir} className="mx-auto max-w-3xl px-6 py-20 text-center text-muted-foreground">المهارة غير موجودة.</main>;
  }
  if (!mode) return <ModePicker skill={skill} onPick={setMode} />;
  return <SkillRunner skill={skill} mode={mode} onExit={() => setMode(null)} />;
}

function ModePicker({ skill, onPick }: { skill: Skill; onPick: (m: Mode) => void }) {
  const { dir, n: num } = useI18n();
  const navigate = useNavigate();
  return (
    <main dir={dir} className="mx-auto max-w-3xl px-4 sm:px-6 py-10 md:py-16">
      <button
        type="button"
        onClick={() => navigate({ to: "/skills" })}
        className="text-xs rounded-full border border-border bg-white px-3 py-1.5 text-muted-foreground hover:border-teal hover:text-teal-deep transition-colors mb-6"
      >
        ← كل المهارات
      </button>
      <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-1">
        {num(skill.id)}. {skill.title}
      </h1>
      <p className="text-sm text-muted-foreground mb-8">{num(skill.questions.length)} سؤال — اختر طريقة الدخول.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <button type="button" onClick={() => onPick("exam")} className="luxury-card p-7 text-start hover:-translate-y-0.5 hover:shadow-lg transition-all border-2 border-teal/30 hover:border-teal">
          <div className="text-3xl mb-3">⏱️</div>
          <div className="font-display font-bold text-lg text-foreground mb-1">اختبار بوقت</div>
          <div className="text-sm text-muted-foreground">
            {num(Math.round((skill.questions.length * SKILL_SECONDS_PER_QUESTION) / 60))} دقيقة، والنتيجة تظهر في النهاية.
          </div>
        </button>
        <button type="button" onClick={() => onPick("practice")} className="luxury-card p-7 text-start hover:-translate-y-0.5 hover:shadow-lg transition-all border-2 border-gold/40 hover:border-gold">
          <div className="text-3xl mb-3">📝</div>
          <div className="font-display font-bold text-lg text-foreground mb-1">تدريب بدون وقت</div>
          <div className="text-sm text-muted-foreground">خذ راحتك، والنتيجة تظهر بعد الإنهاء.</div>
        </button>
      </div>
    </main>
  );
}

function SkillRunner({ skill, mode, onExit }: { skill: Skill; mode: Mode; onExit: () => void }) {
  const { dir, n: num } = useI18n();
  const total = skill.questions.length;
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(total).fill(null));
  const [done, setDone] = useState(false);
  const [left, setLeft] = useState(total * SKILL_SECONDS_PER_QUESTION);
  const finishRef = useRef(() => {});
  finishRef.current = () => setDone(true);

  useEffect(() => {
    if (mode !== "exam" || done) return;
    const t = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) { clearInterval(t); finishRef.current(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [mode, done]);

  const q = skill.questions[idx];
  const answered = answers.filter((a) => a !== null).length;
  const graded = useMemo(() => skill.questions.some((x) => x.correctIndex !== null), [skill]);

  if (done) {
    const correct = skill.questions.reduce(
      (acc, x, i) => acc + (x.correctIndex !== null && answers[i] === x.correctIndex ? 1 : 0),
      0,
    );
    const wrong = skill.questions
      .map((x, i) => ({ x, i }))
      .filter(({ x, i }) => x.correctIndex !== null && answers[i] !== x.correctIndex);
    if (typeof window !== "undefined") {
      try {
        const prev = JSON.parse(localStorage.getItem(SKILL_RESULTS_KEY) || "{}");
        prev[skill.id] = { correct, total, at: Date.now(), graded };
        localStorage.setItem(SKILL_RESULTS_KEY, JSON.stringify(prev));
      } catch { /* ignore */ }
    }
    return (
      <main dir={dir} className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <div className="luxury-card p-8 text-center mb-6">
          <div className="text-4xl mb-3">🎯</div>
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">{skill.title}</h1>
          {graded ? (
            <p className="text-lg font-bold text-teal-deep">النتيجة: {num(correct)} من {num(total)}</p>
          ) : (
            <p className="text-sm text-muted-foreground">تم حفظ إجاباتك — نموذج الإجابات لهذه المهارة لم يُرفع بعد.</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">أجبت على {num(answered)} من {num(total)} سؤال.</p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <button type="button" onClick={onExit} className="rounded-xl border border-border px-4 py-2 text-sm hover:border-teal hover:text-teal-deep transition-colors">إعادة</button>
            <a href="/skills" className="rounded-xl bg-teal text-white px-4 py-2 text-sm font-bold hover:bg-teal-deep transition-colors">كل المهارات</a>
          </div>
        </div>

        {graded && wrong.length > 0 && (
          <section className="space-y-5">
            <h2 className="font-display font-bold text-lg text-foreground">مراجعة الأخطاء ({num(wrong.length)})</h2>
            {wrong.map(({ x, i }) => (
              <div key={x.id} className="luxury-card p-4">
                <div className="text-xs text-muted-foreground mb-2">سؤال {num(i + 1)}</div>
                {x.text ? (
                  <p className="text-base font-semibold leading-loose text-foreground">{x.text}</p>
                ) : (
                  <img src={x.imageUrl} alt={`سؤال ${i + 1} من مهارة ${skill.title}`} loading="lazy" className="w-full max-w-full rounded-xl border border-border bg-white" />
                )}
                <div className="mt-3 text-sm">
                  <span className="text-red-600 font-bold">إجابتك: {answers[i] === null ? "—" : x.choices[answers[i] as number]}</span>
                  <span className="mx-3 text-muted-foreground">|</span>
                  <span className="text-teal-deep font-bold">الصحيحة: {x.choices[x.correctIndex as number]}</span>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    );
  }

  return (
    <main dir={dir} className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-5 bg-surface/85 backdrop-blur-md flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm font-bold text-foreground">{num(skill.id)}. {skill.title}</div>
        <div className="flex items-center gap-3 text-xs">
          <span className="rounded-full bg-teal-soft text-teal-deep px-3 py-1 font-bold border border-teal/30">
            {num(idx + 1)} / {num(total)}
          </span>
          {mode === "exam" && (
            <span className="rounded-full bg-gold-soft text-foreground px-3 py-1 font-bold border border-gold/40">
              {num(`${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`)}
            </span>
          )}
          <button type="button" onClick={() => setDone(true)} className="rounded-full bg-teal text-white px-3 py-1.5 font-bold hover:bg-teal-deep transition-colors">إنهاء</button>
        </div>
      </div>

      <div className="luxury-card p-4 md:p-6">
        {q.text ? (
          <p className="text-lg md:text-xl font-semibold leading-loose text-foreground">{q.text}</p>
        ) : (
          <img src={q.imageUrl} alt={`سؤال ${idx + 1} من مهارة ${skill.title}`} className="w-full max-w-full rounded-xl border border-border bg-white" />
        )}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {q.choices.map((c, ci) => {
            const active = answers[idx] === ci;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setAnswers((a) => a.map((v, i) => (i === idx ? ci : v)))}
                className={"rounded-xl border-2 py-3 font-bold transition-all " +
                  (active ? "border-teal bg-teal-soft text-teal-deep" : "border-border bg-white text-foreground hover:border-teal/50")}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button type="button" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)} className="rounded-xl border border-border px-4 py-2 text-sm disabled:opacity-40">السابق</button>
        {idx < total - 1 ? (
          <button type="button" onClick={() => setIdx((i) => i + 1)} className="rounded-xl bg-teal text-white px-5 py-2 text-sm font-bold hover:bg-teal-deep transition-colors">التالي</button>
        ) : (
          <button type="button" onClick={() => setDone(true)} className="rounded-xl bg-teal text-white px-5 py-2 text-sm font-bold hover:bg-teal-deep transition-colors">إنهاء</button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-8 sm:grid-cols-12 gap-2">
        {skill.questions.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIdx(i)}
            className={"h-9 rounded-lg text-xs font-bold border transition-colors " +
              (i === idx ? "bg-teal text-white border-teal"
                : answers[i] !== null ? "bg-teal-soft text-teal-deep border-teal/30"
                : "bg-white text-muted-foreground border-border")}
          >
            {num(i + 1)}
          </button>
        ))}
      </div>
    </main>
  );
}
