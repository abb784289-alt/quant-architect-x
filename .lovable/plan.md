# Fix Auth: Working localStorage Login/Register + Admin Bypass

Overwrite `src/routes/auth.tsx` with a complete, self-contained client component. No backend calls, no Supabase, no server functions — pure localStorage. This eliminates the "validation/database" rejections entirely.

## What the new page does

**Two tabs (RTL, deep teal + gold theme, matches existing palette):**
- تسجيل الدخول (Sign In)
- إنشاء حساب جديد (Register)

**Register tab fields:** Full Name, Email, Password, Mobile Number
- On submit: light validation (non-empty, email contains `@`, password ≥ 6, mobile ≥ 8 digits)
- Save `{ fullName, email, password, mobile, createdAt }` under `localStorage.user_account`
- Show gold success toast: "تم إنشاء حسابك بنجاح — سجّل الدخول الآن"
- Auto-switch to Sign In tab, prefill email

**Sign In tab fields:** Email, Password
- **Admin bypass first:** if `email === "admin@miqyas.com"` AND `password === "admin@100percent"` → set `localStorage.session = { role: "admin", email }` → `window.location.href = "/admin"`
- Otherwise: read `localStorage.user_account`, compare email + password
  - Match → set `localStorage.session = { role: "student", email }` → `window.location.href = "/dashboard"`
  - Empty fields → inline red message "من فضلك أدخل البريد وكلمة المرور"
  - No account saved → "لا يوجد حساب بهذا البريد — أنشئ حساباً جديداً"
  - Wrong password → "كلمة المرور غير صحيحة"
- Never blocks a syntactically valid input; no regex rejection loop

## Visual system (reuses existing tokens from `src/styles.css`)

- Background: existing teal gradient from `body` (no override needed)
- Card: `glass-card` + `gold-ring` utilities already defined
- Tabs: two pill buttons; active = gold fill on teal-deep text; inactive = white/10 with border
- Inputs: white/10 bg, gold focus ring, RTL, IBM Plex Arabic
- Primary CTA: gold gradient with `animate-pulse-gold` on hover
- Success/error banners: gold-tinted and red-tinted glass strips (no hardcoded hex; use existing tokens where possible)
- Small footer note: "الدخول التجريبي محلي — بدون اتصال بقاعدة بيانات"

## Files touched

- `src/routes/auth.tsx` — full rewrite (single client component, `ssr: false` kept). No other files change.
- No new packages, no migrations, no route tree edits.

## Out of scope (intentionally)

- No Supabase, no Twilio OTP, no Moyasar, no server functions in this step.
- Admin/dashboard routes remain as they are (already publicly reachable per prior fix).
