import { createFileRoute } from "@tanstack/react-router";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import professorHero from "@/assets/professor-hero.jpg";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "منصة المِقْيَاس الذكية | تدريب القدرات الكمي واللفظي" },
      {
        name: "description",
        content:
          "تدرّب على القسم الكمي واللفظي من اختبار القدرات العامة مع أ. أسامة فتح الدين: أقسام مسلسلة، محاكي نمر التفاعلي، سبورة ذكية، ودفتر أخطاء ذكي.",
      },
      { property: "og:title", content: "منصة المِقْيَاس الذكية | تدريب القدرات الكمي واللفظي" },
      {
        property: "og:description",
        content:
          "أقسام مسلسلة، محاكي نمر التفاعلي، سبورة ذكية، ودفتر أخطاء ذكي للتفوق في اختبار القدرات العامة.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://miqyas.info/" },
    ],
    links: [{ rel: "canonical", href: "https://miqyas.info/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "EducationalOrganization",
              "@id": "https://miqyas.info/#organization",
              name: "أكاديمية المِقْيَاس",
              alternateName: "Al-Miqyas Academy",
              url: "https://miqyas.info/",
              logo: "https://miqyas.info/favicon.ico",
              areaServed: "SA",
              description:
                "أكاديمية رقمية لتدريب طلاب اختبار القدرات العامة على القسمين الكمي واللفظي.",
            },
            {
              "@type": "WebSite",
              "@id": "https://miqyas.info/#website",
              url: "https://miqyas.info/",
              name: "منصة المِقْيَاس الذكية",
              inLanguage: "ar",
              publisher: { "@id": "https://miqyas.info/#organization" },
            },
            {
              "@type": "Course",
              name: "تدريب القسم الكمي — اختبار القدرات العامة",
              description:
                "١٥٠ قسماً كمياً مع محاكي نمر التفاعلي، سبورة ذكية، ودفتر أخطاء ذكي.",
              inLanguage: "ar",
              provider: { "@id": "https://miqyas.info/#organization" },
            },
          ],
        }),
      },
    ],
  }),
  component: Index,
});

function Counter({ to, suffix = "", locale = "ar-EG" }: { to: number; suffix?: string; locale?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.floor(v).toLocaleString(locale) + suffix);
  useEffect(() => {
    if (inView) {
      const controls = animate(mv, to, { duration: 2.2, ease: [0.16, 1, 0.3, 1] });
      return controls.stop;
    }
  }, [inView, to, mv]);
  return <motion.span ref={ref}>{rounded}</motion.span>;
}

const stats = [
  { value: 150, suffix: "+", key: "home.stat1" },
  { value: 10000, suffix: "+", key: "home.stat2" },
  { value: 100, suffix: "٪", key: "home.stat3" },
];

const features = [
  { titleKey: "home.f1t", descKey: "home.f1d", icon: "\u270e" },
  { titleKey: "home.f2t", descKey: "home.f2d", icon: "\u25c8" },
  { titleKey: "home.f3t", descKey: "home.f3d", icon: "\u25b6" },
  { titleKey: "home.f4t", descKey: "home.f4d", icon: "\u25d0" },
  { titleKey: "home.f5t", descKey: "home.f5d", icon: "\u25e7" },
  { titleKey: "home.f6t", descKey: "home.f6d", icon: "\u2605" },
];

