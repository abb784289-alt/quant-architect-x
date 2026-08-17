import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "ar" | "en";
const STORAGE_KEY = "app_lang";

type Dict = Record<string, string>;

const ar: Dict = {
  "nav.features": "المزايا",
  "nav.stats": "الأرقام",
  "nav.academy": "الأكاديمية",
  "nav.studentLogin": "دخول الطالب",
  "nav.tracks": "المسارات",
  "nav.quant": "كمي",
  "nav.verbal": "لفظي",
  "nav.admin": "لوحة التحكم",
  "nav.logout": "تسجيل الخروج",
  "nav.login": "تسجيل الدخول",
  "brand.name": "المِقْيَاس",
  "brand.sub": "أ. أسامة فتح الدين",
  "brand.full": "منصة المِقْيَاس الذكية",

  "home.badge": "كبير خبراء القسم الكمي — القدرات العامة",
  "home.h1a": "قُد قدراتك نحو",
  "home.h1b": "مع كبير الخبراء",
  "home.lead": "منظومة تدريب سينمائية مع الأستاذ أسامة فتح الدين محمد — ١٥٠ قسماً كمياً، محاكي نمر التفاعلي، سبورة ذكية، ودفتر أخطاء يعيد بناء اختبارك حتى تتقن كل ضعف.",
  "home.cta": "ابدأ رحلة التميز الآن",
  "home.explore": "استكشف المنصة",
  "home.social": "انضم لآلاف الطلاب الذين رفعوا نتائجهم بأكثر من ٣٠ نقطة",
  "home.profTitle": "أ. أسامة فتح الدين",
  "home.profSub": "كبير خبراء القسم الكمي · +١٥ عاماً تدريب",
  "home.toolsKicker": "الأدوات السيادية",
  "home.toolsTitleA": "كل ما تحتاجه للسيطرة على",
  "home.toolsTitleB": "القسم الكمي",
  "home.toolsLead": "بيئة تدريب متكاملة صُممت بجودة سينمائية — من السبورة الذكية إلى محرك نمر الهجين ودفتر الأخطاء الذاتي.",
  "home.ctaTitleA": "هل أنت مستعد للانضمام إلى",
  "home.ctaTitleB": "صفوة المتفوقين",
  "home.ctaLead": "سجّل الآن، وابدأ رحلتك داخل الأكاديمية الرقمية الأكثر تطوراً لتدريب القدرات الكمي في الوطن العربي.",
  "home.ctaBtn": "احجز مقعدك الآن",
  "home.footerLead": "منصة أ. أسامة فتح الدين محمد للتفوق في القسم الكمي من اختبار القدرات العامة.",
  "home.footerPlatform": "المنصة",
  "home.footerLegal": "قانوني",
  "home.footerContact": "تواصل",
  "home.privacy": "سياسة الخصوصية",
  "home.terms": "شروط الاستخدام",
  "home.protection": "حماية المحتوى",
  "home.address": "الرياض · المملكة العربية السعودية",
  "home.rights": "أكاديمية المِقْيَاس — جميع الحقوق محفوظة.",
  "home.stat1": "قسماً كمياً شاملاً",
  "home.stat2": "سؤالاً ذكياً محاكياً",
  "home.stat3": "محرك نمر التفاعلي الهجين",
  "home.f1t": "السبورة الذكية المتطورة",
  "home.f1d": "قماشة رقمية عالية الاستجابة لرسم المعادلات والأشكال، مع حفظ تلقائي لكل سؤال على حدة.",
  "home.f2t": "دفتر الأخطاء الذكي",
  "home.f2d": "محرّك خفي يلتقط كل سؤال تُخطئ فيه ويعيد بناء اختبار مخصّص لنقاط ضعفك.",
  "home.f3t": "محاضرات مشفّرة عالية الدقة",
  "home.f3d": "بث محمي بروابط زائلة وحماية عسكرية ضد التنزيل والتقاط الشاشة.",
  "home.f4t": "محاكي نمر 2.0",
  "home.f4d": "بيئة اختبار معزولة ببصمة الطالب، ومؤقّت تصاعدي، ولوحة أسئلة تفاعلية.",
  "home.f5t": "خريطة الـ 150 قسماً",
  "home.f5d": "شبكة إتقان بصرية لكل فروع الكمي: الجبر، الهندسة، الحساب، الإحصاء، المقارنات.",
  "home.f6t": "نظام إنجازات ذهبي",
  "home.f6d": "شارات ومستويات وحرارة تعلّم يومية تحفّزك نحو الوصول للمئة الكاملة.",

  "auth.subtitle": "بوابة الدخول الرسمية — أ. أسامة فتح الدين",
  "auth.login": "تسجيل الدخول",
  "auth.register": "إنشاء حساب",
  "auth.email": "البريد الإلكتروني",
  "auth.password": "كلمة المرور",
  "auth.fullName": "الاسم بالكامل",
  "auth.mobile": "رقم الجوال",
  "auth.namePlaceholder": "محمد أحمد",
  "auth.passwordHint": "6 أحرف فأكثر",
  "auth.signingIn": "جارٍ الدخول...",
  "auth.enter": "دخول",
  "auth.creating": "جارٍ الإنشاء...",
  "auth.createAccount": "إنشاء الحساب",
  "auth.secureNote": "الدخول محمي عبر بروتوكولات آمنة — كلمة المرور لا تُخزَّن على جهازك.",
  "auth.or": "أو",
  "auth.google": "المتابعة باستخدام جوجل",
  "auth.googleError": "تعذّر تسجيل الدخول عبر جوجل. حاول مجدداً.",
  "auth.missingCreds": "من فضلك أدخل البريد وكلمة المرور.",
  "auth.badCreds": "بيانات الدخول غير صحيحة.",
  "auth.fillAll": "من فضلك أكمل جميع الحقول.",
  "auth.badEmail": "صيغة البريد الإلكتروني غير صحيحة.",
  "auth.shortPassword": "كلمة المرور يجب أن تكون 6 أحرف فأكثر.",
  "auth.emailTaken": "هذا البريد مسجل بالفعل.",
  "auth.signupFailed": "تعذّر إنشاء الحساب.",
  "auth.signupOk": "تم إنشاء الحساب. تحقّق من بريدك لتأكيد الحساب ثم سجّل الدخول.",

  "tracks.kicker": "اختر المسار",
  "tracks.title": "اختر المسار الذي تريد التدرّب عليه",
  "tracks.lead": "كل مسار مستقل تمامًا — أقسامه وأخطاؤه وتأسيسه.",
  "tracks.start": "ابدأ التدرّب",
  "tracks.sections": "قسم",
  "tracks.hint": "يمكنك التنقل بين المسارَين في أي وقت من رأس الصفحة.",

  "gate.title": "أدخل كود التفعيل",
  "gate.lead": "لبدء رحلتك، أدخل الكود الذي حصلت عليه من الأستاذ أسامة.",
  "gate.submit": "تفعيل الحساب",
  "gate.checking": "جارٍ التحقق...",
  "gate.note": "الكود يُستخدم مرة واحدة ويُربط بحسابك بشكل دائم.",
  "gate.invalid": "الكود غير صحيح.",
  "gate.disabled": "هذا الكود موقوف.",
  "gate.expired": "انتهت صلاحية هذا الكود.",
  "gate.notAuth": "الرجاء تسجيل الدخول مجدداً.",
  "gate.failed": "تعذّر التحقق من الكود.",
  "gate.error": "حدث خطأ. حاول مجدداً.",
  "common.verifying": "جارٍ التحقق...",
  "lang.switch": "English",
};

