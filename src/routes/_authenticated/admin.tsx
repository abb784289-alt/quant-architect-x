import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Papa from "papaparse";
import DOMPurify from "dompurify";
import { getMyRoles } from "@/lib/admin.functions";
import {
  listAllQuestions,
  replyToQuestion,
  deleteQuestion,
  getMediaSignedUrl,
} from "@/lib/questions.functions";
import { supabase } from "@/integrations/supabase/client";
import ProMaxAdminPanel from "@/components/ProMaxAdminPanel";
import SkillsAdminPanel from "@/components/SkillsAdminPanel";
import { upsertMediaAsset } from "@/lib/media-assets.functions";
import {
  listAccessCodes,
  createAccessCode,
  setCodeDisabled,
  deleteAccessCode,
} from "@/lib/access-codes.functions";

const SVG_PURIFY_CONFIG = { USE_PROFILES: { svg: true, svgFilters: true } } as const;
function sanitizeSvg(html: string): string {
  return DOMPurify.sanitize(html, SVG_PURIFY_CONFIG) as unknown as string;
}
import {
  FOUNDATION_CATEGORIES,
  TOTAL_SECTIONS,
  totalSections,
  type TrackId,
  DEFAULT_TIMER_SECONDS,
  SECONDS_PER_QUESTION,
  loadSections,
  saveSections,
  loadFoundationAssets,
  saveFoundationAssets,
  formatTimer,
  getQuestions,
  saveQuestions,
  loadAllQuestions,
  type SectionConfig,
  type FoundationAsset,
  type FoundationCategoryId,
  type Question,
} from "@/lib/platform-config";
import { toArabic } from "@/lib/platform-config";

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
    // Verify admin role server-side (never trust client storage).
    getMyRoles()
      .then((res) => {
        if (res?.roles?.includes("admin")) setState("allowed");
        else { setState("denied"); window.location.replace("/dashboard"); }
      })
      .catch(() => { setState("denied"); window.location.replace("/auth"); });
  }, []);
  if (state === "allowed") return <AdminControlCenter />;
  return <div dir="rtl" className="min-h-[60vh] grid place-items-center text-muted-foreground">جارٍ التحقق...</div>;
}

type Tab = "questions" | "verbal" | "skills" | "student-questions" | "uploader" | "organizer" | "timers" | "codes" | "pro-max";

