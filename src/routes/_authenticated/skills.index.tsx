import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SKILLS } from "@/lib/skills-config";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/skills/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "التأسيس الأسرع — ٣٠ مهارة — منصة المِقْيَاس" },
      { name: "description", content: "التأسيس الأسرع في ٣٠ مهارة كمية، كل مهارة باختبار مستقل بوقت أو تدريب حر." },
      { property: "og:title", content: "التأسيس الأسرع — منصة المِقْيَاس" },
      { property: "og:description", content: "التأسيس الأسرع في ٣٠ مهارة كمية مع اختبارات وتدريبات مستقلة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SkillsList,
});

function SkillsList() {
  const { n: num } = useI18n();
  const navigate = useNavigate();

  return (
    <main dir="rtl" className="mx-auto max-w-6xl px-4 sm:px-6 py-8 md:py-12">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-soft text-teal-deep px-3 py-1 text-[11px] font-semibold border border-teal/30 mb-2">
            القسم الكمي · التأسيس الأسرع
          </div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground">التأسيس الأسرع</h1>
          <p className="text-sm text-muted-foreground mt-1">{num(SKILLS.length)} مهارة — اختر مهارة وابدأ اختبارها.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: "/dashboard", search: { track: "quantitative" } as any })}
          className="text-xs rounded-full border border-border bg-white px-3 py-1.5 text-muted-foreground hover:border-teal hover:text-teal-deep transition-colors"
        >
          ← رجوع لأقسام الكمي
        </button>
      </div>

      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
        {SKILLS.map((s) => (
          <Link
            key={s.id}
            to="/skills/$skillId"
            params={{ skillId: String(s.id) }}
            className="group luxury-card p-5 text-start transition-all hover:border-teal/50 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-11 w-11 rounded-2xl border border-border bg-gradient-to-br from-teal-soft to-white grid place-items-center font-bold text-teal-deep">
                {num(s.id)}
              </div>
              <span className="text-[11px] rounded-full bg-teal-soft text-teal-deep px-2.5 py-1 font-bold border border-teal/30">
                {num(s.questions.length)}
              </span>
            </div>
            <div className="font-display font-bold text-foreground text-[15px] leading-snug line-clamp-2">{s.title}</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
