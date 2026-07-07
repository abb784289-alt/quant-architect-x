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
  return { number: n, title: `القسم ${toArabic(n)}`, timerSeconds: DEFAULT_TIMER_SECONDS, videoUrl: "" };
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
  imageUrl?: string;
  svg?: string; // raw SVG markup for geometric shapes
  choices: string[]; // exactly 4
  correctIndex: 0 | 1 | 2 | 3;
};

// Arabic-Indic digits helper (٠١٢٣٤٥٦٧٨٩)
const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
export function toArabic(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);
}

export const SEED_QUESTIONS: Record<number, Question[]> = {
  1: [
    { id: "s1q1", prompt: "اشترت هدى ١٠ قطع حلوى بريالَين للقطعة الواحدة، وخُصم لها ٥٪ من السعر الإجمالي لقطع الحلوى، فكم ريالاً دفعت؟", choices: ["١٩", "٢٠", "٢١", "٢٢"], correctIndex: 0 },
    { id: "s1q2", prompt: "أيّ الأعداد التالية عبارة عن حاصل ضرب مكعبَي عددَين متتاليَين؟", choices: ["٠", "٢٧", "٦٤", "١٢٥"], correctIndex: 0 },
    { id: "s1q3", prompt: "إذا كان مجموع ثلاثة أعداد متتالية يساوي ١٨، فما العدد الأصغر منها؟", choices: ["١", "٢", "٥", "٩"], correctIndex: 1 },
    { id: "s1q4", prompt: "قارن بين القيمة الأولى: ٤١، والقيمة الثانية: (٣+٤)² − (٢−٤)³", choices: ["القيمة الأولى أكبر", "القيمة الثانية أكبر", "القيمتان متساويتان", "المعطيات غير كافية"], correctIndex: 1 },
    { id: "s1q5", prompt: "أجرة الوقوف في أحد المواقف التجارية لكل ساعة أو أي جزء منها ريالان. دخل فهد الموقف الساعة ٢:٠٥ مساءً وخرج الساعة ٧:٤٥ مساءً، فإن أجرة وقوفه بالريالات تساوي:", choices: ["١٠", "١١", "١٢", "١٣"], correctIndex: 2 },
    {
      id: "s1q6",
      prompt: "في الشكل المجاور، مربع طول ضلعه ٤ سم، ورؤوس المربع مراكز لدوائر متطابقة. كم سنتيمتراً مربعاً مساحة المنطقة المظللة؟",
      svg: `<svg viewBox="0 0 140 150" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <mask id="q6mask">
      <rect x="20" y="20" width="100" height="100" fill="white"/>
      <circle cx="20" cy="20" r="50" fill="black"/>
      <circle cx="120" cy="20" r="50" fill="black"/>
      <circle cx="20" cy="120" r="50" fill="black"/>
      <circle cx="120" cy="120" r="50" fill="black"/>
    </mask>
  </defs>
  <rect x="20" y="20" width="100" height="100" fill="#0D9488" opacity="0.25" mask="url(#q6mask)"/>
  <rect x="20" y="20" width="100" height="100" fill="none" stroke="#0F766E" stroke-width="1.6"/>
  <path d="M 20 70 A 50 50 0 0 1 70 20" fill="none" stroke="#0F766E" stroke-width="1.2"/>
  <path d="M 70 20 A 50 50 0 0 1 120 70" fill="none" stroke="#0F766E" stroke-width="1.2"/>
  <path d="M 20 70 A 50 50 0 0 0 70 120" fill="none" stroke="#0F766E" stroke-width="1.2"/>
  <path d="M 120 70 A 50 50 0 0 0 70 120" fill="none" stroke="#0F766E" stroke-width="1.2"/>
  <text x="70" y="140" text-anchor="middle" font-size="10" fill="#0F766E" font-family="Cairo, sans-serif">٤ سم</text>
</svg>`,
      choices: ["١٦ط", "١٦ + ٤ط", "٤ط", "١٦ − ٤ط"],
      correctIndex: 3,
    },
    { id: "s1q7", prompt: "قارن بين: القيمة الأولى: محيط خُماسي منتظم طول ضلعه ١ سم، والقيمة الثانية: محيط دائرة طول نصف قطرها ١ سم.", choices: ["القيمة الأولى أكبر", "القيمة الثانية أكبر", "القيمتان متساويتان", "المعطيات غير كافية"], correctIndex: 1 },
    {
      id: "s1q8",
      prompt: "حديقة مستطيلة الشكل، طول محيطها ١٨ م، فإذا كان طولها ٥ م، فكم متراً عرضها؟",
      svg: `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="30" width="140" height="70" fill="#0D9488" opacity="0.12" stroke="#0F766E" stroke-width="1.6"/>
  <text x="90" y="22" text-anchor="middle" font-size="12" fill="#0F766E" font-family="Cairo, sans-serif">٥ م</text>
  <text x="10" y="70" text-anchor="middle" font-size="12" fill="#0F766E" font-family="Cairo, sans-serif" transform="rotate(-90 10 70)">؟</text>
</svg>`,
      choices: ["٤", "٥", "٨", "١٠"],
      correctIndex: 0,
    },
    { id: "s1q9", prompt: "إذا كان: ٣س² − ٢٣س = ٣س − ٢٩ + ٢س². أيّ مما يلي أحد جذرَي المعادلة؟", choices: ["٦", "٥", "٣", "١"], correctIndex: 2 },
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