function AdminControlCenter() {
  const [tab, setTab] = useState<Tab>("questions");

  return (
    <main className="mx-auto max-w-7xl px-6 py-8" dir="rtl">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-gold-soft text-foreground border border-gold/40 px-3 py-1 text-[11px] font-semibold mb-3">
          مركز التحكم التنفيذي
        </div>
        <h1 className="text-3xl font-bold text-foreground">لوحة الأستاذ أسامة</h1>
        <p className="text-sm text-muted-foreground mt-1">أدر الأسئلة، الفيديوهات، الأقسام الـ 150، والمؤقتات من جهازك مباشرة. المؤقت الافتراضي = دقيقة لكل سؤال.</p>
      </header>

      <div className="flex flex-wrap gap-1 rounded-2xl bg-surface-2 border border-border p-1 mb-6 max-w-3xl">
        <TabBtn active={tab === "questions"} onClick={() => setTab("questions")}>بنك الأسئلة</TabBtn>
        <TabBtn active={tab === "verbal"} onClick={() => setTab("verbal")}>بنك اللفظي</TabBtn>
        <TabBtn active={tab === "skills"} onClick={() => setTab("skills")}>التأسيس الأسرع</TabBtn>
        <TabBtn active={tab === "student-questions"} onClick={() => setTab("student-questions")}>أسئلة الطلاب</TabBtn>
        <TabBtn active={tab === "uploader"} onClick={() => setTab("uploader")}>رفع الفيديوهات</TabBtn>
        <TabBtn active={tab === "organizer"} onClick={() => setTab("organizer")}>منظّم الأقسام (CSV)</TabBtn>
        <TabBtn active={tab === "timers"} onClick={() => setTab("timers")}>ضابط المؤقتات</TabBtn>
        <TabBtn active={tab === "codes"} onClick={() => setTab("codes")}>أكواد التفعيل</TabBtn>
        <TabBtn active={tab === "pro-max"} onClick={() => setTab("pro-max")}>التأسيس برو ماكس</TabBtn>
      </div>

      {tab === "questions" && <QuestionsBank track="quantitative" />}
      {tab === "verbal" && <QuestionsBank track="verbal" />}
      {tab === "skills" && <SkillsAdminPanel />}
      {tab === "student-questions" && <StudentQuestionsInbox />}
      {tab === "uploader" && <VideoUploader />}
      {tab === "organizer" && <SectionOrganizer />}
      {tab === "timers" && <TimerController />}
      {tab === "codes" && <AccessCodesPanel />}
      {tab === "pro-max" && <ProMaxAdminPanel />}

      <p className="text-[11px] text-muted-foreground mt-8">
        الفيديوهات تُرفع الآن إلى التخزين السحابي (Supabase Storage – bucket: <code className="font-mono">section-videos</code>) بمسار دائم يعمل من أي جهاز.
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

// ────────────── Access Codes Panel ──────────────
type AccessCodeRow = {
  code: string;
  expires_at: string | null;
  disabled: boolean;
  note: string | null;
  created_at: string;
  redemptions: number;
};

function AccessCodesPanel() {
  const [rows, setRows] = useState<AccessCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(1);
  const [expires, setExpires] = useState<string>("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try { setRows((await listAccessCodes()) as AccessCodeRow[]); }
    catch (e: any) { setMsg(e?.message ?? "تعذّر تحميل الأكواد."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const expires_at = expires ? new Date(expires).toISOString() : null;
      const created = await createAccessCode({ data: { count, expires_at, note: note.trim() || null } });
      setMsg(`تم إنشاء ${created.length} كود.`);
      setNote("");
      await refresh();
    } catch (e: any) { setMsg(e?.message ?? "تعذّر إنشاء الأكواد."); }
    finally { setBusy(false); }
  }

  async function toggle(code: string, disabled: boolean) {
    await setCodeDisabled({ data: { code, disabled: !disabled } });
    await refresh();
  }
  async function remove(code: string) {
    if (!confirm(`حذف الكود ${code}؟ سيتم أيضاً حذف سجل استخدامه.`)) return;
    await deleteAccessCode({ data: { code } });
    await refresh();
  }
  async function copy(code: string) {
    try { await navigator.clipboard.writeText(code); setMsg(`تم نسخ ${code}`); } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onCreate} className="luxury-card p-6 grid gap-4 md:grid-cols-4">
        <label className="block">
          <span className="block text-xs font-semibold mb-1.5">عدد الأكواد</span>
          <input type="number" min={1} max={50} value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
            className="w-full rounded-xl bg-surface-1 border border-border px-3 py-2.5 outline-none focus:border-teal" />
        </label>
        <label className="block">
          <span className="block text-xs font-semibold mb-1.5">تاريخ الانتهاء (اختياري)</span>
          <input type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)}
            className="w-full rounded-xl bg-surface-1 border border-border px-3 py-2.5 outline-none focus:border-teal" />
        </label>
        <label className="block md:col-span-2">
          <span className="block text-xs font-semibold mb-1.5">ملاحظة (اختياري)</span>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200}
            placeholder="مثال: مجموعة سبتمبر"
            className="w-full rounded-xl bg-surface-1 border border-border px-3 py-2.5 outline-none focus:border-teal" />
        </label>
        <div className="md:col-span-4 flex items-center gap-3">
          <button type="submit" disabled={busy}
            className="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-l from-teal to-teal-deep hover:opacity-95 shadow-md disabled:opacity-60">
            {busy ? "جارٍ الإنشاء..." : "إنشاء أكواد جديدة"}
          </button>
          {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
        </div>
      </form>

      <div className="luxury-card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold">الأكواد الحالية ({rows.length})</h3>
          <button type="button" onClick={refresh} className="text-xs text-teal-deep hover:underline">تحديث</button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">جارٍ التحميل...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">لا توجد أكواد بعد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-right">الكود</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                  <th className="px-4 py-3 text-right">الاستخدام</th>
                  <th className="px-4 py-3 text-right">ينتهي في</th>
                  <th className="px-4 py-3 text-right">ملاحظة</th>
                  <th className="px-4 py-3 text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => {
                  const expired = r.expires_at && new Date(r.expires_at) < new Date();
                  const used = r.redemptions > 0;
                  return (
                    <tr key={r.code} className="hover:bg-surface-1">
                      <td className="px-4 py-3 font-mono font-bold tracking-widest" dir="ltr">{r.code}</td>
                      <td className="px-4 py-3">
                        {r.disabled ? <span className="text-red-600">موقوف</span>
                          : expired ? <span className="text-amber-600">منتهي</span>
                          : used ? <span className="text-muted-foreground">مُستخدم</span>
                          : <span className="text-teal-deep font-semibold">نشط</span>}
                      </td>
                      <td className="px-4 py-3">{r.redemptions}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {r.expires_at ? new Date(r.expires_at).toLocaleString("ar-EG") : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{r.note ?? "—"}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <button type="button" onClick={() => copy(r.code)} className="text-xs px-2 py-1 rounded-lg bg-surface-2 hover:bg-surface-1 border border-border">نسخ</button>
                        <button type="button" onClick={() => toggle(r.code, r.disabled)} className="text-xs px-2 py-1 rounded-lg bg-surface-2 hover:bg-surface-1 border border-border">
                          {r.disabled ? "تفعيل" : "إيقاف"}
                        </button>
                        <button type="button" onClick={() => remove(r.code)} className="text-xs px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700">حذف</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        كل طالب يستطيع تفعيل حسابه بكود واحد فقط، والكود يبقى مربوطاً بحسابه بشكل دائم. تعطيل أو حذف الكود لا يلغي التفعيل السابق للطلاب الذين استخدموه.
      </p>
    </div>
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
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function pick(f: File | null) {
    if (!f) return;
    if (!f.type.startsWith("video/")) { setError("اختر ملف فيديو صالح."); return; }
    if (f.size > 500 * 1024 * 1024) { setError("حجم الفيديو أكبر من 500MB."); return; }
    setError(null);
    setMessage(null);
    setProgress(0);
    if (preview) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreview(url);
  }

  async function assign() {
    setError(null);
    setMessage(null);
    if (!file) { setError("اختر فيديو أولاً."); return; }
    setUploading(true);
    setProgress(5);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("انتهت الجلسة، سجّل الدخول مجدداً.");
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6) || "mp4";
      const folder = kind === "foundation" ? `foundation/${foundationId}` : `sections/${sectionNumber}`;
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      setProgress(15);
      const { error: upErr } = await supabase.storage
        .from("section-videos")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw new Error(upErr.message);
      setProgress(90);
      if (kind === "foundation") {
        await upsertMediaAsset({ data: { scope: "foundation", track: "quantitative", key: foundationId, video_path: path } });
        const all = loadFoundationAssets();
        all[foundationId] = { ...all[foundationId], videoUrl: path };
        saveFoundationAssets(all);
        setMessage(`تم رفع الفيديو وربطه بمحور التأسيس: ${FOUNDATION_CATEGORIES.find((c) => c.id === foundationId)?.title}`);
      } else {
        await upsertMediaAsset({ data: { scope: "section", track: "quantitative", key: String(sectionNumber), video_path: path } });
        const list = loadSections();
        const idx = list.findIndex((s) => s.number === sectionNumber);
        if (idx >= 0) { list[idx] = { ...list[idx], videoUrl: path }; saveSections(list); }
        setMessage(`تم رفع الفيديو وربطه بالقسم رقم ${sectionNumber}.`);
      }
      setProgress(100);
    } catch (e: any) {
      setError(e?.message || "تعذّر رفع الفيديو، حاول مجدداً.");
      setProgress(0);
    } finally {
      setUploading(false);
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

        <button type="button" onClick={assign} disabled={uploading || !file}
          className="w-full rounded-xl bg-gradient-to-l from-teal to-teal-deep text-white py-3 font-bold hover:opacity-95 transition-opacity shadow-md disabled:opacity-60">
          {uploading ? `جارٍ الرفع… ${progress}%` : "رفع وحفظ الربط"}
        </button>
        {uploading && (
          <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full bg-teal transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        {error && <div className="text-sm rounded-xl bg-red-50 border border-red-200 text-red-700 px-3 py-2">{error}</div>}
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

// ────────────── Questions Bank ──────────────
function makeEmpty(): Question {
  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    prompt: "",
    choices: ["", "", "", ""],
    correctIndex: 0,
  };
}

function QuestionsBank({ track = "quantitative" }: { track?: TrackId }) {
  const total = totalSections(track);
  const [sectionNumber, setSectionNumber] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    setSectionNumber(1);
  }, [track]);

  useEffect(() => {
    setQuestions(getQuestions(sectionNumber, track));
  }, [sectionNumber, track]);

  useEffect(() => {
    const all = loadAllQuestions(track);
    const c: Record<number, number> = {};
    Object.entries(all).forEach(([k, v]) => { c[Number(k)] = v.length; });
    setCounts(c);
  }, [questions]);

  function commit(next: Question[]) {
    setQuestions(next);
    saveQuestions(sectionNumber, next, track);
    setMessage(`تم حفظ ${next.length} سؤالاً في القسم ${sectionNumber}. المؤقت التلقائي: ${next.length} دقيقة.`);
    setTimeout(() => setMessage(null), 2500);
  }

  function addQuestion() { commit([...questions, makeEmpty()]); }
  function removeAt(i: number) { commit(questions.filter((_, idx) => idx !== i)); }
  function moveUp(i: number) {
    if (i === 0) return;
    const next = [...questions];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    commit(next);
  }
  function moveDown(i: number) {
    if (i === questions.length - 1) return;
    const next = [...questions];
    [next[i + 1], next[i]] = [next[i], next[i + 1]];
    commit(next);
  }
  function updateAt(i: number, patch: Partial<Question>) {
    commit(questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }
  function updateChoice(i: number, ci: number, val: string) {
    const next = questions.map((q, idx) => {
      if (idx !== i) return q;
      const choices = [...q.choices];
      choices[ci] = val;
      return { ...q, choices };
    });
    commit(next);
  }

  const autoMinutes = questions.length;

  return (
    <section className="grid lg:grid-cols-4 gap-5">
      {/* Section picker */}
      <aside className="luxury-card p-4 lg:col-span-1 h-fit sticky top-6">
        <h3 className="font-display font-bold text-foreground mb-2 text-sm">
          اختر القسم ({track === "verbal" ? "لفظي" : "كمي"} — 1 إلى {total})
        </h3>
        <input type="number" min={1} max={total} value={sectionNumber}
          onChange={(e) => setSectionNumber(Math.max(1, Math.min(total, Number(e.target.value) || 1)))}
          className="w-full rounded-xl border border-border bg-white px-3 py-2 text-center font-bold text-lg focus:border-teal outline-none" />
        <div className="mt-4 rounded-xl bg-teal-soft border border-teal/30 p-3 text-center">
          <div className="text-[10px] text-muted-foreground">عدد الأسئلة</div>
          <div className="text-2xl font-bold text-teal-deep">{questions.length}</div>
          <div className="text-[11px] text-teal-deep mt-1">المؤقت: {autoMinutes} دقيقة تلقائياً</div>
        </div>
        <button onClick={addQuestion} className="mt-4 w-full rounded-xl bg-teal text-white py-2.5 text-sm font-bold hover:bg-teal-deep transition-colors">
          + إضافة سؤال جديد
        </button>
        {message && <div className="mt-3 text-[11px] rounded-lg bg-gold-soft border border-gold/30 text-foreground p-2">{message}</div>}

        <div className="mt-5 border-t border-border pt-3">
          <div className="text-[10px] font-semibold text-muted-foreground mb-2">أقسام تحتوي أسئلة</div>
          <div className="flex flex-wrap gap-1 max-h-40 overflow-auto">
            {Object.entries(counts).sort((a, b) => Number(a[0]) - Number(b[0])).map(([n, c]) => (
              <button key={n} onClick={() => setSectionNumber(Number(n))}
                className={"h-7 min-w-7 px-1.5 rounded-md text-[11px] font-bold border " +
                  (Number(n) === sectionNumber ? "bg-teal text-white border-teal" : "bg-surface-1 border-border hover:border-teal")}>
                {n} <span className="opacity-70">({c})</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Editor */}
      <div className="lg:col-span-3 space-y-4">
        {questions.length === 0 && (
          <div className="luxury-card p-8 text-center text-muted-foreground">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-sm">لا توجد أسئلة في القسم {sectionNumber} بعد. اضغط "إضافة سؤال جديد" للبدء.</p>
          </div>
        )}

        {questions.map((q, i) => {
          const letters = ["أ", "ب", "ج", "د"];
          return (
            <div key={q.id} className="luxury-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-teal text-white grid place-items-center font-bold text-sm">{i + 1}</div>
                  <span className="text-xs font-semibold text-muted-foreground">سؤال رقم {i + 1}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => moveUp(i)} disabled={i === 0} className="h-8 w-8 rounded-lg border border-border bg-white text-xs font-bold hover:border-teal disabled:opacity-40">↑</button>
                  <button onClick={() => moveDown(i)} disabled={i === questions.length - 1} className="h-8 w-8 rounded-lg border border-border bg-white text-xs font-bold hover:border-teal disabled:opacity-40">↓</button>
                  <button onClick={() => { if (confirm("حذف هذا السؤال؟")) removeAt(i); }} className="h-8 w-8 rounded-lg border border-border bg-white text-xs font-bold text-red-600 hover:border-red-400">×</button>
                </div>
              </div>

              <label className="block mb-3">
                <span className="text-[11px] font-semibold text-foreground">قطعة استيعاب المقروء (اختياري — تظهر فوق السؤال)</span>
                <textarea value={q.passage ?? ""} onChange={(e) => updateAt(i, { passage: e.target.value })}
                  rows={4} placeholder="الصق نص القطعة هنا…"
                  className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-teal focus:ring-2 focus:ring-teal/30 outline-none resize-y" />
              </label>

              <label className="block mb-3">
                <span className="text-[11px] font-semibold text-foreground">نص السؤال</span>
                <textarea value={q.prompt} onChange={(e) => updateAt(i, { prompt: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-teal focus:ring-2 focus:ring-teal/30 outline-none resize-y" />
              </label>

              <label className="block mb-3">
                <span className="text-[11px] font-semibold text-foreground">صيغة LaTeX (اختياري — للمعادلات)</span>
                <input value={q.latex ?? ""} onChange={(e) => updateAt(i, { latex: e.target.value })}
                  placeholder="مثال: 3 \\times 4 = ?" dir="ltr"
                  className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm font-mono focus:border-teal outline-none" />
              </label>

              <div className="mb-3">
                <span className="text-[11px] font-semibold text-foreground">صورة/رسم السؤال (اختياري — للأشكال الهندسية)</span>
                <div className="mt-1 flex gap-2 items-start">
                  <input value={q.imageUrl ?? ""} onChange={(e) => updateAt(i, { imageUrl: e.target.value })}
                    placeholder="https://... أو ارفع صورة" dir="ltr"
                    className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-teal outline-none" />
                  <label className="cursor-pointer rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold hover:border-teal transition-colors whitespace-nowrap">
                    رفع صورة
                    <input type="file" accept="image/*" hidden onChange={(e) => {
                      const f = e.target.files?.[0]; if (!f) return;
                      const reader = new FileReader();
                      reader.onload = () => updateAt(i, { imageUrl: String(reader.result) });
                      reader.readAsDataURL(f);
                    }} />
                  </label>
                  {q.imageUrl && (
                    <button type="button" onClick={() => updateAt(i, { imageUrl: "" })}
                      className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:border-red-400">حذف</button>
                  )}
                </div>
                {q.imageUrl && (
                  <div className="mt-2 rounded-xl border border-border bg-surface-1 p-2 inline-block">
                    <img src={q.imageUrl} alt="معاينة" className="max-h-32 rounded-lg" />
                  </div>
                )}
              </div>

              <div className="mb-3">
                <span className="text-[11px] font-semibold text-foreground">رسم هندسي SVG (اختياري — الصق كود SVG كامل)</span>
                <textarea value={q.svg ?? ""} onChange={(e) => updateAt(i, { svg: e.target.value })}
                  rows={3} dir="ltr"
                  placeholder='<svg viewBox="0 0 100 100">...</svg>'
                  className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-xs font-mono focus:border-teal outline-none resize-y" />
                {q.svg && (
                  <div className="mt-2 rounded-xl border border-border bg-surface-1 p-3 inline-block max-w-full [&_svg]:max-h-40 [&_svg]:w-auto"
                    dangerouslySetInnerHTML={{ __html: sanitizeSvg(q.svg) }} />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {q.choices.map((c, ci) => (
                  <label key={ci} className={"flex items-center gap-2 rounded-xl border p-2 transition-colors " +
                    (q.correctIndex === ci ? "border-teal bg-teal-soft" : "border-border bg-white")}>
                    <button type="button" onClick={() => updateAt(i, { correctIndex: ci as 0 | 1 | 2 | 3 })}
                      className={"h-8 w-8 rounded-lg font-bold text-sm shrink-0 " +
                        (q.correctIndex === ci ? "bg-teal text-white" : "bg-surface-2 text-foreground hover:bg-teal/20")}>
                      {letters[ci]}
                    </button>
                    <input value={c} onChange={(e) => updateChoice(i, ci, e.target.value)}
                      placeholder={`الخيار ${letters[ci]}`}
                      className="flex-1 min-w-0 bg-transparent px-1 py-1 text-sm focus:outline-none" />
                  </label>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                اضغط على حرف الخيار لتحديد الإجابة الصحيحة. الإجابة الحالية: <span className="font-bold text-teal-deep">{letters[q.correctIndex]}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ────────────── Student Questions Inbox (Admin) ──────────────
type StudentQuestion = {
  id: string;
  user_id: string;
  question_text: string | null;
  question_image_path: string | null;
  reply_text: string | null;
  reply_video_path: string | null;
  replied_at: string | null;
  created_at: string;
};

function StudentQuestionsInbox() {
  const [items, setItems] = useState<StudentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "answered">("all");

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const rows = (await listAllQuestions()) as StudentQuestion[];
      setItems(rows);
    } catch (e: any) {
      setError(e?.message || "تعذّر التحميل");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  const shown = items.filter((q) => {
    if (filter === "pending") return !q.replied_at;
    if (filter === "answered") return !!q.replied_at;
    return true;
  });

  const pendingCount = items.filter((q) => !q.replied_at).length;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-surface-2 border border-border p-1">
          <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>الكل ({toArabic(items.length)})</FilterBtn>
          <FilterBtn active={filter === "pending"} onClick={() => setFilter("pending")}>بانتظار الرد ({toArabic(pendingCount)})</FilterBtn>
          <FilterBtn active={filter === "answered"} onClick={() => setFilter("answered")}>مُجاب ({toArabic(items.length - pendingCount)})</FilterBtn>
        </div>
        <button type="button" onClick={refresh} className="text-sm rounded-xl border border-border bg-white px-3 py-2 hover:border-teal">تحديث</button>
      </div>

      {error && <div className="text-sm rounded-xl bg-red-50 border border-red-200 text-red-700 px-3 py-2">{error}</div>}

      {loading ? (
        <div className="text-sm text-muted-foreground">جارٍ التحميل…</div>
      ) : shown.length === 0 ? (
        <div className="luxury-card p-6 text-center text-sm text-muted-foreground">لا توجد أسئلة.</div>
      ) : (
        <div className="space-y-3">
          {shown.map((q) => (
            <AdminQuestionCard key={q.id} row={q} onChanged={refresh} />
          ))}
        </div>
      )}
    </section>
  );
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={"px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors " +
        (active ? "bg-white text-teal-deep shadow-sm" : "text-muted-foreground hover:text-foreground")}>
      {children}
    </button>
  );
}

function AdminQuestionCard({ row, onChanged }: { row: StudentQuestion; onChanged: () => void }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [replyText, setReplyText] = useState(row.reply_text ?? "");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    if (row.question_image_path) {
      getMediaSignedUrl({ data: { question_id: row.id, kind: "image" } })
        .then((r) => !cancelled && setImgUrl(r.url)).catch(() => {});
    }
    if (row.reply_video_path) {
      getMediaSignedUrl({ data: { question_id: row.id, kind: "video" } })
        .then((r) => !cancelled && setVideoUrl(r.url)).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [row.id, row.question_image_path, row.reply_video_path]);

  function pickVideo(f: File | null) {
    if (!f) return;
    if (!f.type.startsWith("video/")) { setErr("اختر ملف فيديو"); return; }
    if (f.size > 300 * 1024 * 1024) { setErr("حجم الفيديو أكبر من 300MB"); return; }
    setErr(null);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(f);
    setVideoPreview(URL.createObjectURL(f));
  }

  async function submitReply() {
    setErr(null);
    setMsg(null);
    if (!replyText.trim() && !videoFile && !row.reply_video_path) {
      setErr("أضِف رسالة أو فيديو"); return;
    }
    setSaving(true);
    try {
      let videoPath: string | null = row.reply_video_path;
      if (videoFile) {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData.user?.id;
        if (!uid) throw new Error("انتهت الجلسة");
        const ext = videoFile.name.split(".").pop()?.toLowerCase() || "mp4";
        const path = `${uid}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("reply-videos")
          .upload(path, videoFile, { contentType: videoFile.type, upsert: false });
        if (upErr) throw new Error(upErr.message);
        videoPath = path;
      }
      await replyToQuestion({
        data: {
          id: row.id,
          reply_text: replyText.trim() || null,
          reply_video_path: videoPath,
        },
      });
      setMsg("تم إرسال الرد.");
      setVideoFile(null);
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
      if (videoInput.current) videoInput.current.value = "";
      onChanged();
    } catch (e: any) {
      setErr(e?.message || "تعذّر إرسال الرد");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("حذف هذا السؤال نهائياً؟")) return;
    try {
      await deleteQuestion({ data: { id: row.id } });
      onChanged();
    } catch (e: any) {
      setErr(e?.message || "تعذّر الحذف");
    }
  }

  return (
    <article className="luxury-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] text-muted-foreground">
          <span className="font-mono">{row.user_id.slice(0, 8)}…</span>
          <span className="mx-2">·</span>
          <span>{new Date(row.created_at).toLocaleString("ar-EG")}</span>
        </div>
        <div className="flex items-center gap-2">
          {row.replied_at ? (
            <span className="text-[11px] rounded-full bg-teal-soft text-teal-deep border border-teal/30 px-2.5 py-0.5 font-bold">تم الرد</span>
          ) : (
            <span className="text-[11px] rounded-full bg-gold-soft text-foreground border border-gold/40 px-2.5 py-0.5 font-semibold">بانتظار الرد</span>
          )}
          <button type="button" onClick={onDelete} className="text-xs text-red-600 hover:underline">حذف</button>
        </div>
      </div>

      {row.question_text && (
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{row.question_text}</p>
      )}
      {imgUrl && (
        <a href={imgUrl} target="_blank" rel="noopener noreferrer">
          <img src={imgUrl} alt="سؤال" className="mt-3 max-h-80 rounded-xl border border-border object-contain bg-black/5" />
        </a>
      )}

      <div className="mt-4 pt-4 border-t border-border space-y-3">
        <div className="text-xs font-bold text-teal-deep">رد الأستاذ أسامة</div>
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          rows={3}
          maxLength={8000}
          placeholder="اكتب الرد النصي…"
          className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm focus:border-teal focus:ring-2 focus:ring-teal/30 outline-none resize-y"
        />
        <div className="flex items-center gap-3 flex-wrap">
          <input ref={videoInput} type="file" accept="video/*" hidden onChange={(e) => pickVideo(e.target.files?.[0] ?? null)} />
          <button type="button" onClick={() => videoInput.current?.click()}
            className="rounded-xl border border-border bg-surface-2 px-4 py-2 text-sm font-semibold hover:border-teal">
            {row.reply_video_path ? "استبدال الفيديو" : "إرفاق فيديو رد"}
          </button>
          {videoFile && <span className="text-xs text-muted-foreground truncate">{videoFile.name} · {(videoFile.size / (1024*1024)).toFixed(1)}MB</span>}
        </div>
        {videoPreview && <video src={videoPreview} controls className="w-full rounded-xl bg-black aspect-video" />}
        {!videoPreview && videoUrl && <video src={videoUrl} controls className="w-full rounded-xl bg-black aspect-video" />}

        {err && <div className="text-sm rounded-xl bg-red-50 border border-red-200 text-red-700 px-3 py-2">{err}</div>}
        {msg && <div className="text-sm rounded-xl bg-teal-soft border border-teal/30 text-teal-deep px-3 py-2">{msg}</div>}

        <button type="button" onClick={submitReply} disabled={saving}
          className="w-full rounded-xl bg-gradient-to-l from-teal to-teal-deep text-white py-2.5 font-bold hover:opacity-95 shadow-md disabled:opacity-60">
          {saving ? "جارٍ الحفظ…" : row.replied_at ? "تحديث الرد" : "إرسال الرد"}
        </button>
      </div>
    </article>
  );
}