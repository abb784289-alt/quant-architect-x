'use client';

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { readSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "لوحة التحكم العامة — منصة المِقْيَاس" },
      { name: "description", content: "لوحة تحكم عامة لإدارة فيديوهات وأقسام ومؤقتات منصة المِقْيَاس الذكية بدون أي بوابة تحقق." },
    ],
  }),
  component: AdminGate,
});

function AdminGate() {
  const [state, setState] = useState<"checking" | "allowed" | "denied">("checking");
  useEffect(() => {
    const s = readSession();
    if (s?.role === "admin") {
      setState("allowed");
    } else {
      setState("denied");
      window.location.replace("/auth");
    }
  }, []);
  if (state === "allowed") return <AdminDashboardPage />;
  return (
    <div dir="rtl" className="min-h-[60vh] grid place-items-center text-muted-foreground">
      جارٍ التحقق من صلاحيات الدخول...
    </div>
  );
}

type SectionRecord = {
  id: string;
  order: number;
  title: string;
  category: string;
  duration: number;
  videoName: string;
  status: "جاهز" | "مسودة" | "مراجعة";
};

const categoryNames = ["الجبر", "الهندسة", "الحساب", "الإحصاء", "النسب والتناسب", "المقارنات الكمية"];

const starterSections: SectionRecord[] = Array.from({ length: 150 }, (_, index) => {
  const category = categoryNames[index % categoryNames.length];
  return {
    id: `section-${index + 1}`,
    order: index + 1,
    title: `${category} — مهارة ${index + 1}`,
    category,
    duration: 25,
    videoName: index < 18 ? `lecture-${String(index + 1).padStart(3, "0")}.mp4` : "لم يتم الربط بعد",
    status: index < 72 ? "جاهز" : index < 112 ? "مراجعة" : "مسودة",
  };
});

