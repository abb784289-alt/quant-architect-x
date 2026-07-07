## Milestone 2 — Fix 404s + build the operational core

You're on **TanStack Start** (not Next.js), so routes live in `src/routes/*.tsx`, not `app/*/page.tsx`. I'll create the missing routes and wire real backend functionality. This is a large build — here's exactly what ships and in what order so nothing is a placeholder.

### Step 1 — Enable Lovable Cloud (required)
Uploads (video + Excel), the 150 sections DB, exam sessions, AI evaluation, and admin auth all need a backend. I'll enable Lovable Cloud (managed Postgres + Storage + Auth + server functions + AI Gateway).

### Step 2 — Database schema (migration)
- `sections` — id, title, category (`algebra|geometry|arithmetic|statistics`), order_index, video_url, duration_seconds, timer_seconds (custom countdown), created_at
- `questions` — id, section_id, prompt, choices (jsonb), correct_index, explanation
- `exam_sessions` — id, user_id, section_id, started_at, submitted_at, auto_submitted, score, time_taken_seconds, answers (jsonb), skipped (int[]), ai_report (jsonb)
- `user_roles` + `has_role()` (per platform security rules — admin gate)
- RLS on every table + GRANTs; storage buckets `lecture-videos` (private, signed URLs) and `section-imports` (private)

### Step 3 — Missing routes (fixes every 404)
- `src/routes/auth.tsx` — sign-in / sign-up (email + Google)
- `src/routes/_authenticated/route.tsx` — auth gate
- `src/routes/_authenticated/dashboard.tsx` — the 150-section academy, grouped in collapsible accordions per category (جبر / هندسة / حساب / إحصاء), progress badges, "ابدأ الاختبار" per section
- `src/routes/_authenticated/exam.$sectionId.tsx` — Nimar exam engine, teal top bar with live `mm:ss` countdown seeded from `sections.timer_seconds`, auto-submit + screen lock at 00:00
- `src/routes/_authenticated/report.$sessionId.tsx` — Smart AI Performance Report (mastery %, custom roadmap of sections to re-watch, motivational commentary "من الأستاذ أسامة")
- `src/routes/_authenticated/admin.tsx` — admin-only control center:
  - Drag-and-drop **video uploader** → Supabase Storage `lecture-videos`, attaches to a section
  - **Bulk CSV/XLSX section uploader** (parsed client-side with SheetJS) → server fn inserts/updates the 150 sections
  - Per-section **custom countdown timer** editor (دقائق : ثواني)
- Update `src/routes/index.tsx` — "ابدأ" now links to `/dashboard` (or `/auth` if signed out)

### Step 4 — Server functions (`src/lib/*.functions.ts`)
- `listSections`, `getSection`, `getQuestions`
- `startExamSession`, `submitExamSession` (also called by auto-submit) — computes score, time, weak areas, then calls the AI evaluator and stores the report
- `bulkUpsertSections` (admin) — accepts parsed rows
- `setSectionTimer`, `attachSectionVideo` (admin)
- `generateAiReport` — Lovable AI Gateway (`openai/gpt-5.5`) with structured `Output.object` → mastery, roadmap (section ids to rewatch), coaching commentary in Arabic voice of الأستاذ أسامة

### Step 5 — Polish
- Preserve the cinematic teal + gold design system already in place
- RTL, Arabic copy throughout
- Loading / empty / error states, no placeholders

### Technical notes
- Stack is TanStack Start; there is no `app/` or `pages/` directory. All Next.js `/admin/page.tsx`-style paths become TanStack routes as listed above — functionally identical URLs (`/admin`, `/dashboard`, `/exam/:sectionId`).
- Video uploads go to Supabase Storage from the browser using the authenticated Supabase client (chunked, resumable), then a server fn records the returned path on the section.
- Excel parsing uses `xlsx` in the browser so we never ship the file to a server function — only clean rows are sent.
- Admin gate uses the `user_roles` + `has_role()` security-definer pattern (never a boolean on profiles).

Approve and I'll build steps 1→5 in order.