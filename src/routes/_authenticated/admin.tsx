import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Papa from "papaparse";
import { readSession } from "@/lib/session";
import {
  FOUNDATION_CATEGORIES,
  TOTAL_SECTIONS,
  DEFAULT_TIMER_SECONDS,
  loadSections,
  saveSections,
  loadFoundationAssets,
  saveFoundationAssets,
  formatTimer,
  type SectionConfig,
  type FoundationAsset,
  type FoundationCategoryId,
} from "@/lib/platform-config";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "مركز التحكم — منصة المِقْيَاس" },
      { name: "description", content: "لوحة تحكم المدرّب لرفع فيديوهات، إدارة الأقسام الـ 150، وضبط المؤقتات." },
    ],
  }),
  component: AdminGate,
});

function AdminGate() {
  const [state, setState] = useState<"checking" | "allowed" | "denied">("checking");
  useEffect(() => {
    const s = readSession();
    if (s?.role === "admin") setState("allowed");
    else { setState("denied"); window.location.replace("/auth"); }
  }, []);
  if (state === "allowed") return <AdminControlCenter />;
  return <div dir="rtl" className="min-h-[60vh] grid place-items-center text-muted-foreground">جارٍ التحقق...</div>;
}

type Tab = "uploader" | "organizer" | "timers";

function AdminControlCenter() {
  const [tab, setTab] = useState<Tab>("uploader");

  return (
    <main className="mx-auto max-w-7xl px-6 py-8" dir="rtl">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-gold-soft text-foreground border border-gold/40 px-3 py-1 text-[11px] font-semibold mb-3">
          مركز التحكم التنفيذي
        </div>
        <h1 className="text-3xl font-bold text-foreground">لوحة الأستاذ أسامة</h1>
        <p className="text-sm text-muted-foreground mt-1">أدر الفيديوهات، الأقسام الـ 150، والمؤقتات من جهازك مباشرة.</p>
      </header>

      <div className="flex flex-wrap gap-1 rounded-2xl bg-surface-2 border border-border p-1 mb-6 max-w-2xl">
        <TabBtn active={tab === "uploader"} onClick={() => setTab("uploader")}>رفع الفيديوهات</TabBtn>
        <TabBtn active={tab === "organizer"} onClick={() => setTab("organizer")}>منظّم الأقسام (CSV)</TabBtn>
        <TabBtn active={tab === "timers"} onClick={() => setTab("timers")}>ضابط المؤقتات</TabBtn>
      </div>

      {tab === "uploader" && <VideoUploader />}
      {tab === "organizer" && <SectionOrganizer />}
      {tab === "timers" && <TimerController />}

      <p className="text-[11px] text-muted-foreground mt-8">
        ملاحظة تقنية: التخزين الحالي محلي على متصفحك (localStorage / Object URL). لرفع فيديوهات ذات حجم كبير للطلاب من أي جهاز، يلزم تفعيل التخزين السحابي في مرحلة لاحقة.
      </p>
    </main>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={"px-4 py-2 rounded-xl text-sm font-semibold transition-all " + (active ? "bg-white text-teal-deep shadow-sm" : "text-muted-foreground hover:text-foreground")}
    >
      {children}
    </button>
  );
}

// ────────────── Video Uploader ──────────────
type TargetKind = "foundation" | "section";

