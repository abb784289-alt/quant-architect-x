import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FOUNDATION_PRO_MAX_CHAPTERS } from "@/lib/foundation-pro-max-config";
import {
  getProMaxSettings,
  saveProMaxChapter,
  saveProMaxQuestion,
  type ProMaxChapterSetting,
  type ProMaxQuestionSetting,
} from "@/lib/pro-max.functions";

const answerLabels = ["أ", "ب", "ج", "د"];
const ar = (n: number) => n.toLocaleString("ar-EG");

export default function ProMaxAdminPanel() {
  const [slug, setSlug] = useState(FOUNDATION_PRO_MAX_CHAPTERS[0]?.slug ?? "");
  const [chapterMap, setChapterMap] = useState<Record<string, ProMaxChapterSetting>>({});
  const [questionMap, setQuestionMap] = useState<Record<string, ProMaxQuestionSetting>>({});
  const [loading, setLoading] = useState(true);
  const [savingChapter, setSavingChapter] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    getProMaxSettings()
      .then((res) => {
        setChapterMap(Object.fromEntries(res.chapters.map((c) => [c.slug, c])));
        setQuestionMap(Object.fromEntries(res.questions.map((q) => [q.question_id, q])));
      })
      .catch((e) => setStatus(e?.message ?? "تعذّر تحميل الإعدادات"))
      .finally(() => setLoading(false));
  }, []);

  const chapter = useMemo(() => FOUNDATION_PRO_MAX_CHAPTERS.find((c) => c.slug === slug), [slug]);
  const setting = chapterMap[slug];
  const [titleDraft, setTitleDraft] = useState("");
  const [partsDraft, setPartsDraft] = useState(2);

  useEffect(() => {
    setTitleDraft(setting?.title ?? chapter?.title ?? "");
    setPartsDraft(setting?.parts ?? (slug === "powers" ? 4 : 2));
  }, [slug, setting, chapter]);

  const chapterHidden = setting?.hidden ?? false;

  async function persistChapter(next: { title?: string; parts?: number; hidden?: boolean }) {
    if (!chapter) return;
    setSavingChapter(true);
    const payload = {
      slug: chapter.slug,
      title: (next.title ?? titleDraft).trim() || chapter.title,
      parts: next.parts ?? partsDraft,
      hidden: next.hidden ?? chapterHidden,
    };
    try {
      await saveProMaxChapter({ data: payload });
      setChapterMap((m) => ({ ...m, [chapter.slug]: payload }));
      setStatus("تم الحفظ");
    } catch (e: any) {
      setStatus(e?.message ?? "تعذّر الحفظ");
    } finally {
      setSavingChapter(false);
    }
  }

  async function persistQuestion(questionId: string, next: { correct_index?: number | null; hidden?: boolean }) {
    if (!chapter) return;
    const base = questionMap[questionId];
    const fallback = chapter.questions.find((q) => q.id === questionId)?.correctIndex ?? null;
    const payload: ProMaxQuestionSetting = {
      question_id: questionId,
      chapter_slug: chapter.slug,
      correct_index: next.correct_index !== undefined ? next.correct_index : base?.correct_index ?? fallback,
      hidden: next.hidden !== undefined ? next.hidden : base?.hidden ?? false,
    };
    setQuestionMap((m) => ({ ...m, [questionId]: payload }));
    try {
      await saveProMaxQuestion({ data: payload });
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
        <h3 className="mb-2 px-2 text-sm font-bold">أبواب برو ماكس</h3>
        <div className="max-h-[560px] space-y-1 overflow-y-auto">
          {FOUNDATION_PRO_MAX_CHAPTERS.map((c) => {
            const s = chapterMap[c.slug];
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => setSlug(c.slug)}
                className={
                  "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-right text-sm transition-colors " +
                  (slug === c.slug ? "bg-teal-soft font-bold text-teal-deep" : "hover:bg-surface-2")
                }
              >
                <span className="truncate">{s?.title ?? c.title}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {s?.hidden ? "مخفي" : ar(c.questions.length)}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="space-y-4">
        {chapter && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_auto] md:items-end">
              <label className="block text-sm">
                <span className="mb-1 block font-semibold">اسم الباب</span>
                <input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold">عدد الأجزاء</span>
                <select
                  value={partsDraft}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setPartsDraft(v);
                    void persistChapter({ parts: v });
                  }}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>{ar(n)}</option>
                  ))}
                </select>
              </label>
              <div className="flex gap-2">
                <Button onClick={() => persistChapter({})} disabled={savingChapter}>
                  <Save /> حفظ
                </Button>
                <Button variant={chapterHidden ? "default" : "outline"} onClick={() => persistChapter({ hidden: !chapterHidden })}>
                  {chapterHidden ? <EyeOff /> : <Eye />} {chapterHidden ? "مخفي" : "ظاهر"}
                </Button>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {ar(chapter.questions.length)} سؤالًا — المخفي منها {ar(chapter.questions.filter((q) => questionMap[q.id]?.hidden).length)}
              {status && <span className="mr-2 text-teal-deep">• {status}</span>}
            </p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {chapter?.questions.map((q, i) => {
            const s = questionMap[q.id];
            const correct = s?.correct_index ?? q.correctIndex;
            const hidden = s?.hidden ?? false;
            return (
              <article key={q.id} className={"rounded-2xl border border-border bg-card p-3 " + (hidden ? "opacity-50" : "")}>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-bold">سؤال {ar(i + 1)}</span>
                  <button
                    type="button"
                    onClick={() => persistQuestion(q.id, { hidden: !hidden })}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-muted-foreground hover:text-foreground"
                  >
                    {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    {hidden ? "مخفي" : "ظاهر"}
                  </button>
                </div>
                <div className="grid min-h-32 place-items-center overflow-hidden rounded-xl bg-background p-2">
                  <img src={q.image} alt={`سؤال ${ar(i + 1)}`} loading="lazy" className="max-h-56 w-auto max-w-full object-contain" />
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {answerLabels.map((label, idx) => (
                    <Button
                      key={label}
                      size="sm"
                      variant={correct === idx ? "default" : "outline"}
                      onClick={() => persistQuestion(q.id, { correct_index: idx })}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
