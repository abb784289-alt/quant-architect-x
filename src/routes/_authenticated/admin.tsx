import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { listSections } from "@/lib/sections.functions";
import {
  bulkUpsertSections, setSectionTimer, attachSectionVideo,
  deleteSection, getMyRoles, grantSelfAdmin, seedSampleSections,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "لوحة التحكم — المِقْيَاس" }] }),
  component: AdminPage,
});

type Section = {
  id: string; title: string; category: string; order_index: number;
  timer_seconds: number; video_path: string | null;
};

const CATS = ["algebra", "geometry", "arithmetic", "statistics"] as const;

function AdminPage() {
  const roles = useServerFn(getMyRoles);
  const list = useServerFn(listSections);
  const bulk = useServerFn(bulkUpsertSections);
  const setTimer = useServerFn(setSectionTimer);
  const attach = useServerFn(attachSectionVideo);
  const remove = useServerFn(deleteSection);
  const grant = useServerFn(grantSelfAdmin);
  const seed = useServerFn(seedSampleSections);

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await roles();
      setIsAdmin(r.roles.includes("admin"));
      if (r.roles.includes("admin")) {
        const s = await list();
        setSections(s as Section[]);
      }
    } catch (e: any) { setErr(e.message); }
  }, [roles, list]);

  useEffect(() => { refresh(); }, [refresh]);

  if (isAdmin === null) return <div className="mx-auto max-w-7xl px-6 py-10 text-muted-foreground">جاري التحقّق…</div>;

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="glass-card p-8">
          <h1 className="font-display text-2xl font-black">صلاحيات إدارية مطلوبة</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            هذه اللوحة مخصّصة للأدمن. إن كنت أوّل مسؤول على المنصة يمكنك ترقية نفسك تلقائيًا (يعمل مرّة واحدة فقط عندما لا يوجد أي أدمن).
          </p>
          {err && <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs">{err}</div>}
          <button onClick={async () => { try { await grant(); setErr(null); refresh(); } catch (e:any) { setErr(e.message); } }}
            className="mt-6 rounded-full bg-gradient-to-l from-gold to-gold-soft px-6 py-3 font-display font-bold text-primary-foreground">
            رقّني كأول أدمن
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 space-y-8">
      <header>
        <div className="text-xs uppercase tracking-[0.3em] text-gold-soft">لوحة التحكم المتقدمة</div>
        <h1 className="mt-2 font-display text-4xl font-black">مركز قيادة المنصة</h1>
      </header>

      {msg && <div className="rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm text-gold-soft">{msg}</div>}
      {err && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">{err}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BulkUploader onDone={async (n: number | string) => { setMsg(typeof n === "number" ? `تم رفع ${n} قسمًا بنجاح.` : n); refresh(); }}
          onError={(e: string) => setErr(e)} bulk={bulk} seed={seed} />
        <VideoUploader sections={sections} attach={attach}
          onDone={(t: string) => { setMsg(t); refresh(); }} onError={(e: string) => setErr(e)} />
      </div>

      <SectionsTable sections={sections} setTimer={setTimer} remove={remove}
        onDone={(t: string) => { setMsg(t); refresh(); }} onError={(e: string) => setErr(e)} />
    </main>
  );
}

/* ---------- BULK UPLOADER ---------- */
function BulkUploader({ bulk, seed, onDone, onError }: any) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<any[] | null>(null);

  async function handleFile(f: File) {
    setBusy(true);
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: "" });
      const parsed = rows.map((r, i) => ({
        title: String(r.title ?? r.Title ?? r.العنوان ?? "").trim(),
        category: normalizeCategory(r.category ?? r.Category ?? r.المجال ?? "algebra"),
        order_index: Number(r.order_index ?? r.order ?? i) || i,
        timer_seconds: Number(r.timer_seconds ?? r.timer ?? 1500) || 1500,
        description: String(r.description ?? r.desc ?? r.الوصف ?? "") || null,
      })).filter((r) => r.title);
      setPreview(parsed);
    } catch (e: any) { onError(`تعذّر قراءة الملف: ${e.message}`); }
    finally { setBusy(false); }
  }

  async function confirmUpload() {
    if (!preview) return;
    setBusy(true);
    try {
      const { inserted } = await bulk({ data: { rows: preview } });
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      onDone(inserted);
    } catch (e: any) { onError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-gold/40 bg-teal-deep/60 text-gold">📥</div>
        <div>
          <h3 className="font-display text-lg font-bold">رفع الأقسام دفعة واحدة</h3>
          <p className="text-xs text-muted-foreground">ملف Excel أو CSV (title, category, order_index, timer_seconds, description)</p>
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="block w-full cursor-pointer rounded-xl border border-dashed border-gold/40 bg-teal-deep/40 px-4 py-6 text-center text-sm hover:border-gold/70" />

      {preview && (
        <div className="mt-4">
          <div className="text-xs text-muted-foreground">معاينة {preview.length} صفًا:</div>
          <div className="mt-2 max-h-40 overflow-auto rounded-lg border border-white/5 bg-teal-deep/50 p-2 text-xs">
            {preview.slice(0, 8).map((r, i) => (
              <div key={i} className="flex justify-between border-b border-white/5 py-1 last:border-0">
                <span>{r.title}</span>
                <span className="text-gold-soft">{r.category} · {r.timer_seconds}s</span>
              </div>
            ))}
            {preview.length > 8 && <div className="pt-1 text-center text-muted-foreground">…و {preview.length - 8} أخرى</div>}
          </div>
          <button onClick={confirmUpload} disabled={busy}
            className="mt-3 rounded-full bg-gradient-to-l from-gold to-gold-soft px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">
            {busy ? "..." : "تأكيد الرفع"}
          </button>
        </div>
      )}

      <div className="mt-4 border-t border-white/5 pt-4 text-xs text-muted-foreground">
        <button onClick={async () => { try { const r = await seed(); onDone(`تم بذر ${r.inserted} قسم تجريبي.`); } catch (e:any) { onError(e.message); } }}
          className="rounded-full border border-white/10 px-3 py-1.5 hover:border-gold/40">
          أو ابذر ١٦ قسم تجريبي فورًا
        </button>
      </div>
    </div>
  );
}

