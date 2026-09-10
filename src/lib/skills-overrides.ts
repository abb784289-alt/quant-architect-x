import { useEffect, useState } from "react";
import { SKILLS, type Skill } from "@/lib/skills-config";
import { getSkillSettings, type SkillSetting, type SkillQuestionSetting } from "@/lib/skills.functions";

export type SkillsOverrides = {
  skills: Record<number, SkillSetting>;
  questions: Record<string, SkillQuestionSetting>;
};

const EMPTY: SkillsOverrides = { skills: {}, questions: {} };

export function applySkillOverrides(skill: Skill, o: SkillsOverrides): Skill {
  const s = o.skills[skill.id];
  return {
    ...skill,
    title: s?.title || skill.title,
    questions: skill.questions
      .filter((q) => !o.questions[q.id]?.hidden)
      .map((q) => {
        const override = o.questions[q.id];
        return override?.correct_index != null ? { ...q, correctIndex: override.correct_index } : q;
      }),
  };
}

/** Loads admin overrides once, then returns the visible skills list. */
export function useResolvedSkills() {
  const [overrides, setOverrides] = useState<SkillsOverrides>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getSkillSettings()
      .then((res) => {
        if (!alive) return;
        setOverrides({
          skills: Object.fromEntries(res.skills.map((s) => [s.skill_id, s])),
          questions: Object.fromEntries(res.questions.map((q) => [q.question_id, q])),
        });
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const visible = SKILLS.filter((s) => !overrides.skills[s.id]?.hidden).map((s) => applySkillOverrides(s, overrides));
  return { skills: visible, overrides, loading };
}