const en: Dict = {
  "nav.features": "Features",
  "nav.stats": "Numbers",
  "nav.academy": "Academy",
  "nav.studentLogin": "Student login",
  "nav.tracks": "Tracks",
  "nav.quant": "Quantitative",
  "nav.verbal": "Verbal",
  "nav.admin": "Admin panel",
  "nav.logout": "Sign out",
  "nav.login": "Sign in",
  "brand.name": "Al-Miqyas",
  "brand.sub": "Mr. Osama Fathaldin",
  "brand.full": "Al-Miqyas Smart Platform",

  "home.badge": "Lead expert in the Quantitative section — GAT",
  "home.h1a": "Drive your aptitude toward",
  "home.h1b": "with the lead expert",
  "home.lead": "A cinematic training system with Mr. Osama Fathaldin — 150 quantitative sections, the interactive Nimar simulator, a smart whiteboard, and a mistake notebook that rebuilds your test until every weakness is mastered.",
  "home.cta": "Start your journey now",
  "home.explore": "Explore the platform",
  "home.social": "Join thousands of students who raised their scores by 30+ points",
  "home.profTitle": "Mr. Osama Fathaldin",
  "home.profSub": "Lead quantitative expert · 15+ years of teaching",
  "home.toolsKicker": "Signature tools",
  "home.toolsTitleA": "Everything you need to master the",
  "home.toolsTitleB": "Quantitative section",
  "home.toolsLead": "A complete training environment built to cinematic quality — from the smart whiteboard to the hybrid Nimar engine and the self-building mistake notebook.",
  "home.ctaTitleA": "Ready to join the",
  "home.ctaTitleB": "top achievers",
  "home.ctaLead": "Sign up now and start your journey inside the most advanced digital academy for quantitative aptitude training in the Arab world.",
  "home.ctaBtn": "Reserve your seat",
  "home.footerLead": "Mr. Osama Fathaldin's platform for excelling in the quantitative section of the GAT.",
  "home.footerPlatform": "Platform",
  "home.footerLegal": "Legal",
  "home.footerContact": "Contact",
  "home.privacy": "Privacy policy",
  "home.terms": "Terms of use",
  "home.protection": "Content protection",
  "home.address": "Riyadh · Saudi Arabia",
  "home.rights": "Al-Miqyas Academy — All rights reserved.",
  "home.stat1": "comprehensive quantitative sections",
  "home.stat2": "smart simulated questions",
  "home.stat3": "hybrid interactive Nimar engine",
  "home.f1t": "Advanced smart whiteboard",
  "home.f1d": "A highly responsive digital canvas for equations and figures, auto-saved per question.",
  "home.f2t": "Smart mistake notebook",
  "home.f2d": "A silent engine that captures every mistake and rebuilds a custom test for your weak points.",
  "home.f3t": "Encrypted high-definition lectures",
  "home.f3d": "Protected streaming with expiring links and strong protection against downloads and screen capture.",
  "home.f4t": "Nimar simulator 2.0",
  "home.f4d": "An isolated exam environment with student fingerprint, live timer, and an interactive question grid.",
  "home.f5t": "The 150-section map",
  "home.f5d": "A visual mastery grid across all quantitative branches: algebra, geometry, arithmetic, statistics, comparisons.",
  "home.f6t": "Golden achievement system",
  "home.f6d": "Badges, levels, and a daily learning streak that push you toward a perfect score.",

  "auth.subtitle": "Official login gateway — Mr. Osama Fathaldin",
  "auth.login": "Sign in",
  "auth.register": "Create account",
  "auth.email": "Email address",
  "auth.password": "Password",
  "auth.fullName": "Full name",
  "auth.mobile": "Mobile number",
  "auth.namePlaceholder": "John Smith",
  "auth.passwordHint": "6 characters or more",
  "auth.signingIn": "Signing in...",
  "auth.enter": "Sign in",
  "auth.creating": "Creating...",
  "auth.createAccount": "Create account",
  "auth.secureNote": "Login is protected by secure protocols — your password is never stored on this device.",
  "auth.or": "or",
  "auth.google": "Continue with Google",
  "auth.googleError": "Google sign-in failed. Please try again.",
  "auth.missingCreds": "Please enter your email and password.",
  "auth.badCreds": "Invalid login details.",
  "auth.fillAll": "Please complete all fields.",
  "auth.badEmail": "Invalid email format.",
  "auth.shortPassword": "Password must be at least 6 characters.",
  "auth.emailTaken": "This email is already registered.",
  "auth.signupFailed": "Could not create the account.",
  "auth.signupOk": "Account created. Check your email to confirm, then sign in.",

  "tracks.kicker": "Choose a track",
  "tracks.title": "Choose the track you want to practice",
  "tracks.lead": "Each track is fully independent — its sections, mistakes, and foundations.",
  "tracks.start": "Start practicing",
  "tracks.sections": "sections",
  "tracks.hint": "You can switch between tracks at any time from the header.",

  "gate.title": "Enter your activation code",
  "gate.lead": "To begin, enter the code you received from Mr. Osama.",
  "gate.submit": "Activate account",
  "gate.checking": "Verifying...",
  "gate.note": "The code is single-use and is permanently linked to your account.",
  "gate.invalid": "Invalid code.",
  "gate.disabled": "This code is disabled.",
  "gate.expired": "This code has expired.",
  "gate.notAuth": "Please sign in again.",
  "gate.failed": "Could not verify the code.",
  "gate.error": "Something went wrong. Try again.",
  "common.verifying": "Verifying...",
  "lang.switch": "العربية",
};

const DICTS: Record<Lang, Dict> = { ar, en };

type Ctx = { lang: Lang; dir: "rtl" | "ltr"; setLang: (l: Lang) => void; t: (k: string) => string };
const I18nContext = createContext<Ctx>({ lang: "ar", dir: "rtl", setLang: () => {}, t: (k) => ar[k] ?? k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "ar") setLangState(saved);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang]);

  const value = useMemo<Ctx>(() => ({
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
    setLang: (l: Lang) => {
      setLangState(l);
      try { window.localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
    },
    t: (k: string) => DICTS[lang][k] ?? DICTS.ar[k] ?? k,
  }), [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