function normalizeCategory(v: string): "algebra"|"geometry"|"arithmetic"|"statistics" {
  const s = String(v).toLowerCase().trim();
  if (["algebra","جبر"].includes(s)) return "algebra";
  if (["geometry","هندسة"].includes(s)) return "geometry";
  if (["arithmetic","حساب"].includes(s)) return "arithmetic";
  if (["statistics","إحصاء","احصاء"].includes(s)) return "statistics";
  return "algebra";
}

/* ---------- VIDEO UPLOADER ---------- */
function VideoUploader({ sections, attach, onDone, onError }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [sectionId, setSectionId] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  async function upload() {
    if (!file || !sectionId) { onError("اختر قسمًا وملف فيديو أولاً."); return; }
    setBusy(true); setProgress(0);
    try {
      const path = `${sectionId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const { error } = await supabase.storage.from("lecture-videos").upload(path, file, {
        cacheControl: "3600", upsert: false, contentType: file.type,
      });
      if (error) throw error;
      setProgress(100);
      await attach({ data: { id: sectionId, video_path: path } });
      setFile(null);
      onDone("تم رفع الفيديو وربطه بالقسم.");
    } catch (e: any) { onError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-gold/40 bg-teal-deep/60 text-gold">🎬</div>
        <div>
          <h3 className="font-display text-lg font-bold">رفع محاضرة فيديو</h3>
          <p className="text-xs text-muted-foreground">اختر قسمًا ثم فيديو من جهازك — سيُخزَّن مشفَّرًا.</p>
        </div>
      </div>

      <select value={sectionId} onChange={(e) => setSectionId(e.target.value)}
        className="mb-3 w-full rounded-xl border border-white/10 bg-teal-deep/60 px-4 py-3 text-sm">
        <option value="">— اختر القسم —</option>
        {sections.map((s: Section) => <option key={s.id} value={s.id}>{s.title} ({s.category})</option>)}
      </select>

      <label className="block cursor-pointer rounded-xl border border-dashed border-gold/40 bg-teal-deep/40 px-4 py-8 text-center text-sm hover:border-gold/70">
        <input type="file" accept="video/*" className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        {file ? <><b>{file.name}</b><br/><span className="text-xs text-muted-foreground">{(file.size/1024/1024).toFixed(1)} MB</span></> : "اسحب فيديو هنا أو انقر للاختيار"}
      </label>

      {progress > 0 && <div className="mt-3 h-2 overflow-hidden rounded-full bg-teal-deep/60"><div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} /></div>}

      <button onClick={upload} disabled={busy || !file || !sectionId}
        className="mt-4 rounded-full bg-gradient-to-l from-gold to-gold-soft px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">
        {busy ? "جاري الرفع…" : "رفع وربط"}
      </button>
    </div>
  );
}

/* ---------- SECTIONS TABLE ---------- */
function SectionsTable({ sections, setTimer, remove, onDone, onError }: any) {
  return (
    <div className="glass-card p-6">
      <h3 className="mb-4 font-display text-lg font-bold">جميع الأقسام ({sections.length})</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-right text-xs text-gold-soft">
            <tr className="border-b border-white/10">
              <th className="py-2">العنوان</th><th>المجال</th><th>الترتيب</th><th>المؤقّت (د:ث)</th><th>فيديو</th><th></th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s: Section) => (
              <TimerRow key={s.id} s={s} setTimer={setTimer} remove={remove} onDone={onDone} onError={onError} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TimerRow({ s, setTimer, remove, onDone, onError }: any) {
  const [m, setM] = useState(Math.floor(s.timer_seconds / 60));
  const [sec, setSec] = useState(s.timer_seconds % 60);
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    try { await setTimer({ data: { id: s.id, timer_seconds: m * 60 + sec } }); onDone("تم حفظ المؤقّت."); }
    catch (e: any) { onError(e.message); }
    finally { setSaving(false); }
  }
  return (
    <tr className="border-b border-white/5">
      <td className="py-3">{s.title}</td>
      <td className="text-xs text-muted-foreground">{s.category}</td>
      <td className="text-xs">{s.order_index}</td>
      <td>
        <div className="flex items-center gap-1">
          <input type="number" min={0} max={720} value={m} onChange={(e) => setM(Number(e.target.value))}
            className="w-14 rounded border border-white/10 bg-teal-deep/60 px-2 py-1 text-center text-sm" />
          :
          <input type="number" min={0} max={59} value={sec} onChange={(e) => setSec(Number(e.target.value))}
            className="w-14 rounded border border-white/10 bg-teal-deep/60 px-2 py-1 text-center text-sm" />
          <button onClick={save} disabled={saving} className="mr-1 rounded-full border border-gold/40 px-3 py-1 text-xs text-gold hover:bg-gold/10">حفظ</button>
        </div>
      </td>
      <td className="text-xs">{s.video_path ? <span className="text-gold">✓ مرفوع</span> : <span className="text-muted-foreground">—</span>}</td>
      <td>
        <button onClick={async () => { if (!confirm("حذف هذا القسم؟")) return;
          try { await remove({ data: { id: s.id } }); onDone("تم الحذف."); } catch (e:any) { onError(e.message); }}}
          className="text-xs text-destructive hover:underline">حذف</button>
      </td>
    </tr>
  );
}