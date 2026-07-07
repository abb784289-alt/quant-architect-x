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
    { id: "s1q1", prompt: "", imageUrl: "/questions/s01_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s1q2", prompt: "", imageUrl: "/questions/s01_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s1q3", prompt: "", imageUrl: "/questions/s01_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s1q4", prompt: "", imageUrl: "/questions/s01_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s1q5", prompt: "", imageUrl: "/questions/s01_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s1q6", prompt: "", imageUrl: "/questions/s01_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s1q7", prompt: "", imageUrl: "/questions/s01_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s1q8", prompt: "", imageUrl: "/questions/s01_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s1q9", prompt: "", imageUrl: "/questions/s01_q09.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s1q10", prompt: "", imageUrl: "/questions/s01_q10.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s1q11", prompt: "", imageUrl: "/questions/s01_q11.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
  ],
  2: [
    { id: "s2q1", prompt: "", imageUrl: "/questions/s02_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s2q2", prompt: "", imageUrl: "/questions/s02_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s2q3", prompt: "", imageUrl: "/questions/s02_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s2q4", prompt: "", imageUrl: "/questions/s02_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s2q5", prompt: "", imageUrl: "/questions/s02_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s2q6", prompt: "", imageUrl: "/questions/s02_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s2q7", prompt: "", imageUrl: "/questions/s02_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s2q8", prompt: "", imageUrl: "/questions/s02_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s2q9", prompt: "", imageUrl: "/questions/s02_q09.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s2q10", prompt: "", imageUrl: "/questions/s02_q10.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s2q11", prompt: "", imageUrl: "/questions/s02_q11.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  3: [
    { id: "s3q1", prompt: "", imageUrl: "/questions/s03_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s3q2", prompt: "", imageUrl: "/questions/s03_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s3q3", prompt: "", imageUrl: "/questions/s03_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s3q4", prompt: "", imageUrl: "/questions/s03_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s3q5", prompt: "", imageUrl: "/questions/s03_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s3q6", prompt: "", imageUrl: "/questions/s03_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s3q7", prompt: "", imageUrl: "/questions/s03_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s3q8", prompt: "", imageUrl: "/questions/s03_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s3q9", prompt: "", imageUrl: "/questions/s03_q09.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s3q10", prompt: "", imageUrl: "/questions/s03_q10.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s3q11", prompt: "", imageUrl: "/questions/s03_q11.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  4: [
    { id: "s4q1", prompt: "", imageUrl: "/questions/s04_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s4q2", prompt: "", imageUrl: "/questions/s04_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s4q3", prompt: "", imageUrl: "/questions/s04_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s4q4", prompt: "", imageUrl: "/questions/s04_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s4q5", prompt: "", imageUrl: "/questions/s04_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s4q6", prompt: "", imageUrl: "/questions/s04_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s4q7", prompt: "", imageUrl: "/questions/s04_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s4q8", prompt: "", imageUrl: "/questions/s04_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s4q9", prompt: "", imageUrl: "/questions/s04_q09.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s4q10", prompt: "", imageUrl: "/questions/s04_q10.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s4q11", prompt: "", imageUrl: "/questions/s04_q11.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  5: [
    { id: "s5q1", prompt: "", imageUrl: "/questions/s05_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s5q2", prompt: "", imageUrl: "/questions/s05_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s5q3", prompt: "", imageUrl: "/questions/s05_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s5q4", prompt: "", imageUrl: "/questions/s05_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s5q5", prompt: "", imageUrl: "/questions/s05_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s5q6", prompt: "", imageUrl: "/questions/s05_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s5q7", prompt: "", imageUrl: "/questions/s05_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s5q8", prompt: "", imageUrl: "/questions/s05_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s5q9", prompt: "", imageUrl: "/questions/s05_q09.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s5q10", prompt: "", imageUrl: "/questions/s05_q10.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s5q11", prompt: "", imageUrl: "/questions/s05_q11.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
  ],
  6: [
    { id: "s6q1", prompt: "", imageUrl: "/questions/s06_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s6q2", prompt: "", imageUrl: "/questions/s06_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s6q3", prompt: "", imageUrl: "/questions/s06_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s6q4", prompt: "", imageUrl: "/questions/s06_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s6q5", prompt: "", imageUrl: "/questions/s06_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s6q6", prompt: "", imageUrl: "/questions/s06_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s6q7", prompt: "", imageUrl: "/questions/s06_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s6q8", prompt: "", imageUrl: "/questions/s06_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s6q9", prompt: "", imageUrl: "/questions/s06_q09.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s6q10", prompt: "", imageUrl: "/questions/s06_q10.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s6q11", prompt: "", imageUrl: "/questions/s06_q11.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
  ],
  7: [
    { id: "s7q1", prompt: "", imageUrl: "/questions/s07_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s7q2", prompt: "", imageUrl: "/questions/s07_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s7q3", prompt: "", imageUrl: "/questions/s07_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s7q4", prompt: "", imageUrl: "/questions/s07_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s7q5", prompt: "", imageUrl: "/questions/s07_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s7q6", prompt: "", imageUrl: "/questions/s07_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s7q7", prompt: "", imageUrl: "/questions/s07_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s7q8", prompt: "", imageUrl: "/questions/s07_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s7q9", prompt: "", imageUrl: "/questions/s07_q09.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s7q10", prompt: "", imageUrl: "/questions/s07_q10.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s7q11", prompt: "", imageUrl: "/questions/s07_q11.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
  ],
  8: [
    { id: "s8q1", prompt: "", imageUrl: "/questions/s08_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s8q2", prompt: "", imageUrl: "/questions/s08_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s8q3", prompt: "", imageUrl: "/questions/s08_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s8q4", prompt: "", imageUrl: "/questions/s08_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s8q5", prompt: "", imageUrl: "/questions/s08_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s8q6", prompt: "", imageUrl: "/questions/s08_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s8q7", prompt: "", imageUrl: "/questions/s08_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s8q8", prompt: "", imageUrl: "/questions/s08_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s8q9", prompt: "", imageUrl: "/questions/s08_q09.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s8q10", prompt: "", imageUrl: "/questions/s08_q10.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s8q11", prompt: "", imageUrl: "/questions/s08_q11.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  9: [
    { id: "s9q1", prompt: "", imageUrl: "/questions/s09_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s9q2", prompt: "", imageUrl: "/questions/s09_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s9q3", prompt: "", imageUrl: "/questions/s09_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s9q4", prompt: "", imageUrl: "/questions/s09_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s9q5", prompt: "", imageUrl: "/questions/s09_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s9q6", prompt: "", imageUrl: "/questions/s09_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s9q7", prompt: "", imageUrl: "/questions/s09_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s9q8", prompt: "", imageUrl: "/questions/s09_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s9q9", prompt: "", imageUrl: "/questions/s09_q09.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s9q10", prompt: "", imageUrl: "/questions/s09_q10.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s9q11", prompt: "", imageUrl: "/questions/s09_q11.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
  ],
  10: [
    { id: "s10q1", prompt: "", imageUrl: "/questions/s10_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s10q2", prompt: "", imageUrl: "/questions/s10_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s10q3", prompt: "", imageUrl: "/questions/s10_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s10q4", prompt: "", imageUrl: "/questions/s10_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s10q5", prompt: "", imageUrl: "/questions/s10_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s10q6", prompt: "", imageUrl: "/questions/s10_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s10q7", prompt: "", imageUrl: "/questions/s10_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s10q8", prompt: "", imageUrl: "/questions/s10_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s10q9", prompt: "", imageUrl: "/questions/s10_q09.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s10q10", prompt: "", imageUrl: "/questions/s10_q10.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s10q11", prompt: "", imageUrl: "/questions/s10_q11.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  11: [
    { id: "s11q1", prompt: "", imageUrl: "/questions/s11_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s11q2", prompt: "", imageUrl: "/questions/s11_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s11q3", prompt: "", imageUrl: "/questions/s11_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s11q4", prompt: "", imageUrl: "/questions/s11_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s11q5", prompt: "", imageUrl: "/questions/s11_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s11q6", prompt: "", imageUrl: "/questions/s11_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s11q7", prompt: "", imageUrl: "/questions/s11_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s11q8", prompt: "", imageUrl: "/questions/s11_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s11q9", prompt: "", imageUrl: "/questions/s11_q09.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s11q10", prompt: "", imageUrl: "/questions/s11_q10.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s11q11", prompt: "", imageUrl: "/questions/s11_q11.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
  ],
  12: [
    { id: "s12q1", prompt: "", imageUrl: "/questions/s12_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s12q2", prompt: "", imageUrl: "/questions/s12_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s12q3", prompt: "", imageUrl: "/questions/s12_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s12q4", prompt: "", imageUrl: "/questions/s12_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s12q5", prompt: "", imageUrl: "/questions/s12_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s12q6", prompt: "", imageUrl: "/questions/s12_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s12q7", prompt: "", imageUrl: "/questions/s12_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s12q8", prompt: "", imageUrl: "/questions/s12_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s12q9", prompt: "", imageUrl: "/questions/s12_q09.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s12q10", prompt: "", imageUrl: "/questions/s12_q10.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s12q11", prompt: "", imageUrl: "/questions/s12_q11.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  13: [
    { id: "s13q1", prompt: "", imageUrl: "/questions/s13_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s13q2", prompt: "", imageUrl: "/questions/s13_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s13q3", prompt: "", imageUrl: "/questions/s13_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s13q4", prompt: "", imageUrl: "/questions/s13_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s13q5", prompt: "", imageUrl: "/questions/s13_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s13q6", prompt: "", imageUrl: "/questions/s13_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s13q7", prompt: "", imageUrl: "/questions/s13_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s13q8", prompt: "", imageUrl: "/questions/s13_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s13q9", prompt: "", imageUrl: "/questions/s13_q09.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s13q10", prompt: "", imageUrl: "/questions/s13_q10.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s13q11", prompt: "", imageUrl: "/questions/s13_q11.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  14: [
    { id: "s14q1", prompt: "", imageUrl: "/questions/s14_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s14q2", prompt: "", imageUrl: "/questions/s14_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s14q3", prompt: "", imageUrl: "/questions/s14_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s14q4", prompt: "", imageUrl: "/questions/s14_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s14q5", prompt: "", imageUrl: "/questions/s14_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s14q6", prompt: "", imageUrl: "/questions/s14_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s14q7", prompt: "", imageUrl: "/questions/s14_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s14q8", prompt: "", imageUrl: "/questions/s14_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s14q9", prompt: "", imageUrl: "/questions/s14_q09.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s14q10", prompt: "", imageUrl: "/questions/s14_q10.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s14q11", prompt: "", imageUrl: "/questions/s14_q11.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  15: [
    { id: "s15q1", prompt: "", imageUrl: "/questions/s15_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s15q2", prompt: "", imageUrl: "/questions/s15_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s15q3", prompt: "", imageUrl: "/questions/s15_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s15q4", prompt: "", imageUrl: "/questions/s15_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s15q5", prompt: "", imageUrl: "/questions/s15_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s15q6", prompt: "", imageUrl: "/questions/s15_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s15q7", prompt: "", imageUrl: "/questions/s15_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s15q8", prompt: "", imageUrl: "/questions/s15_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s15q9", prompt: "", imageUrl: "/questions/s15_q09.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s15q10", prompt: "", imageUrl: "/questions/s15_q10.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s15q11", prompt: "", imageUrl: "/questions/s15_q11.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  16: [
    { id: "s16q1", prompt: "", imageUrl: "/questions/s16_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s16q2", prompt: "", imageUrl: "/questions/s16_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s16q3", prompt: "", imageUrl: "/questions/s16_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s16q4", prompt: "", imageUrl: "/questions/s16_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s16q5", prompt: "", imageUrl: "/questions/s16_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s16q6", prompt: "", imageUrl: "/questions/s16_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s16q7", prompt: "", imageUrl: "/questions/s16_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s16q8", prompt: "", imageUrl: "/questions/s16_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s16q9", prompt: "", imageUrl: "/questions/s16_q09.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s16q10", prompt: "", imageUrl: "/questions/s16_q10.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s16q11", prompt: "", imageUrl: "/questions/s16_q11.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  17: [
    { id: "s17q1", prompt: "", imageUrl: "/questions/s17_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s17q2", prompt: "", imageUrl: "/questions/s17_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s17q3", prompt: "", imageUrl: "/questions/s17_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s17q4", prompt: "", imageUrl: "/questions/s17_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s17q5", prompt: "", imageUrl: "/questions/s17_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s17q6", prompt: "", imageUrl: "/questions/s17_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s17q7", prompt: "", imageUrl: "/questions/s17_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s17q8", prompt: "", imageUrl: "/questions/s17_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s17q9", prompt: "", imageUrl: "/questions/s17_q09.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s17q10", prompt: "", imageUrl: "/questions/s17_q10.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s17q11", prompt: "", imageUrl: "/questions/s17_q11.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  18: [
    { id: "s18q1", prompt: "", imageUrl: "/questions/s18_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s18q2", prompt: "", imageUrl: "/questions/s18_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s18q3", prompt: "", imageUrl: "/questions/s18_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s18q4", prompt: "", imageUrl: "/questions/s18_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s18q5", prompt: "", imageUrl: "/questions/s18_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s18q6", prompt: "", imageUrl: "/questions/s18_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s18q7", prompt: "", imageUrl: "/questions/s18_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s18q8", prompt: "", imageUrl: "/questions/s18_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s18q9", prompt: "", imageUrl: "/questions/s18_q09.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s18q10", prompt: "", imageUrl: "/questions/s18_q10.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s18q11", prompt: "", imageUrl: "/questions/s18_q11.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  19: [
    { id: "s19q1", prompt: "", imageUrl: "/questions/s19_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s19q2", prompt: "", imageUrl: "/questions/s19_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s19q3", prompt: "", imageUrl: "/questions/s19_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s19q4", prompt: "", imageUrl: "/questions/s19_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s19q5", prompt: "", imageUrl: "/questions/s19_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s19q6", prompt: "", imageUrl: "/questions/s19_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s19q7", prompt: "", imageUrl: "/questions/s19_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s19q8", prompt: "", imageUrl: "/questions/s19_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s19q9", prompt: "", imageUrl: "/questions/s19_q09.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s19q10", prompt: "", imageUrl: "/questions/s19_q10.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s19q11", prompt: "", imageUrl: "/questions/s19_q11.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
  ],
  20: [
    { id: "s20q1", prompt: "", imageUrl: "/questions/s20_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s20q2", prompt: "", imageUrl: "/questions/s20_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s20q3", prompt: "", imageUrl: "/questions/s20_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s20q4", prompt: "", imageUrl: "/questions/s20_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s20q5", prompt: "", imageUrl: "/questions/s20_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s20q6", prompt: "", imageUrl: "/questions/s20_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s20q7", prompt: "", imageUrl: "/questions/s20_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s20q8", prompt: "", imageUrl: "/questions/s20_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s20q9", prompt: "", imageUrl: "/questions/s20_q09.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s20q10", prompt: "", imageUrl: "/questions/s20_q10.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s20q11", prompt: "", imageUrl: "/questions/s20_q11.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  21: [
    { id: "s21q1", prompt: "", imageUrl: "/questions/s21_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s21q2", prompt: "", imageUrl: "/questions/s21_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s21q3", prompt: "", imageUrl: "/questions/s21_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s21q4", prompt: "", imageUrl: "/questions/s21_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s21q5", prompt: "", imageUrl: "/questions/s21_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s21q6", prompt: "", imageUrl: "/questions/s21_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s21q7", prompt: "", imageUrl: "/questions/s21_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s21q8", prompt: "", imageUrl: "/questions/s21_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  22: [
    { id: "s22q1", prompt: "", imageUrl: "/questions/s22_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s22q2", prompt: "", imageUrl: "/questions/s22_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s22q3", prompt: "", imageUrl: "/questions/s22_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s22q4", prompt: "", imageUrl: "/questions/s22_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s22q5", prompt: "", imageUrl: "/questions/s22_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s22q6", prompt: "", imageUrl: "/questions/s22_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  23: [
    { id: "s23q1", prompt: "", imageUrl: "/questions/s23_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s23q2", prompt: "", imageUrl: "/questions/s23_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s23q3", prompt: "", imageUrl: "/questions/s23_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s23q4", prompt: "", imageUrl: "/questions/s23_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s23q5", prompt: "", imageUrl: "/questions/s23_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s23q6", prompt: "", imageUrl: "/questions/s23_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  24: [
    { id: "s24q1", prompt: "", imageUrl: "/questions/s24_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s24q2", prompt: "", imageUrl: "/questions/s24_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s24q3", prompt: "", imageUrl: "/questions/s24_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s24q4", prompt: "", imageUrl: "/questions/s24_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s24q5", prompt: "", imageUrl: "/questions/s24_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s24q6", prompt: "", imageUrl: "/questions/s24_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s24q7", prompt: "", imageUrl: "/questions/s24_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  25: [
    { id: "s25q1", prompt: "", imageUrl: "/questions/s25_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s25q2", prompt: "", imageUrl: "/questions/s25_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s25q3", prompt: "", imageUrl: "/questions/s25_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s25q4", prompt: "", imageUrl: "/questions/s25_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s25q5", prompt: "", imageUrl: "/questions/s25_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  26: [
    { id: "s26q1", prompt: "", imageUrl: "/questions/s26_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s26q2", prompt: "", imageUrl: "/questions/s26_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s26q3", prompt: "", imageUrl: "/questions/s26_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s26q4", prompt: "", imageUrl: "/questions/s26_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s26q5", prompt: "", imageUrl: "/questions/s26_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  27: [
    { id: "s27q1", prompt: "", imageUrl: "/questions/s27_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s27q2", prompt: "", imageUrl: "/questions/s27_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s27q3", prompt: "", imageUrl: "/questions/s27_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s27q4", prompt: "", imageUrl: "/questions/s27_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
  ],
  28: [
    { id: "s28q1", prompt: "", imageUrl: "/questions/s28_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s28q2", prompt: "", imageUrl: "/questions/s28_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s28q3", prompt: "", imageUrl: "/questions/s28_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s28q4", prompt: "", imageUrl: "/questions/s28_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s28q5", prompt: "", imageUrl: "/questions/s28_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s28q6", prompt: "", imageUrl: "/questions/s28_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s28q7", prompt: "", imageUrl: "/questions/s28_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s28q8", prompt: "", imageUrl: "/questions/s28_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  29: [
    { id: "s29q1", prompt: "", imageUrl: "/questions/s29_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s29q2", prompt: "", imageUrl: "/questions/s29_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s29q3", prompt: "", imageUrl: "/questions/s29_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s29q4", prompt: "", imageUrl: "/questions/s29_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s29q5", prompt: "", imageUrl: "/questions/s29_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s29q6", prompt: "", imageUrl: "/questions/s29_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s29q7", prompt: "", imageUrl: "/questions/s29_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s29q8", prompt: "", imageUrl: "/questions/s29_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s29q9", prompt: "", imageUrl: "/questions/s29_q09.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s29q10", prompt: "", imageUrl: "/questions/s29_q10.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  30: [
    { id: "s30q1", prompt: "", imageUrl: "/questions/s30_q01.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s30q2", prompt: "", imageUrl: "/questions/s30_q02.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s30q3", prompt: "", imageUrl: "/questions/s30_q03.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s30q4", prompt: "", imageUrl: "/questions/s30_q04.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s30q5", prompt: "", imageUrl: "/questions/s30_q05.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s30q6", prompt: "", imageUrl: "/questions/s30_q06.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s30q7", prompt: "", imageUrl: "/questions/s30_q07.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s30q8", prompt: "", imageUrl: "/questions/s30_q08.png", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
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