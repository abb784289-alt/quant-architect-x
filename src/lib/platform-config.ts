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
const QUESTIONS_KEY = "questions_bank_v2";

export const TOTAL_SECTIONS = 90;
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
  tableHtml?: string; // raw HTML markup for real tables (preferred over svg when present)
  choices: string[]; // exactly 4
  correctIndex: 0 | 1 | 2 | 3;
};

// Arabic-Indic digits helper (0123456789)
const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
export function toArabic(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);
}

// ─────────────── Real HTML tables (replace SVG-based tables) ───────────────
function htmlTable(headers: string[], rows: string[][], caption?: string): string {
  const th = headers.map((h) => `<th scope="col">${h}</th>`).join("");
  const body = rows
    .map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${c}</th>` : `<td>${c}</td>`)).join("")}</tr>`)
    .join("");
  return `<table class="q-table" dir="rtl">${caption ? `<caption>${caption}</caption>` : ""}<thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>`;
}

const TABLE_HTML_FIXES: Record<string, string> = {};
const GEOMETRY_SVG_FIXES: Record<string, string> = {};

function applyQuestionSvgFixes(questions: Question[]): Question[] {
  return questions.map((q) => {
    const tableHtml = TABLE_HTML_FIXES[q.id];
    if (tableHtml) return { ...q, tableHtml };
    const fixedSvg = GEOMETRY_SVG_FIXES[q.id];
    if (fixedSvg) return { ...q, svg: fixedSvg };
    return q;
  });
}

