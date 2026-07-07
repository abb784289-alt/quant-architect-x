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

export const TOTAL_SECTIONS = 150;
export const DEFAULT_TIMER_SECONDS = 25 * 60;

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