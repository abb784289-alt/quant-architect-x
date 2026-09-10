import { createFileRoute, Link } from "@tanstack/react-router";
import foundationProMax from "@/assets/foundation-pro-max.pdf.asset.json";

export const Route = createFileRoute("/_authenticated/foundation-pro-max")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "التأسيس برو ماكس — منصة المِقْيَاس" },
      { name: "description", content: "منهج التأسيس برو ماكس الكامل في القدرات الكمية، متاح للقراءة والتحميل." },
      { property: "og:title", content: "التأسيس برو ماكس — منصة المِقْيَاس" },
      { property: "og:description", content: "منهج التأسيس برو ماكس الكامل في القدرات الكمية، متاح للقراءة والتحميل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: FoundationProMax,
});

function FoundationProMax() {
  return (
    <main dir="rtl" className="mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold-soft px-3 py-1 text-[11px] font-bold text-foreground">
            القسم الكمي · المنهج الكامل
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">التأسيس برو ماكس</h1>
          <p className="mt-1 text-sm text-muted-foreground">منهج التأسيس الكامل — ٨١٣ صفحة.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            search={{ track: "quantitative" } as any}
            className="rounded-xl border border-border bg-white px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-teal hover:text-teal-deep"
          >
            رجوع للكمي
          </Link>
          <a
            href={foundationProMax.url}
            download="التأسيس برو ماكس.pdf"
            className="rounded-xl bg-teal px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-teal-deep"
          >
            تحميل الملف
          </a>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <iframe
          src={`${foundationProMax.url}#view=FitH`}
          title="كتاب التأسيس برو ماكس"
          className="h-[72vh] min-h-[520px] w-full bg-white"
        />
        <div className="border-t border-border p-4 text-center text-sm text-muted-foreground">
          لو الملف لم يظهر داخل الصفحة، افتحه من زر التحميل بالأعلى.
        </div>
      </section>
    </main>
  );
}