export const SEED_QUESTIONS: Record<number, Question[]> = {
  1: [
    { id: "s1q1", prompt: "", imageUrl: "/__l5e/assets-v1/616cb057-b35a-4deb-ab8a-4f9a3d2ab786/s1q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s1q2", prompt: "", imageUrl: "/__l5e/assets-v1/97544f19-011f-45bb-b59d-81690d475735/s1q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s1q3", prompt: "", imageUrl: "/__l5e/assets-v1/6cc48319-8daa-47e6-87fc-a289ab7e29fc/s1q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s1q4", prompt: "", imageUrl: "/__l5e/assets-v1/73f3ace4-c16a-46a8-918f-80fb68bc1ae2/s1q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s1q5", prompt: "", imageUrl: "/__l5e/assets-v1/cb6546f1-47c6-4814-9360-7c86bb1d3a65/s1q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s1q6", prompt: "", imageUrl: "/__l5e/assets-v1/88d8286b-5749-4bbf-a6b8-26c90ba16f49/s1q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s1q7", prompt: "", imageUrl: "/__l5e/assets-v1/8233ce44-3a74-47bb-a0a2-33a88166d064/s1q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s1q8", prompt: "", imageUrl: "/__l5e/assets-v1/1c1a9ee3-ec04-413b-bced-922d0f97523f/s1q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s1q9", prompt: "", imageUrl: "/__l5e/assets-v1/faf6a3c2-8f7e-432e-a013-b712407313e4/s1q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s1q10", prompt: "", imageUrl: "/__l5e/assets-v1/c1219298-0604-449c-8df7-06b11f144196/s1q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s1q11", prompt: "", imageUrl: "/__l5e/assets-v1/dbcf2ed0-b28a-475e-a719-cf20874eced0/s1q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  2: [
    { id: "s2q1", prompt: "", imageUrl: "/__l5e/assets-v1/dfcc3fa3-d366-4684-9a82-94136c0549ce/s2q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s2q2", prompt: "", imageUrl: "/__l5e/assets-v1/0077e350-7d3b-419c-97d8-b34c0ebc434d/s2q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s2q3", prompt: "", imageUrl: "/__l5e/assets-v1/eac23f99-b8f4-4ca4-b3a9-d1174c4d106e/s2q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s2q4", prompt: "", imageUrl: "/__l5e/assets-v1/c9e3e16a-fb6a-4d90-b0b6-f919df3b4999/s2q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s2q5", prompt: "", imageUrl: "/__l5e/assets-v1/21944bfb-940f-4e8a-97b6-db2329f03a29/s2q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s2q6", prompt: "", imageUrl: "/__l5e/assets-v1/b2c5d862-5cb6-425d-a980-2fca57472d9b/s2q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s2q7", prompt: "", imageUrl: "/__l5e/assets-v1/ba599aee-a700-4f11-9606-5e3db11c4cb8/s2q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s2q8", prompt: "", imageUrl: "/__l5e/assets-v1/ec5cafeb-4e56-4618-aa2e-9f222529b9df/s2q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s2q9", prompt: "", imageUrl: "/__l5e/assets-v1/b70b31f4-8a8f-42a4-83b2-42eb864a82c3/s2q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s2q10", prompt: "", imageUrl: "/__l5e/assets-v1/f1b80097-be89-4b50-96ab-9d570bbb6156/s2q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s2q11", prompt: "", imageUrl: "/__l5e/assets-v1/64229d90-18a9-406e-ae69-cbbbf578cc62/s2q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  3: [
    { id: "s3q1", prompt: "", imageUrl: "/__l5e/assets-v1/407e04c7-ec66-46a8-b0bc-01e3606cc817/s3q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s3q2", prompt: "", imageUrl: "/__l5e/assets-v1/e841a93a-74cf-4290-9c22-d778714e7edd/s3q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s3q3", prompt: "", imageUrl: "/__l5e/assets-v1/071039d5-ac8b-4aca-9042-f8b329515c5c/s3q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s3q4", prompt: "", imageUrl: "/__l5e/assets-v1/dce2366d-3f6e-4218-a55c-559002e26ab6/s3q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s3q5", prompt: "", imageUrl: "/__l5e/assets-v1/f9a4ea38-8f0b-4dfe-9d43-34ce8ae4c662/s3q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s3q6", prompt: "", imageUrl: "/__l5e/assets-v1/28964822-c14b-4783-a8cf-0bb1a851b9d3/s3q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s3q7", prompt: "", imageUrl: "/__l5e/assets-v1/a5393daf-a907-4242-a3be-88f57d494327/s3q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s3q8", prompt: "", imageUrl: "/__l5e/assets-v1/aa15750b-7c33-4d82-bc07-fe6f4489aa6b/s3q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s3q9", prompt: "", imageUrl: "/__l5e/assets-v1/a8f5c212-c1a4-4cb8-aed9-f30d0b198689/s3q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s3q10", prompt: "", imageUrl: "/__l5e/assets-v1/2a522191-76ba-4bf8-86ff-8f26ebad5fff/s3q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s3q11", prompt: "", imageUrl: "/__l5e/assets-v1/f685899e-583d-42e6-9c14-fecacc67facf/s3q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  4: [
    { id: "s4q1", prompt: "", imageUrl: "/__l5e/assets-v1/51eaa193-0664-425a-889c-90bdab7ab61d/s4q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s4q2", prompt: "", imageUrl: "/__l5e/assets-v1/62fbaa54-57ec-477f-af36-9ce38b6076d9/s4q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s4q3", prompt: "", imageUrl: "/__l5e/assets-v1/ded40645-5ab4-4b74-96c7-d3a234d9fa38/s4q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s4q4", prompt: "", imageUrl: "/__l5e/assets-v1/a191b375-b307-47e3-948b-498745684c90/s4q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s4q5", prompt: "", imageUrl: "/__l5e/assets-v1/fec48cd1-3281-4cc6-b1e7-4c849253f5b0/s4q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s4q6", prompt: "", imageUrl: "/__l5e/assets-v1/1f88974c-14ae-4f37-8be3-de17f4ee579b/s4q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s4q7", prompt: "", imageUrl: "/__l5e/assets-v1/82794279-7654-48ea-9f78-804d605d00c9/s4q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s4q8", prompt: "", imageUrl: "/__l5e/assets-v1/cacf0d78-1024-4bf5-8762-423bce09e947/s4q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s4q9", prompt: "", imageUrl: "/__l5e/assets-v1/af3367ac-84e8-468f-891a-e17546b45aab/s4q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s4q10", prompt: "", imageUrl: "/__l5e/assets-v1/3c358d0b-2be7-47a3-8a7d-24631ce1235b/s4q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s4q11", prompt: "", imageUrl: "/__l5e/assets-v1/af83f5c5-c139-43d0-b34f-cf04e64b87ff/s4q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  5: [
    { id: "s5q1", prompt: "", imageUrl: "/__l5e/assets-v1/7c7e99c9-c785-47cb-bac8-e7933561402f/s5q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s5q2", prompt: "", imageUrl: "/__l5e/assets-v1/97f6c412-e817-43cb-8b58-66fd767b17e3/s5q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s5q3", prompt: "", imageUrl: "/__l5e/assets-v1/74a531bf-b075-4be9-8d6f-f0681accfdc9/s5q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s5q4", prompt: "", imageUrl: "/__l5e/assets-v1/4a62dff8-7f9b-4ed2-902d-7d658f367da6/s5q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s5q5", prompt: "", imageUrl: "/__l5e/assets-v1/578385f1-05ce-4166-9b2c-f48d6c33df8e/s5q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s5q6", prompt: "", imageUrl: "/__l5e/assets-v1/057438c1-ab64-4ad2-8c98-a235f73df261/s5q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s5q7", prompt: "", imageUrl: "/__l5e/assets-v1/f37dfc81-878d-42b8-b8fd-aec1a82f8549/s5q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s5q8", prompt: "", imageUrl: "/__l5e/assets-v1/c391fa9a-fade-49b8-bcd4-def96ee6e01b/s5q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s5q9", prompt: "", imageUrl: "/__l5e/assets-v1/523041dd-6d9c-4735-8a50-a4027b49dffc/s5q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s5q10", prompt: "", imageUrl: "/__l5e/assets-v1/cadc4d21-fe44-4f83-b682-8d35086e7069/s5q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s5q11", prompt: "", imageUrl: "/__l5e/assets-v1/18bb2dce-9b61-4572-8493-368391b53800/s5q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  6: [
    { id: "s6q1", prompt: "", imageUrl: "/__l5e/assets-v1/00d19893-2fa4-4fdc-9303-f15167eaece2/s6q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s6q2", prompt: "", imageUrl: "/__l5e/assets-v1/7fd6b24b-4a0b-4d9e-ba46-1470425d6a00/s6q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s6q3", prompt: "", imageUrl: "/__l5e/assets-v1/181c2bf7-4bd8-4e26-8801-bcd04cace58d/s6q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s6q4", prompt: "", imageUrl: "/__l5e/assets-v1/672f44d8-c44b-4939-9b2a-38c476367a47/s6q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s6q5", prompt: "", imageUrl: "/__l5e/assets-v1/97767b01-8108-4780-a09c-f12dfc69c9c5/s6q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s6q6", prompt: "", imageUrl: "/__l5e/assets-v1/4d34b74c-3b7d-40f1-b251-ce4f8d273755/s6q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s6q7", prompt: "", imageUrl: "/__l5e/assets-v1/c37c634e-daf3-48d7-b5b2-843f732b4fbf/s6q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s6q8", prompt: "", imageUrl: "/__l5e/assets-v1/a1d2cc0b-7599-4aed-8fe6-1bfea468f95d/s6q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s6q9", prompt: "", imageUrl: "/__l5e/assets-v1/7b218123-40cd-4e6c-91d4-49a4021a9aa4/s6q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s6q10", prompt: "", imageUrl: "/__l5e/assets-v1/01fc2869-a595-4f30-a12c-2047dcd4363c/s6q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s6q11", prompt: "", imageUrl: "/__l5e/assets-v1/787e5b9b-68f8-45e5-b978-e6fe686a27ec/s6q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  7: [
    { id: "s7q1", prompt: "", imageUrl: "/__l5e/assets-v1/0788d8a6-0026-4d4c-abce-2b0fd29eb576/s7q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s7q2", prompt: "", imageUrl: "/__l5e/assets-v1/fb2b8510-fd85-4178-90af-26affb872fc8/s7q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s7q3", prompt: "", imageUrl: "/__l5e/assets-v1/c0d6fe46-952f-4b33-bb1c-32f33cbc7b54/s7q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s7q4", prompt: "", imageUrl: "/__l5e/assets-v1/0173f1bd-2d34-4bcf-ae91-3400b0e724b7/s7q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s7q5", prompt: "", imageUrl: "/__l5e/assets-v1/9d49937a-5313-4298-a186-ddcf0995239e/s7q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s7q6", prompt: "", imageUrl: "/__l5e/assets-v1/686985b7-7ed3-4c84-8fed-21e93ff44309/s7q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s7q7", prompt: "", imageUrl: "/__l5e/assets-v1/7244eaa5-008c-4bf4-ab57-00639b2aebec/s7q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s7q8", prompt: "", imageUrl: "/__l5e/assets-v1/59629a00-bb92-4927-9d4a-e253a1d5eb43/s7q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s7q9", prompt: "", imageUrl: "/__l5e/assets-v1/71edb3f5-0c48-4da2-8fb1-b887556fd6d0/s7q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s7q10", prompt: "", imageUrl: "/__l5e/assets-v1/fd96953a-bd04-48f0-8c6a-df649b608df2/s7q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s7q11", prompt: "", imageUrl: "/__l5e/assets-v1/3875d00f-a89d-4d8b-bcd0-1fbab1785673/s7q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  8: [
    { id: "s8q1", prompt: "", imageUrl: "/__l5e/assets-v1/93cbbb8c-01ad-4f0c-9d19-a2ea6e8345be/s8q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s8q2", prompt: "", imageUrl: "/__l5e/assets-v1/0206242f-bd57-4212-8fdb-89634697099c/s8q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s8q3", prompt: "", imageUrl: "/__l5e/assets-v1/ee30cdf6-eea1-4823-a1d2-6753fde04674/s8q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s8q4", prompt: "", imageUrl: "/__l5e/assets-v1/5edb3b0b-e96b-4367-afa4-60ec46a1655a/s8q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s8q5", prompt: "", imageUrl: "/__l5e/assets-v1/3c072aab-c2f2-44b9-ba87-ab8cde41679d/s8q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s8q6", prompt: "", imageUrl: "/__l5e/assets-v1/26c37154-ec77-4859-8c96-fc27dabc5e18/s8q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s8q7", prompt: "", imageUrl: "/__l5e/assets-v1/08c62592-853c-4c88-b313-0edaf174cd88/s8q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s8q8", prompt: "", imageUrl: "/__l5e/assets-v1/016ec80c-e271-4362-99a9-e0861b4d3358/s8q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s8q9", prompt: "", imageUrl: "/__l5e/assets-v1/7f55863a-7b4f-4a13-85aa-ac5f54d1c7f1/s8q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s8q10", prompt: "", imageUrl: "/__l5e/assets-v1/e979d961-dc7d-44a1-bbf4-3e07ff770e5b/s8q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s8q11", prompt: "", imageUrl: "/__l5e/assets-v1/01f1f468-fb90-4ecd-9202-98193a3893c9/s8q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  9: [
    { id: "s9q1", prompt: "", imageUrl: "/__l5e/assets-v1/f777be22-93d0-433a-b775-d9e020cc46fc/s9q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s9q2", prompt: "", imageUrl: "/__l5e/assets-v1/01b51207-f143-43d5-bdf3-e4fbc131dd7c/s9q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s9q3", prompt: "", imageUrl: "/__l5e/assets-v1/d1640459-43d2-4cf1-abae-dd4cfcc18d27/s9q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s9q4", prompt: "", imageUrl: "/__l5e/assets-v1/ad94de3c-2e75-4008-b10d-74cb4157e3c0/s9q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s9q5", prompt: "", imageUrl: "/__l5e/assets-v1/3402d2a6-d38e-4df8-a439-3939a5a29284/s9q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s9q6", prompt: "", imageUrl: "/__l5e/assets-v1/fe63c674-b0ed-460b-842f-141b75407c37/s9q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s9q7", prompt: "", imageUrl: "/__l5e/assets-v1/f3ada970-4d9a-4bf6-b945-b22775405f6d/s9q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s9q8", prompt: "", imageUrl: "/__l5e/assets-v1/dc57d1ed-113a-4b43-af6b-6969071fddbe/s9q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s9q9", prompt: "", imageUrl: "/__l5e/assets-v1/e5d1f42b-ac57-4227-8f33-8387be598714/s9q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s9q10", prompt: "", imageUrl: "/__l5e/assets-v1/3bf13d08-0808-40c0-bd30-c30f85108ca0/s9q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s9q11", prompt: "", imageUrl: "/__l5e/assets-v1/4a1d0e0c-25c1-4023-8969-cf8a59aeb313/s9q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
  ],
  10: [
    { id: "s10q1", prompt: "", imageUrl: "/__l5e/assets-v1/6cd6903d-61b5-4964-bfcd-1c2d1e1fb702/s10q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s10q2", prompt: "", imageUrl: "/__l5e/assets-v1/370a8024-95ab-4678-b7c5-88ae3eb1e1fc/s10q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s10q3", prompt: "", imageUrl: "/__l5e/assets-v1/ad9bc973-f718-4f77-96f1-ad05028488a5/s10q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s10q4", prompt: "", imageUrl: "/__l5e/assets-v1/49eae188-e349-4598-925c-deb08d737dd6/s10q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s10q5", prompt: "", imageUrl: "/__l5e/assets-v1/eba425eb-f2f9-425d-b68a-e48302d875fe/s10q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s10q6", prompt: "", imageUrl: "/__l5e/assets-v1/25c0ddf1-b093-44f5-a39b-8eff6699db6f/s10q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s10q7", prompt: "", imageUrl: "/__l5e/assets-v1/7462612a-0483-41ff-a137-5ac3be217594/s10q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s10q8", prompt: "", imageUrl: "/__l5e/assets-v1/b7b5290f-6d7f-40d2-989c-7927c1e5c488/s10q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s10q9", prompt: "", imageUrl: "/__l5e/assets-v1/258a70f6-e1b5-473e-92fa-b2cb84e06452/s10q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s10q10", prompt: "", imageUrl: "/__l5e/assets-v1/72889273-2020-40e6-850f-c42f646db390/s10q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s10q11", prompt: "", imageUrl: "/__l5e/assets-v1/ad507901-7ade-4cd2-823b-d446e73087a7/s10q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  11: [
    { id: "s11q1", prompt: "", imageUrl: "/__l5e/assets-v1/35ec9b23-2f18-4ef5-ae2a-020c54b0506e/s11q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s11q2", prompt: "", imageUrl: "/__l5e/assets-v1/e9b4b533-667c-4c99-9290-b0b04f4f0aad/s11q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s11q3", prompt: "", imageUrl: "/__l5e/assets-v1/327b1070-114f-4482-8767-2e4a5025ded9/s11q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s11q4", prompt: "", imageUrl: "/__l5e/assets-v1/f3e9ef9e-9520-4414-a898-a250d2692895/s11q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s11q5", prompt: "", imageUrl: "/__l5e/assets-v1/450e33ae-6f8d-4f77-ac6b-9d6c551a08da/s11q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s11q6", prompt: "", imageUrl: "/__l5e/assets-v1/5e57a838-acbb-4406-b340-4863ccbd6528/s11q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s11q7", prompt: "", imageUrl: "/__l5e/assets-v1/351d8062-ceb3-4e0e-a0e8-35febaf35960/s11q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s11q8", prompt: "", imageUrl: "/__l5e/assets-v1/67e71278-3c3c-44b9-9a7e-19ea05773100/s11q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s11q9", prompt: "", imageUrl: "/__l5e/assets-v1/8528fe3b-0850-4438-bee6-7bc9230c42c6/s11q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s11q10", prompt: "", imageUrl: "/__l5e/assets-v1/3d4f0756-f08c-4adb-b139-5ab8d5ba4a7f/s11q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s11q11", prompt: "", imageUrl: "/__l5e/assets-v1/b2d55b41-4a1a-4b47-91b9-cad6fd1f9254/s11q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  12: [
    { id: "s12q1", prompt: "", imageUrl: "/__l5e/assets-v1/a774af16-6caa-451b-a43a-aa7cef33d7aa/s12q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s12q2", prompt: "", imageUrl: "/__l5e/assets-v1/68c3e641-150e-41db-9a0b-961cc4a0c579/s12q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s12q3", prompt: "", imageUrl: "/__l5e/assets-v1/aaec860e-6cdf-4c99-a4b3-f371b9a2f344/s12q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s12q4", prompt: "", imageUrl: "/__l5e/assets-v1/09c45ee4-cd22-4164-b65a-1c9f87e2c73e/s12q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s12q5", prompt: "", imageUrl: "/__l5e/assets-v1/4a1f7043-d2cd-4739-885c-70772e5cd4ba/s12q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s12q6", prompt: "", imageUrl: "/__l5e/assets-v1/d51bb37e-5cf1-46db-89c4-81f0bb5870e0/s12q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s12q7", prompt: "", imageUrl: "/__l5e/assets-v1/be324414-ddee-4582-8ceb-b02431584095/s12q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s12q8", prompt: "", imageUrl: "/__l5e/assets-v1/ff15c282-df6c-40f0-8d99-e89abfd27d02/s12q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s12q9", prompt: "", imageUrl: "/__l5e/assets-v1/1aaa0fe4-d1d3-4565-a0b4-b87def6e7bab/s12q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s12q10", prompt: "", imageUrl: "/__l5e/assets-v1/8c0c06fa-2bb7-4038-bb19-7223add2bf61/s12q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s12q11", prompt: "", imageUrl: "/__l5e/assets-v1/08ab3d9f-5a55-4d77-ab1f-369c03139023/s12q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  13: [
    { id: "s13q1", prompt: "", imageUrl: "/__l5e/assets-v1/3a1b5a98-9427-40f2-81d6-1cac6525628d/s13q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s13q2", prompt: "", imageUrl: "/__l5e/assets-v1/0b1b6b42-3995-47e9-beaa-b05fe7f0bfc3/s13q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s13q3", prompt: "", imageUrl: "/__l5e/assets-v1/a8e422fb-a257-40dd-9958-0576d305c139/s13q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s13q4", prompt: "", imageUrl: "/__l5e/assets-v1/d301bdd1-6377-429d-bfad-c465b382f9a3/s13q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s13q5", prompt: "", imageUrl: "/__l5e/assets-v1/5abf1724-45f8-48a2-aca4-f221bf76e616/s13q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s13q6", prompt: "", imageUrl: "/__l5e/assets-v1/67ee997b-2664-4b6b-9acc-8416c5d2b0fc/s13q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s13q7", prompt: "", imageUrl: "/__l5e/assets-v1/cc936cbb-6e74-480e-a666-ae5a931b3555/s13q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s13q8", prompt: "", imageUrl: "/__l5e/assets-v1/0ced4a93-ca35-4857-8df1-1eeb07195a6a/s13q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s13q9", prompt: "", imageUrl: "/__l5e/assets-v1/0b17b41b-fffe-47d5-bb6c-9f472803ae3e/s13q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s13q10", prompt: "", imageUrl: "/__l5e/assets-v1/327d7fc4-712b-4ec2-892a-d2e14d4ad6c0/s13q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s13q11", prompt: "", imageUrl: "/__l5e/assets-v1/df2ebf5c-fab7-4392-a17c-3bf215891324/s13q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  14: [
    { id: "s14q1", prompt: "", imageUrl: "/__l5e/assets-v1/608f8f06-6ef3-4dea-9342-a8b00d73c3d1/s14q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s14q2", prompt: "", imageUrl: "/__l5e/assets-v1/85272607-d34e-4d0f-91d6-965304f2d1c5/s14q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s14q3", prompt: "", imageUrl: "/__l5e/assets-v1/ac1094eb-480f-4e62-ad7d-76108d5a0564/s14q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s14q4", prompt: "", imageUrl: "/__l5e/assets-v1/77ea1ff9-73e8-480c-a0f9-0f921787574b/s14q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s14q5", prompt: "", imageUrl: "/__l5e/assets-v1/0cb51e6d-671c-476b-b6c1-7d37f57b32e5/s14q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s14q6", prompt: "", imageUrl: "/__l5e/assets-v1/c86ec703-383a-4602-bee0-a4e0eab5d40f/s14q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s14q7", prompt: "", imageUrl: "/__l5e/assets-v1/716031e2-07a8-4e49-ae29-a7fbb35559b6/s14q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s14q8", prompt: "", imageUrl: "/__l5e/assets-v1/03b48316-f913-4ef1-a795-638695d34e63/s14q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s14q9", prompt: "", imageUrl: "/__l5e/assets-v1/722266b4-c5c7-469c-adbc-f16581c908e6/s14q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s14q10", prompt: "", imageUrl: "/__l5e/assets-v1/d1fa54bc-ce4a-401c-a302-9a037600a565/s14q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s14q11", prompt: "", imageUrl: "/__l5e/assets-v1/de61f5f6-5194-42ad-92b9-55624d810ea2/s14q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  15: [
    { id: "s15q1", prompt: "", imageUrl: "/__l5e/assets-v1/e06d2409-111b-4031-9080-77ec5bca4693/s15q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s15q2", prompt: "", imageUrl: "/__l5e/assets-v1/8dfcb061-95aa-4305-a43e-5eeb88239b8f/s15q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s15q3", prompt: "", imageUrl: "/__l5e/assets-v1/eea9b16e-23ef-4c38-b729-9827f6f5af19/s15q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s15q4", prompt: "", imageUrl: "/__l5e/assets-v1/2a1f4783-94cd-44ad-a19a-04455bcbdced/s15q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s15q5", prompt: "", imageUrl: "/__l5e/assets-v1/0714dcfd-2493-4eb6-a53f-d76ef67f1e46/s15q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s15q6", prompt: "", imageUrl: "/__l5e/assets-v1/cb2e50f9-afa7-4929-adef-d58d98c9e483/s15q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s15q7", prompt: "", imageUrl: "/__l5e/assets-v1/6342fe3d-da60-43ce-bd9e-cc5f35563710/s15q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s15q8", prompt: "", imageUrl: "/__l5e/assets-v1/2df4e42a-6261-4bc0-949d-0c61ad19badd/s15q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s15q9", prompt: "", imageUrl: "/__l5e/assets-v1/371d047b-83c8-4ee7-93e1-9ea318d8e297/s15q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s15q10", prompt: "", imageUrl: "/__l5e/assets-v1/bd167d18-b6b8-4542-86cf-cb51819d668d/s15q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s15q11", prompt: "", imageUrl: "/__l5e/assets-v1/7b3cb325-34a8-4860-a3a4-9e228cd73a73/s15q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  16: [
    { id: "s16q1", prompt: "", imageUrl: "/__l5e/assets-v1/c93c7b08-c3a2-4895-82fa-953026d2f0ca/s16q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s16q2", prompt: "", imageUrl: "/__l5e/assets-v1/ac30538f-6c10-4866-a7db-f25e83709249/s16q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s16q3", prompt: "", imageUrl: "/__l5e/assets-v1/b5909bc6-dbec-465f-9590-1bd138cf6e70/s16q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s16q4", prompt: "", imageUrl: "/__l5e/assets-v1/29aaa74b-e883-4fe0-859a-4cd85e957200/s16q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s16q5", prompt: "", imageUrl: "/__l5e/assets-v1/6a26e597-1dca-4766-9a1a-d7652b0de50a/s16q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s16q6", prompt: "", imageUrl: "/__l5e/assets-v1/2360b0f8-9419-4c1b-b533-3e5e2cfab08a/s16q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s16q7", prompt: "", imageUrl: "/__l5e/assets-v1/3e024b81-ae07-4ad9-bf0d-49d1539f89a2/s16q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s16q8", prompt: "", imageUrl: "/__l5e/assets-v1/519407f1-3293-4362-9a53-6cf55341ac18/s16q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s16q9", prompt: "", imageUrl: "/__l5e/assets-v1/94d2717b-ea94-46c8-adfc-dce5622c556b/s16q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s16q10", prompt: "", imageUrl: "/__l5e/assets-v1/2bfafc11-30ec-4a5d-bd7b-3065c6daf916/s16q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s16q11", prompt: "", imageUrl: "/__l5e/assets-v1/3d384806-1efc-4b76-9424-e2d3f5bac8ee/s16q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
  ],
  17: [
    { id: "s17q1", prompt: "", imageUrl: "/__l5e/assets-v1/bca3d118-e406-44ca-8a76-f303171950be/s17q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s17q2", prompt: "", imageUrl: "/__l5e/assets-v1/4cb18bc0-79c9-42ea-b800-4cecc8610914/s17q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s17q3", prompt: "", imageUrl: "/__l5e/assets-v1/20149b01-2e68-4949-877d-e620c3e2bb4d/s17q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s17q4", prompt: "", imageUrl: "/__l5e/assets-v1/e4ca376b-6770-44bd-a54a-cb3e8af91f7c/s17q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s17q5", prompt: "", imageUrl: "/__l5e/assets-v1/32a88823-8d2b-4eaf-bd2e-fc41044bcc95/s17q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s17q6", prompt: "", imageUrl: "/__l5e/assets-v1/dd428035-9eeb-4ebe-85f5-a62f0d021173/s17q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s17q7", prompt: "", imageUrl: "/__l5e/assets-v1/ad473c0b-cc5a-45d4-9a7f-b302c8bb951d/s17q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s17q8", prompt: "", imageUrl: "/__l5e/assets-v1/8eacf2e8-1f3e-46e6-bd64-1ddcf625b833/s17q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s17q9", prompt: "", imageUrl: "/__l5e/assets-v1/c2d6c510-3cd3-4d9d-b1ff-ab9158399fa3/s17q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s17q10", prompt: "", imageUrl: "/__l5e/assets-v1/bc36839a-d324-48e0-83df-c35a1e3c187d/s17q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s17q11", prompt: "", imageUrl: "/__l5e/assets-v1/55e51bd9-343e-4737-8b9e-b74069d33fc9/s17q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  18: [
    { id: "s18q1", prompt: "", imageUrl: "/__l5e/assets-v1/f27a8bc8-c559-4979-b9a7-74c7acb09ce7/s18q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s18q2", prompt: "", imageUrl: "/__l5e/assets-v1/726a7f51-b80e-46d7-bb5a-269a387d76a1/s18q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s18q3", prompt: "", imageUrl: "/__l5e/assets-v1/1dd2b26d-f7c6-4ad3-a7d3-9474b73ec6a5/s18q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s18q4", prompt: "", imageUrl: "/__l5e/assets-v1/2282fc51-a08d-411a-965b-301c7edb516c/s18q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s18q5", prompt: "", imageUrl: "/__l5e/assets-v1/3eace415-d8a7-40fa-baa3-4ffc21580554/s18q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s18q6", prompt: "", imageUrl: "/__l5e/assets-v1/0c3f1119-2ca9-4f6f-9503-13a0877d4133/s18q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s18q7", prompt: "", imageUrl: "/__l5e/assets-v1/b76b0e83-ffc7-4712-b569-244169692e5c/s18q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s18q8", prompt: "", imageUrl: "/__l5e/assets-v1/038bf0ea-e10b-4564-84eb-d2dffefdc8a0/s18q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s18q9", prompt: "", imageUrl: "/__l5e/assets-v1/3bc6d8f1-14a7-404d-b576-66f0ffadf433/s18q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s18q10", prompt: "", imageUrl: "/__l5e/assets-v1/2a6cf342-4f5b-44ce-a0f9-fff05660c89b/s18q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s18q11", prompt: "", imageUrl: "/__l5e/assets-v1/f5869f1e-5c5f-4d4b-853e-339ee2e8e247/s18q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  19: [
    { id: "s19q1", prompt: "", imageUrl: "/__l5e/assets-v1/1e99a4b5-b22e-4b0c-8ad4-df2928bb6145/s19q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s19q2", prompt: "", imageUrl: "/__l5e/assets-v1/ecafd0b8-d101-464c-b55c-a82a9d3e9dd5/s19q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s19q3", prompt: "", imageUrl: "/__l5e/assets-v1/3852e17d-c3b1-498c-ab22-b7332981a6c7/s19q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s19q4", prompt: "", imageUrl: "/__l5e/assets-v1/05b280d0-9b98-4de1-b12b-5a6d5fa26482/s19q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s19q5", prompt: "", imageUrl: "/__l5e/assets-v1/9f1d1a2e-5f0e-43b0-8a54-250dd14e16a9/s19q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s19q6", prompt: "", imageUrl: "/__l5e/assets-v1/528e3c0d-1aa0-460a-b383-932d79c626e1/s19q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s19q7", prompt: "", imageUrl: "/__l5e/assets-v1/5fbee8c6-2420-42ff-acf5-fb4114075b63/s19q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s19q8", prompt: "", imageUrl: "/__l5e/assets-v1/2ea75c0f-58c3-4905-8acb-c859e0957813/s19q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s19q9", prompt: "", imageUrl: "/__l5e/assets-v1/7809fe87-ce37-41a3-9f0c-28639c0c47a0/s19q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s19q10", prompt: "", imageUrl: "/__l5e/assets-v1/9045476d-b177-4267-8bae-521ca3886b7b/s19q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s19q11", prompt: "", imageUrl: "/__l5e/assets-v1/bd58cf97-54a9-415c-95b0-78143ebdda0b/s19q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  20: [
    { id: "s20q1", prompt: "", imageUrl: "/__l5e/assets-v1/4328b9d4-fac3-4ee5-8616-a248717dd7f1/s20q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s20q2", prompt: "", imageUrl: "/__l5e/assets-v1/7ac78512-7ba2-4e79-a2ce-b0805870da66/s20q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s20q3", prompt: "", imageUrl: "/__l5e/assets-v1/1ad78e23-2fec-4c07-8488-e575dd140020/s20q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s20q4", prompt: "", imageUrl: "/__l5e/assets-v1/b7752841-219b-40ae-842c-47c795926070/s20q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s20q5", prompt: "", imageUrl: "/__l5e/assets-v1/1a9acdd4-4016-49e7-83ed-bc894c0e05e1/s20q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s20q6", prompt: "", imageUrl: "/__l5e/assets-v1/db923a80-357e-4875-ac08-e77fe77b8912/s20q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s20q7", prompt: "", imageUrl: "/__l5e/assets-v1/1e76822d-850d-4908-91ba-10a37f3e1643/s20q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s20q8", prompt: "", imageUrl: "/__l5e/assets-v1/6d65ddf2-8b61-40ef-aaa4-9a453615e4bf/s20q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s20q9", prompt: "", imageUrl: "/__l5e/assets-v1/16d92b1c-1211-4cf8-bda5-b3c8f51017a1/s20q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s20q10", prompt: "", imageUrl: "/__l5e/assets-v1/17fadbf7-7551-454c-bfe5-c9db3ce25bef/s20q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s20q11", prompt: "", imageUrl: "/__l5e/assets-v1/988d2f46-5192-40c5-b5d5-037bd4890085/s20q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  21: [
    { id: "s21q1", prompt: "", imageUrl: "/__l5e/assets-v1/372eedb6-2da2-4727-895d-0f722fd6ec6f/s21q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s21q2", prompt: "", imageUrl: "/__l5e/assets-v1/f3b72d11-9dbf-452f-b8ae-93d16a43c287/s21q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s21q3", prompt: "", imageUrl: "/__l5e/assets-v1/4fb2f91b-9be2-4231-891a-8c9721005f3a/s21q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s21q4", prompt: "", imageUrl: "/__l5e/assets-v1/b4e6d75f-9d8c-453b-b900-db46f0943cd9/s21q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s21q5", prompt: "", imageUrl: "/__l5e/assets-v1/313b6a24-4a7b-4ee1-833e-63078823c969/s21q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s21q6", prompt: "", imageUrl: "/__l5e/assets-v1/8ff0649f-70df-453f-92d1-bbb71aaa73a2/s21q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s21q7", prompt: "", imageUrl: "/__l5e/assets-v1/ba4562ef-89ba-44dc-af17-a7ee001d7088/s21q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s21q8", prompt: "", imageUrl: "/__l5e/assets-v1/2f4d7249-6b31-462c-ab6d-84d1bdf49d0e/s21q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s21q9", prompt: "", imageUrl: "/__l5e/assets-v1/6c564cf2-2de4-4391-a347-de21c5cfd0b5/s21q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s21q10", prompt: "", imageUrl: "/__l5e/assets-v1/19704a88-ea11-415b-969d-5d863ad8e500/s21q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s21q11", prompt: "", imageUrl: "/__l5e/assets-v1/88286891-27b9-458b-a5da-e3d5743b265c/s21q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  22: [
    { id: "s22q1", prompt: "", imageUrl: "/__l5e/assets-v1/6a8045d0-5448-4b8f-8f21-6a26c43b45c9/s22q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s22q2", prompt: "", imageUrl: "/__l5e/assets-v1/b6f3e644-552e-4132-ad2a-3720c5907536/s22q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s22q3", prompt: "", imageUrl: "/__l5e/assets-v1/b7d3c870-fefa-4a9f-b94d-a1e5c0a9e59a/s22q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s22q4", prompt: "", imageUrl: "/__l5e/assets-v1/0f99bfc0-708c-4d34-9516-c6fa7886de0e/s22q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s22q5", prompt: "", imageUrl: "/__l5e/assets-v1/53121462-5f34-4396-a633-c8da6d68f885/s22q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s22q6", prompt: "", imageUrl: "/__l5e/assets-v1/af096e37-1ffe-444f-a32f-aee43b17a7f2/s22q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s22q7", prompt: "", imageUrl: "/__l5e/assets-v1/6694b830-9b7d-4ea1-a853-1f62ce2dd262/s22q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s22q8", prompt: "", imageUrl: "/__l5e/assets-v1/5bad1aa3-4008-4d22-9c33-0e29af144d23/s22q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s22q9", prompt: "", imageUrl: "/__l5e/assets-v1/7bbe284f-af54-4484-9698-61f067557756/s22q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s22q10", prompt: "", imageUrl: "/__l5e/assets-v1/88204dce-6bcd-4488-ab7a-fafb54798de7/s22q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s22q11", prompt: "", imageUrl: "/__l5e/assets-v1/aef01144-84f1-4f7e-8937-6c37c85a391f/s22q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  23: [
    { id: "s23q1", prompt: "", imageUrl: "/__l5e/assets-v1/f5cf5bef-80b6-42e3-a7af-3d635870743b/s23q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s23q2", prompt: "", imageUrl: "/__l5e/assets-v1/65d5f52e-c255-478b-ae84-0650318bf74c/s23q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s23q3", prompt: "", imageUrl: "/__l5e/assets-v1/69703d6d-25ad-414f-a514-fbc454e1de61/s23q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s23q4", prompt: "", imageUrl: "/__l5e/assets-v1/24e5d52c-2a79-4f1f-95a1-1ee08d54eb52/s23q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s23q5", prompt: "", imageUrl: "/__l5e/assets-v1/1a1ba50d-6a4b-4227-b2d8-e34084e22c44/s23q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s23q6", prompt: "", imageUrl: "/__l5e/assets-v1/76d8d757-62f9-4a91-84bf-3d18611b417a/s23q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s23q7", prompt: "", imageUrl: "/__l5e/assets-v1/525f9907-a19d-4dd1-8e63-d20a2e4481a7/s23q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s23q8", prompt: "", imageUrl: "/__l5e/assets-v1/a3964ea7-b35b-4370-920a-2fbf7a99d23b/s23q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s23q9", prompt: "", imageUrl: "/__l5e/assets-v1/1c05b451-14f6-47b8-b317-c7b159a00f37/s23q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s23q10", prompt: "", imageUrl: "/__l5e/assets-v1/460cfc72-f8c6-4de3-a20f-7d60fab3f093/s23q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s23q11", prompt: "", imageUrl: "/__l5e/assets-v1/95a01285-9fdf-4610-ace6-bb8296f2f16d/s23q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  24: [
    { id: "s24q1", prompt: "", imageUrl: "/__l5e/assets-v1/4aa163ce-4542-42c4-a5b7-dee4a33caeec/s24q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s24q2", prompt: "", imageUrl: "/__l5e/assets-v1/bafe01d7-4cc8-485f-b7bf-50f33fdd8e0d/s24q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s24q3", prompt: "", imageUrl: "/__l5e/assets-v1/3790ddcb-9224-49c7-b8a4-962671b9946b/s24q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s24q4", prompt: "", imageUrl: "/__l5e/assets-v1/cf130d3a-e5f4-463f-9427-4fadff58d29f/s24q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s24q5", prompt: "", imageUrl: "/__l5e/assets-v1/2e3072a9-ec24-491d-9380-854247448534/s24q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s24q6", prompt: "", imageUrl: "/__l5e/assets-v1/b9107098-46f5-41b6-8f43-9d08459ff30d/s24q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s24q7", prompt: "", imageUrl: "/__l5e/assets-v1/dd905bd8-c868-4d76-81de-c9698f8bf48c/s24q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s24q8", prompt: "", imageUrl: "/__l5e/assets-v1/67c6ddeb-1fe9-496f-8d8d-d02b8084ee5b/s24q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s24q9", prompt: "", imageUrl: "/__l5e/assets-v1/81f1e5e0-280b-4820-9d39-e0e0f95ce82c/s24q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s24q10", prompt: "", imageUrl: "/__l5e/assets-v1/27b8743d-374e-4a6a-851e-243c86815297/s24q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s24q11", prompt: "", imageUrl: "/__l5e/assets-v1/d81d5758-f614-4cbb-a253-040b2d580dd0/s24q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  25: [
    { id: "s25q1", prompt: "", imageUrl: "/__l5e/assets-v1/2d6e66b6-45d2-445d-91c5-c0a8031b38c1/s25q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s25q2", prompt: "", imageUrl: "/__l5e/assets-v1/da68f581-7186-40e0-a7a5-23b619e6ea85/s25q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s25q3", prompt: "", imageUrl: "/__l5e/assets-v1/cd601bad-0f43-4a5b-873e-fe95ab258b0c/s25q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s25q4", prompt: "", imageUrl: "/__l5e/assets-v1/a0a7257d-87c0-42e8-bdaa-a252dae99bf8/s25q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s25q5", prompt: "", imageUrl: "/__l5e/assets-v1/fd0060c7-22cc-41f9-8605-61b47df49c70/s25q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s25q6", prompt: "", imageUrl: "/__l5e/assets-v1/67e89314-33ff-4eb2-b486-79f5fc4b333c/s25q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s25q7", prompt: "", imageUrl: "/__l5e/assets-v1/8b9e805c-f579-4db7-a064-cce524c389fd/s25q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s25q8", prompt: "", imageUrl: "/__l5e/assets-v1/60b72b8f-90cd-4737-a463-4e3f9ff9679c/s25q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s25q9", prompt: "", imageUrl: "/__l5e/assets-v1/5f06d70c-2514-46ba-8332-6f5efd4a8b58/s25q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s25q10", prompt: "", imageUrl: "/__l5e/assets-v1/f54fc66b-9973-4c1a-a82a-3224c32d24c0/s25q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s25q11", prompt: "", imageUrl: "/__l5e/assets-v1/1a8630f3-0fb0-45d4-8ebb-a5f15e21badc/s25q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  26: [
    { id: "s26q1", prompt: "", imageUrl: "/__l5e/assets-v1/46caf7a6-9b56-4354-aad6-dbdc1055ee68/s26q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s26q2", prompt: "", imageUrl: "/__l5e/assets-v1/640eefae-cefd-4f42-940f-5a8ee9c54571/s26q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s26q3", prompt: "", imageUrl: "/__l5e/assets-v1/066f005f-faad-4d63-b970-dd20df1bc098/s26q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s26q4", prompt: "", imageUrl: "/__l5e/assets-v1/cd045653-dccf-4446-b008-7bd8685634c4/s26q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s26q5", prompt: "", imageUrl: "/__l5e/assets-v1/4336fdbd-dd14-4747-8917-3de83833893a/s26q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s26q6", prompt: "", imageUrl: "/__l5e/assets-v1/e1878f18-87ac-4765-9dcb-57b6659e9980/s26q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s26q7", prompt: "", imageUrl: "/__l5e/assets-v1/2248c1a7-516a-41be-81ec-2c1178b6c14b/s26q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s26q8", prompt: "", imageUrl: "/__l5e/assets-v1/949477fa-6ea0-46ed-adbd-342f59a0fb90/s26q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s26q9", prompt: "", imageUrl: "/__l5e/assets-v1/fe842ca0-26b3-43ec-85da-0d20476a22cf/s26q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s26q10", prompt: "", imageUrl: "/__l5e/assets-v1/8d9ae985-977e-458c-8053-583c73e52980/s26q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s26q11", prompt: "", imageUrl: "/__l5e/assets-v1/c629ba1b-8c23-4caa-ab71-3b686f6648d2/s26q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
  ],
  27: [
    { id: "s27q1", prompt: "", imageUrl: "/__l5e/assets-v1/4076971f-537d-4adb-a5f9-c88a9cd0feba/s27q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s27q2", prompt: "", imageUrl: "/__l5e/assets-v1/2d65549f-c040-4714-9b91-fe55061fddd4/s27q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s27q3", prompt: "", imageUrl: "/__l5e/assets-v1/acd6cb42-fa1a-4b92-90a1-98f42b627bcd/s27q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s27q4", prompt: "", imageUrl: "/__l5e/assets-v1/615cb772-87a6-4b1c-9687-5346d50134db/s27q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s27q5", prompt: "", imageUrl: "/__l5e/assets-v1/848a577d-0f71-4be6-b031-12a16b90358b/s27q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s27q6", prompt: "", imageUrl: "/__l5e/assets-v1/7f3ea720-2c1a-484c-bb1e-3d233ae96c2e/s27q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s27q7", prompt: "", imageUrl: "/__l5e/assets-v1/e59641de-63c2-4898-910b-c3ed5ba67d9f/s27q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s27q8", prompt: "", imageUrl: "/__l5e/assets-v1/4b43d167-98f2-4a0f-9afc-83cb2a96eab5/s27q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s27q9", prompt: "", imageUrl: "/__l5e/assets-v1/91c9bd9e-00ca-4a8d-aa30-8d8cad132a05/s27q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s27q10", prompt: "", imageUrl: "/__l5e/assets-v1/ed7dfc1c-9b90-4d1c-b671-a6b441b8a2f6/s27q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s27q11", prompt: "", imageUrl: "/__l5e/assets-v1/84ecf005-f162-46f5-84ae-544d308196ce/s27q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  28: [
    { id: "s28q1", prompt: "", imageUrl: "/__l5e/assets-v1/91d90982-4f63-4084-963c-d308e264ab88/s28q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s28q2", prompt: "", imageUrl: "/__l5e/assets-v1/5c35f0a9-f072-44a3-8714-86935aab508b/s28q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s28q3", prompt: "", imageUrl: "/__l5e/assets-v1/7a2b243f-4736-4e48-adad-179f8b8ce7bb/s28q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s28q4", prompt: "", imageUrl: "/__l5e/assets-v1/d365f9ae-fd24-40db-a9b7-ac47fbc417fc/s28q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s28q5", prompt: "", imageUrl: "/__l5e/assets-v1/ec44925e-35f3-4fcb-a9dc-1d6b3d3c8980/s28q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s28q6", prompt: "", imageUrl: "/__l5e/assets-v1/5897414a-fd8e-47d1-b9b7-b6af80106c5a/s28q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s28q7", prompt: "", imageUrl: "/__l5e/assets-v1/2341fc72-4edb-4915-8dde-c86e3a518d24/s28q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s28q8", prompt: "", imageUrl: "/__l5e/assets-v1/0b725bf5-7859-4ad2-b2c1-db210204db02/s28q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s28q9", prompt: "", imageUrl: "/__l5e/assets-v1/8a289ff6-f616-4ed3-8387-70ae9538ec92/s28q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s28q10", prompt: "", imageUrl: "/__l5e/assets-v1/f36a3ae0-6696-40bc-a379-e98e85a424aa/s28q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s28q11", prompt: "", imageUrl: "/__l5e/assets-v1/f55bb678-e47d-4aa7-a287-af6f2d084afd/s28q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  29: [
    { id: "s29q1", prompt: "", imageUrl: "/__l5e/assets-v1/c09b953c-8f37-4392-9613-a6442c041c57/s29q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s29q2", prompt: "", imageUrl: "/__l5e/assets-v1/148c8697-139a-439b-8027-9208b8bed119/s29q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s29q3", prompt: "", imageUrl: "/__l5e/assets-v1/e5fe1a99-6796-438c-8aad-906c407f4ac2/s29q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s29q4", prompt: "", imageUrl: "/__l5e/assets-v1/d3aea144-b96e-4cc3-81df-0ef9fdd60212/s29q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s29q5", prompt: "", imageUrl: "/__l5e/assets-v1/120f81d7-ec1f-49ca-b5b0-5f6f70a42632/s29q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s29q6", prompt: "", imageUrl: "/__l5e/assets-v1/c3747033-2fd7-4b4c-9d21-14d3ccdbe0b0/s29q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s29q7", prompt: "", imageUrl: "/__l5e/assets-v1/dfdb946b-4af4-418c-839f-110d27664b67/s29q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s29q8", prompt: "", imageUrl: "/__l5e/assets-v1/597d8190-8e69-4d51-bd1d-1d47d1b8b5a7/s29q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s29q9", prompt: "", imageUrl: "/__l5e/assets-v1/0714d287-a15d-4271-bac0-8771ac99f172/s29q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s29q10", prompt: "", imageUrl: "/__l5e/assets-v1/f96801f1-49b2-495b-9dde-9c3f4a4d3932/s29q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s29q11", prompt: "", imageUrl: "/__l5e/assets-v1/1552f2c1-24f0-4957-914b-20c0159a7e46/s29q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  30: [
    { id: "s30q1", prompt: "", imageUrl: "/__l5e/assets-v1/b5286d6f-1307-4ce0-8dec-a101559cde40/s30q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s30q2", prompt: "", imageUrl: "/__l5e/assets-v1/fca21768-30f6-4ad2-ac7b-484a9c5237af/s30q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s30q3", prompt: "", imageUrl: "/__l5e/assets-v1/027dd3a5-9d69-4912-b0a1-243ed7713713/s30q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s30q4", prompt: "", imageUrl: "/__l5e/assets-v1/4d9bc634-0e8d-46f6-9a05-98a6f62b54d4/s30q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s30q5", prompt: "", imageUrl: "/__l5e/assets-v1/6922616a-1228-426d-be8d-d35cd6737d3f/s30q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s30q6", prompt: "", imageUrl: "/__l5e/assets-v1/cb487a11-8fdb-4cfb-abf1-2f963cb774d3/s30q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s30q7", prompt: "", imageUrl: "/__l5e/assets-v1/755a6307-f061-457f-8fd0-296070cd56ce/s30q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s30q8", prompt: "", imageUrl: "/__l5e/assets-v1/c6a66397-9ef5-45a0-bf7e-47fda6e82f8f/s30q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s30q9", prompt: "", imageUrl: "/__l5e/assets-v1/8e2e247b-084a-4803-9e76-f2be56203ecf/s30q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s30q10", prompt: "", imageUrl: "/__l5e/assets-v1/f4025fe3-36a6-4023-8f90-440e891a80be/s30q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s30q11", prompt: "", imageUrl: "/__l5e/assets-v1/cf5c35e1-6f55-427e-979f-d1711de0b81c/s30q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  31: [
    { id: "s31q1", prompt: "", imageUrl: "/__l5e/assets-v1/f461ee2d-92c8-450c-92e2-2dda4596c1bb/s31q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s31q2", prompt: "", imageUrl: "/__l5e/assets-v1/4eaf60f1-b9e1-429e-b9a4-6534e27e7aa5/s31q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s31q3", prompt: "", imageUrl: "/__l5e/assets-v1/26b93c31-4ab8-4f5a-bb2d-3a6156a922cd/s31q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s31q4", prompt: "", imageUrl: "/__l5e/assets-v1/38105ab7-09fa-4827-a6ac-63b689e129ec/s31q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s31q5", prompt: "", imageUrl: "/__l5e/assets-v1/8686c9a3-604c-431d-aca1-e0dccb516ad6/s31q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s31q6", prompt: "", imageUrl: "/__l5e/assets-v1/36b546d4-431d-4243-9b81-267603853217/s31q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s31q7", prompt: "", imageUrl: "/__l5e/assets-v1/caf45e4b-9972-49ad-aa18-7f3bc402fcbc/s31q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s31q8", prompt: "", imageUrl: "/__l5e/assets-v1/2edf3f48-4799-48d5-8c7c-baae7c55e9a4/s31q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s31q9", prompt: "", imageUrl: "/__l5e/assets-v1/fc0c0c28-199a-456e-afc6-7deb4dfd7b9d/s31q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s31q10", prompt: "", imageUrl: "/__l5e/assets-v1/da4efd85-f636-470f-912c-1b57f492af93/s31q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s31q11", prompt: "", imageUrl: "/__l5e/assets-v1/cf38213f-04d8-4fa6-b396-4b0826dd5e87/s31q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  32: [
    { id: "s32q1", prompt: "", imageUrl: "/__l5e/assets-v1/22acf54e-e71f-429f-9ac3-7c190513a7cf/s32q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s32q2", prompt: "", imageUrl: "/__l5e/assets-v1/e06705b9-544c-4164-b4cf-2b0468648d6d/s32q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s32q3", prompt: "", imageUrl: "/__l5e/assets-v1/563bbd1c-7841-4e79-9be0-481a00c3ce85/s32q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s32q4", prompt: "", imageUrl: "/__l5e/assets-v1/6dca1f39-6b7d-48d2-aa37-6308914c6990/s32q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s32q5", prompt: "", imageUrl: "/__l5e/assets-v1/9f913f4d-e3ba-4eac-8862-477d74493cf9/s32q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s32q6", prompt: "", imageUrl: "/__l5e/assets-v1/b75d3fb8-b944-474d-bad0-2b56eb439520/s32q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s32q7", prompt: "", imageUrl: "/__l5e/assets-v1/2f409c8c-b707-43d7-af3d-c446bc1d58fd/s32q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s32q8", prompt: "", imageUrl: "/__l5e/assets-v1/be4f6585-7839-44b6-b925-b1007a563b84/s32q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s32q9", prompt: "", imageUrl: "/__l5e/assets-v1/d4a7f35e-ed01-4b51-8906-f65caf8b7cca/s32q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s32q10", prompt: "", imageUrl: "/__l5e/assets-v1/5b14d736-31b6-4277-ba23-f681abaf8c20/s32q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s32q11", prompt: "", imageUrl: "/__l5e/assets-v1/a7e2b178-6782-43dc-bf11-6fd297ab7b11/s32q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  33: [
    { id: "s33q1", prompt: "", imageUrl: "/__l5e/assets-v1/98377d66-7333-487e-891e-28214189a7dd/s33q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s33q2", prompt: "", imageUrl: "/__l5e/assets-v1/c99f5896-e8ac-4ffb-8879-14e54ec994d2/s33q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s33q3", prompt: "", imageUrl: "/__l5e/assets-v1/b53ea80a-42ee-4717-8baa-510c4149f781/s33q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s33q4", prompt: "", imageUrl: "/__l5e/assets-v1/02c9aee1-d05e-450c-8403-470b6ef02980/s33q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s33q5", prompt: "", imageUrl: "/__l5e/assets-v1/35e0ef3a-8c48-4515-9086-71c2b04f0856/s33q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s33q6", prompt: "", imageUrl: "/__l5e/assets-v1/e3ffd6a5-727a-452b-9d4e-b82a8c3bfeee/s33q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s33q7", prompt: "", imageUrl: "/__l5e/assets-v1/5c3480eb-e66e-4144-aa10-fd4785921908/s33q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s33q8", prompt: "", imageUrl: "/__l5e/assets-v1/fca24f3b-3c39-425d-9360-64f694a7668a/s33q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s33q9", prompt: "", imageUrl: "/__l5e/assets-v1/e86faab6-46d6-4620-a123-b10d5d5d7d53/s33q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s33q10", prompt: "", imageUrl: "/__l5e/assets-v1/848a423c-58f2-485f-8b29-e2388b72b1cb/s33q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s33q11", prompt: "", imageUrl: "/__l5e/assets-v1/688b3a9e-932b-4d75-ab4f-367133036608/s33q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  34: [
    { id: "s34q1", prompt: "", imageUrl: "/__l5e/assets-v1/4c6338bd-e1ed-47d0-9d04-50b5b8899248/s34q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s34q2", prompt: "", imageUrl: "/__l5e/assets-v1/699bf963-050a-41f9-b0e3-bb0e0709bfa4/s34q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s34q3", prompt: "", imageUrl: "/__l5e/assets-v1/7a8ce7af-472e-4f79-879f-8c89aa2de880/s34q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s34q4", prompt: "", imageUrl: "/__l5e/assets-v1/26859fde-9a89-4e83-94e8-9cb9b8408af9/s34q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s34q5", prompt: "", imageUrl: "/__l5e/assets-v1/e2841cd5-803a-4af5-aa4b-b1abf07d6de5/s34q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s34q6", prompt: "", imageUrl: "/__l5e/assets-v1/3b14adf2-11ae-44a1-88c8-97b909f29980/s34q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s34q7", prompt: "", imageUrl: "/__l5e/assets-v1/0230ec2d-db82-4ab2-abcb-dff73c986348/s34q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s34q8", prompt: "", imageUrl: "/__l5e/assets-v1/886c6a94-b32d-4e85-8691-bda481737b03/s34q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s34q9", prompt: "", imageUrl: "/__l5e/assets-v1/2864da7a-a51e-4577-9a79-066d28c87c8a/s34q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s34q10", prompt: "", imageUrl: "/__l5e/assets-v1/010c8937-0f00-44fd-8c6d-6c19e23af9b3/s34q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s34q11", prompt: "", imageUrl: "/__l5e/assets-v1/32744e96-698f-49fa-a481-a78898c6bdee/s34q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
  ],
  35: [
    { id: "s35q1", prompt: "", imageUrl: "/__l5e/assets-v1/4dfc0864-ec67-4d78-8dd1-4502e7f1bac2/s35q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s35q2", prompt: "", imageUrl: "/__l5e/assets-v1/ab930bc0-5a08-4c22-80c0-fd9b0d7d4577/s35q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s35q3", prompt: "", imageUrl: "/__l5e/assets-v1/e0d7309e-25bf-4296-a73a-9183d6d458fd/s35q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s35q4", prompt: "", imageUrl: "/__l5e/assets-v1/0697350d-d1a0-4bd9-a5db-76c1668bc55a/s35q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s35q5", prompt: "", imageUrl: "/__l5e/assets-v1/f68e7948-462d-4de8-9190-5bbc44bf4165/s35q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s35q6", prompt: "", imageUrl: "/__l5e/assets-v1/b5c3bb03-e959-435c-8dc8-30dda633cf2a/s35q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s35q7", prompt: "", imageUrl: "/__l5e/assets-v1/35b58ba9-e262-4976-8032-8e1aba31d198/s35q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s35q8", prompt: "", imageUrl: "/__l5e/assets-v1/019945c3-5ca8-4eea-b9af-e6b95f1bf65c/s35q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s35q9", prompt: "", imageUrl: "/__l5e/assets-v1/3410ad12-85eb-4f6f-b2d2-502612f9d078/s35q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s35q10", prompt: "", imageUrl: "/__l5e/assets-v1/a126ca20-9126-4e36-8fa3-1a6d42d95b93/s35q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s35q11", prompt: "", imageUrl: "/__l5e/assets-v1/c373c462-e04f-4c09-a650-baadcd6c5108/s35q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  36: [
    { id: "s36q1", prompt: "", imageUrl: "/__l5e/assets-v1/821b2c4d-30f3-4425-9c39-2c4b78b0dec3/s36q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s36q2", prompt: "", imageUrl: "/__l5e/assets-v1/46042da8-b404-475b-b0c0-af162e373b84/s36q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s36q3", prompt: "", imageUrl: "/__l5e/assets-v1/6b946404-7f61-4f13-ab99-3366b6c87119/s36q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s36q4", prompt: "", imageUrl: "/__l5e/assets-v1/fb1a5dfb-0dea-427d-8d4b-4bdba9531741/s36q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s36q5", prompt: "", imageUrl: "/__l5e/assets-v1/d21709e8-f563-4a24-9dbc-c0c28e6c29d3/s36q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s36q6", prompt: "", imageUrl: "/__l5e/assets-v1/5a8917de-2b03-4743-a5df-b32ae7660b9b/s36q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s36q7", prompt: "", imageUrl: "/__l5e/assets-v1/a667395b-80db-4bf6-86b4-1970bef0b76f/s36q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s36q8", prompt: "", imageUrl: "/__l5e/assets-v1/760ad6e8-33cf-4c4c-9a06-07df510d4ff8/s36q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s36q9", prompt: "", imageUrl: "/__l5e/assets-v1/dff0210d-e764-42f2-8f5a-5089aae3d3b6/s36q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s36q10", prompt: "", imageUrl: "/__l5e/assets-v1/f310206a-a6dd-494e-9683-a02e611f6d70/s36q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s36q11", prompt: "", imageUrl: "/__l5e/assets-v1/b61996aa-8907-48e7-acf5-3ad589ae4a86/s36q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  37: [
    { id: "s37q1", prompt: "", imageUrl: "/__l5e/assets-v1/b0fdc85d-a351-470f-86f0-48f36dfae6ab/s37q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s37q2", prompt: "", imageUrl: "/__l5e/assets-v1/5d2dc859-9767-4655-9d51-0764022334e1/s37q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s37q3", prompt: "", imageUrl: "/__l5e/assets-v1/cc6b33d5-50ee-43e6-a4ab-5ad427b0588d/s37q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s37q4", prompt: "", imageUrl: "/__l5e/assets-v1/5477723c-60cf-4910-96d9-30dae5bdea04/s37q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s37q5", prompt: "", imageUrl: "/__l5e/assets-v1/27b799ac-fca3-40ed-b13a-c28805debcb5/s37q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s37q6", prompt: "", imageUrl: "/__l5e/assets-v1/3adc46d0-4fb4-47f8-b3d2-d17e66ef277e/s37q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s37q7", prompt: "", imageUrl: "/__l5e/assets-v1/4b1e890c-8627-45d1-9ba4-d444e86d24cb/s37q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s37q8", prompt: "", imageUrl: "/__l5e/assets-v1/67b2702a-f51a-472b-8183-db974c2da2de/s37q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s37q9", prompt: "", imageUrl: "/__l5e/assets-v1/ef9607b9-5a6a-4906-aa8f-9d31681e6216/s37q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s37q10", prompt: "", imageUrl: "/__l5e/assets-v1/817fd7f1-b59a-49e0-99c4-858fb5081848/s37q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s37q11", prompt: "", imageUrl: "/__l5e/assets-v1/7c846884-223c-41e9-960b-93d6fadb0316/s37q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  38: [
    { id: "s38q1", prompt: "", imageUrl: "/__l5e/assets-v1/4b44a731-c913-43de-b962-ea07ffeef2e1/s38q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s38q2", prompt: "", imageUrl: "/__l5e/assets-v1/120d34b0-8919-4493-85ee-021d61f7661d/s38q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s38q3", prompt: "", imageUrl: "/__l5e/assets-v1/b3accc55-8193-451c-a68b-26f0d5bc8eb9/s38q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s38q4", prompt: "", imageUrl: "/__l5e/assets-v1/894bbd63-c7fd-4098-a38c-1746b3638207/s38q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s38q5", prompt: "", imageUrl: "/__l5e/assets-v1/543d3e04-12db-496e-94e7-1f9ca500d50a/s38q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s38q6", prompt: "", imageUrl: "/__l5e/assets-v1/ed458416-cc1b-41f5-a852-63c9d839b725/s38q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s38q7", prompt: "", imageUrl: "/__l5e/assets-v1/df2f94ff-6299-420e-8a03-8d1d111da6ea/s38q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s38q8", prompt: "", imageUrl: "/__l5e/assets-v1/366b9f45-99b8-4b37-8212-b38b527e166f/s38q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s38q9", prompt: "", imageUrl: "/__l5e/assets-v1/b1aa3e35-55cf-4b24-a274-5d2bec424787/s38q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s38q10", prompt: "", imageUrl: "/__l5e/assets-v1/dcc256f8-2e4f-43da-9be0-5f29ba07e3a2/s38q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s38q11", prompt: "", imageUrl: "/__l5e/assets-v1/7995e2e5-0cd2-4b46-9ac2-5943116fdbe4/s38q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
  ],
  39: [
    { id: "s39q1", prompt: "", imageUrl: "/__l5e/assets-v1/d0f914b7-2a41-45f0-95d2-7ba7891db200/s39q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s39q2", prompt: "", imageUrl: "/__l5e/assets-v1/1438b994-97c4-4be9-9170-5afb64c9e2a4/s39q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s39q3", prompt: "", imageUrl: "/__l5e/assets-v1/0ef972b5-4daa-4170-a77d-93d69ad97c06/s39q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s39q4", prompt: "", imageUrl: "/__l5e/assets-v1/9c10f73c-5e81-4642-a338-ae7106bf517e/s39q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s39q5", prompt: "", imageUrl: "/__l5e/assets-v1/e52bd081-f17b-43ac-b707-7000dbd5c2ae/s39q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s39q6", prompt: "", imageUrl: "/__l5e/assets-v1/9b33821a-681b-49a9-9262-458b31f8ded9/s39q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s39q7", prompt: "", imageUrl: "/__l5e/assets-v1/a8b973fd-61ef-4510-a64f-447dca8ddce3/s39q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s39q8", prompt: "", imageUrl: "/__l5e/assets-v1/c96f5688-4cae-4ae9-8b06-62bfab169dec/s39q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s39q9", prompt: "", imageUrl: "/__l5e/assets-v1/cd4a73bc-5702-43a4-a7ab-de5441f37201/s39q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s39q10", prompt: "", imageUrl: "/__l5e/assets-v1/4a52ab9b-0f69-445c-8b24-e75ba331de48/s39q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s39q11", prompt: "", imageUrl: "/__l5e/assets-v1/2b6e1aa7-593a-4cfa-8ed4-d726a3a7062d/s39q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
  ],
  40: [
    { id: "s40q1", prompt: "", imageUrl: "/__l5e/assets-v1/df93b9b7-b8b2-4fde-b3e7-64bb43f5bf7d/s40q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s40q2", prompt: "", imageUrl: "/__l5e/assets-v1/f99717ff-f9e0-4d50-a5a7-7b9419a89f3f/s40q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s40q3", prompt: "", imageUrl: "/__l5e/assets-v1/d64648ee-05ae-45d1-a3cb-c711ba63bbd4/s40q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s40q4", prompt: "", imageUrl: "/__l5e/assets-v1/4d62f9a4-ee33-45cb-a034-4ea322f680a6/s40q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s40q5", prompt: "", imageUrl: "/__l5e/assets-v1/36d57121-6cca-4f81-9da7-257cdeb92757/s40q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s40q6", prompt: "", imageUrl: "/__l5e/assets-v1/76e57308-53d5-4232-a01a-cdfaefda787f/s40q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s40q7", prompt: "", imageUrl: "/__l5e/assets-v1/4c1b8cab-020a-4e8b-b4f0-daa40eb38dc9/s40q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s40q8", prompt: "", imageUrl: "/__l5e/assets-v1/272e25f6-1115-45e3-97e7-06c2b5b62b4a/s40q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s40q9", prompt: "", imageUrl: "/__l5e/assets-v1/8a08e7fd-1735-45c1-a8ab-2d6ccb319609/s40q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s40q10", prompt: "", imageUrl: "/__l5e/assets-v1/bf6a798e-b41d-42b6-8b4a-b3f014873b8a/s40q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s40q11", prompt: "", imageUrl: "/__l5e/assets-v1/804a2d38-62f0-433a-b262-d82c8e55fd88/s40q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  41: [
    { id: "s41q1", prompt: "", imageUrl: "/__l5e/assets-v1/5689399b-a01b-4ceb-8aa2-4b20c24d70f1/s41q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s41q2", prompt: "", imageUrl: "/__l5e/assets-v1/054009b6-3ead-46a9-9bdf-1eefbdffbe50/s41q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s41q3", prompt: "", imageUrl: "/__l5e/assets-v1/d581b8e6-debe-4776-8bfc-baf8e0d9f73c/s41q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s41q4", prompt: "", imageUrl: "/__l5e/assets-v1/34cbe796-cd45-4c29-82e5-f7afaaf0e349/s41q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s41q5", prompt: "", imageUrl: "/__l5e/assets-v1/f87cb5f3-d04c-426b-b741-aa7c8c9d5278/s41q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s41q6", prompt: "", imageUrl: "/__l5e/assets-v1/85dc635c-6f66-4cbb-aea7-4240b51633a1/s41q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s41q7", prompt: "", imageUrl: "/__l5e/assets-v1/1b7cd089-a945-48ef-af66-2000f0bb8366/s41q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s41q8", prompt: "", imageUrl: "/__l5e/assets-v1/5c801325-d571-4cdb-8dbe-203bc9cd05f9/s41q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s41q9", prompt: "", imageUrl: "/__l5e/assets-v1/b9e28743-8941-4975-a79e-ef7804cbba0b/s41q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s41q10", prompt: "", imageUrl: "/__l5e/assets-v1/0a152428-3384-40e6-ab7f-a39485950690/s41q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s41q11", prompt: "", imageUrl: "/__l5e/assets-v1/5fc5de2e-f839-4523-b12f-dbf977f676b2/s41q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  42: [
    { id: "s42q1", prompt: "", imageUrl: "/__l5e/assets-v1/ea394f0b-9cc0-4366-87d6-0dab03f3df1e/s42q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s42q2", prompt: "", imageUrl: "/__l5e/assets-v1/ba1dbb8f-a95b-4264-8ce6-2a842d53a7b5/s42q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s42q3", prompt: "", imageUrl: "/__l5e/assets-v1/0e4b9e49-bd85-4b0b-80a5-768780822990/s42q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s42q4", prompt: "", imageUrl: "/__l5e/assets-v1/e32ca42c-64c8-4a7d-9b17-28dcffb878b8/s42q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s42q5", prompt: "", imageUrl: "/__l5e/assets-v1/baa50479-7c12-473a-b89e-7b2d5b5779ea/s42q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s42q6", prompt: "", imageUrl: "/__l5e/assets-v1/f59d647f-a087-4817-b13c-41814ec98903/s42q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s42q7", prompt: "", imageUrl: "/__l5e/assets-v1/7634ae1b-3ad7-42ae-8563-84aa603e5300/s42q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s42q8", prompt: "", imageUrl: "/__l5e/assets-v1/0bacbb68-837c-4ba8-84bc-f4685e210d2c/s42q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s42q9", prompt: "", imageUrl: "/__l5e/assets-v1/428422c5-541c-4c58-b904-1e3aba0813a9/s42q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s42q10", prompt: "", imageUrl: "/__l5e/assets-v1/c7e077cf-cb15-40b1-ab39-87431464225f/s42q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s42q11", prompt: "", imageUrl: "/__l5e/assets-v1/8e1541d1-bc50-4b37-a106-7ea7316b477f/s42q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
  ],
  43: [
    { id: "s43q1", prompt: "", imageUrl: "/__l5e/assets-v1/fefe9dc9-32de-4acd-9fb9-85ce3bfc359d/s43q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s43q2", prompt: "", imageUrl: "/__l5e/assets-v1/acb62b2f-3681-4aff-b07d-d6580dfc2310/s43q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s43q3", prompt: "", imageUrl: "/__l5e/assets-v1/426f7407-cb4a-4bc0-bbc9-46ec46ef4e93/s43q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s43q4", prompt: "", imageUrl: "/__l5e/assets-v1/6ff098bd-0b6c-455a-ae34-a74a0ec12338/s43q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s43q5", prompt: "", imageUrl: "/__l5e/assets-v1/c59270e2-32b0-407b-9fb1-ec75c8e7ee2c/s43q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s43q6", prompt: "", imageUrl: "/__l5e/assets-v1/30e99fc6-bb99-4e42-8fdf-a63755dd158f/s43q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s43q7", prompt: "", imageUrl: "/__l5e/assets-v1/19cf6b4e-7b3a-4b12-aa3d-aee07b70a15a/s43q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s43q8", prompt: "", imageUrl: "/__l5e/assets-v1/354fce1e-cb5f-4593-b858-6e029fd7560e/s43q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s43q9", prompt: "", imageUrl: "/__l5e/assets-v1/0c25a9fc-7044-4e88-ad2d-57f291ecc595/s43q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s43q10", prompt: "", imageUrl: "/__l5e/assets-v1/331a6d34-8c27-4ebd-a283-99ea89c71976/s43q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s43q11", prompt: "", imageUrl: "/__l5e/assets-v1/0164f804-ab1d-4041-8d65-8bfe63191b92/s43q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  44: [
    { id: "s44q1", prompt: "", imageUrl: "/__l5e/assets-v1/7d75bfef-4cec-402b-9384-ddddf0064f85/s44q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s44q2", prompt: "", imageUrl: "/__l5e/assets-v1/88c86907-f68e-43da-bca5-432a29acbb1a/s44q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s44q3", prompt: "", imageUrl: "/__l5e/assets-v1/7abf6d70-57ee-4b72-93fb-9f386702c573/s44q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s44q4", prompt: "", imageUrl: "/__l5e/assets-v1/9ab0d1ae-c8eb-47cb-b04d-86940dd7a9c7/s44q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s44q5", prompt: "", imageUrl: "/__l5e/assets-v1/15d4b714-f2fc-44c8-977c-450aa33f7c00/s44q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s44q6", prompt: "", imageUrl: "/__l5e/assets-v1/8eacbbae-c3fd-4bd9-86a4-73effc556eac/s44q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s44q7", prompt: "", imageUrl: "/__l5e/assets-v1/e15299e6-d03a-4bd7-a550-6e7bc47d9b76/s44q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s44q8", prompt: "", imageUrl: "/__l5e/assets-v1/1718b689-2ebe-44e4-ae44-ea2ad2822ec3/s44q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s44q9", prompt: "", imageUrl: "/__l5e/assets-v1/c97ed39f-e755-4ea3-a99e-a31992194d3b/s44q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s44q10", prompt: "", imageUrl: "/__l5e/assets-v1/2d71b28a-18c1-44d4-a220-6cdc4db1c787/s44q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s44q11", prompt: "", imageUrl: "/__l5e/assets-v1/ce1becaa-c5af-448d-be09-d5a9bcdd092f/s44q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  45: [
    { id: "s45q1", prompt: "", imageUrl: "/__l5e/assets-v1/337d4ef1-66fe-4838-8b80-adc640efb8f4/s45q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s45q2", prompt: "", imageUrl: "/__l5e/assets-v1/c7c83033-3ec1-4e15-b0af-40d0eedf4a60/s45q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s45q3", prompt: "", imageUrl: "/__l5e/assets-v1/5d4a8b91-f8b3-4e53-b1dd-e7decd9c276a/s45q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s45q4", prompt: "", imageUrl: "/__l5e/assets-v1/a4ab7153-3914-4289-8358-64e14b11860b/s45q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s45q5", prompt: "", imageUrl: "/__l5e/assets-v1/251662e3-5927-4e85-8d2a-6b0cfaca6f35/s45q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s45q6", prompt: "", imageUrl: "/__l5e/assets-v1/41ec1f51-a151-4154-857a-1e0106a1f32a/s45q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s45q7", prompt: "", imageUrl: "/__l5e/assets-v1/218a0c5b-416d-4f72-818e-88a0769da1bc/s45q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s45q8", prompt: "", imageUrl: "/__l5e/assets-v1/ac80b8f6-fed9-49e8-a113-aa674968fcde/s45q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s45q9", prompt: "", imageUrl: "/__l5e/assets-v1/89f81d8f-e818-4298-a7a9-e124741262e7/s45q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s45q10", prompt: "", imageUrl: "/__l5e/assets-v1/1ed939a7-80ae-4882-ba13-6f949f5581d4/s45q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s45q11", prompt: "", imageUrl: "/__l5e/assets-v1/a3e6069b-d51c-49ac-910d-2c0a360176f4/s45q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
  ],
  46: [
    { id: "s46q1", prompt: "", imageUrl: "/__l5e/assets-v1/b9c32e72-6706-4313-a5d3-5f1aef76c05f/s46q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s46q2", prompt: "", imageUrl: "/__l5e/assets-v1/e6c7516c-e780-42c4-8657-e76016f2b4be/s46q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s46q3", prompt: "", imageUrl: "/__l5e/assets-v1/26f857d0-7537-46c4-8eb0-306d342da84e/s46q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s46q4", prompt: "", imageUrl: "/__l5e/assets-v1/60b94029-ecca-453f-bcec-97182dde76b9/s46q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s46q5", prompt: "", imageUrl: "/__l5e/assets-v1/d167f6bf-a18c-4ed9-9146-b6f692bf3f19/s46q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s46q6", prompt: "", imageUrl: "/__l5e/assets-v1/f0211614-1ef7-4f8a-b795-9faa3dc9398c/s46q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s46q7", prompt: "", imageUrl: "/__l5e/assets-v1/2d8e363d-8564-487e-b8bf-0cb487449101/s46q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s46q8", prompt: "", imageUrl: "/__l5e/assets-v1/5177dd70-b877-4474-9f56-b251759e193f/s46q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s46q9", prompt: "", imageUrl: "/__l5e/assets-v1/594d8c1b-da32-4924-9c5e-242663559a30/s46q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s46q10", prompt: "", imageUrl: "/__l5e/assets-v1/50da6661-3aa0-41b5-b40f-f9d0f8893789/s46q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s46q11", prompt: "", imageUrl: "/__l5e/assets-v1/5a2f5fa4-b1c3-4fc5-88b4-4b0e119e9075/s46q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  47: [
    { id: "s47q1", prompt: "", imageUrl: "/__l5e/assets-v1/c4aee734-51ef-4d4a-bb9b-4fad838902b0/s47q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s47q2", prompt: "", imageUrl: "/__l5e/assets-v1/9e412fc0-d737-4167-a56b-d6b234e4957f/s47q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s47q3", prompt: "", imageUrl: "/__l5e/assets-v1/f622496a-ae23-40b4-a50c-a13d9bf81339/s47q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s47q4", prompt: "", imageUrl: "/__l5e/assets-v1/c4399769-9126-4f86-b61e-234210048009/s47q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s47q5", prompt: "", imageUrl: "/__l5e/assets-v1/7ea54db6-bf4f-4574-9e8a-91a30d68c06b/s47q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s47q6", prompt: "", imageUrl: "/__l5e/assets-v1/4e333c84-4826-41aa-85b4-53e7b0191763/s47q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s47q7", prompt: "", imageUrl: "/__l5e/assets-v1/1b52dcf7-acde-4a93-9225-f1f556687174/s47q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s47q8", prompt: "", imageUrl: "/__l5e/assets-v1/758b3381-08e3-468d-b2d3-6238e9df3584/s47q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s47q9", prompt: "", imageUrl: "/__l5e/assets-v1/2ffbb7c2-8a21-4b70-96fb-90bf620768a3/s47q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s47q10", prompt: "", imageUrl: "/__l5e/assets-v1/44c725f1-9ee9-4165-87ab-e088cea91ffc/s47q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s47q11", prompt: "", imageUrl: "/__l5e/assets-v1/f6a736ca-6d26-4857-8f3a-71937ad10af8/s47q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  48: [
    { id: "s48q1", prompt: "", imageUrl: "/__l5e/assets-v1/4f1f3ed6-b361-492e-9bab-ec5a41ab4623/s48q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s48q2", prompt: "", imageUrl: "/__l5e/assets-v1/e370e75b-74fb-4c1d-afad-f2e1863a5fcc/s48q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s48q3", prompt: "", imageUrl: "/__l5e/assets-v1/77235a26-f529-4ac9-be39-d6a543fc548d/s48q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s48q4", prompt: "", imageUrl: "/__l5e/assets-v1/c8be09ea-c07e-4588-b141-9fb1f71696bb/s48q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s48q5", prompt: "", imageUrl: "/__l5e/assets-v1/cfa313eb-fe1c-4ad1-881a-21697faba6ef/s48q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s48q6", prompt: "", imageUrl: "/__l5e/assets-v1/24a72360-9ae0-4480-bcbf-76440fe28be7/s48q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s48q7", prompt: "", imageUrl: "/__l5e/assets-v1/99ec243d-18e1-4d3a-b450-5def3a7b5d42/s48q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s48q8", prompt: "", imageUrl: "/__l5e/assets-v1/5e4ddb4b-30cf-4748-b75a-4ae459c43064/s48q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s48q9", prompt: "", imageUrl: "/__l5e/assets-v1/74f82c00-5105-4578-8251-845fadbf5cfa/s48q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s48q10", prompt: "", imageUrl: "/__l5e/assets-v1/cd11b258-2591-4774-9731-7d0ae157b1a3/s48q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s48q11", prompt: "", imageUrl: "/__l5e/assets-v1/60e01a34-90a0-497d-b99c-9405ab66516a/s48q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  49: [
    { id: "s49q1", prompt: "", imageUrl: "/__l5e/assets-v1/79c48486-19cf-433c-ae94-f27fff26f835/s49q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s49q2", prompt: "", imageUrl: "/__l5e/assets-v1/ea83fe18-bc64-472c-97f8-e42453edc4b5/s49q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s49q3", prompt: "", imageUrl: "/__l5e/assets-v1/f78ec1df-0515-43d3-801a-7501f84ab247/s49q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s49q4", prompt: "", imageUrl: "/__l5e/assets-v1/f3284b53-d8f4-4cc4-83b4-8cbff0c8e6a2/s49q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s49q5", prompt: "", imageUrl: "/__l5e/assets-v1/82c766cd-d6d9-4631-a92e-a11e12bdf8e6/s49q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s49q6", prompt: "", imageUrl: "/__l5e/assets-v1/cb14621e-bd98-42f9-a73f-c8cae8de18f9/s49q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s49q7", prompt: "", imageUrl: "/__l5e/assets-v1/a71b8fdf-7bb4-4af6-83cc-4e2fc5e8a2f0/s49q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s49q8", prompt: "", imageUrl: "/__l5e/assets-v1/4f37bee3-1f4d-4f08-af68-b326f63845f1/s49q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s49q9", prompt: "", imageUrl: "/__l5e/assets-v1/2770e667-f13b-474d-a156-0bc99df28586/s49q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s49q10", prompt: "", imageUrl: "/__l5e/assets-v1/cb6c091a-a69d-408c-89a5-0f1565ca72d5/s49q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s49q11", prompt: "", imageUrl: "/__l5e/assets-v1/b9978090-9902-4cb8-bf36-544520ba9850/s49q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  50: [
    { id: "s50q1", prompt: "", imageUrl: "/__l5e/assets-v1/72ac585a-1f09-42d1-a8b0-37023d7aec03/s50q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s50q2", prompt: "", imageUrl: "/__l5e/assets-v1/aceefcc9-82af-4a3b-854b-dbcaa421b753/s50q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s50q3", prompt: "", imageUrl: "/__l5e/assets-v1/875dd53a-418b-4fde-ac50-d7519d627395/s50q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s50q4", prompt: "", imageUrl: "/__l5e/assets-v1/45b959ca-bd55-409a-92ae-59c9b83b6982/s50q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s50q5", prompt: "", imageUrl: "/__l5e/assets-v1/daf8668f-77ff-4152-bbee-f5155c0067e9/s50q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s50q6", prompt: "", imageUrl: "/__l5e/assets-v1/965ac5f8-66fa-4bb1-88bf-4fab9c53fdbd/s50q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s50q7", prompt: "", imageUrl: "/__l5e/assets-v1/991715b8-ea6e-44ee-8771-3b3a9c47b99e/s50q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s50q8", prompt: "", imageUrl: "/__l5e/assets-v1/f1258686-0e42-438a-9d1f-4aa2cc0aff4a/s50q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s50q9", prompt: "", imageUrl: "/__l5e/assets-v1/e5f15ac4-04a9-4582-8ba9-88418b1988d6/s50q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s50q10", prompt: "", imageUrl: "/__l5e/assets-v1/a513696a-6956-4c6d-87c8-6730fbefd254/s50q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s50q11", prompt: "", imageUrl: "/__l5e/assets-v1/a047aac4-7614-494f-8515-30eeb68fec2a/s50q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  51: [
    { id: "s51q1", prompt: "", imageUrl: "/__l5e/assets-v1/c1df981c-a70b-4c63-ab34-934e554b9631/s51q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s51q2", prompt: "", imageUrl: "/__l5e/assets-v1/9ad9eec4-ae0b-429e-91dd-ab9b70d0c244/s51q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s51q3", prompt: "", imageUrl: "/__l5e/assets-v1/8d3a0111-4d9f-45fe-9939-42d5c86b31c1/s51q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s51q4", prompt: "", imageUrl: "/__l5e/assets-v1/b1557eb0-bc55-4523-bfe1-9f15c8860b9c/s51q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s51q5", prompt: "", imageUrl: "/__l5e/assets-v1/b3ba8474-13b9-4ebb-8b2f-09681cb57def/s51q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s51q6", prompt: "", imageUrl: "/__l5e/assets-v1/5e9c4964-e3b8-4530-b8fe-d1e4ec735e51/s51q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s51q7", prompt: "", imageUrl: "/__l5e/assets-v1/db785159-d33a-4a68-b0f9-ab3ba5cc80f4/s51q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s51q8", prompt: "", imageUrl: "/__l5e/assets-v1/d38cc9d1-4e6e-4d1e-9851-f6a2533efaa9/s51q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s51q9", prompt: "", imageUrl: "/__l5e/assets-v1/fef6cda6-4ebd-406c-9aff-d1364ec3b824/s51q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s51q10", prompt: "", imageUrl: "/__l5e/assets-v1/a274c134-10ea-478f-8e9d-b09ce322641e/s51q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s51q11", prompt: "", imageUrl: "/__l5e/assets-v1/a8b5c84d-ddd4-4b87-b53a-aa1a84f3f75e/s51q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  52: [
    { id: "s52q1", prompt: "", imageUrl: "/__l5e/assets-v1/0f129422-9ccb-4df4-b803-90aa1f8e7d45/s52q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s52q2", prompt: "", imageUrl: "/__l5e/assets-v1/9219cec4-3158-4151-8977-b138b1cf6aae/s52q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s52q3", prompt: "", imageUrl: "/__l5e/assets-v1/8975f1cb-c892-406c-99de-0018bf9096b4/s52q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s52q4", prompt: "", imageUrl: "/__l5e/assets-v1/bc7eeb46-68e9-4897-8922-ffda7e8905ad/s52q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s52q5", prompt: "", imageUrl: "/__l5e/assets-v1/43dc1286-e7cc-4b2b-a769-11d67513db92/s52q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s52q6", prompt: "", imageUrl: "/__l5e/assets-v1/3669c823-2c44-4d99-aa24-3d649584f4eb/s52q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s52q7", prompt: "", imageUrl: "/__l5e/assets-v1/8d229f2c-c155-42f4-ae1a-8dfefadb94da/s52q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s52q8", prompt: "", imageUrl: "/__l5e/assets-v1/4f0a700d-0cb0-4f84-80a5-c8ecc3e530fc/s52q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s52q9", prompt: "", imageUrl: "/__l5e/assets-v1/45d9d7c8-e542-4a90-8f07-1d1173adecf0/s52q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s52q10", prompt: "", imageUrl: "/__l5e/assets-v1/4d201c90-9335-4ceb-8d07-a0c1519cb7e6/s52q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s52q11", prompt: "", imageUrl: "/__l5e/assets-v1/be48936b-7d1f-404e-a69d-5af8ca279799/s52q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  53: [
    { id: "s53q1", prompt: "", imageUrl: "/__l5e/assets-v1/6403e330-fe19-412f-9251-558d5ac911f1/s53q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s53q2", prompt: "", imageUrl: "/__l5e/assets-v1/87ad10a2-35d0-4933-823c-f5b861d4bc8a/s53q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s53q3", prompt: "", imageUrl: "/__l5e/assets-v1/b00c347e-fb54-4ee8-8bd6-6c67c5d5655c/s53q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s53q4", prompt: "", imageUrl: "/__l5e/assets-v1/ec70f6c1-21f9-4e3e-9331-757f90f959eb/s53q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s53q5", prompt: "", imageUrl: "/__l5e/assets-v1/da3c83c7-015e-4799-b18c-9b74fae28297/s53q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s53q6", prompt: "", imageUrl: "/__l5e/assets-v1/6b8c7360-ba45-4c7b-ac70-59686764f432/s53q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s53q7", prompt: "", imageUrl: "/__l5e/assets-v1/3363b3da-f90e-4bdf-8a27-24f6757fb04f/s53q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s53q8", prompt: "", imageUrl: "/__l5e/assets-v1/c40080a7-f480-418f-8302-c8198dd78a92/s53q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s53q9", prompt: "", imageUrl: "/__l5e/assets-v1/964b2dbc-902e-42d6-950a-05fb383c8821/s53q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s53q10", prompt: "", imageUrl: "/__l5e/assets-v1/442fd274-d2ae-4cbf-bd59-747066873aee/s53q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s53q11", prompt: "", imageUrl: "/__l5e/assets-v1/442b1ddf-cf90-45ee-a0b0-48a270dee41b/s53q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  54: [
    { id: "s54q1", prompt: "", imageUrl: "/__l5e/assets-v1/7ab4a0cc-6dda-46e3-a665-4e72078fe2d5/s54q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s54q2", prompt: "", imageUrl: "/__l5e/assets-v1/21590ccc-320b-444d-8507-677d7a4fd22d/s54q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s54q3", prompt: "", imageUrl: "/__l5e/assets-v1/ebd18126-837f-4e4b-9c56-3424fc45f3ff/s54q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s54q4", prompt: "", imageUrl: "/__l5e/assets-v1/2fc3a5ff-84f2-4fd7-916f-f6343d9779dd/s54q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s54q5", prompt: "", imageUrl: "/__l5e/assets-v1/b4ecc1ee-8105-4129-97f0-bf1fe11776b4/s54q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s54q6", prompt: "", imageUrl: "/__l5e/assets-v1/19db78f7-db17-48c1-bdae-525e7b408642/s54q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s54q7", prompt: "", imageUrl: "/__l5e/assets-v1/44b0c518-42f2-4248-89e7-532763f9eca4/s54q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s54q8", prompt: "", imageUrl: "/__l5e/assets-v1/ec748876-c8ee-48c4-97c3-0e999e20b60e/s54q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s54q9", prompt: "", imageUrl: "/__l5e/assets-v1/5dc1d67d-af3a-4deb-831e-a664d41d7dcd/s54q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s54q10", prompt: "", imageUrl: "/__l5e/assets-v1/9727eb5e-f787-4022-bc3c-d2556d8f4744/s54q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s54q11", prompt: "", imageUrl: "/__l5e/assets-v1/45c99b60-c167-4acc-afc9-fcaa21bfe83b/s54q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  55: [
    { id: "s55q1", prompt: "", imageUrl: "/__l5e/assets-v1/279ce43b-e9e5-475e-abdf-0b3b80a82b0c/s55q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s55q2", prompt: "", imageUrl: "/__l5e/assets-v1/c50a029c-b48d-4b0e-9640-051f72e64e6e/s55q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s55q3", prompt: "", imageUrl: "/__l5e/assets-v1/fb828d7a-f307-499f-85e0-3dae42f30c69/s55q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s55q4", prompt: "", imageUrl: "/__l5e/assets-v1/a8d64fd3-6af1-4ca3-8b3a-2b1e16b11997/s55q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s55q5", prompt: "", imageUrl: "/__l5e/assets-v1/d154f1a6-07f3-42ac-a705-3c45462d6da3/s55q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s55q6", prompt: "", imageUrl: "/__l5e/assets-v1/2563eee7-6f6f-4b79-9b93-5d7e5903d888/s55q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s55q7", prompt: "", imageUrl: "/__l5e/assets-v1/187bee47-9dcc-4c2c-97bc-880a6b1ff71f/s55q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s55q8", prompt: "", imageUrl: "/__l5e/assets-v1/f81868d9-9546-40ea-9a1b-504eb1f60006/s55q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s55q9", prompt: "", imageUrl: "/__l5e/assets-v1/00d8ac8c-db1d-4b3b-b633-ed9e5e006226/s55q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s55q10", prompt: "", imageUrl: "/__l5e/assets-v1/ead3ff15-302a-4791-a8b5-519546a1dd2e/s55q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s55q11", prompt: "", imageUrl: "/__l5e/assets-v1/364b4045-b703-4c7c-805b-24215b2866fe/s55q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  56: [
    { id: "s56q1", prompt: "", imageUrl: "/__l5e/assets-v1/b8c32ab8-cb4d-40cf-984a-f3d63d21a7f3/s56q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s56q2", prompt: "", imageUrl: "/__l5e/assets-v1/f4fca022-7865-4ca8-ac69-db9916b05ae7/s56q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s56q3", prompt: "", imageUrl: "/__l5e/assets-v1/1eca906b-bef6-49cc-a2c7-bbe2e1008ae3/s56q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s56q4", prompt: "", imageUrl: "/__l5e/assets-v1/3de6ea35-0e76-4180-b2fd-09926f68a6f1/s56q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s56q5", prompt: "", imageUrl: "/__l5e/assets-v1/a03d60c2-8fea-41a4-a7f0-b4ae056a870f/s56q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s56q6", prompt: "", imageUrl: "/__l5e/assets-v1/0174cc4a-e5f0-477e-8e71-a4768a6a1f73/s56q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s56q7", prompt: "", imageUrl: "/__l5e/assets-v1/79f414ee-9ba6-44f4-ba22-3529cda8c521/s56q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s56q8", prompt: "", imageUrl: "/__l5e/assets-v1/a56665f8-a3c8-473e-946c-05a27f996c3e/s56q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s56q9", prompt: "", imageUrl: "/__l5e/assets-v1/34c7924f-fce8-4daa-8625-08074db34961/s56q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s56q10", prompt: "", imageUrl: "/__l5e/assets-v1/bee708c4-7631-4d3c-bd77-fe685b3b9c42/s56q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s56q11", prompt: "", imageUrl: "/__l5e/assets-v1/8b0f94ef-4d98-41ba-9971-2c59f50e74fe/s56q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  57: [
    { id: "s57q1", prompt: "", imageUrl: "/__l5e/assets-v1/f025750c-9bea-4f88-8557-0cfa4b7d093e/s57q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s57q2", prompt: "", imageUrl: "/__l5e/assets-v1/f7719cf6-8028-4b4f-a3ae-bad686838f90/s57q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s57q3", prompt: "", imageUrl: "/__l5e/assets-v1/caf28ddb-f249-4cab-a232-e3bd04c3e609/s57q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s57q4", prompt: "", imageUrl: "/__l5e/assets-v1/95990015-12bf-428b-b8ff-07f94e3c01f1/s57q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s57q5", prompt: "", imageUrl: "/__l5e/assets-v1/ca860289-fe00-4db2-9e74-d2ea8ca54b43/s57q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s57q6", prompt: "", imageUrl: "/__l5e/assets-v1/58d125bb-3d52-486a-8ba6-41cf57ed694b/s57q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s57q7", prompt: "", imageUrl: "/__l5e/assets-v1/4c457959-f23b-47f5-be89-bc81ad5f87d6/s57q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s57q8", prompt: "", imageUrl: "/__l5e/assets-v1/a47aff87-0636-4d76-b3c3-e35dac08d69f/s57q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s57q9", prompt: "", imageUrl: "/__l5e/assets-v1/39e9906e-64a1-4d26-a663-7c74019ad9a2/s57q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s57q10", prompt: "", imageUrl: "/__l5e/assets-v1/4842c56a-5a40-4e94-a68c-ad5f7bfb1d3e/s57q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s57q11", prompt: "", imageUrl: "/__l5e/assets-v1/ee6217ed-cf88-43d9-950c-0dbaf294321c/s57q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  58: [
    { id: "s58q1", prompt: "", imageUrl: "/__l5e/assets-v1/b5389a27-a357-44b6-9714-ecc822dbbadf/s58q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s58q2", prompt: "", imageUrl: "/__l5e/assets-v1/dddd2e10-e0f6-435e-a1a0-223aafaf252d/s58q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s58q3", prompt: "", imageUrl: "/__l5e/assets-v1/b7a0db0f-8f3d-43b4-8048-ee39d0e20a97/s58q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s58q4", prompt: "", imageUrl: "/__l5e/assets-v1/7277ccf6-e904-4140-974e-26439d241e85/s58q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s58q5", prompt: "", imageUrl: "/__l5e/assets-v1/61b44b21-1d70-4dc6-9222-f029ab9aebcd/s58q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s58q6", prompt: "", imageUrl: "/__l5e/assets-v1/af075495-0f46-48be-9eba-48cebeccb374/s58q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s58q7", prompt: "", imageUrl: "/__l5e/assets-v1/a7d9ca7b-a237-48bd-9160-b48c25e784f9/s58q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s58q8", prompt: "", imageUrl: "/__l5e/assets-v1/4d1c834f-dda4-4afd-bb9b-bd3d2d13b4b7/s58q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s58q9", prompt: "", imageUrl: "/__l5e/assets-v1/7662109d-ead2-459b-83ce-033f62e7a2cb/s58q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s58q10", prompt: "", imageUrl: "/__l5e/assets-v1/7885ece5-f2db-424f-aee2-cbe58518e728/s58q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s58q11", prompt: "", imageUrl: "/__l5e/assets-v1/a7f41ca2-a6c2-4036-af68-5ffc7a2a1b55/s58q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  59: [
    { id: "s59q1", prompt: "", imageUrl: "/__l5e/assets-v1/b16994b6-3410-4c33-a8e4-1a29b3f36439/s59q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s59q2", prompt: "", imageUrl: "/__l5e/assets-v1/6b164399-7f96-4f57-bf2a-75ef9d964fdd/s59q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s59q3", prompt: "", imageUrl: "/__l5e/assets-v1/908f87d5-a4cb-484c-bc90-0861645350fb/s59q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s59q4", prompt: "", imageUrl: "/__l5e/assets-v1/d657a91a-940e-48dd-8e85-9e7c8d4061e4/s59q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s59q5", prompt: "", imageUrl: "/__l5e/assets-v1/d9567271-fc9b-4aa3-9864-857bf41c4ba7/s59q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s59q6", prompt: "", imageUrl: "/__l5e/assets-v1/c5dc90ef-537e-409f-ad8f-3ad3f4a83a20/s59q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s59q7", prompt: "", imageUrl: "/__l5e/assets-v1/357d27e0-8c0e-4182-b7ee-b2839afae38a/s59q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s59q8", prompt: "", imageUrl: "/__l5e/assets-v1/afddb789-109a-49e2-9082-41a28b883c40/s59q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s59q9", prompt: "", imageUrl: "/__l5e/assets-v1/9148dad7-d4e9-4d4a-9326-7ea193b8c119/s59q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s59q10", prompt: "", imageUrl: "/__l5e/assets-v1/16ce8082-7278-4273-9697-a5cb1f5db203/s59q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s59q11", prompt: "", imageUrl: "/__l5e/assets-v1/e49c830f-a1c4-433f-a39d-a892ab8b0310/s59q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  60: [
    { id: "s60q1", prompt: "", imageUrl: "/__l5e/assets-v1/bf8c7e2a-86ae-4917-b52c-12da80a1acbd/s60q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s60q2", prompt: "", imageUrl: "/__l5e/assets-v1/7a8e9fbb-a917-4819-b4ad-892ab2771f2e/s60q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s60q3", prompt: "", imageUrl: "/__l5e/assets-v1/a3a66eea-eb82-4fe4-a9f9-4a34f3f2f4c1/s60q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s60q4", prompt: "", imageUrl: "/__l5e/assets-v1/2034d314-9686-46d6-aa9d-57b549da28f4/s60q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s60q5", prompt: "", imageUrl: "/__l5e/assets-v1/a09a72d8-0d77-4696-8314-a6e9399d6aa9/s60q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s60q6", prompt: "", imageUrl: "/__l5e/assets-v1/26207815-2658-4049-ad9c-574eab42240e/s60q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s60q7", prompt: "", imageUrl: "/__l5e/assets-v1/420c079b-34a0-4539-954e-693ccc290ada/s60q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s60q8", prompt: "", imageUrl: "/__l5e/assets-v1/f2c789f8-955d-4992-9861-3e1ddc5c041d/s60q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s60q9", prompt: "", imageUrl: "/__l5e/assets-v1/e8910b57-98bd-4fda-8249-55afbc2dc991/s60q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s60q10", prompt: "", imageUrl: "/__l5e/assets-v1/58387028-cd0e-4307-a9a0-d4a4c34aa27c/s60q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s60q11", prompt: "", imageUrl: "/__l5e/assets-v1/16d71434-ad8b-4b93-a948-3708f48187b5/s60q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  61: [
    { id: "s61q1", prompt: "", imageUrl: "/__l5e/assets-v1/3ff3a5ee-6811-4549-911a-edc72874c932/s61q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s61q2", prompt: "", imageUrl: "/__l5e/assets-v1/89373774-7702-489a-8029-93f715860414/s61q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s61q3", prompt: "", imageUrl: "/__l5e/assets-v1/0f71a153-13c7-4d16-862b-938344fbc58b/s61q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s61q4", prompt: "", imageUrl: "/__l5e/assets-v1/19f04cdc-1462-4eb2-9f57-6a2f91677331/s61q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s61q5", prompt: "", imageUrl: "/__l5e/assets-v1/23f8d1c0-2c19-4b83-94da-56f9eddcb70c/s61q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s61q6", prompt: "", imageUrl: "/__l5e/assets-v1/c04a62dd-8d32-4a35-87a6-f62e2bcb0c1c/s61q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s61q7", prompt: "", imageUrl: "/__l5e/assets-v1/add238ee-06e4-4ba6-9a2f-c44b96b15559/s61q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s61q8", prompt: "", imageUrl: "/__l5e/assets-v1/24795c04-7c7f-45a0-99ad-a8bcf65d369d/s61q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s61q9", prompt: "", imageUrl: "/__l5e/assets-v1/83d0c4ac-e411-4f40-8d7a-895ece5e78fc/s61q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s61q10", prompt: "", imageUrl: "/__l5e/assets-v1/a63f3f25-71c5-4343-b502-fa3bb99431c1/s61q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s61q11", prompt: "", imageUrl: "/__l5e/assets-v1/cc457221-a2fb-4b5e-a872-683c6bc16449/s61q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  62: [
    { id: "s62q1", prompt: "", imageUrl: "/__l5e/assets-v1/f5a95d10-a67f-4f5e-a0a6-1c02691e6819/s62q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s62q2", prompt: "", imageUrl: "/__l5e/assets-v1/ad7862d3-d4f7-4249-82ff-270ca6dd2fed/s62q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s62q3", prompt: "", imageUrl: "/__l5e/assets-v1/87012cba-a49a-4228-b48d-de990dbd384c/s62q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s62q4", prompt: "", imageUrl: "/__l5e/assets-v1/6651befe-281e-4d15-926d-08c2c7382c41/s62q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s62q5", prompt: "", imageUrl: "/__l5e/assets-v1/e25db4b6-805c-4a6f-8086-9b51a30614ac/s62q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s62q6", prompt: "", imageUrl: "/__l5e/assets-v1/2e730f44-7be0-433a-8529-e57bd6721649/s62q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s62q7", prompt: "", imageUrl: "/__l5e/assets-v1/2a028595-4bcd-4763-ab6d-9e4263436c58/s62q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s62q8", prompt: "", imageUrl: "/__l5e/assets-v1/32f0e5f2-54d0-4f27-8f12-c31eaeec6618/s62q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s62q9", prompt: "", imageUrl: "/__l5e/assets-v1/a16501d1-908e-4ae6-994f-d14f932be0d4/s62q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s62q10", prompt: "", imageUrl: "/__l5e/assets-v1/cb9ddcb6-89c5-41b9-8c9a-ff011d47777c/s62q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s62q11", prompt: "", imageUrl: "/__l5e/assets-v1/9340360c-03b1-49c0-97f9-be3fe88dd5cb/s62q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
  ],
  63: [
    { id: "s63q1", prompt: "", imageUrl: "/__l5e/assets-v1/82de542c-4270-4aa3-b517-6765e5fb89e6/s63q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s63q2", prompt: "", imageUrl: "/__l5e/assets-v1/9f23c136-dbee-4c5c-bad2-cd3d91711f36/s63q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s63q3", prompt: "", imageUrl: "/__l5e/assets-v1/5a9c2541-7aa5-47c3-bb9a-acc6c72d69e2/s63q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s63q4", prompt: "", imageUrl: "/__l5e/assets-v1/e6aac106-1c50-4ceb-8044-36ad30301b2e/s63q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s63q5", prompt: "", imageUrl: "/__l5e/assets-v1/44622895-6df6-4422-8599-c4325114333f/s63q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s63q6", prompt: "", imageUrl: "/__l5e/assets-v1/b3b46d4b-288a-4053-8718-9d49a95f12a2/s63q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s63q7", prompt: "", imageUrl: "/__l5e/assets-v1/28d65009-d643-4ba8-b79a-e14747ef6bb0/s63q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s63q8", prompt: "", imageUrl: "/__l5e/assets-v1/c62d1844-ceb3-4409-90c1-b1bb322243bb/s63q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s63q9", prompt: "", imageUrl: "/__l5e/assets-v1/c0dc9d56-e209-48a4-83d7-50a70e1feee3/s63q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s63q10", prompt: "", imageUrl: "/__l5e/assets-v1/23c1b005-79d9-4dcc-811b-7799ab212522/s63q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s63q11", prompt: "", imageUrl: "/__l5e/assets-v1/cd11ef1f-918f-4921-a871-722f3e63036e/s63q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  64: [
    { id: "s64q1", prompt: "", imageUrl: "/__l5e/assets-v1/e0de8f44-bf6d-4676-ad85-25b3c11ad899/s64q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s64q2", prompt: "", imageUrl: "/__l5e/assets-v1/1b8ba1a2-712c-4499-bfa6-a77ab64abd8c/s64q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s64q3", prompt: "", imageUrl: "/__l5e/assets-v1/2c0a9455-2181-49a4-8d5e-070294e3f546/s64q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s64q4", prompt: "", imageUrl: "/__l5e/assets-v1/63ceb4c4-f53e-41f7-8243-cb42c89cffb6/s64q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s64q5", prompt: "", imageUrl: "/__l5e/assets-v1/2e07664c-4efc-4fb8-b619-f60e2f4bb241/s64q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s64q6", prompt: "", imageUrl: "/__l5e/assets-v1/bc1490a2-4e9d-4e4b-b967-942681836be8/s64q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s64q7", prompt: "", imageUrl: "/__l5e/assets-v1/40160299-37de-4918-ad7d-cbd232c9195e/s64q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s64q8", prompt: "", imageUrl: "/__l5e/assets-v1/a4567ab0-0a7e-419b-ba2d-4dbab67c4338/s64q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s64q9", prompt: "", imageUrl: "/__l5e/assets-v1/c15d16eb-7a1a-4309-bdde-fe2f951324c5/s64q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s64q10", prompt: "", imageUrl: "/__l5e/assets-v1/87fc98d3-3c58-452e-bf86-9a9f43a13fb2/s64q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s64q11", prompt: "", imageUrl: "/__l5e/assets-v1/bdbf893c-97be-4b42-8beb-0f82f827e7bf/s64q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  65: [
    { id: "s65q1", prompt: "", imageUrl: "/__l5e/assets-v1/edec1072-6599-4fd3-a195-d00f2a3115d8/s65q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s65q2", prompt: "", imageUrl: "/__l5e/assets-v1/c2b6625a-3b03-4900-8188-0f11cb0a3d88/s65q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s65q3", prompt: "", imageUrl: "/__l5e/assets-v1/f65f2cb3-bb94-45bf-919d-0c3450c57729/s65q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s65q4", prompt: "", imageUrl: "/__l5e/assets-v1/49d32cfb-4b82-4c8b-99f7-40dbf9c40554/s65q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s65q5", prompt: "", imageUrl: "/__l5e/assets-v1/59c7e3ce-c786-4b7d-a9c4-1b6bb696af88/s65q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s65q6", prompt: "", imageUrl: "/__l5e/assets-v1/64b06126-0ed3-484c-965b-279eb749ebab/s65q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s65q7", prompt: "", imageUrl: "/__l5e/assets-v1/b6d4042f-8ee4-495b-bea9-b19adb5149ed/s65q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s65q8", prompt: "", imageUrl: "/__l5e/assets-v1/d37092ac-4171-4a51-a187-b4516945d784/s65q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s65q9", prompt: "", imageUrl: "/__l5e/assets-v1/31c57fe3-af2d-4857-a16a-902f44b21c18/s65q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s65q10", prompt: "", imageUrl: "/__l5e/assets-v1/58c1bdd2-d692-4855-af0c-073d0fddc27c/s65q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s65q11", prompt: "", imageUrl: "/__l5e/assets-v1/ff95ba30-5ca3-453c-ba25-377a6032b48c/s65q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  66: [
    { id: "s66q1", prompt: "", imageUrl: "/__l5e/assets-v1/23440a37-bba9-4a07-b59e-82f961bb4bdc/s66q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s66q2", prompt: "", imageUrl: "/__l5e/assets-v1/34415b8e-f7e0-40db-9ee8-9781c4627683/s66q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s66q3", prompt: "", imageUrl: "/__l5e/assets-v1/c113a474-4fb7-46c5-addb-f4ffb5ea3325/s66q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s66q4", prompt: "", imageUrl: "/__l5e/assets-v1/4fc5f9f8-8eeb-4467-bafe-3e94d9271fcb/s66q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s66q5", prompt: "", imageUrl: "/__l5e/assets-v1/e35e52ec-7b7d-48a0-b48c-f290337de980/s66q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s66q6", prompt: "", imageUrl: "/__l5e/assets-v1/a2ae0707-5183-4f84-adc8-7ca2c701380e/s66q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s66q7", prompt: "", imageUrl: "/__l5e/assets-v1/b598f29b-3eeb-47ed-bc34-47492ed60157/s66q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s66q8", prompt: "", imageUrl: "/__l5e/assets-v1/e4a0d2cd-19bb-4c2e-aedf-a21fb9807b1f/s66q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s66q9", prompt: "", imageUrl: "/__l5e/assets-v1/2921a6eb-6a2d-4014-a23c-0a0a168eab6e/s66q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s66q10", prompt: "", imageUrl: "/__l5e/assets-v1/91c72ece-f88a-4361-b85c-426b3cd31bbe/s66q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s66q11", prompt: "", imageUrl: "/__l5e/assets-v1/3c3b814a-3556-4fd4-a660-4440fae1e6d8/s66q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  67: [
    { id: "s67q1", prompt: "", imageUrl: "/__l5e/assets-v1/0777f2ff-5953-445a-bf16-52ba79703973/s67q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s67q2", prompt: "", imageUrl: "/__l5e/assets-v1/4e1753bc-70ac-4e9b-b942-2030c643585a/s67q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s67q3", prompt: "", imageUrl: "/__l5e/assets-v1/2b06eef3-ce3e-4b52-9410-913f59e6ec83/s67q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s67q4", prompt: "", imageUrl: "/__l5e/assets-v1/349b1c80-3c54-467e-a851-b73bef910f88/s67q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s67q5", prompt: "", imageUrl: "/__l5e/assets-v1/59350be6-56b0-4681-ac7a-6449124e7c40/s67q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s67q6", prompt: "", imageUrl: "/__l5e/assets-v1/df70873b-06b7-42c0-9497-e4171ae6446a/s67q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s67q7", prompt: "", imageUrl: "/__l5e/assets-v1/676443bb-e35f-4475-8a56-aa10d0d23313/s67q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s67q8", prompt: "", imageUrl: "/__l5e/assets-v1/8854bb26-d179-4446-ae38-d981d2fc160c/s67q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s67q9", prompt: "", imageUrl: "/__l5e/assets-v1/7dc27b1b-0d4f-4e82-9077-9480cee5dcec/s67q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s67q10", prompt: "", imageUrl: "/__l5e/assets-v1/e18b8165-26b3-4da6-8726-9f019b7ff5ca/s67q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s67q11", prompt: "", imageUrl: "/__l5e/assets-v1/8cd0a9ac-8f9a-4db8-8130-a453152ede4b/s67q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  68: [
    { id: "s68q1", prompt: "", imageUrl: "/__l5e/assets-v1/09ae5193-d040-4098-aaa8-599be8e35ee5/s68q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s68q2", prompt: "", imageUrl: "/__l5e/assets-v1/df120908-1d14-4299-9f1d-25506c7be709/s68q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s68q3", prompt: "", imageUrl: "/__l5e/assets-v1/211dfef3-22fb-4909-b6c5-78920a5d9674/s68q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s68q4", prompt: "", imageUrl: "/__l5e/assets-v1/e1f913ec-2f13-4824-b769-a7c5d02a20ce/s68q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s68q5", prompt: "", imageUrl: "/__l5e/assets-v1/ae268c00-5540-4798-949b-23d97f453f97/s68q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s68q6", prompt: "", imageUrl: "/__l5e/assets-v1/8ef1be94-2695-42fe-93f9-9be7399f5b6d/s68q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s68q7", prompt: "", imageUrl: "/__l5e/assets-v1/4764dc63-b22a-400e-bd62-99f11b0523dd/s68q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s68q8", prompt: "", imageUrl: "/__l5e/assets-v1/fbbb65ea-b5da-4e5d-a4b2-20d5ed47a196/s68q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s68q9", prompt: "", imageUrl: "/__l5e/assets-v1/04a60bc7-bcf0-41db-ad48-4a81142135e3/s68q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s68q10", prompt: "", imageUrl: "/__l5e/assets-v1/f052c65e-b190-45a6-ae0d-76c335624a34/s68q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s68q11", prompt: "", imageUrl: "/__l5e/assets-v1/c746c3e1-9af9-46aa-a3ff-5ede31ad56a4/s68q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  69: [
    { id: "s69q1", prompt: "", imageUrl: "/__l5e/assets-v1/263feb0f-7e5c-4889-a050-313c7c6eab66/s69q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s69q2", prompt: "", imageUrl: "/__l5e/assets-v1/b7f8088d-1430-49fb-a118-2d330b8ae980/s69q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s69q3", prompt: "", imageUrl: "/__l5e/assets-v1/9f870acd-be8d-441d-a24b-d8cee8a1b550/s69q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s69q4", prompt: "", imageUrl: "/__l5e/assets-v1/56d073ec-682f-42e5-92d9-25c3f399a7e8/s69q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s69q5", prompt: "", imageUrl: "/__l5e/assets-v1/ee9f09e3-ca95-4fec-b3e0-1936160c89dd/s69q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s69q6", prompt: "", imageUrl: "/__l5e/assets-v1/e4667ab7-a924-486e-bfed-b13a575ab99b/s69q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s69q7", prompt: "", imageUrl: "/__l5e/assets-v1/4cec4d3c-ca1f-4085-9c64-b72d4e1f6acb/s69q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s69q8", prompt: "", imageUrl: "/__l5e/assets-v1/72c8ad28-e10c-4306-b4dd-c41c26f708c7/s69q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s69q9", prompt: "", imageUrl: "/__l5e/assets-v1/b7e9b321-4f75-4831-b0a1-d94a455fb23c/s69q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s69q10", prompt: "", imageUrl: "/__l5e/assets-v1/0f9961cc-f77e-4c58-babf-53fd3d35ac8e/s69q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s69q11", prompt: "", imageUrl: "/__l5e/assets-v1/4231b657-9d2a-473f-827e-f69427b7064c/s69q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  70: [
    { id: "s70q1", prompt: "", imageUrl: "/__l5e/assets-v1/90042782-0b5c-47c9-9270-f189f16b1dfa/s70q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s70q2", prompt: "", imageUrl: "/__l5e/assets-v1/c0de31db-145a-480a-87d6-004671f3f328/s70q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s70q3", prompt: "", imageUrl: "/__l5e/assets-v1/61f4aa82-cb03-47e1-ba7f-17a2faf1ca08/s70q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s70q4", prompt: "", imageUrl: "/__l5e/assets-v1/8c6a5cfb-7b96-4d50-85bb-db26d057b9f9/s70q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s70q5", prompt: "", imageUrl: "/__l5e/assets-v1/38267b77-e6c3-48d8-9b8b-e3fa98dfca81/s70q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s70q6", prompt: "", imageUrl: "/__l5e/assets-v1/af5ef3bf-ccbd-4284-8592-1b89e64b50b2/s70q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s70q7", prompt: "", imageUrl: "/__l5e/assets-v1/49e31c8e-ba71-4aca-9868-449ea9d917e7/s70q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s70q8", prompt: "", imageUrl: "/__l5e/assets-v1/1212d685-ea71-4409-b9e8-3efe6d070e7c/s70q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s70q9", prompt: "", imageUrl: "/__l5e/assets-v1/502eec2e-97c6-407e-93de-dd67febc14f3/s70q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s70q10", prompt: "", imageUrl: "/__l5e/assets-v1/9aa474d3-a295-4713-8549-6edf45c2a980/s70q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s70q11", prompt: "", imageUrl: "/__l5e/assets-v1/53af7b1a-b60d-4af8-b4c1-289bb70cf20c/s70q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
  ],
  71: [
    { id: "s71q1", prompt: "", imageUrl: "/__l5e/assets-v1/a6fed329-cc24-4e8c-8111-7388eb6bf719/s71q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s71q2", prompt: "", imageUrl: "/__l5e/assets-v1/bf1f72e2-0933-4c69-9f75-f2ca0afc34f9/s71q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s71q3", prompt: "", imageUrl: "/__l5e/assets-v1/14fef75e-4fa3-4a2d-af70-8628a6433408/s71q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s71q4", prompt: "", imageUrl: "/__l5e/assets-v1/d2d44bab-c4f6-4607-829d-dfdcd5611ae5/s71q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s71q5", prompt: "", imageUrl: "/__l5e/assets-v1/2a5315fb-6bd9-437d-96c4-3db4a2707dcf/s71q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s71q6", prompt: "", imageUrl: "/__l5e/assets-v1/4fa5e497-9eee-451a-a245-fe823c91865d/s71q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s71q7", prompt: "", imageUrl: "/__l5e/assets-v1/ed9a447d-a8cd-48d5-b614-7f1db6110801/s71q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s71q8", prompt: "", imageUrl: "/__l5e/assets-v1/e2dcee51-fa7f-4431-98ed-4ffac3e7a6b5/s71q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s71q9", prompt: "", imageUrl: "/__l5e/assets-v1/ba2730f1-b4c1-449f-9071-7dba9c64b6cb/s71q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s71q10", prompt: "", imageUrl: "/__l5e/assets-v1/749653b4-58c2-424c-8b0a-6569be06994b/s71q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s71q11", prompt: "", imageUrl: "/__l5e/assets-v1/8fd4f409-d450-455f-97f1-383753d088a1/s71q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  72: [
    { id: "s72q1", prompt: "", imageUrl: "/__l5e/assets-v1/138004bd-ba8a-45b5-bbac-8c2b136f12e0/s72q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s72q2", prompt: "", imageUrl: "/__l5e/assets-v1/38fec080-be36-40a4-a3cf-6fa41fc9ef57/s72q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s72q3", prompt: "", imageUrl: "/__l5e/assets-v1/09f18c20-7e81-4f77-8042-a9dcfa89632e/s72q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s72q4", prompt: "", imageUrl: "/__l5e/assets-v1/a53fcd91-b5b3-4dd6-9c90-a4c76e72c8db/s72q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s72q5", prompt: "", imageUrl: "/__l5e/assets-v1/fef663dd-45ed-40c7-9769-2b7bbe85a425/s72q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s72q6", prompt: "", imageUrl: "/__l5e/assets-v1/c21f344e-65d5-4165-8c9c-75d3fcfcc883/s72q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s72q7", prompt: "", imageUrl: "/__l5e/assets-v1/d8e1157b-fcab-46fe-8e17-6d61790dfeec/s72q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s72q8", prompt: "", imageUrl: "/__l5e/assets-v1/d762729d-6668-456d-a92b-e69ed52d9fd7/s72q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s72q9", prompt: "", imageUrl: "/__l5e/assets-v1/1f467d0b-3db6-4765-901f-7bdd94cd14dd/s72q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s72q10", prompt: "", imageUrl: "/__l5e/assets-v1/04cc177d-0bfb-4592-bbfe-6643eaa855fb/s72q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s72q11", prompt: "", imageUrl: "/__l5e/assets-v1/cb5835c0-c447-4a81-9a05-9ca06962b131/s72q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  73: [
    { id: "s73q1", prompt: "", imageUrl: "/__l5e/assets-v1/74561699-21d5-4a9a-8742-f7d53b5edc86/s73q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s73q2", prompt: "", imageUrl: "/__l5e/assets-v1/037fd983-5e67-408e-908e-636af84cc79e/s73q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s73q3", prompt: "", imageUrl: "/__l5e/assets-v1/58a51582-8855-4e1c-a1f8-623b9e80e86e/s73q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s73q4", prompt: "", imageUrl: "/__l5e/assets-v1/ed4cd86b-13e2-4194-bb23-e94838e8ca6f/s73q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s73q5", prompt: "", imageUrl: "/__l5e/assets-v1/5d6b6401-ec6a-4025-b58e-06cb04e81650/s73q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s73q6", prompt: "", imageUrl: "/__l5e/assets-v1/6ebdce5c-bd14-4a4f-91ae-73e1d7a79e64/s73q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s73q7", prompt: "", imageUrl: "/__l5e/assets-v1/de7a799d-1dce-4c4b-9eb2-fc842f9b010a/s73q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s73q8", prompt: "", imageUrl: "/__l5e/assets-v1/16a3672b-df37-4ce9-8203-2b8c867020c0/s73q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s73q9", prompt: "", imageUrl: "/__l5e/assets-v1/7e114ab6-e260-4f4b-b747-b8323a2893ce/s73q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s73q10", prompt: "", imageUrl: "/__l5e/assets-v1/8be69ac4-bff8-40b6-8b03-41e584992af6/s73q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s73q11", prompt: "", imageUrl: "/__l5e/assets-v1/5b6d1010-3d65-4187-9e04-a08ca650faf3/s73q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  74: [
    { id: "s74q1", prompt: "", imageUrl: "/__l5e/assets-v1/6049cf80-fd73-4e0e-be58-d1f35100de7f/s74q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s74q2", prompt: "", imageUrl: "/__l5e/assets-v1/e6e1529b-52d8-4015-a4e0-5e07b32d1908/s74q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s74q3", prompt: "", imageUrl: "/__l5e/assets-v1/3c91437d-5c43-490c-b2c8-9bfaab8a29cd/s74q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s74q4", prompt: "", imageUrl: "/__l5e/assets-v1/dd152470-d7ae-4749-b4bb-bf730794959a/s74q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s74q5", prompt: "", imageUrl: "/__l5e/assets-v1/7c435c30-633a-42a4-8878-7f42ec1cb72f/s74q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s74q6", prompt: "", imageUrl: "/__l5e/assets-v1/9461a623-51ca-4926-b907-24d06629156f/s74q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s74q7", prompt: "", imageUrl: "/__l5e/assets-v1/e0c956d5-8bea-40f2-a6bb-1c009552e51d/s74q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s74q8", prompt: "", imageUrl: "/__l5e/assets-v1/de112159-f091-4628-ab56-3e4c1c3dc611/s74q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s74q9", prompt: "", imageUrl: "/__l5e/assets-v1/46a0fcf6-f4c4-42eb-8052-e6fbcb736526/s74q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s74q10", prompt: "", imageUrl: "/__l5e/assets-v1/1e8fb1c6-3ca0-485c-92dc-ae48aed086dd/s74q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s74q11", prompt: "", imageUrl: "/__l5e/assets-v1/b3a8f564-0c13-450a-bc36-cefd4a2bcfae/s74q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  75: [
    { id: "s75q1", prompt: "", imageUrl: "/__l5e/assets-v1/a3a525d8-d6e4-4456-9197-e3412480624f/s75q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s75q2", prompt: "", imageUrl: "/__l5e/assets-v1/5a0c5156-c07d-4f9b-8a15-e54d493999d1/s75q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s75q3", prompt: "", imageUrl: "/__l5e/assets-v1/702e82b2-dd98-4735-a2e9-c957435d9063/s75q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s75q4", prompt: "", imageUrl: "/__l5e/assets-v1/761e5a26-25c4-4327-87e3-e89e9fd6912e/s75q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s75q5", prompt: "", imageUrl: "/__l5e/assets-v1/33ce54c9-b773-4d70-8868-61f345a871b8/s75q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s75q6", prompt: "", imageUrl: "/__l5e/assets-v1/0586fea1-10ae-4edd-977e-7445747f98c8/s75q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s75q7", prompt: "", imageUrl: "/__l5e/assets-v1/11240483-f178-492f-8538-d1dff925c7d0/s75q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s75q8", prompt: "", imageUrl: "/__l5e/assets-v1/e62014fd-3859-4463-83b5-00336bba43ff/s75q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s75q9", prompt: "", imageUrl: "/__l5e/assets-v1/451a5099-16a2-4bf5-a352-c4b8e745c71b/s75q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s75q10", prompt: "", imageUrl: "/__l5e/assets-v1/d5244895-27f1-4c53-84c3-0c8ce2246dd8/s75q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s75q11", prompt: "", imageUrl: "/__l5e/assets-v1/1f6674ad-67c5-4086-81f6-d1e9e7688478/s75q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  76: [
    { id: "s76q1", prompt: "", imageUrl: "/__l5e/assets-v1/51e5c7e7-a299-4910-8b41-57175bb744a8/s76q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s76q2", prompt: "", imageUrl: "/__l5e/assets-v1/d3ae57a3-a589-4645-a275-e6c5730ecfb3/s76q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s76q3", prompt: "", imageUrl: "/__l5e/assets-v1/3f4d184c-6b1a-4dd7-bdb6-ade4d2953817/s76q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s76q4", prompt: "", imageUrl: "/__l5e/assets-v1/23e5c494-c991-4d4d-a0b3-2444e695c083/s76q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s76q5", prompt: "", imageUrl: "/__l5e/assets-v1/c688370f-25eb-4fe3-93ee-9c09c96e870c/s76q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s76q6", prompt: "", imageUrl: "/__l5e/assets-v1/7d91d5ea-9f46-415e-9ff2-c19e5b28fe91/s76q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s76q7", prompt: "", imageUrl: "/__l5e/assets-v1/d05c01e3-17df-4aef-b1b9-e89e8c757783/s76q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s76q8", prompt: "", imageUrl: "/__l5e/assets-v1/80954cb5-a035-4d7b-aa2f-8c3b8702e5fc/s76q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s76q9", prompt: "", imageUrl: "/__l5e/assets-v1/a9dac52c-c3de-4aa1-bfcc-188cbb9ba087/s76q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s76q10", prompt: "", imageUrl: "/__l5e/assets-v1/e457344e-aab1-456e-aaea-c41b6e20a86d/s76q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s76q11", prompt: "", imageUrl: "/__l5e/assets-v1/3ee3f07b-a8b5-417a-90c7-b8678b887b4e/s76q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  77: [
    { id: "s77q1", prompt: "", imageUrl: "/__l5e/assets-v1/1cdc48ca-de0f-4e81-b1f3-d76cbffb182f/s77q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s77q2", prompt: "", imageUrl: "/__l5e/assets-v1/cb23e801-ced6-4e8f-90f2-254866a7e572/s77q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s77q3", prompt: "", imageUrl: "/__l5e/assets-v1/f9e4e7e1-3bfb-4538-bee7-213f32c4b7cd/s77q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s77q4", prompt: "", imageUrl: "/__l5e/assets-v1/f38cd2bd-abe2-4b9c-a106-e81f5b0f4687/s77q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s77q5", prompt: "", imageUrl: "/__l5e/assets-v1/dd4c4d99-701d-45cf-be1e-c471b23a6c4b/s77q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s77q6", prompt: "", imageUrl: "/__l5e/assets-v1/df094d19-f249-419b-b33b-52186cf6f905/s77q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s77q7", prompt: "", imageUrl: "/__l5e/assets-v1/bc342178-5353-4df1-ab80-6557995d9b38/s77q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s77q8", prompt: "", imageUrl: "/__l5e/assets-v1/c15c1f5e-d431-4b17-b4f3-ee1a3e7219d3/s77q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s77q9", prompt: "", imageUrl: "/__l5e/assets-v1/dd350667-06a4-4c2a-ae5d-4ebe3cb91f2a/s77q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s77q10", prompt: "", imageUrl: "/__l5e/assets-v1/0601aedd-30b1-4b79-a576-da40fa14a9db/s77q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s77q11", prompt: "", imageUrl: "/__l5e/assets-v1/a194ebd0-53ea-4d9e-ab78-b14d47ef0c26/s77q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  78: [
    { id: "s78q1", prompt: "", imageUrl: "/__l5e/assets-v1/c7a3418f-d5d3-40b9-bf13-598cd7bc574b/s78q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s78q2", prompt: "", imageUrl: "/__l5e/assets-v1/80189915-5fc3-4280-98a3-56f8746ccef1/s78q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s78q3", prompt: "", imageUrl: "/__l5e/assets-v1/2a6a7595-90c2-4494-9814-065d67729c16/s78q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s78q4", prompt: "", imageUrl: "/__l5e/assets-v1/a67283dd-57ce-4de7-b141-706c18c82522/s78q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s78q5", prompt: "", imageUrl: "/__l5e/assets-v1/853c5e13-e845-445e-a47a-71409edede45/s78q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s78q6", prompt: "", imageUrl: "/__l5e/assets-v1/af3b0deb-5037-45a0-8ae9-945e0cc51a24/s78q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s78q7", prompt: "", imageUrl: "/__l5e/assets-v1/e352b800-f341-406e-acbb-db6122c56b73/s78q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s78q8", prompt: "", imageUrl: "/__l5e/assets-v1/53554c4c-2176-4c4b-8d18-38f6069d454f/s78q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s78q9", prompt: "", imageUrl: "/__l5e/assets-v1/9a445c91-ac28-4cf9-9462-9633051bb6b9/s78q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s78q10", prompt: "", imageUrl: "/__l5e/assets-v1/d2165187-79a0-42f6-9775-8b24bbb7677c/s78q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s78q11", prompt: "", imageUrl: "/__l5e/assets-v1/a8b4617a-7ba3-4bdb-be0c-61b38bcfec64/s78q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  79: [
    { id: "s79q1", prompt: "", imageUrl: "/__l5e/assets-v1/96ddace6-d6ab-4cad-8777-030183d53545/s79q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s79q2", prompt: "", imageUrl: "/__l5e/assets-v1/9f8a38c6-d035-4c73-8030-f2cf32a847fb/s79q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s79q3", prompt: "", imageUrl: "/__l5e/assets-v1/290c4d4e-f77a-4a75-9793-f94c1af62ac3/s79q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s79q4", prompt: "", imageUrl: "/__l5e/assets-v1/1ffc646c-1f4b-415e-bce7-97c791d3159c/s79q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s79q5", prompt: "", imageUrl: "/__l5e/assets-v1/3ace75e3-8672-40ee-b097-6605e256aec4/s79q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s79q6", prompt: "", imageUrl: "/__l5e/assets-v1/6f434320-9b62-4a07-a57e-e9850d5541c4/s79q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s79q7", prompt: "", imageUrl: "/__l5e/assets-v1/401ead73-bead-4788-aa1e-8cceddb3b6bd/s79q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s79q8", prompt: "", imageUrl: "/__l5e/assets-v1/2d97ded5-6416-4aba-99db-6b5089e8eb9b/s79q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s79q9", prompt: "", imageUrl: "/__l5e/assets-v1/ec942bc8-ba91-4910-8fd9-604b6ce70f51/s79q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s79q10", prompt: "", imageUrl: "/__l5e/assets-v1/302757af-3444-414b-9931-3fa538c8251f/s79q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s79q11", prompt: "", imageUrl: "/__l5e/assets-v1/0f859707-d00b-4102-8147-6c4dd4177585/s79q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  80: [
    { id: "s80q1", prompt: "", imageUrl: "/__l5e/assets-v1/5d01bcdb-903d-4684-a1f8-d45a14103d80/s80q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s80q2", prompt: "", imageUrl: "/__l5e/assets-v1/4a1c7ab2-a8bd-4df9-86cb-9d4b11af064e/s80q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s80q3", prompt: "", imageUrl: "/__l5e/assets-v1/6d6671ba-f56a-487d-bc5a-ecf568c08df1/s80q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s80q4", prompt: "", imageUrl: "/__l5e/assets-v1/c8dbe573-c84b-44ce-a2b3-abe26d0e92f5/s80q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s80q5", prompt: "", imageUrl: "/__l5e/assets-v1/bdc1762c-d288-41ea-b197-59988f40282d/s80q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s80q6", prompt: "", imageUrl: "/__l5e/assets-v1/fc13b988-8560-43d8-bcc0-01c270f0c592/s80q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s80q7", prompt: "", imageUrl: "/__l5e/assets-v1/9d744969-c052-4915-ad9f-eade5e048f2e/s80q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s80q8", prompt: "", imageUrl: "/__l5e/assets-v1/6e200419-68a2-4416-bb03-899b5e116949/s80q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s80q9", prompt: "", imageUrl: "/__l5e/assets-v1/52971c64-dc0e-49e0-9f54-b6536c2734fd/s80q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s80q10", prompt: "", imageUrl: "/__l5e/assets-v1/4b1a4d8a-1152-4167-81df-ead2e4965d4b/s80q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s80q11", prompt: "", imageUrl: "/__l5e/assets-v1/78be4b94-fe40-43bc-95b4-54e9a7252ca0/s80q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
  ],
  81: [
    { id: "s81q1", prompt: "", imageUrl: "/__l5e/assets-v1/82f4bd1b-9710-4d52-b658-70b661124253/s81q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s81q2", prompt: "", imageUrl: "/__l5e/assets-v1/5c8463b2-6e86-4f81-8985-33e434459edf/s81q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s81q3", prompt: "", imageUrl: "/__l5e/assets-v1/9df614ca-a6f9-44b4-bb62-2312847bf4f3/s81q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s81q4", prompt: "", imageUrl: "/__l5e/assets-v1/ad506853-72de-417b-8f9a-180eb0d52d3f/s81q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s81q5", prompt: "", imageUrl: "/__l5e/assets-v1/2b8547d3-0576-4cd8-956f-b2fb42696c30/s81q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s81q6", prompt: "", imageUrl: "/__l5e/assets-v1/0410df87-3a38-423d-941d-d73f5ff08d26/s81q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s81q7", prompt: "", imageUrl: "/__l5e/assets-v1/6b9caa45-390a-467f-ac68-53cfbbceef7e/s81q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s81q8", prompt: "", imageUrl: "/__l5e/assets-v1/ece8b3bd-0f86-4181-877b-33b8ac59b288/s81q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s81q9", prompt: "", imageUrl: "/__l5e/assets-v1/92490207-4e54-4c06-a9ab-3a3c67899f5c/s81q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s81q10", prompt: "", imageUrl: "/__l5e/assets-v1/e1853738-5660-45c9-91a7-d4142bbcc1f1/s81q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s81q11", prompt: "", imageUrl: "/__l5e/assets-v1/3257c1c1-23ef-4b54-b671-bbf22698d45e/s81q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
  ],
  82: [
    { id: "s82q1", prompt: "", imageUrl: "/__l5e/assets-v1/61f95339-8e39-452c-bbe7-361811b7a640/s82q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s82q2", prompt: "", imageUrl: "/__l5e/assets-v1/8941bded-99db-4c3b-bab2-5700697682f7/s82q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s82q3", prompt: "", imageUrl: "/__l5e/assets-v1/458fba25-b9c7-46d4-b80d-93810fa0439e/s82q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s82q4", prompt: "", imageUrl: "/__l5e/assets-v1/25d4adb8-2ac4-4436-859b-63272344a28c/s82q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s82q5", prompt: "", imageUrl: "/__l5e/assets-v1/56db71ac-9483-4d8a-b854-1d7669e2bc8d/s82q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s82q6", prompt: "", imageUrl: "/__l5e/assets-v1/d5f0ba2f-4773-4f3f-b587-92abe07e57db/s82q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s82q7", prompt: "", imageUrl: "/__l5e/assets-v1/049a5987-fdf9-45ce-a9d9-142fc1ed59be/s82q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s82q8", prompt: "", imageUrl: "/__l5e/assets-v1/1ff0821a-a6fd-4ea8-913d-e8cd578fe3a6/s82q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s82q9", prompt: "", imageUrl: "/__l5e/assets-v1/ff88cf04-d859-47ba-9f6a-5b1288d9da71/s82q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s82q10", prompt: "", imageUrl: "/__l5e/assets-v1/97942b99-c3d0-4c7e-aaec-9469bb13d648/s82q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s82q11", prompt: "", imageUrl: "/__l5e/assets-v1/fad85506-cc58-46e4-82b8-82d6c31ce48b/s82q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
  ],
  83: [
    { id: "s83q1", prompt: "", imageUrl: "/__l5e/assets-v1/fb17d7ce-5e86-4845-bd9b-4c4ceb7dfe69/s83q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s83q2", prompt: "", imageUrl: "/__l5e/assets-v1/4f587248-a657-4922-8f2c-b08a61bf9690/s83q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s83q3", prompt: "", imageUrl: "/__l5e/assets-v1/349f9eca-9790-4c14-93bf-42acb32996b6/s83q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s83q4", prompt: "", imageUrl: "/__l5e/assets-v1/e6546f3a-dfeb-42b4-b8aa-c17d2cccef2b/s83q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s83q5", prompt: "", imageUrl: "/__l5e/assets-v1/30ffe794-02a1-4917-9763-254998ef2dde/s83q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s83q6", prompt: "", imageUrl: "/__l5e/assets-v1/170f978b-859e-4864-9c79-e0b5c20edfd4/s83q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s83q7", prompt: "", imageUrl: "/__l5e/assets-v1/48e8d601-b7ea-4456-a876-fb8142f8ddea/s83q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s83q8", prompt: "", imageUrl: "/__l5e/assets-v1/b8bf1313-bdfd-4e07-b067-b764a0793c0e/s83q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s83q9", prompt: "", imageUrl: "/__l5e/assets-v1/4c8924cb-3d5f-4eec-baca-af378ed814a3/s83q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s83q10", prompt: "", imageUrl: "/__l5e/assets-v1/f698ad1c-1aa0-41fa-9041-d93d67a43494/s83q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s83q11", prompt: "", imageUrl: "/__l5e/assets-v1/30f31ce6-7fa5-48a9-bf43-c4b733058860/s83q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  84: [
    { id: "s84q1", prompt: "", imageUrl: "/__l5e/assets-v1/dbf84642-5699-430b-aac0-6aaedfb904a6/s84q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s84q2", prompt: "", imageUrl: "/__l5e/assets-v1/9914f648-911a-4e8f-beab-73957ad8c066/s84q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s84q3", prompt: "", imageUrl: "/__l5e/assets-v1/e562ced5-f490-4fd6-a8a4-79a370c4e1a9/s84q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s84q4", prompt: "", imageUrl: "/__l5e/assets-v1/43f84bd2-ff3c-4e49-b5e6-79910cd77117/s84q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s84q5", prompt: "", imageUrl: "/__l5e/assets-v1/4d32dcdd-7f13-4a48-9da6-6611e075a0ce/s84q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s84q6", prompt: "", imageUrl: "/__l5e/assets-v1/359123e0-4ea3-4143-b88f-c7e0ac6362ca/s84q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s84q7", prompt: "", imageUrl: "/__l5e/assets-v1/6fc80b2d-c706-4e84-aa98-6025fbafa9d9/s84q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s84q8", prompt: "", imageUrl: "/__l5e/assets-v1/d3bc8efa-0d0a-4c49-a828-cd00f79f86c7/s84q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s84q9", prompt: "", imageUrl: "/__l5e/assets-v1/238c0dbd-2590-41ac-ac56-494541696195/s84q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s84q10", prompt: "", imageUrl: "/__l5e/assets-v1/e56af6c0-ff62-4cca-855d-f86421639190/s84q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s84q11", prompt: "", imageUrl: "/__l5e/assets-v1/dc322fdb-11cf-4e59-81ab-d1f24b7033eb/s84q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  85: [
    { id: "s85q1", prompt: "", imageUrl: "/__l5e/assets-v1/e3c8ef01-fd33-4c32-bf28-d27ce3840f31/s85q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s85q2", prompt: "", imageUrl: "/__l5e/assets-v1/b3612bd2-8529-4980-b884-7300b406b3c6/s85q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s85q3", prompt: "", imageUrl: "/__l5e/assets-v1/28690abe-e18c-46d9-ad73-2a2a9d6fc953/s85q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s85q4", prompt: "", imageUrl: "/__l5e/assets-v1/a90770cd-e0f1-4fee-b48b-8697b067ff04/s85q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s85q5", prompt: "", imageUrl: "/__l5e/assets-v1/c9062857-c9ee-4993-ae65-4fc5ba49ec82/s85q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s85q6", prompt: "", imageUrl: "/__l5e/assets-v1/09f341c0-1711-410c-b1ee-443384592ed0/s85q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s85q7", prompt: "", imageUrl: "/__l5e/assets-v1/9016f29e-044a-4cc3-ad9f-b905d9824779/s85q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s85q8", prompt: "", imageUrl: "/__l5e/assets-v1/b9358ce4-bf4f-4a5c-927f-620997e2fa96/s85q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s85q9", prompt: "", imageUrl: "/__l5e/assets-v1/e968ab9c-31a0-469f-b5ed-6e13c9c3404b/s85q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s85q10", prompt: "", imageUrl: "/__l5e/assets-v1/41694583-2d3b-472b-a2c4-93f07377f3b3/s85q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s85q11", prompt: "", imageUrl: "/__l5e/assets-v1/580fef6c-087d-4faf-b362-c3184807e387/s85q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  86: [
    { id: "s86q1", prompt: "", imageUrl: "/__l5e/assets-v1/0f9f381c-63aa-4615-b5ea-87ec83b94833/s86q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s86q2", prompt: "", imageUrl: "/__l5e/assets-v1/ed806bd6-cc6e-475c-952b-c94dfdc5c387/s86q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s86q3", prompt: "", imageUrl: "/__l5e/assets-v1/fb419bb9-56e3-486e-bc3a-ce382a9847bd/s86q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s86q4", prompt: "", imageUrl: "/__l5e/assets-v1/0d704982-8d28-42ed-be74-c84a88744da7/s86q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s86q5", prompt: "", imageUrl: "/__l5e/assets-v1/1f310ab2-5e28-4b53-9e97-3d8966733d51/s86q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s86q6", prompt: "", imageUrl: "/__l5e/assets-v1/ec3dd4f2-36e9-4472-9000-c752e72e96f4/s86q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s86q7", prompt: "", imageUrl: "/__l5e/assets-v1/960f677a-2938-4f1a-ba43-56a2016245c8/s86q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s86q8", prompt: "", imageUrl: "/__l5e/assets-v1/25da314a-4f53-4ce1-8cc7-42756b424922/s86q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s86q9", prompt: "", imageUrl: "/__l5e/assets-v1/753b9906-00c6-4819-8ef1-6f0e15afdc65/s86q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s86q10", prompt: "", imageUrl: "/__l5e/assets-v1/504f6648-c0f5-4215-9aa7-cc356215e89b/s86q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s86q11", prompt: "", imageUrl: "/__l5e/assets-v1/81ec9ab6-335a-4170-8b7e-7029b3b09736/s86q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
  ],
  87: [
    { id: "s87q1", prompt: "", imageUrl: "/__l5e/assets-v1/ae2a5e0f-79a8-47c5-b667-18fddea67759/s87q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s87q2", prompt: "", imageUrl: "/__l5e/assets-v1/fc5dd5f9-1d6b-4a72-a40c-932574ef90f0/s87q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s87q3", prompt: "", imageUrl: "/__l5e/assets-v1/05fa0a73-c9c1-48c8-842f-b54bc587a212/s87q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s87q4", prompt: "", imageUrl: "/__l5e/assets-v1/7f2ac34f-e887-41d3-8bcc-0a3fcf22b4cf/s87q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s87q5", prompt: "", imageUrl: "/__l5e/assets-v1/13405f6f-db26-4a04-9a6d-94d5f0f47e8a/s87q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s87q6", prompt: "", imageUrl: "/__l5e/assets-v1/b6047107-9ef2-4fe1-bf5b-6573fa7021e4/s87q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s87q7", prompt: "", imageUrl: "/__l5e/assets-v1/5308e077-9937-4363-8dfe-8884b33bbb9d/s87q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s87q8", prompt: "", imageUrl: "/__l5e/assets-v1/7db7c6bb-9296-4bdb-8fb4-633f386b42a0/s87q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s87q9", prompt: "", imageUrl: "/__l5e/assets-v1/9c285c03-b6d1-43cd-b832-bef71a6896a4/s87q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s87q10", prompt: "", imageUrl: "/__l5e/assets-v1/0df31c7f-f875-4b2c-88da-470208d9419b/s87q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s87q11", prompt: "", imageUrl: "/__l5e/assets-v1/369d9eac-c3bb-4e66-a3ab-e8d5c9612bc3/s87q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
  ],
  88: [
    { id: "s88q1", prompt: "", imageUrl: "/__l5e/assets-v1/a1c4eb51-b369-44d2-896a-6071c04e6df7/s88q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s88q2", prompt: "", imageUrl: "/__l5e/assets-v1/cc7c19be-99d7-43f8-bea2-e08485f03916/s88q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s88q3", prompt: "", imageUrl: "/__l5e/assets-v1/983aee6e-454d-4992-bd2d-dbf8b791662c/s88q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s88q4", prompt: "", imageUrl: "/__l5e/assets-v1/c7907fe9-efbb-4a98-9ee7-8099ef85953a/s88q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s88q5", prompt: "", imageUrl: "/__l5e/assets-v1/ac639167-1302-46fd-8968-26c1b782cef4/s88q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s88q6", prompt: "", imageUrl: "/__l5e/assets-v1/57e7cbb5-69b8-4a0d-84a4-25b1439bf84f/s88q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s88q7", prompt: "", imageUrl: "/__l5e/assets-v1/b3404e3a-baa0-4fe3-b6cc-80e4d6e188fe/s88q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s88q8", prompt: "", imageUrl: "/__l5e/assets-v1/cc9fa0fc-e679-4c6b-8f98-32334c97937f/s88q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s88q9", prompt: "", imageUrl: "/__l5e/assets-v1/81ceff13-14e8-46c1-a364-ddc87e129066/s88q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s88q10", prompt: "", imageUrl: "/__l5e/assets-v1/4acc1858-ebf2-4ce6-9b4c-64b11d1d7211/s88q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s88q11", prompt: "", imageUrl: "/__l5e/assets-v1/95b78757-3831-4f1d-b58b-d7596c137a8d/s88q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
  ],
  89: [
    { id: "s89q1", prompt: "", imageUrl: "/__l5e/assets-v1/3e99131c-59f2-4792-8111-9d61d8fc48d7/s89q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s89q2", prompt: "", imageUrl: "/__l5e/assets-v1/6bd3efef-408d-4c4d-83b9-2966d5a15479/s89q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s89q3", prompt: "", imageUrl: "/__l5e/assets-v1/b7139d1e-bb7d-45df-87c5-95927f0fd593/s89q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s89q4", prompt: "", imageUrl: "/__l5e/assets-v1/8eb17da2-2184-4042-a5a5-7c8abab50230/s89q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s89q5", prompt: "", imageUrl: "/__l5e/assets-v1/3ab06e8e-c9b9-468a-b541-c64487701d3b/s89q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s89q6", prompt: "", imageUrl: "/__l5e/assets-v1/cef6b7d6-28bd-4386-9244-350f2fe000da/s89q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s89q7", prompt: "", imageUrl: "/__l5e/assets-v1/24013c89-8028-44cf-94ed-62bf74cb91c6/s89q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s89q8", prompt: "", imageUrl: "/__l5e/assets-v1/7fd636c8-4981-455f-b2db-99f164f2564d/s89q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s89q9", prompt: "", imageUrl: "/__l5e/assets-v1/13d7fa42-96e4-4532-b07a-c40a5d68ac78/s89q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s89q10", prompt: "", imageUrl: "/__l5e/assets-v1/4edaaf46-6b72-4761-bf82-9458d05302a2/s89q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 3 },
    { id: "s89q11", prompt: "", imageUrl: "/__l5e/assets-v1/13acb51f-79ee-4b17-9253-72f3a8955bab/s89q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
  ],
  90: [
    { id: "s90q1", prompt: "", imageUrl: "/__l5e/assets-v1/3bc99f3e-7568-46b3-9a01-d1eb95334021/s90q1.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s90q2", prompt: "", imageUrl: "/__l5e/assets-v1/a19d8963-4435-497d-b479-d696988f33bf/s90q2.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s90q3", prompt: "", imageUrl: "/__l5e/assets-v1/67bdf87d-9e5f-40d4-ab87-2d29717b3e47/s90q3.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s90q4", prompt: "", imageUrl: "/__l5e/assets-v1/5bf8a0c6-d628-4a39-8d27-2f911829597b/s90q4.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s90q5", prompt: "", imageUrl: "/__l5e/assets-v1/be61f363-5424-478e-8e43-acaa6e630e6d/s90q5.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s90q6", prompt: "", imageUrl: "/__l5e/assets-v1/3cb47c6d-5e10-4375-a9f5-32df8967d5b3/s90q6.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s90q7", prompt: "", imageUrl: "/__l5e/assets-v1/0a11fe86-5fec-41fc-be62-3f172fbd4526/s90q7.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s90q8", prompt: "", imageUrl: "/__l5e/assets-v1/7e26c4f1-5876-46ba-ad8b-45046a44e514/s90q8.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 1 },
    { id: "s90q9", prompt: "", imageUrl: "/__l5e/assets-v1/5b162a5f-1e74-4334-9ed9-35c7e81ebd7e/s90q9.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 2 },
    { id: "s90q10", prompt: "", imageUrl: "/__l5e/assets-v1/9baa5458-dce8-4747-aa82-1b7716d2c339/s90q10.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
    { id: "s90q11", prompt: "", imageUrl: "/__l5e/assets-v1/1c2b74c1-2214-4cc6-97de-fa677af486d4/s90q11.jpg", choices: ["أ", "ب", "ج", "د"], correctIndex: 0 },
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
  if (custom && custom.length > 0) return applyQuestionSvgFixes(custom);
  return applyQuestionSvgFixes(SEED_QUESTIONS[sectionNumber] ?? []);
}

export function saveQuestions(sectionNumber: number, questions: Question[]) {
  if (typeof window === "undefined") return;
  const all = loadAllQuestions();
  all[sectionNumber] = questions;
  window.localStorage.setItem(QUESTIONS_KEY, JSON.stringify(all));
  // Fire-and-forget: push to shared server bank so every student sees the edit.
  void pushQuestionsToServer(sectionNumber, questions);
}

// ─────────────── Server-backed question bank (shared across users) ───────────────
let hydratePromise: Promise<void> | null = null;

export function hydrateQuestionBankFromServer(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    try {
      const { fetchAllQuestionBank } = await import("./question-bank.functions");
      const rows = (await fetchAllQuestionBank()) as Array<{
        section_number: number;
        questions: Question[];
      }>;
      if (!rows || rows.length === 0) return;
      const merged = loadAllQuestions();
      for (const row of rows) {
        if (Array.isArray(row.questions) && row.questions.length > 0) {
          merged[row.section_number] = row.questions;
        }
      }
      window.localStorage.setItem(QUESTIONS_KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent("question-bank:hydrated"));
    } catch (e) {
      console.warn("[question-bank] hydrate failed", e);
    }
  })();
  return hydratePromise;
}

async function pushQuestionsToServer(sectionNumber: number, questions: Question[]) {
  try {
    const { saveSectionQuestionBank } = await import("./question-bank.functions");
    await saveSectionQuestionBank({ data: { section_number: sectionNumber, questions } });
  } catch (e) {
    console.warn("[question-bank] save failed", e);
  }
}

export function computeTimerSeconds(section: SectionConfig, questionCount: number): number {
  if (section.timerSeconds && section.timerSeconds > 0) return section.timerSeconds;
  return Math.max(SECONDS_PER_QUESTION, questionCount * SECONDS_PER_QUESTION);
}