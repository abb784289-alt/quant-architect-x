## Scope

Convert the app to a **Luxury Light Theme** and restructure into 4 modules. This is a big refactor — I'll do it in one pass but need your sign-off on the shape first.

Note: this project is **TanStack Start**, not Next.js — routes live in `src/routes/`, not `/app/`. Everything below maps 1:1 to your intent.

---

## 1. Light Theme Tokens (`src/styles.css`)

Wipe current dark palette. New tokens:

- `--background`: #FFFFFF, page surface `--surface-1`: #F8FAFC, `--surface-2`: #F1F5F9
- `--teal`: #0D9488 (primary), `--teal-deep`: #0F766E (text/CTA)
- `--gold`: #F59E0B (highlights only — badges, progress, "active question" ring)
- `--foreground`: slate-900, `--muted-foreground`: slate-500, `--border`: slate-200
- Keep Cairo + IBM Plex Sans Arabic
- Rework `glass-card`, `gold-ring`, gradients for light surfaces (soft shadows, no backdrop-blur-on-dark tricks)

## 2. Foundation Academy `/foundation` (new)

Independent hub, publicly reachable from dashboard header. 4 super-categories as large cards:
1. النسبة والتناسب والكسور  2. الهندسة والزوايا والأشكال  3. الإحصاء والرسوم البيانية  4. المتوسطات والمسائل الحياتية

Each category page (`/foundation/$categoryId`) lists: concept video player + core formulas panel. Data source: `localStorage.foundation_assets` (populated by admin uploader).

## 3. Serialized 150 Sections `/dashboard`

- Remove hardcoded category names. Render **150 numbered cards** (القسم 1 … القسم 150).
- Sticky **fast search bar**: type a number → instant filter + "اذهب للقسم N" Enter shortcut.
- Each card: mini video-ready thumbnail + "ابدأ اختبار نمر" button → `/exam?section=N`.
- Section metadata (title override, timer, video URL) read from `localStorage.sections_config` (admin-controlled), with sensible defaults.

## 4. Admin Control Center `/admin`

Light-mode executive panel, 3 tools:

- **Local Video Uploader**: drag-and-drop `<input type="file">`, target dropdown = `Foundation:{1..4}` or `Section:{1..150}`. Stores as object URL + metadata in localStorage (client-only, per your "no DB" directive). Note upfront: browser storage caps mean this is a demo-scale uploader; real video hosting needs backend later.
- **Serialized Section Organizer**: CSV upload (columns: `number,title,timer_seconds,video_url`) + inline table editor for all 150 rows.
- **Custom Timer Controller**: per-section minutes/seconds input, plus a global default.

## 5. Nimar Exam Engine `/exam` (light rewrite)

Full-screen light layout, no book/watermark artwork. Reads `?section=N` for context.

- **Top ribbon** (light teal on white): test code (`النِمار — القسم N`), countdown (from admin config), question counter, solved/unsolved counters.
- **Split view**:
  - Left: floating HTML5 scratchpad on white canvas — pen/eraser/undo/redo/brush size + 6-color palette. Canvas state cached per-question in memory (swap without losing strokes).
  - Right: KaTeX-rendered question, A+/A/A- font sizer, MCQ options vertically stacked with radio on the **right edge** of each option box.
- **Right sidebar**: student identity card + numeric grid (answered = warm orange, active = gold ring, unvisited = light grey).
- **Bottom nav**: التالي، السؤال السابق، إضافة لمجلد، وضع مؤشر كعلامة مرجعية.
- **Floating utility column**: تعليمات القسم، تعليمات الاختبار، القوانين، and a **red** إنهاء القسم button.

## 6. Auth `/auth` (kept, restyled light)

Already localStorage-based. Just re-skin to light theme. Admin creds unchanged (`admin@miqyas.com` / `admin@100percent`), student flow unchanged.

---

## Technical notes

- Stack: TanStack Start + TS + Tailwind v4 (not Next.js). Routes = `src/routes/*.tsx`.
- No backend calls this pass — pure client + localStorage, matching your "no DB loops" directive.
- New deps: `katex` + `react-katex` for math, `papaparse` for CSV.
- Files touched/created:
  - `src/styles.css` (rewrite tokens)
  - `src/routes/_authenticated/dashboard.tsx` (serialized 150 + search)
  - `src/routes/_authenticated/admin.tsx` (3-tool control center)
  - `src/routes/_authenticated/exam.tsx` (light Nimar rewrite, reads `?section=N`)
  - `src/routes/_authenticated/foundation.tsx` (hub)
  - `src/routes/_authenticated/foundation.$categoryId.tsx` (category detail)
  - `src/routes/auth.tsx` (light re-skin)
  - `src/routes/_authenticated/route.tsx` (header link to Foundation)
  - `src/lib/platform-config.ts` (localStorage helpers: sections config, foundation assets, video store)

## Out of scope this pass (call out explicitly)

- Real video hosting (localStorage/object URLs only — demo scale)
- Real backend, Moyasar, Twilio OTP, Supabase wiring
- Server-side timer enforcement (client-side countdown only)

Approve and I'll ship all files in one batch.