function VideoUploader() {
  const [kind, setKind] = useState<TargetKind>("section");
  const [foundationId, setFoundationId] = useState<FoundationCategoryId>("ratios");
  const [sectionNumber, setSectionNumber] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function pick(f: File | null) {
    if (!f) return;
    if (preview) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreview(url);
    setMessage(null);
  }

  function assign() {
    if (!preview) { setMessage("اختر فيديو أولاً."); return; }
    if (kind === "foundation") {
      const all = loadFoundationAssets();
      all[foundationId] = { ...all[foundationId], videoUrl: preview };
      saveFoundationAssets(all);
      setMessage(`تم ربط الفيديو بمحور التأسيس: ${FOUNDATION_CATEGORIES.find((c) => c.id === foundationId)?.title}`);
    } else {
      const list = loadSections();
      const idx = list.findIndex((s) => s.number === sectionNumber);
      if (idx >= 0) { list[idx] = { ...list[idx], videoUrl: preview }; saveSections(list); }
      setMessage(`تم ربط الفيديو بالقسم رقم ${sectionNumber}.`);
    }
  }

  return (
    <section className="grid lg:grid-cols-2 gap-5">
      <div
        className={"luxury-card p-6 border-2 " + (dragOver ? "border-teal bg-teal-soft/40" : "border-dashed border-border")}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); pick(e.dataTransfer.files?.[0] ?? null); }}
      >
        <div className="text-center py-6">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-teal-soft text-teal-deep grid place-items-center text-2xl font-bold">↑</div>
          <h3 className="font-display font-bold text-foreground mb-1">اسحب فيديو الشرح هنا</h3>
          <p className="text-xs text-muted-foreground mb-4">أو اختر ملفاً من جهازك (MP4 / WebM)</p>
          <input ref={fileInput} type="file" accept="video/*" hidden onChange={(e: ChangeEvent<HTMLInputElement>) => pick(e.target.files?.[0] ?? null)} />
          <button type="button" onClick={() => fileInput.current?.click()} className="rounded-xl bg-teal text-white px-5 py-2.5 text-sm font-semibold hover:bg-teal-deep transition-colors">
            اختر ملفاً
          </button>
          {file && <div className="mt-4 text-xs text-muted-foreground truncate">{file.name} · {(file.size / (1024 * 1024)).toFixed(1)}MB</div>}
        </div>

        {preview && (
          <div className="mt-4">
            <video src={preview} controls className="w-full rounded-xl bg-black aspect-video" />
          </div>
        )}
      </div>

      <div className="luxury-card p-6 space-y-5">
        <h3 className="font-display font-bold text-foreground">اربط الفيديو بموضع</h3>

        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-surface-2 border border-border">
          <button type="button" onClick={() => setKind("section")} className={"py-2 rounded-lg text-sm font-semibold " + (kind === "section" ? "bg-white text-teal-deep shadow-sm" : "text-muted-foreground")}>قسم مسلسل</button>
          <button type="button" onClick={() => setKind("foundation")} className={"py-2 rounded-lg text-sm font-semibold " + (kind === "foundation" ? "bg-white text-teal-deep shadow-sm" : "text-muted-foreground")}>محور تأسيسي</button>
        </div>

        {kind === "section" ? (
          <label className="block">
            <span className="text-xs font-semibold text-foreground">رقم القسم (1 - {TOTAL_SECTIONS})</span>
            <input type="number" min={1} max={TOTAL_SECTIONS} value={sectionNumber}
              onChange={(e) => setSectionNumber(Math.max(1, Math.min(TOTAL_SECTIONS, Number(e.target.value) || 1)))}
              className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 focus:border-teal focus:ring-2 focus:ring-teal/30 outline-none" />
          </label>
        ) : (
          <label className="block">
            <span className="text-xs font-semibold text-foreground">محور التأسيس</span>
            <select value={foundationId} onChange={(e) => setFoundationId(e.target.value as FoundationCategoryId)}
              className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 focus:border-teal focus:ring-2 focus:ring-teal/30 outline-none">
              {FOUNDATION_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
        )}

        <button type="button" onClick={assign} className="w-full rounded-xl bg-gradient-to-l from-teal to-teal-deep text-white py-3 font-bold hover:opacity-95 transition-opacity shadow-md">
          حفظ الربط
        </button>
        {message && <div className="text-sm rounded-xl bg-teal-soft border border-teal/30 text-teal-deep px-3 py-2">{message}</div>}
      </div>
    </section>
  );
}

