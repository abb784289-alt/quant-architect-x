import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  submitQuestion,
  listMyQuestions,
  getMediaSignedUrl,
} from "@/lib/questions.functions";

export const Route = createFileRoute("/_authenticated/ask")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "اسأل الأستاذ أسامة — منصة المِقْيَاس" },
      {
        name: "description",
        content:
          "ابعت سؤالك للأستاذ أسامة نصياً أو كصورة، ويرد عليك برسالة أو فيديو تعليمي.",
      },
    ],
  }),
  component: AskPage,
});

type QuestionRow = {
  id: string;
  question_text: string | null;
  question_image_path: string | null;
  reply_text: string | null;
  reply_video_path: string | null;
  replied_at: string | null;
  created_at: string;
};

function AskPage() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [items, setItems] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInput = useRef<HTMLInputElement>(null);

  async function refresh() {
    setLoading(true);
    try {
      const rows = await listMyQuestions();
      setItems(rows as QuestionRow[]);
    } catch (e: any) {
      setError(e?.message || "تعذّر تحميل الأسئلة");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function pick(f: File | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("اختر ملف صورة فقط");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("حجم الصورة أكبر من 10MB");
      return;
    }
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function clearImage() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const t = text.trim();
    if (!t && !file) {
      setError("اكتب سؤالك أو ارفع صورة");
      return;
    }
    setSubmitting(true);
    try {
      let imagePath: string | null = null;
      if (file) {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData.user?.id;
        if (!uid) throw new Error("انتهت الجلسة، سجّل الدخول من جديد");
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${uid}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("question-images")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw new Error(upErr.message);
        imagePath = path;
      }
      await submitQuestion({
        data: {
          question_text: t || null,
          question_image_path: imagePath,
        },
      });
      setText("");
      clearImage();
      setOk("تم إرسال سؤالك للأستاذ أسامة. سيصلك الرد قريباً.");
      await refresh();
    } catch (e: any) {
      setError(e?.message || "تعذّر إرسال السؤال");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-8 md:py-12" dir="rtl">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link to="/dashboard" className="text-sm text-teal-deep hover:underline">
            ← العودة للأقسام
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full bg-gold-soft border border-gold/40 px-3 py-1 text-[11px] font-semibold">
            تواصل مباشر
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground">اسأل الأستاذ أسامة</h1>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          اكتب سؤالك أو ارفع صورة للمسألة اللي محتاج فيها مساعدة، وهيوصلك الرد بفيديو أو رسالة من الأستاذ.
        </p>
      </header>

      <form onSubmit={onSubmit} className="luxury-card p-5 md:p-6 mb-8 space-y-4">
        <label className="block">
          <span className="text-xs font-semibold text-foreground">اكتب سؤالك</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            maxLength={4000}
            placeholder="اكتب المسألة أو الاستفسار هنا…"
            className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm focus:border-teal focus:ring-2 focus:ring-teal/30 outline-none resize-y"
          />
        </label>

        <div>
          <span className="text-xs font-semibold text-foreground">أو ارفع صورة للمسألة</span>
          <div className="mt-1.5 flex items-center gap-3">
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => pick(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="rounded-xl border border-border bg-surface-2 px-4 py-2 text-sm font-semibold hover:border-teal transition-colors"
            >
              اختر صورة
            </button>
            {file && (
              <button
                type="button"
                onClick={clearImage}
                className="text-xs text-red-600 hover:underline"
              >
                إزالة
              </button>
            )}
            {file && (
              <span className="text-xs text-muted-foreground truncate">
                {file.name} · {(file.size / 1024).toFixed(0)}KB
              </span>
            )}
          </div>
          {preview && (
            <img
              src={preview}
              alt="preview"
              className="mt-3 max-h-64 rounded-xl border border-border object-contain bg-black/5"
            />
          )}
        </div>

        {error && (
          <div className="text-sm rounded-xl bg-red-50 border border-red-200 text-red-700 px-3 py-2">
            {error}
          </div>
        )}
        {ok && (
          <div className="text-sm rounded-xl bg-teal-soft border border-teal/30 text-teal-deep px-3 py-2">
            {ok}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-gradient-to-l from-teal to-teal-deep text-white py-3 font-bold hover:opacity-95 transition-opacity shadow-md disabled:opacity-60"
        >
          {submitting ? "جارٍ الإرسال…" : "إرسال السؤال"}
        </button>
      </form>

      <section>
        <h2 className="text-lg font-bold text-foreground mb-3">أسئلتي السابقة</h2>
        {loading ? (
          <div className="text-sm text-muted-foreground">جارٍ التحميل…</div>
        ) : items.length === 0 ? (
          <div className="luxury-card p-6 text-center text-sm text-muted-foreground">
            لم ترسل أي سؤال بعد.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((q) => (
              <QuestionCard key={q.id} row={q} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function QuestionCard({ row }: { row: QuestionRow }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (row.question_image_path) {
      getMediaSignedUrl({ data: { question_id: row.id, kind: "image" } })
        .then((r) => !cancelled && setImgUrl(r.url))
        .catch(() => {});
    }
    if (row.reply_video_path) {
      getMediaSignedUrl({ data: { question_id: row.id, kind: "video" } })
        .then((r) => !cancelled && setVideoUrl(r.url))
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [row.id, row.question_image_path, row.reply_video_path]);

  const hasReply = row.reply_text || row.reply_video_path;

  return (
    <article className="luxury-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-muted-foreground">
          {new Date(row.created_at).toLocaleString("ar-EG")}
        </span>
        {hasReply ? (
          <span className="text-[11px] rounded-full bg-teal-soft text-teal-deep border border-teal/30 px-2.5 py-0.5 font-bold">
            تم الرد
          </span>
        ) : (
          <span className="text-[11px] rounded-full bg-gold-soft text-foreground border border-gold/40 px-2.5 py-0.5 font-semibold">
            في انتظار الرد
          </span>
        )}
      </div>
      {row.question_text && (
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
          {row.question_text}
        </p>
      )}
      {imgUrl && (
        <img
          src={imgUrl}
          alt="سؤال"
          className="mt-3 max-h-80 rounded-xl border border-border object-contain bg-black/5"
        />
      )}
      {hasReply && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs font-bold text-teal-deep mb-2">رد الأستاذ أسامة</div>
          {row.reply_text && (
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {row.reply_text}
            </p>
          )}
          {videoUrl && (
            <video
              src={videoUrl}
              controls
              className="mt-3 w-full rounded-xl bg-black aspect-video"
            />
          )}
        </div>
      )}
    </article>
  );
}