function Index() {
  const { t, dir, lang } = useI18n();
  return (
    <main dir={dir} className="relative min-h-screen overflow-hidden text-foreground">
      {/* floating geometric background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-40 -right-24 h-72 w-72 rounded-full bg-teal-glow/20 blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 -left-24 h-96 w-96 rounded-full bg-gold/10 blur-3xl animate-float-slow" style={{ animationDelay: "-4s" }} />
        <svg className="absolute top-1/3 left-10 h-24 w-24 opacity-20 animate-float-slow" viewBox="0 0 100 100" fill="none">
          <polygon points="50,5 95,80 5,80" stroke="oklch(0.78 0.14 82)" strokeWidth="1.2" />
        </svg>
        <svg className="absolute bottom-1/4 right-16 h-20 w-20 opacity-20 animate-float-slow" viewBox="0 0 100 100" fill="none" style={{ animationDelay: "-3s" }}>
          <circle cx="50" cy="50" r="42" stroke="oklch(0.55 0.12 172)" strokeWidth="1.2" />
          <circle cx="50" cy="50" r="24" stroke="oklch(0.78 0.14 82)" strokeWidth="1" />
        </svg>
      </div>

      {/* NAV */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-gold/40 bg-teal-deep/60 font-display text-lg text-gold-gradient">م</div>
          <div className="leading-tight">
            <div className="font-display text-lg font-bold tracking-tight">{t("brand.name")}</div>
            <div className="text-[11px] text-muted-foreground">Al-Miqyas Academy</div>
          </div>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition hover:text-foreground">{t("nav.features")}</a>
          <a href="#stats" className="transition hover:text-foreground">{t("nav.stats")}</a>
          <a href="#academy" className="transition hover:text-foreground">{t("nav.academy")}</a>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <a href="/auth" className="rounded-full border border-gold/40 px-5 py-2 text-sm text-gold-soft transition hover:border-gold hover:bg-gold/10">
            {t("nav.studentLogin")}
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 pb-24 pt-10 lg:grid-cols-[1.15fr_1fr] lg:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs text-gold-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
            {t("home.badge")}
          </div>
          <h1 className="font-display text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            {t("home.h1a")}
            <br />
            <span className="text-gold-gradient">100%</span> {t("home.h1b")}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t("home.lead")}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="/dashboard"
              className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-l from-gold to-gold-soft px-8 py-4 font-display text-base font-bold text-primary-foreground animate-pulse-gold transition hover:scale-[1.02]"
            >
              {t("home.cta")}
              <span className="transition group-hover:-translate-x-1">←</span>
            </a>
            <a href="#features" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              {t("home.explore")}
            </a>
          </div>

          <div className="mt-14 flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex -space-x-2 rtl:space-x-reverse">
              {["ج", "ه", "ن", "س"].map((c, i) => (
                <div key={i} className="grid h-8 w-8 place-items-center rounded-full border border-gold/40 bg-teal font-display text-[10px]">{c}</div>
              ))}
            </div>
            {t("home.social")}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto w-full max-w-md"
        >
          <div aria-hidden className="absolute -inset-8 rounded-[2rem] bg-gradient-to-tr from-gold/30 via-transparent to-teal-glow/30 blur-2xl" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-gold/30 gold-ring">
            <img
              src={professorHero}
              alt="الأستاذ أسامة فتح الدين محمد — كبير خبراء القسم الكمي"
              width={1024}
              height={1280}
              className="h-full w-full object-cover"
            />
            {/* cinematic color grade */}
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-teal-deep via-teal-deep/40 to-transparent mix-blend-multiply" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gold/15" />
            {/* subtle vignette */}
            <div aria-hidden className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 120px 20px oklch(0.14 0.04 175 / 0.7)" }} />
            <div className="absolute bottom-5 right-5 left-5 glass-card px-5 py-4">
              <div className="font-display text-lg font-bold">{t("home.profTitle")}</div>
              <div className="text-xs text-muted-foreground">{t("home.profSub")}</div>
            </div>
          </div>
          <div aria-hidden className="absolute -top-6 -left-6 h-20 w-20 rounded-2xl border border-gold/40 bg-teal-deep/70 backdrop-blur animate-float-slow" />
        </motion.div>
      </section>

      {/* TELEMETRY */}
      <section id="stats" className="mx-auto max-w-7xl px-6 pb-24">
        <div className="glass-card grid grid-cols-1 divide-y divide-white/5 px-8 py-10 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:rtl:divide-x-reverse">
          {stats.map((s) => (
            <div key={s.key} className="px-6 py-6 text-center">
              <div className="font-display text-5xl font-black tabular-nums text-gold-gradient sm:text-6xl">
                <Counter to={s.value} suffix={s.suffix} locale={lang === "ar" ? "ar-EG" : "en-US"} />
              </div>
              <div className="mt-3 text-sm text-muted-foreground">{t(s.key)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-6 pb-28">
        <div className="mb-14 max-w-2xl">
          <div className="mb-3 text-xs uppercase tracking-[0.3em] text-gold-soft">{t("home.toolsKicker")}</div>
          <h2 className="font-display text-4xl font-black leading-tight sm:text-5xl">
            {t("home.toolsTitleA")} <span className="text-gold-gradient">{t("home.toolsTitleB")}</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            {t("home.toolsLead")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.titleKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6, rotateX: 3, rotateY: -3 }}
              className="group relative glass-card p-7 transition [transform-style:preserve-3d]"
            >
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl border border-gold/40 bg-teal-deep/60 font-display text-xl text-gold">
                {f.icon}
              </div>
              <h3 className="font-display text-xl font-bold">{t(f.titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(f.descKey)}</p>
              <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[1.25rem] opacity-0 transition group-hover:opacity-100" style={{ boxShadow: "inset 0 0 0 1px oklch(0.78 0.14 82 / 0.4)" }} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="academy" className="mx-auto max-w-7xl px-6 pb-28">
        <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-teal to-teal-deep p-12 text-center">
          <div aria-hidden className="absolute inset-0 bg-shimmer opacity-40" />
          <h2 className="relative font-display text-3xl font-black sm:text-4xl">
            {t("home.ctaTitleA")} <span className="text-gold-gradient">{t("home.ctaTitleB")}</span>
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-muted-foreground">
            {t("home.ctaLead")}
          </p>
          <a
            href="/auth"
            className="relative mt-8 inline-flex items-center gap-3 rounded-full bg-gradient-to-l from-gold to-gold-soft px-8 py-4 font-display text-base font-bold text-primary-foreground animate-pulse-gold"
          >
            {t("home.ctaBtn")}
            <span>←</span>
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-14 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-gold/40 bg-teal-deep/60 font-display text-gold-gradient">م</div>
              <div className="font-display font-bold">{t("brand.full")}</div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {t("home.footerLead")}
            </p>
          </div>
          <div>
            <div className="mb-3 text-xs uppercase tracking-widest text-gold-soft">{t("home.footerPlatform")}</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">{t("nav.features")}</a></li>
              <li><a href="#stats" className="hover:text-foreground">{t("nav.stats")}</a></li>
              <li><a href="/auth" className="hover:text-foreground">{t("nav.login")}</a></li>
            </ul>
          </div>
          <div>
            <div className="mb-3 text-xs uppercase tracking-widest text-gold-soft">{t("home.footerLegal")}</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">{t("home.privacy")}</a></li>
              <li><a href="#" className="hover:text-foreground">{t("home.terms")}</a></li>
              <li><a href="#" className="hover:text-foreground">{t("home.protection")}</a></li>
            </ul>
          </div>
          <div>
            <div className="mb-3 text-xs uppercase tracking-widest text-gold-soft">{t("home.footerContact")}</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{t("home.address")}</li>
              <li>support@al-miqyas.com</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {t("home.rights")}
        </div>
      </footer>
    </main>
  );
}
