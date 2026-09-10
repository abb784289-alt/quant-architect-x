import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SKILLS } from "@/lib/skills-config";
import {
  getSkillSettings,
  saveSkillSetting,
  saveSkillQuestion,
  type SkillSetting,
  type SkillQuestionSetting,
} from "@/lib/skills.functions";

const answerLabels = ["أ", "ب", "ج", "د"];
const ar = (n: number) => n.toLocaleString("ar-EG");

export default function SkillsAdminPanel() {
  const [skillId, setSkillId] = useState(SKILLS[0]?.id ?? 1);
  const [skillMap, setSkillMap] = useState<Record<number, SkillSetting>>({});
  const [questionMap, setQuestionMap] = useState<Record<string, SkillQuestionSetting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [titleDraft, setTitleDraft] = useState("");

  useEffect(() => {
    getSkillSettings()
      .then((res) => {
        setSkillMap(Object.fromEntries(res.skills.map((s) => [s.skill_id, s])));
        setQuestionMap(Object.fromEntries(res.questions.map((q) => [q.question_id, q])));
      })
      .catch((e: any) => setStatus(e?.message ?? "تعذّر تحميل الإعدادات"))
      .finally(() => setLoading(false));
  }, []);

  const skill = useMemo(() => SKILLS.find((s) => s.id === skillId), [skillId]);
  const setting = skillMap[skillId];
  const hidden = setting?.hidden ?? false;

  useEffect(() => {
    setTitleDraft(setting?.title ?? skill?.title ?? "");
  }, [skillId, setting, skill]);

  async function persistSkill(next: { title?: string; hidden?: boolean }) {
    if (!skill) return;
    setSaving(true);
    const payload: SkillSetting = {
      skill_id: skill.id,
      title: (next.title ?? titleDraft).trim() || skill.title,
      hidden: next.hidden ?? hidden,
    };
    try {
      await saveSkillSetting({ data: payload });
      setSkillMap((m) => ({ ...m, [skill.id]: payload }));
      setStatus("تم الحفظ");
    } catch (e: any) {
      setStatus(e?.message ?? "تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function persistQuestion(questionId: string, next: { correct_index?: number | null; hidden?: boolean }) {
    if (!skill) return;
    const base = questionMap[questionId];
    const fallback = skill.questions.find((q) => q.id === questionId)?.correctIndex ?? null;
    const payload: SkillQuestionSetting = {
      question_id: questionId,
      skill_id: skill.id,
      correct_index: next.correct_index !== undefined ? next.correct_index : base?.correct_index ?? fallback,
      hidden: next.hidden !== undefined ? next.hidden : base?.hidden ?? false,
    };
    setQuestionMap((m) => ({ ...m, [questionId]: payload }));
    try {
      await saveSkillQuestion({ data: payload });
      setStatus("تم الحفظ");
    } catch (e: any) {
      setStatus(e?.message ?? "تعذّر الحفظ");
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-40 place-items-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <section dir="rtl" className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-border bg-card p-3">
        <h3 className="mb-2 px-2 text-sm font-bold">مهارات التأسيس الأسرع</h3>
        <div className="max-h-[560px] space-y-1 overflow-y-auto">
          {SKILLS.map((s) => {
            const st = skillMap[s.id];
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSkillId(s.id)}
                className={
                  "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-right text-sm transition-colors " +
                  (skillId === s.id ? "bg-teal-soft font-bold text-teal-deep" : "hover:bg-surface-2")
                }
              >
                <span className="truncate">{st?.title ?? s.title}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {st?.hidden ? "مخفية" : ar(s.questions.length)}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="space-y-4">
        {skill && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <label className="block text-sm">
                <span className="mb-1 block font-semibold">اسم المهارة</span>
                <input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
              <div className="flex gap-2">
                <Button onClick={() => persistSkill({})} disabled={saving}>
                  <Save /> حفظ
                </Button>
                <Button variant={hidden ? "default" : "outline"} onClick={() => persistSkill({ hidden: !hidden })}>
                  {hidden ? <EyeOff /> : <Eye />} {hidden ? "مخفية" : "ظاهرة"}
                </Button>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {ar(skill.questions.length)} سؤالًا — المخفي منها{" "}
              {ar(skill.questions.filter((q) => questionMap[q.id]?.hidden).length)}
              {status && <span className="mr-2 text-teal-deep">• {status}</span>}
            </p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {skill?.questions.map((q, i) => {
            const st = questionMap[q.id];
            const correct = st?.correct_index ?? q.correctIndex;
            const qHidden = st?.hidden ?? false;
            return (
              <div
                key={q.id}
                className={"rounded-2xl border border-border bg-card p-3 " + (qHidden ? "opacity-50" : "")}
              >
                <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                  <span>سؤال {ar(i + 1)}</span>
                  <button
                    type="button"
                    onClick={() => persistQuestion(q.id, { hidden: !qHidden })}
                    className="rounded-lg border border-border px-2 py-1 text-[11px] hover:bg-surface-2"
                  >
                    {qHidden ? "إظهار" : "إخفاء"}
                  </button>
                </div>
                <img src={q.image} alt={`سؤال ${i + 1}`} loading="lazy" className="w-full rounded-xl border border-border bg-white" />
                <div className="mt-2 grid grid-cols-4 gap-1">
                  {answerLabels.map((label, idx) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => persistQuestion(q.id, { correct_index: idx })}
                      className={
                        "rounded-lg border px-2 py-1.5 text-sm font-bold transition-colors " +
                        (correct === idx
                          ? "border-teal bg-teal text-white"
                          : "border-border hover:border-teal")
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
