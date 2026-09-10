import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Check, ChevronLeft, ChevronRight, Clock3, Dumbbell, Flag, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FOUNDATION_PRO_MAX_CHAPTERS, getFoundationProMaxChapter } from "@/lib/foundation-pro-max-config";

type Mode = "exam" | "practice";
type Search = { chapter?: string; mode?: Mode };

export const Route = createFileRoute("/_authenticated/foundation-pro-max")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): Search => ({
    chapter: typeof search.chapter === "string" ? search.chapter : undefined,
    mode: search.mode === "exam" || search.mode === "practice" ? search.mode : undefined,
  }),
  head: () => ({
    meta: [
      { title: "اختبارات التأسيس برو ماكس — منصة المِقْيَاس" },
      { name: "description", content: "اختبارات التأسيس برو ماكس مرتبة حسب الأبواب، بوقت أو كتدريب حر." },
      { property: "og:title", content: "اختبارات التأسيس برو ماكس — منصة المِقْيَاس" },
      { property: "og:description", content: "أسئلة اختيار من متعدد مرتبة حسب أبواب التأسيس الكمي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: FoundationProMax,
});

const arabicNumber = (value: number) => value.toLocaleString("ar-EG");
const answerLabels = ["أ", "ب", "ج", "د"];

function FoundationProMax() {
  const search = Route.useSearch();
  const chapter = search.chapter ? getFoundationProMaxChapter(search.chapter) : undefined;

  if (chapter && search.mode) return <ChapterExam chapterSlug={chapter.slug} mode={search.mode} />;
  if (chapter) return <ModePicker chapterSlug={chapter.slug} />;
  return <ChapterPicker />;
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="mb-2 text-xs font-bold text-teal-deep">القسم الكمي</p>
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Button variant="outline" asChild>
        <Link to="/dashboard" search={{ track: "quantitative" } as never}>
          <ArrowLeft /> رجوع للكمي
        </Link>
      </Button>
    </header>
  );
}

function ChapterPicker() {
  return (
    <main dir="rtl" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-10">
      <PageHeader title="التأسيس برو ماكس" subtitle="اختر الباب، ثم ابدأ اختبارًا بوقت أو تدريبًا بدون وقت." />
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FOUNDATION_PRO_MAX_CHAPTERS.map((chapter, index) => (
          <Link
            key={chapter.slug}
            to="/foundation-pro-max"
            search={{ chapter: chapter.slug }}
            className="group flex min-h-28 items-center gap-4 rounded-md border border-border bg-card p-5 transition-colors hover:border-teal"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-md bg-teal-soft font-display font-bold text-teal-deep">{arabicNumber(index + 1)}</span>
            <span className="min-w-0 flex-1"><strong className="block text-base text-card-foreground">{chapter.title}</strong><small className="mt-1 block text-muted-foreground">{arabicNumber(chapter.questions.length)} سؤالًا</small></span>
            <ChevronLeft className="text-muted-foreground transition-transform group-hover:-translate-x-1 group-hover:text-teal-deep" />
          </Link>
        ))}
      </section>
    </main>
  );
}

function ModePicker({ chapterSlug }: { chapterSlug: string }) {
  const chapter = getFoundationProMaxChapter(chapterSlug);
  if (!chapter) return null;
  return (
    <main dir="rtl" className="mx-auto max-w-4xl px-4 py-6 sm:px-6 md:py-12">
      <PageHeader title={chapter.title} subtitle={`${arabicNumber(chapter.questions.length)} سؤالًا اختياريًا`} />
      <section className="grid gap-4 md:grid-cols-2">
        <Link to="/foundation-pro-max" search={{ chapter: chapter.slug, mode: "exam" }} className="group rounded-md border-2 border-teal bg-card p-6 transition-colors hover:bg-teal-soft/40">
          <Clock3 className="mb-5 size-9 text-teal-deep" />
          <h2 className="text-xl font-bold">اختبار بوقت</h2>
          <p className="mt-2 text-sm text-muted-foreground">عداد زمني، تنقل بين الأسئلة، ثم نتيجة عند الإنهاء.</p>
        </Link>
        <Link to="/foundation-pro-max" search={{ chapter: chapter.slug, mode: "practice" }} className="group rounded-md border-2 border-gold bg-card p-6 transition-colors hover:bg-gold-soft/40">
          <Dumbbell className="mb-5 size-9 text-foreground" />
          <h2 className="text-xl font-bold">تدريب بدون وقت</h2>
          <p className="mt-2 text-sm text-muted-foreground">حل الأسئلة براحتك بدون عداد زمني.</p>
        </Link>
      </section>
      <Button className="mt-5" variant="ghost" asChild><Link to="/foundation-pro-max"><ChevronRight /> كل الأبواب</Link></Button>
    </main>
  );
}