// ────────────── Section Organizer ──────────────
function SectionOrganizer() {
  const [sections, setSections] = useState<SectionConfig[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => { setSections(loadSections()); }, []);

  const filtered = useMemo(() => {
    if (!filter.trim()) return sections;
    return sections.filter((s) => String(s.number).includes(filter) || s.title.includes(filter));
  }, [sections, filter]);

  function updateRow(n: number, patch: Partial<SectionConfig>) {
    setSections((prev) => prev.map((s) => (s.number === n ? { ...s, ...patch } : s)));
  }

  function save() {
    saveSections(sections);
    setMessage("تم حفظ إعدادات جميع الأقسام.");
    setTimeout(() => setMessage(null), 3000);
  }

  function downloadCsv() {
    const csv = Papa.unparse(sections.map((s) => ({ number: s.number, title: s.title, timer_seconds: s.timerSeconds, video_url: s.videoUrl })));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "sections.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function importCsv(f: File | null) {
    if (!f) return;
    Papa.parse<{ number: string; title: string; timer_seconds: string; video_url: string }>(f, {
      header: true, skipEmptyLines: true,
      complete: (res) => {
        const map = new Map(sections.map((s) => [s.number, s]));
        for (const row of res.data) {
          const n = Number(row.number);
          if (!Number.isFinite(n) || n < 1 || n > TOTAL_SECTIONS) continue;
          const cur = map.get(n) ?? { number: n, title: `القسم ${n}`, timerSeconds: DEFAULT_TIMER_SECONDS, videoUrl: "" };
          map.set(n, {
            number: n,
            title: row.title?.trim() || cur.title,
            timerSeconds: Number(row.timer_seconds) || cur.timerSeconds,
            videoUrl: row.video_url?.trim() || cur.videoUrl,
          });
        }
        const next = Array.from(map.values()).sort((a, b) => a.number - b.number);
        setSections(next);
        saveSections(next);
        setMessage(`تم استيراد ${res.data.length} صف من CSV.`);
        setTimeout(() => setMessage(null), 3000);
      },
    });
  }

  return (
    <section className="luxury-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="font-display font-bold text-foreground">منظّم الأقسام الـ 150</h3>
        <div className="flex gap-2">
          <input ref={fileInput} type="file" accept=".csv" hidden onChange={(e) => importCsv(e.target.files?.[0] ?? null)} />
          <button onClick={() => fileInput.current?.click()} className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:border-teal transition-colors">استيراد CSV</button>
          <button onClick={downloadCsv} className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:border-teal transition-colors">تصدير CSV</button>
          <button onClick={save} className="rounded-xl bg-teal text-white px-3 py-1.5 text-xs font-bold hover:bg-teal-deep transition-colors">حفظ الكل</button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="بحث برقم القسم أو العنوان"
          className="w-full max-w-sm rounded-xl border border-border bg-white px-4 py-2 text-sm focus:border-teal focus:ring-2 focus:ring-teal/30 outline-none" />
        {message && <span className="text-xs text-teal-deep font-semibold">{message}</span>}
      </div>

      <div className="overflow-auto max-h-[60vh] rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 sticky top-0">
            <tr className="text-right">
              <th className="p-2 w-14">#</th>
              <th className="p-2">العنوان</th>
              <th className="p-2 w-40">المؤقت (ث)</th>
              <th className="p-2 w-64">رابط الفيديو</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.number} className="border-t border-border">
                <td className="p-2 font-bold text-teal-deep">{s.number}</td>
                <td className="p-2">
                  <input value={s.title} onChange={(e) => updateRow(s.number, { title: e.target.value })}
                    className="w-full rounded-lg border border-border bg-white px-2 py-1 focus:border-teal outline-none" />
                </td>
                <td className="p-2">
                  <input type="number" min={30} value={s.timerSeconds} onChange={(e) => updateRow(s.number, { timerSeconds: Number(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-border bg-white px-2 py-1 focus:border-teal outline-none" />
                  <div className="text-[10px] text-muted-foreground mt-0.5">{formatTimer(s.timerSeconds)}</div>
                </td>
                <td className="p-2">
                  <input value={s.videoUrl} onChange={(e) => updateRow(s.number, { videoUrl: e.target.value })} placeholder="https://... أو من رفع محلي"
                    className="w-full rounded-lg border border-border bg-white px-2 py-1 focus:border-teal outline-none text-xs" dir="ltr" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ────────────── Timer Controller ──────────────
function TimerController() {
  const [sections, setSections] = useState<SectionConfig[]>([]);
  const [globalMin, setGlobalMin] = useState(25);
  const [globalSec, setGlobalSec] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { setSections(loadSections()); }, []);

  function applyGlobal() {
    const total = globalMin * 60 + globalSec;
    if (total <= 0) return;
    const next = sections.map((s) => ({ ...s, timerSeconds: total }));
    setSections(next); saveSections(next);
    setMessage(`تم تطبيق ${formatTimer(total)} على جميع الأقسام.`);
    setTimeout(() => setMessage(null), 3000);
  }

  function updateOne(n: number, min: number, sec: number) {
    const total = Math.max(0, min * 60 + sec);
    const next = sections.map((s) => (s.number === n ? { ...s, timerSeconds: total } : s));
    setSections(next); saveSections(next);
  }

  return (
    <section className="grid lg:grid-cols-3 gap-5">
      <div className="luxury-card p-5 lg:col-span-1 h-fit">
        <h3 className="font-display font-bold text-foreground mb-3">مؤقّت افتراضي عام</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-foreground">دقائق</span>
            <input type="number" min={0} value={globalMin} onChange={(e) => setGlobalMin(Math.max(0, Number(e.target.value) || 0))}
              className="mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2 focus:border-teal outline-none text-center font-bold text-lg" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-foreground">ثوانٍ</span>
            <input type="number" min={0} max={59} value={globalSec} onChange={(e) => setGlobalSec(Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
              className="mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2 focus:border-teal outline-none text-center font-bold text-lg" />
          </label>
        </div>
        <button onClick={applyGlobal} className="mt-4 w-full rounded-xl bg-gradient-to-l from-gold to-gold-soft text-foreground py-2.5 font-bold hover:opacity-95 transition-opacity">
          تطبيق على جميع الأقسام
        </button>
        {message && <div className="mt-3 text-xs text-teal-deep font-semibold">{message}</div>}
      </div>

      <div className="luxury-card p-5 lg:col-span-2">
        <h3 className="font-display font-bold text-foreground mb-3">تخصيص المؤقّت لكل قسم</h3>
        <div className="max-h-[60vh] overflow-auto grid sm:grid-cols-2 gap-2">
          {sections.map((s) => {
            const mm = Math.floor(s.timerSeconds / 60);
            const ss = s.timerSeconds % 60;
            return (
              <div key={s.number} className="flex items-center gap-2 rounded-xl border border-border bg-white p-2">
                <div className="h-8 w-8 rounded-lg bg-teal-soft text-teal-deep grid place-items-center font-bold text-xs">{s.number}</div>
                <div className="flex-1 text-xs font-semibold text-foreground truncate">{s.title}</div>
                <input type="number" min={0} value={mm} onChange={(e) => updateOne(s.number, Number(e.target.value) || 0, ss)}
                  className="w-14 rounded-lg border border-border bg-surface-1 px-2 py-1 text-center text-sm focus:border-teal outline-none" />
                <span className="text-muted-foreground">:</span>
                <input type="number" min={0} max={59} value={ss} onChange={(e) => updateOne(s.number, mm, Math.min(59, Number(e.target.value) || 0))}
                  className="w-14 rounded-lg border border-border bg-surface-1 px-2 py-1 text-center text-sm focus:border-teal outline-none" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}