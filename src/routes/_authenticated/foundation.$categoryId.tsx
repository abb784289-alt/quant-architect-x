import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { readSession } from "@/lib/session";
import { FOUNDATION_CATEGORIES, loadFoundationAssets, type FoundationAsset, type FoundationCategoryId } from "@/lib/platform-config";
import { getSectionVideoSignedUrl } from "@/lib/section-videos.functions";
import { getMediaAsset } from "@/lib/media-assets.functions";

export const Route = createFileRoute("/_authenticated/foundation/$categoryId")({
  ssr: false,
  component: CategoryGate,
});

function CategoryGate() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    const s = readSession();
    if (!s) { setOk(false); window.location.replace("/auth"); return; }
    setOk(true);
  }, []);
  if (ok) return <CategoryPage />;
  return <div dir="rtl" className="min-h-[60vh] grid place-items-center text-muted-foreground">جارٍ التحميل...</div>;
}

function CategoryPage() {
  const { categoryId } = Route.useParams();
  const meta = FOUNDATION_CATEGORIES.find((c) => c.id === (categoryId as FoundationCategoryId));
  const [asset, setAsset] = useState<FoundationAsset | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const all = loadFoundationAssets();
    const a = all[categoryId as FoundationCategoryId] ?? null;
    setAsset(a);
    setVideoSrc(null);
    (async () => {
      let v = a?.videoUrl?.trim() || "";
      try {
        const asset = await getMediaAsset({ data: { scope: "foundation", track: "quantitative", key: categoryId } });
        if (asset?.video_path) v = asset.video_path;
      } catch { /* fall back to local */ }
      if (cancelled) return;
      if (!v) { setVideoSrc(null); return; }
      if (/^(https?:|blob:|data:)/i.test(v)) { setVideoSrc(v); return; }
      try {
        const r = await getSectionVideoSignedUrl({ data: { path: v } });
        if (!cancelled) setVideoSrc(r.url);
      } catch { if (!cancelled) setVideoSrc(null); }
    })();
    return () => { cancelled = true; };
  }, [categoryId]);

  if (!meta) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center" dir="rtl">
        <p className="text-muted-foreground mb-4">المحور غير موجود.</p>
        <Link to="/foundation" className="text-teal-deep font-semibold">← عودة إلى قسم التأسيس</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10" dir="rtl">
      <div className="mb-6">
        <Link to="/foundation" className="text-xs text-muted-foreground hover:text-teal-deep transition-colors">← قسم التأسيس</Link>
        <h1 className="mt-3 text-3xl font-bold text-foreground">{meta.title}</h1>
        <p className="text-sm text-muted-foreground">{meta.subtitle}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 luxury-card p-4">
          <div className="text-xs font-semibold text-muted-foreground mb-3">فيديو الشرح</div>
          {videoSrc ? (
            <video src={videoSrc} controls className="w-full rounded-xl bg-black aspect-video" />
          ) : asset?.videoUrl ? (
            <div className="aspect-video rounded-xl bg-surface-2 border border-dashed border-border grid place-items-center text-muted-foreground text-sm">
              جارٍ تحضير الفيديو…
            </div>
          ) : (
            <div className="aspect-video rounded-xl bg-surface-2 border border-dashed border-border grid place-items-center text-muted-foreground text-sm">
              لم يتم رفع فيديو لهذا المحور بعد.
            </div>
          )}
        </div>
        <div className="luxury-card p-5">
          <div className="text-xs font-semibold text-muted-foreground mb-3">القوانين والملخصات</div>
          {asset?.formulas ? (
            <pre className="whitespace-pre-wrap text-sm text-foreground leading-7 font-sans">{asset.formulas}</pre>
          ) : (
            <p className="text-sm text-muted-foreground">لا توجد قوانين مضافة بعد.</p>
          )}
        </div>
      </div>
    </main>
  );
}