function AdminDashboardPage() {
  const [sections, setSections] = useState<SectionRecord[]>(starterSections);
  const [selectedSection, setSelectedSection] = useState(starterSections[0].id);
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [bulkPreview, setBulkPreview] = useState<SectionRecord[]>([]);
  const [videoFileName, setVideoFileName] = useState("لم يتم اختيار فيديو بعد");
  const [notice, setNotice] = useState("تم تعطيل كل بوابات التحقق — لوحة التحكم مفتوحة الآن مباشرة.");
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const ready = sections.filter((section) => section.status === "جاهز").length;
    const review = sections.filter((section) => section.status === "مراجعة").length;
    const draft = sections.filter((section) => section.status === "مسودة").length;
    const withVideos = sections.filter((section) => section.videoName !== "لم يتم الربط بعد").length;
    return { ready, review, draft, withVideos };
  }, [sections]);

  function handleVideoSelection(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setVideoFileName(file.name);
    setSections((current) =>
      current.map((section) =>
        section.id === selectedSection ? { ...section, videoName: file.name, status: "جاهز" } : section,
      ),
    );
    setNotice(`تم تجهيز الفيديو المحلي وربطه بالقسم المحدد: ${file.name}`);
  }

  function applyTimer() {
    setSections((current) =>
      current.map((section) => (section.id === selectedSection ? { ...section, duration: timerMinutes } : section)),
    );
    setNotice(`تم ضبط مؤقت القسم المحدد على ${timerMinutes} دقيقة.`);
  }

  async function handleBulkFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 150)
      .map((line, index) => {
        const [title = `قسم ${index + 1}`, category = categoryNames[index % categoryNames.length], duration = "25"] = line
          .split(",")
          .map((cell) => cell.trim());
        return {
          id: `bulk-${Date.now()}-${index}`,
          order: index + 1,
          title,
          category,
          duration: Number(duration) || 25,
          videoName: "لم يتم الربط بعد",
          status: "مراجعة" as const,
        };
      });
    setBulkPreview(rows);
    setNotice(`تمت قراءة ${rows.length} قسم من ملف الرفع الجماعي.`);
  }

  function commitBulkUpload() {
    if (!bulkPreview.length) return;
    setSections(bulkPreview.map((section, index) => ({ ...section, order: index + 1 })));
    setSelectedSection(bulkPreview[0].id);
    setBulkPreview([]);
    if (bulkInputRef.current) bulkInputRef.current.value = "";
    setNotice("تم استبدال خريطة الأقسام الحالية بملف الرفع الجماعي بنجاح.");
  }

  const selected = sections.find((section) => section.id === selectedSection) ?? sections[0];

  return (
    <main className="min-h-screen bg-background text-foreground" dir="rtl">
      <section className="border-b border-white/10 bg-gradient-to-l from-teal-deep via-teal to-teal-deep px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-xs uppercase tracking-[0.3em] text-gold-soft">Master Admin Control Center</div>
          <h1 className="mt-3 font-display text-4xl font-black sm:text-5xl">لوحة التحكم السيادية للأستاذ أسامة</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
            إدارة مباشرة للأقسام، الفيديوهات المحلية، الرفع الجماعي، ومؤقت اختبار نمر بدون أي تحويلات أو تحقق جلسة.
          </p>
          <div className="mt-6 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold-soft">{notice}</div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-6 py-8 lg:grid-cols-4">
        <StatCard label="الأقسام الجاهزة" value={stats.ready} />
        <StatCard label="قيد المراجعة" value={stats.review} />
        <StatCard label="المسودات" value={stats.draft} />
        <StatCard label="فيديوهات مربوطة" value={stats.withVideos} />
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 pb-10 lg:grid-cols-3">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-gold/40 bg-teal-deep/60 text-xl text-gold">🎬</div>
            <div>
              <h2 className="font-display text-xl font-bold">Local Video Upload Slot</h2>
              <p className="text-xs text-muted-foreground">ربط فيديو محلي بأي قسم من الـ 150 قسم.</p>
            </div>
          </div>

          <select
            value={selectedSection}
            onChange={(event) => setSelectedSection(event.target.value)}
            className="mt-5 w-full rounded-xl border border-white/10 bg-teal-deep/70 px-4 py-3 text-sm outline-none focus:border-gold/60"
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.order}. {section.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="mt-4 w-full rounded-xl border border-dashed border-gold/50 bg-gold/10 px-4 py-8 text-sm text-gold-soft transition hover:bg-gold/15"
          >
            اضغط لاختيار ملف فيديو محلي
          </button>
          <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(event) => handleVideoSelection(event.target.files)} />
          <div className="mt-4 rounded-xl border border-white/10 bg-teal-deep/45 p-4 text-xs text-muted-foreground">
            <div className="text-gold-soft">القسم الحالي: {selected.title}</div>
            <div className="mt-2">الفيديو: {videoFileName}</div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-gold/40 bg-teal-deep/60 text-xl text-gold">📥</div>
            <div>
              <h2 className="font-display text-xl font-bold">150 Sections Bulk Uploader</h2>
              <p className="text-xs text-muted-foreground">CSV: title, category, duration.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => bulkInputRef.current?.click()}
            className="mt-5 w-full rounded-xl border border-dashed border-gold/50 bg-teal-deep/45 px-4 py-8 text-sm transition hover:border-gold/80"
          >
            اختر ملف CSV للأقسام الـ 150
          </button>
          <input ref={bulkInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void handleBulkFile(event.target.files)} />

          <div className="mt-4 max-h-40 overflow-auto rounded-xl border border-white/10 bg-teal-deep/45 p-3 text-xs">
            {bulkPreview.length ? (
              bulkPreview.slice(0, 10).map((section) => (
                <div key={section.id} className="flex justify-between border-b border-white/5 py-2 last:border-0">
                  <span>{section.title}</span>
                  <span className="text-gold-soft">{section.category}</span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground">لا توجد معاينة بعد.</div>
            )}
          </div>

          <button
            type="button"
            onClick={commitBulkUpload}
            disabled={!bulkPreview.length}
            className="mt-4 w-full rounded-xl bg-gradient-to-l from-gold to-gold-soft px-5 py-3 font-display font-bold text-primary-foreground transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
          >
            اعتماد ملف الأقسام
          </button>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-gold/40 bg-teal-deep/60 text-xl text-gold">⏱</div>
            <div>
              <h2 className="font-display text-xl font-bold">Custom Timer Setup</h2>
              <p className="text-xs text-muted-foreground">تحديد زمن اختبار نمر لكل قسم.</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-teal-deep/45 p-5 text-center">
            <div className="text-xs text-muted-foreground">القسم المحدد</div>
            <div className="mt-2 font-display text-lg font-bold text-gold-soft">{selected.title}</div>
            <div className="mt-4 font-display text-5xl font-black tabular-nums text-gold-gradient">{timerMinutes}</div>
            <div className="text-xs text-muted-foreground">دقيقة</div>
          </div>

          <input
            type="range"
            min="5"
            max="90"
            value={timerMinutes}
            onChange={(event) => setTimerMinutes(Number(event.target.value))}
            className="mt-6 w-full accent-gold"
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>5 دقائق</span>
            <span>90 دقيقة</span>
          </div>

          <button
            type="button"
            onClick={applyTimer}
            className="mt-5 w-full rounded-xl border border-gold/40 bg-gold/10 px-5 py-3 font-display font-bold text-gold-soft transition hover:bg-gold/15"
          >
            حفظ المؤقت للقسم
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-14">
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div>
              <h2 className="font-display text-xl font-bold">خريطة الأقسام الكاملة</h2>
              <p className="text-xs text-muted-foreground">150 قسم جاهزة للفرز والإدارة المباشرة.</p>
            </div>
            <div className="rounded-full border border-gold/30 px-4 py-2 text-xs text-gold-soft">{sections.length} قسم</div>
          </div>
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="sticky top-0 bg-teal-deep text-right text-xs text-gold-soft">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">القسم</th>
                  <th className="px-4 py-3">التصنيف</th>
                  <th className="px-4 py-3">المؤقت</th>
                  <th className="px-4 py-3">الفيديو</th>
                  <th className="px-4 py-3">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section) => (
                  <tr key={section.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{section.order}</td>
                    <td className="px-4 py-3 font-display font-bold">{section.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{section.category}</td>
                    <td className="px-4 py-3 text-gold-soft">{section.duration} دقيقة</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{section.videoName}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs text-gold-soft">{section.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-card p-5 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-4xl font-black text-gold-gradient tabular-nums">{value}</div>
    </div>
  );
}