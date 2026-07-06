import { createFileRoute } from "@tanstack/react-router";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import professorHero from "@/assets/professor-hero.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.floor(v).toLocaleString("ar-EG") + suffix);
  useEffect(() => {
    if (inView) {
      const controls = animate(mv, to, { duration: 2.2, ease: [0.16, 1, 0.3, 1] });
      return controls.stop;
    }
  }, [inView, to, mv]);
  return <motion.span ref={ref}>{rounded}</motion.span>;
}

const stats = [
  { value: 150, suffix: "+", label: "قسماً كمياً شاملاً" },
  { value: 10000, suffix: "+", label: "سؤالاً ذكياً محاكياً" },
  { value: 100, suffix: "٪", label: "محرك نمر التفاعلي الهجين" },
];

const features = [
  {
    title: "السبورة الذكية المتطورة",
    desc: "قماشة رقمية عالية الاستجابة لرسم المعادلات والأشكال، مع حفظ تلقائي لكل سؤال على حدة.",
    icon: "✎",
  },
  {
    title: "دفتر الأخطاء الذكي",
    desc: "محرّك خفي يلتقط كل سؤال تُخطئ فيه ويعيد بناء اختبار مخصّص لنقاط ضعفك.",
    icon: "◈",
  },
  {
    title: "محاضرات مشفّرة عالية الدقة",
    desc: "بث محمي بروابط زائلة وحماية عسكرية ضد التنزيل والتقاط الشاشة.",
    icon: "▶",
  },
  {
    title: "محاكي نمر 2.0",
    desc: "بيئة اختبار معزولة ببصمة الطالب، ومؤقّت تصاعدي، ولوحة أسئلة تفاعلية.",
    icon: "◐",
  },
  {
    title: "خريطة الـ 150 قسماً",
    desc: "شبكة إتقان بصرية لكل فروع الكمي: الجبر، الهندسة، الحساب، الإحصاء، المقارنات.",
    icon: "◧",
  },
  {
    title: "نظام إنجازات ذهبي",
    desc: "شارات ومستويات وحرارة تعلّم يومية تحفّزك نحو الوصول للمئة الكاملة.",
    icon: "★",
  },
];

function Index() {
  return (
    <main className="relative min-h-screen overflow-hidden text-foreground">
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
            <div className="font-display text-lg font-bold tracking-tight">المِقْيَاس</div>
            <div className="text-[11px] text-muted-foreground">Al-Miqyas Academy</div>
          </div>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition hover:text-foreground">المزايا</a>
          <a href="#stats" className="transition hover:text-foreground">الأرقام</a>
          <a href="#academy" className="transition hover:text-foreground">الأكاديمية</a>
        </nav>
        <a href="/auth" className="rounded-full border border-gold/40 px-5 py-2 text-sm text-gold-soft transition hover:border-gold hover:bg-gold/10">
          دخول الطالب
        </a>
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
            كبير خبراء القسم الكمي — القدرات العامة
          </div>
          <h1 className="font-display text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            قُد قدراتك نحو
            <br />
            <span className="text-gold-gradient">الـ 100٪</span> مع كبير الخبراء
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            منظومة تدريب سينمائية مع الأستاذ <b className="text-foreground">أسامة فتح الدين محمد</b> — ١٥٠ قسماً كمياً، محاكي نمر التفاعلي، سبورة ذكية، ودفتر أخطاء يعيد بناء اختبارك حتى تتقن كل ضعف.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="/auth"
              className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-l from-gold to-gold-soft px-8 py-4 font-display text-base font-bold text-primary-foreground animate-pulse-gold transition hover:scale-[1.02]"
            >
              ابدأ رحلة التميز الآن
              <span className="transition group-hover:-translate-x-1">←</span>
            </a>
            <a href="#features" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              استكشف المنصة
            </a>
          </div>

          <div className="mt-14 flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex -space-x-2 rtl:space-x-reverse">
              {["ج", "ه", "ن", "س"].map((c, i) => (
                <div key={i} className="grid h-8 w-8 place-items-center rounded-full border border-gold/40 bg-teal font-display text-[10px]">{c}</div>
              ))}
            </div>
            انضم لآلاف الطلاب الذين رفعوا نتائجهم بأكثر من ٣٠ نقطة
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
              <div className="font-display text-lg font-bold">أ. أسامة فتح الدين</div>
              <div className="text-xs text-muted-foreground">كبير خبراء القسم الكمي · +١٥ عاماً تدريب</div>
            </div>
          </div>
          <div aria-hidden className="absolute -top-6 -left-6 h-20 w-20 rounded-2xl border border-gold/40 bg-teal-deep/70 backdrop-blur animate-float-slow" />
        </motion.div>
      </section>

      {/* TELEMETRY */}
      <section id="stats" className="mx-auto max-w-7xl px-6 pb-24">
        <div className="glass-card grid grid-cols-1 divide-y divide-white/5 px-8 py-10 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:rtl:divide-x-reverse">
          {stats.map((s) => (
            <div key={s.label} className="px-6 py-6 text-center">
              <div className="font-display text-5xl font-black tabular-nums text-gold-gradient sm:text-6xl">
                <Counter to={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-3 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-6 pb-28">
        <div className="mb-14 max-w-2xl">
          <div className="mb-3 text-xs uppercase tracking-[0.3em] text-gold-soft">الأدوات السيادية</div>
          <h2 className="font-display text-4xl font-black leading-tight sm:text-5xl">
            كل ما تحتاجه للسيطرة على <span className="text-gold-gradient">القسم الكمي</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            بيئة تدريب متكاملة صُممت بجودة سينمائية — من السبورة الذكية إلى محرك نمر الهجين ودفتر الأخطاء الذاتي.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
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
              <h3 className="font-display text-xl font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
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
            هل أنت مستعد للانضمام إلى <span className="text-gold-gradient">صفوة المتفوقين</span>؟
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-muted-foreground">
            سجّل الآن، وابدأ رحلتك داخل الأكاديمية الرقمية الأكثر تطوراً لتدريب القدرات الكمي في الوطن العربي.
          </p>
          <a
            href="/auth"
            className="relative mt-8 inline-flex items-center gap-3 rounded-full bg-gradient-to-l from-gold to-gold-soft px-8 py-4 font-display text-base font-bold text-primary-foreground animate-pulse-gold"
          >
            احجز مقعدك الآن
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
              <div className="font-display font-bold">المِقْيَاس الذكية</div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              منصة أ. أسامة فتح الدين محمد للتفوق في القسم الكمي من اختبار القدرات العامة.
            </p>
          </div>
          <div>
            <div className="mb-3 text-xs uppercase tracking-widest text-gold-soft">المنصة</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">المزايا</a></li>
              <li><a href="#stats" className="hover:text-foreground">أرقامنا</a></li>
              <li><a href="/auth" className="hover:text-foreground">تسجيل الدخول</a></li>
            </ul>
          </div>
          <div>
            <div className="mb-3 text-xs uppercase tracking-widest text-gold-soft">قانوني</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">سياسة الخصوصية</a></li>
              <li><a href="#" className="hover:text-foreground">شروط الاستخدام</a></li>
              <li><a href="#" className="hover:text-foreground">حماية المحتوى</a></li>
            </ul>
          </div>
          <div>
            <div className="mb-3 text-xs uppercase tracking-widest text-gold-soft">تواصل</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>الرياض · المملكة العربية السعودية</li>
              <li>support@al-miqyas.com</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} أكاديمية المِقْيَاس — جميع الحقوق محفوظة.
        </div>
      </footer>
    </main>
  );
}
