export type FoundationCategoryId = "ratios" | "geometry" | "statistics" | "averages";

export const FOUNDATION_CATEGORIES: {
  id: FoundationCategoryId;
  title: string;
  subtitle: string;
  icon: string;
}[] = [
  { id: "ratios", title: "النسبة والتناسب والكسور", subtitle: "Ratios · Proportions · Fractions", icon: "÷" },
  { id: "geometry", title: "الهندسة والزوايا والأشكال", subtitle: "Geometry · Angles · Shapes", icon: "△" },
  { id: "statistics", title: "الإحصاء والرسوم البيانية", subtitle: "Statistics · Charts", icon: "◫" },
  { id: "averages", title: "المتوسطات والمسائل الحياتية", subtitle: "Averages · Word Problems", icon: "μ" },
];

export type SectionConfig = {
  number: number;
  title: string;
  timerSeconds: number;
  videoUrl: string;
};

export type FoundationAsset = {
  categoryId: FoundationCategoryId;
  title: string;
  videoUrl: string;
  formulas: string;
};

const SECTIONS_KEY = "sections_config_v1";
const FOUNDATION_KEY = "foundation_assets_v1";
const QUESTIONS_KEY = "questions_bank_v1";

export const TOTAL_SECTIONS = 150;
export const DEFAULT_TIMER_SECONDS = 0; // 0 = auto (1 minute per question)
export const SECONDS_PER_QUESTION = 60;

export function defaultSection(n: number): SectionConfig {
  return { number: n, title: `القسم ${n}`, timerSeconds: DEFAULT_TIMER_SECONDS, videoUrl: "" };
}

export function loadSections(): SectionConfig[] {
  if (typeof window === "undefined") {
    return Array.from({ length: TOTAL_SECTIONS }, (_, i) => defaultSection(i + 1));
  }
  try {
    const raw = window.localStorage.getItem(SECTIONS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<SectionConfig>[]) : [];
    const byNumber = new Map<number, Partial<SectionConfig>>();
    parsed.forEach((s) => {
      if (s && typeof s.number === "number") byNumber.set(s.number, s);
    });
    return Array.from({ length: TOTAL_SECTIONS }, (_, i) => {
      const n = i + 1;
      const override = byNumber.get(n) ?? {};
      return { ...defaultSection(n), ...override, number: n };
    });
  } catch {
    return Array.from({ length: TOTAL_SECTIONS }, (_, i) => defaultSection(i + 1));
  }
}

export function saveSections(sections: SectionConfig[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections));
}

export function getSection(n: number): SectionConfig {
  const all = loadSections();
  return all.find((s) => s.number === n) ?? defaultSection(n);
}

export function loadFoundationAssets(): Record<FoundationCategoryId, FoundationAsset> {
  const empty = FOUNDATION_CATEGORIES.reduce((acc, c) => {
    acc[c.id] = { categoryId: c.id, title: c.title, videoUrl: "", formulas: "" };
    return acc;
  }, {} as Record<FoundationCategoryId, FoundationAsset>);
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(FOUNDATION_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<Record<FoundationCategoryId, FoundationAsset>>;
    for (const cat of FOUNDATION_CATEGORIES) {
      const val = parsed[cat.id];
      if (val && typeof val === "object") empty[cat.id] = { ...empty[cat.id], ...val };
    }
    return empty;
  } catch {
    return empty;
  }
}

export function saveFoundationAssets(assets: Record<FoundationCategoryId, FoundationAsset>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FOUNDATION_KEY, JSON.stringify(assets));
}

export function formatTimer(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─────────────────── Questions Bank ───────────────────
export type Question = {
  id: string;
  prompt: string;
  latex?: string;
  choices: string[]; // exactly 4
  correctIndex: 0 | 1 | 2 | 3;
};

export const SEED_QUESTIONS: Record<number, Question[]> = {
  1: [
    { id: "s1q1", prompt: "اشترت هدى 10 قطع حلوى بريالين للقطعة الواحدة، وخُصم لها 5% من السعر الإجمالي لقطع الحلوى، فكم ريالاً دفعت؟", choices: ["19", "20", "21", "22"], correctIndex: 0 },
    { id: "s1q2", prompt: "أي الأعداد التالية عبارة عن حاصل ضرب مكعبَي عددين متتاليين؟", choices: ["0", "27", "64", "125"], correctIndex: 0 },
    { id: "s1q3", prompt: "إذا كان مجموع ثلاثة أعداد متتالية يساوي 18، فما العدد الأصغر منها؟", choices: ["1", "2", "5", "9"], correctIndex: 1 },
    { id: "s1q4", prompt: "قارن بين القيمة الأولى: 41، والقيمة الثانية: (3+4)² − (2−4)³", choices: ["القيمة الأولى أكبر", "القيمة الثانية أكبر", "القيمتان متساويتان", "المعطيات غير كافية"], correctIndex: 1 },
    { id: "s1q5", prompt: "أجرة الوقوف في أحد المواقف التجارية لكل ساعة أو أي جزء منها ريالان. دخل فهد الموقف الساعة 2:05 مساءً وخرج الساعة 7:45 مساءً، فإن أجرة وقوفه بالريالات تساوي:", choices: ["10", "11", "12", "13"], correctIndex: 2 },
    { id: "s1q6", prompt: "مربع طول ضلعه 4 سم، ورؤوس المربع مراكز لدوائر متطابقة. كم سنتيمتراً مربعاً مساحة المنطقة المظللة؟", latex: "\\text{}", choices: ["16\\pi", "16+4\\pi", "4\\pi", "16-4\\pi"], correctIndex: 3 },
    { id: "s1q7", prompt: "قارن بين: القيمة الأولى: محيط خماسي منتظم طول ضلعه 1 سم، والقيمة الثانية: محيط دائرة طول نصف قطرها 1 سم.", choices: ["القيمة الأولى أكبر", "القيمة الثانية أكبر", "القيمتان متساويتان", "المعطيات غير كافية"], correctIndex: 1 },
    { id: "s1q8", prompt: "حديقة مستطيلة الشكل، طول محيطها 18 م، فإذا كان طولها 5 م، فكم متراً عرضها؟", choices: ["4", "5", "8", "10"], correctIndex: 0 },
    { id: "s1q9", prompt: "إذا كان: 3س² − 23س = 3س − 29 + 2س². أي مما يلي أحد جذري المعادلة؟", latex: "3س^2 - 23س = 3س - 29 + 2س^2", choices: ["6", "5", "3", "1"], correctIndex: 2 },
  ],
};

export function loadAllQuestions(): Record<number, Question[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(QUESTIONS_KEY);
    return raw ? (JSON.parse(raw) as Record<number, Question[]>) : {};
  } catch { return {}; }
}

export function getQuestions(sectionNumber: number): Question[] {
  const all = loadAllQuestions();
  const custom = all[sectionNumber];
  if (custom && custom.length > 0) return custom;
  return SEED_QUESTIONS[sectionNumber] ?? [];
}

export function saveQuestions(sectionNumber: number, questions: Question[]) {
  if (typeof window === "undefined") return;
  const all = loadAllQuestions();
  all[sectionNumber] = questions;
  window.localStorage.setItem(QUESTIONS_KEY, JSON.stringify(all));
}

export function computeTimerSeconds(section: SectionConfig, questionCount: number): number {
  if (section.timerSeconds && section.timerSeconds > 0) return section.timerSeconds;
  return Math.max(SECONDS_PER_QUESTION, questionCount * SECONDS_PER_QUESTION);
}