function ChapterExam({ chapterSlug, mode }: { chapterSlug: string; mode: Mode }) {
  const navigate = useNavigate();
  const chapter = getFoundationProMaxChapter(chapterSlug);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);
  const initialSeconds = Math.max(300, (chapter?.questions.length ?? 0) * 75);
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (mode !== "exam" || finished) return;
    if (seconds <= 0) { setFinished(true); return; }
    const timer = window.setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [mode, finished, seconds]);

  const answered = Object.keys(answers).length;
  const time = useMemo(() => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`, [seconds]);
  if (!chapter) return null;

  if (finished) {
    return (
      <main dir="rtl" className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <section className="rounded-md border border-border bg-card p-6 text-center md:p-10">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-teal-soft text-teal-deep"><Check className="size-8" /></div>
          <h1 className="text-2xl font-bold">اكتمل {mode === "exam" ? "الاختبار" : "التدريب"}</h1>
          <p className="mt-2 text-muted-foreground">أجبت عن {arabicNumber(answered)} من {arabicNumber(chapter.questions.length)} سؤالًا.</p>
          <div className="mx-auto mt-6 max-w-sm border-y border-border py-4 text-sm text-muted-foreground">ستظهر درجة الصح والخطأ بعد إضافة ملف الإجابات المعتمد.</div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={() => { setIndex(0); setAnswers({}); setSeconds(initialSeconds); setFinished(false); }}><RotateCcw /> إعادة المحاولة</Button>
            <Button variant="outline" onClick={() => navigate({ to: "/foundation-pro-max", search: { chapter: chapter.slug } })}><BookOpen /> اختيار الطريقة</Button>
            <Button variant="ghost" onClick={() => navigate({ to: "/foundation-pro-max" })}>كل الأبواب</Button>
          </div>
        </section>
      </main>
    );
  }

  const question = chapter.questions[index];
  if (!question) return null;
  return (
    <main dir="rtl" className="mx-auto max-w-6xl px-3 py-4 sm:px-6 md:py-7">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div><p className="text-xs font-bold text-teal-deep">التأسيس برو ماكس</p><h1 className="font-display text-lg font-bold">{chapter.title}</h1></div>
        <div className="flex items-center gap-2">
          {mode === "exam" && <span dir="ltr" className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 font-mono text-sm"><Clock3 />{time}</span>}
          <Button variant="outline" size="sm" onClick={() => setFinished(true)}><Flag /> إنهاء</Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <section className="rounded-md border border-border bg-card p-3 sm:p-5">
          <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground"><span>السؤال {arabicNumber(index + 1)} من {arabicNumber(chapter.questions.length)}</span><span>{arabicNumber(answered)} مجاب</span></div>
          <div className="grid min-h-[280px] place-items-center overflow-auto rounded-md bg-background p-2 sm:min-h-[380px] sm:p-5">
            <img src={question.image} alt={`سؤال ${arabicNumber(index + 1)} من باب ${chapter.title}`} className="max-h-[470px] w-auto max-w-full object-contain" draggable={false} />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2" aria-label="اختر الإجابة">
            {answerLabels.map((label, answerIndex) => (
              <Button key={label} variant={answers[index] === answerIndex ? "default" : "outline"} className="h-12 text-lg font-bold" onClick={() => setAnswers((current) => ({ ...current, [index]: answerIndex }))}>{label}</Button>
            ))}
          </div>
          <div className="mt-4 flex justify-between gap-3">
            <Button variant="outline" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}><ChevronRight /> السابق</Button>
            {index === chapter.questions.length - 1 ? <Button onClick={() => setFinished(true)}><Flag /> إنهاء</Button> : <Button onClick={() => setIndex((value) => value + 1)}>التالي <ChevronLeft /></Button>}
          </div>
        </section>

        <aside className="rounded-md border border-border bg-card p-4 lg:sticky lg:top-4 lg:self-start">
          <h2 className="mb-3 text-sm font-bold">الأسئلة</h2>
          <div className="grid max-h-72 grid-cols-8 gap-1.5 overflow-y-auto lg:grid-cols-5">
            {chapter.questions.map((item, questionIndex) => (
              <Button key={item.id} variant={questionIndex === index ? "default" : answers[questionIndex] !== undefined ? "secondary" : "outline"} size="icon" className="size-9 text-xs" onClick={() => setIndex(questionIndex)}>{arabicNumber(questionIndex + 1)}</Button>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}