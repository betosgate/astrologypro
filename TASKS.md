# AstrologyPro — Daily Task Board

> **Workflow:** Update this file each session. Check off items as you go. Push at end of day.
> **Last updated:** 2026-04-03 (session 6)

---

## 📊 Progress Overview

| Area | Status |
|---|---|
| Routing & deployment | ✅ Fixed |
| Stripe checkout (platform billing) | ✅ Working |
| Signup flow | ✅ Fixed (webhook was inserting wrong columns — now fixed) |
| Onboarding — profile fields | ✅ Complete |
| SEO & social metadata | ✅ Complete |
| Database migration (profile fields) | ✅ Applied to production |
| Stripe Connect — account creation | ✅ Fixed (`stripe_account_id` field name corrected) |
| Stripe Connect — KYC status sync | ✅ `account.updated` webhook added |
| Availability booking conflict detection | ✅ Fixed (`end_at` bug + `is_active` filter) |
| Dashboard routes (all 16) | ✅ Validated via Chrome review |
| Client portal routes (all 4) | ✅ Validated via code review |
| Stripe debug endpoint (security) | ✅ Removed (`GET /api/stripe/checkout` was public) |
| Twilio WebSocket spam | ✅ Fixed (device now destroyed on error) |
| Booking flow (end-to-end) | ✅ Fixed (RLS + 5 stacked column bugs; all DB writes use adminSupabase) |
| Portal `clients` table bugs | ✅ Fixed (`display_name` → `full_name` across layout/page/profile) |
| Booking status `cancelled` | ✅ Fixed (schema uses `canceled`; UI had double-L everywhere) |
| Cron / follow-up emails | ✅ Fixed (`questionnaire` → `questionnaire_responses`; `display_name` cleanup) |
| Event reminder deduplication | ✅ Migration created (`scheduled_notifications` table was missing) |
| Refund flow | ✅ Fixed (cents/dollars mismatch; `amount` → `base_price`; `display_name` → `full_name`) |
| Dashboard bookings display | ✅ Fixed (`amount`, `duration`, `display_name` → correct column names) |
| Reschedule diviner email | ✅ Fixed (looked up diviner email via auth; was using non-existent `.email` column) |
| Email notifications | 🟡 AWS SES wired; DNS records added; awaiting SES verification (~72h) |
| Vercel env vars | ✅ All 16 vars pushed to production (Supabase, Stripe, SES, app URL) |
| Phone readings (Twilio) | 🔴 Stub only — credentials misconfigured in prod |
| Marketing automation | 🔴 Crons fire; social POST is a stub (Ayrshare key needed) |
| Currency bugs (global sweep) | ✅ All `/100` division bugs fixed across 10 files |
| Affiliate detail page | ✅ Fixed wrong column names + `/100` bugs |
| Services feature (3 files) | ✅ Fixed all column names (duration_minutes, base_price, is_featured, is_active) |
| Gift purchase flow | ✅ Redesigned — Stripe Checkout → webhook creates cert |
| Build errors (Turbopack) | ✅ Fixed playwright scan, tsconfig exclude, turbopack config |

---

## 🔴 Critical — Run in Supabase

### Apply the migration

The file `supabase/migrations/20260403000001_diviner_profile_fields.sql` was added.
Run it manually in the Supabase SQL editor for your project:

```sql
-- Copy from supabase/migrations/20260403000001_diviner_profile_fields.sql
ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS cover_image_url        text,
  ADD COLUMN IF NOT EXISTS phone                  text,
  ADD COLUMN IF NOT EXISTS youtube_channel_id     text,
  ADD COLUMN IF NOT EXISTS facebook_live_url      text;

ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS charges_enabled        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS payouts_enabled        boolean DEFAULT false;

ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS google_calendar_connected boolean
    GENERATED ALWAYS AS (google_calendar_token IS NOT NULL) STORED;

ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS twilio_phone_number    varchar(20),
  ADD COLUMN IF NOT EXISTS twilio_phone_sid       varchar(64);

ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS notification_email               boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_sms                 boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_booking_confirmed   boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_booking_cancelled   boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_payout              boolean DEFAULT true;
```

- [x] Run migration in **production** Supabase project ✅ Applied 2026-04-03
- [x] Run migration in **dev/staging** Supabase project ✅ Applied 2026-04-03 (session 3b)

---

## 🟠 High Priority

| # | Task | Notes |
|---|---|---|
| H1 | **OG social image** | Create a proper 1200×630px branded card. Currently using `run_your_divination.png` as fallback |
| H2 | **Apple touch icon** | `png_logo_1.png` used as apple-touch-icon — needs a proper square 180×180px version |
| H3 | **Verify Stripe Connect webhook** | Register `account.updated` in the Stripe Dashboard webhook config (currently only platform events are registered) |
| H4 | **Email delivery** | ✅ AWS SES wired (`email.ts` rewritten); IAM user `astrologypro-ses-sender` created; DNS records added to Route 53; awaiting SES verification for `divineinfinitebeing.com`. Also need `STRIPE_WEBHOOK_SECRET` set in Vercel once webhook is registered |
| H5 | **Twilio credentials** | Prod has misconfigured Twilio keys — `AccessTokenInvalid (20101)` on every dashboard load. Fix or remove keys until wired properly |
| H6 | **Client magic-link login** | Clients use passwordless magic link only — cannot test portal without email access. Acceptable for prod but make sure email delivery works |

---

## 🟡 Normal Priority

| # | Task | Notes |
|---|---|---|
| N1 | ~~**Sitemap audit**~~ | ✅ Fixed — `/blog`, `/discover`, `/zodiac` added to sitemap |
| N2 | ~~**Session notes UI**~~ | ✅ Done — write UI in booking detail sheet; `PATCH /api/bookings/session-notes` |
| N3 | **Phone readings** | Twilio SDK integrated; call routing is a stub — provisioning, inbound routing, and billing need wiring |
| N4 | ~~**Marketing automation**~~ | ✅ Unblocked — `CRON_SECRET` added to `.env.local` + Vercel; all 5 cron routes were already fully implemented, just missing the secret |
| N5 | ~~**Google Calendar sync**~~ | ✅ Done — `createCalendarEvent` called in `payment_intent.succeeded` webhook; stores `google_calendar_event_id` |
| N6 | ~~**Subscription upgrade flow**~~ | ✅ Done — `POST /api/stripe/upgrade`; "Upgrade to Oracle" button in Settings; proration via Stripe item swap |

---

## 🟢 Backlog / Ideas

- ~~Admin analytics dashboard~~ ✅ Built at `/admin` — KPI cards, top diviners by revenue, recently joined, recent bookings; protected by `ADMIN_EMAILS` env var
- ~~Reviews & ratings UI improvements~~ ✅ Featured star badge, rating summary header, `booking_id` dedup, `featured` column fix
- ~~Gift readings public page~~ ✅ Fixed — payment now collected via Stripe Checkout before cert is created; webhook creates cert + sends emails; `/gift/pending` polling fallback
- ~~Referral tracking improvements~~ ✅ Fixed — affiliate `referral_code` column bug (was `.eq("code",...)`) + affiliate currency `/100` bug in dashboard
- Mobile app (React Native)

---

## ✅ Completed

### 2026-04-03 — Bug sweep + missing migrations + Ayrshare wiring (session 7)

| Fix | Detail |
|---|---|
| `twilio/voice/status` — `display_name` bug | Clients table has `full_name`; was silently selecting null |
| `twilio/voice/status` — TODO resolved | Added `sendPhonePaymentFailed` email when card-on-file charge fails; fetches diviner username for CTA |
| `email.ts` — new function | `sendPhonePaymentFailed` (template 14): notifies client with amount + diviner link |
| `r/[code]/route.ts` — race condition | Replaced read-then-write click increment with atomic `increment_tracking_link_clicks()` RPC |
| Migration 20260403000007 | `blog_subscribers` table — was missing; `/api/blog/subscribe` was silently soft-failing every call |
| Migration 20260403000008 | `increment_tracking_link_clicks()` RPC function for atomic click counting |
| `scheduled_posts` migration | Table was missing from schema; `POST /api/social/post` would fail at runtime |
| Ayrshare integration | `/api/social/post` now calls Ayrshare when `AYRSHARE_API_KEY` is set; stores post ID or error |
| `POST /api/marketing/content` | New route to save custom content to `marketing_content` |
| Content management page | Added Title field; wired "Save to Library" to API (was dead no-op button) |
| Build verified ✅ | All 221 routes compile clean across all sessions |

**3 migrations to apply in Supabase SQL editor:**
- `20260403000006_scheduled_posts.sql`
- `20260403000007_blog_subscribers.sql`
- `20260403000008_tracking_rpc.sql`

---

### 2026-04-03 — Global currency bug sweep + affiliate detail fix (session 5–6)

| Fix | Detail |
|---|---|
| `affiliates/[affiliateId]/page.tsx` | Wrong columns (`client_name`, `booking_date`, `amount`, `commission`) → joined `bookings→services→clients` via `commission_amount`; removed all `/100` on totals |
| `dashboard/clients/page.tsx` | `total_spent / 100` removed — `client_diviners.total_spent` is `DECIMAL(10,2)` dollars |
| `dashboard/page.tsx` | `thisMonthRevenueTotal / 100` removed — `bookings.total_amount` is `DECIMAL(10,2)` dollars |
| `components/dashboard/revenue-chart.tsx` | `data.revenue / 100` removed from chart tooltip |
| `components/dashboard/roi-banner.tsx` | `monthlyRevenue / 100` removed; comment corrected to say "in dollars" |
| `api/cron/weekly-digest/route.ts` | `thisWeekRevenue / 100` and `totalRevenue / 100` removed from email subject + body |
| Build: `next.config.ts` | `serverExternalPackages` + `turbopack: {}` to silence warnings; removed unsupported webpack config |
| Build: `tsconfig.json` | Added `_app-legacy`, `tests`, `playwright.config.ts` to exclude |
| Build: `app/` renamed | Legacy `app/` directory was scanned by Turbopack as App Router source; renamed to `_app-legacy/` |
| Build: TypeScript fixes | `diviner_id` doesn't exist on revenueResult → moved to `topDiviners.data`; twilio dead-code non-null assertions |
| `service-toggles.tsx` | `active` → `is_active`, `featured` → `is_featured` |
| `service-edit-sheet.tsx` | Full interface + DB column rename (duration_minutes, base_price, is_featured, category); templates use `base_price` |
| `dashboard/services/page.tsx` | All column names corrected (duration_minutes, base_price, is_featured, is_active) |
| `affiliate/[code]/page.tsx` | Select uses `commission_amount`; removed `/100`; joined bookings for display |
| `api/stripe/booking-payment/route.ts` | `referral_code` lookup fix; commission insert with correct columns; affiliate totals increment |
| `gift/purchase/route.ts` | Redesigned: Stripe Checkout → webhook creates cert (was creating cert before payment) |
| `api/gift/confirm/route.ts` | New polling redirect endpoint — waits for webhook to fire, then redirects to `/gift/{code}` |
| `api/stripe/webhooks/route.ts` | Added `handleGiftCheckoutCompleted` for `checkout.session.completed` with `type=gift_certificate` |
| `gift/pending/page.tsx` | New client-side poller with `<Suspense>` for `useSearchParams` prerender fix |

---

### 2026-04-03 — Column bug sweep + Vercel deploy (session 4)

| Fix | Detail |
|---|---|
| Vercel project linked | `astrologypro` project created under `betosgates-projects`; 18 env vars pushed to production (incl. CRON_SECRET + ADMIN_EMAILS) |
| AWS SES vars in Vercel | `AWS_SES_ACCESS_KEY_ID`, `AWS_SES_SECRET_ACCESS_KEY`, `AWS_SES_REGION`, `AWS_SES_FROM_ADDRESS` all set |
| `daily/end-session` — column bugs | `amount` → `base_price`, `duration` → `duration_minutes` in select; `totalAmount` calc now uses `base_price * 100` (cents) + overage |
| `daily/create-room` — column bug | `questionnaire` → `questionnaire_responses` in select and usage |
| `twilio/voice/incoming` — schema error | Removed non-existent `default_payment_method_id`, `card_consent_at`, `stripe_customer_id` from clients select; standalone billing path gated with `if (false)` stub |
| `portal/reschedule` — RLS | Booking notes update switched to `adminSupabase`; removed duplicate `adminSupabase` var |
| `cron/weekly-digest` — column bugs | `amount` → `base_price` in all 3 booking selects and reduce calls |
| `dashboard/clients` — display_name | `display_name` → `full_name` in select, filter, and render |
| `dashboard/testimonials` — display_name | `display_name` → `full_name` in select and render (×2) |
| `dashboard/calendar` + `calendar-view` — display_name | Simplified to `clients(full_name)` only; removed `display_name` fallback in interface and renders |
| Marketing automation unblocked | `CRON_SECRET` was missing — all 5 crons returned 401. Added to `.env.local` + Vercel. Crons now fire on schedule (every 2h follow-ups, daily reminders, Mon 10am weekly content, Mon 2pm digest, daily 1pm+9pm mundane shares) |
| Admin analytics dashboard | Built `/admin` — protected by `ADMIN_EMAILS` env var; KPI cards (diviners, bookings, revenue, page views, completion rate); top diviners by revenue table; recently joined table; recent bookings table |

---

### 2026-04-03 — Feature completion + RLS fix (session 3b)

| Fix/Feature | Detail |
|---|---|
| `booking-payment` — RLS | All DB writes (booking insert, affiliate, gift cert, payment intent update) switched to `adminSupabase` — guest bookers have no session so RLS blocked every write |
| Sitemap | Added `/blog`, `/discover`, `/zodiac` — were missing entirely |
| Session notes UI | `PATCH /api/bookings/session-notes` route; write textarea in booking detail sheet; only visible on completed bookings |
| Google Calendar sync | `createCalendarEvent()` called in `payment_intent.succeeded` webhook after confirming booking; stores `google_calendar_event_id` on booking row |
| Subscription upgrade flow | `POST /api/stripe/upgrade` — swaps monthly subscription item with proration; migration `20260403000003_diviner_plan_id.sql` adds `plan_id` column; Settings page shows current plan + "Upgrade to Oracle" button when on tarot or astrology |
| Webhook — plan_id | `handleCheckoutCompleted` now stores `plan_id` from session metadata on diviner upsert |

> ✅ Migrations applied to production via Management API (2026-04-03)

---

### 2026-04-03 — Deep schema audit + API + UI/UX fixes (session 3)

| Fix | Detail |
|---|---|
| `booking-payment` — `service.price` | `services.price` doesn't exist; fixed to `base_price` in select, loyalty calc ×2, and response ×2 |
| `booking-payment` — booking insert | `end_at` removed (doesn't exist), `price`→`base_price`, `questionnaire`→`questionnaire_responses`, added missing `duration_minutes` (NOT NULL!) |
| `booking-payment` — client upsert | `diviner_id` doesn't exist on `clients` table; removed it; added required `user_id`; fixed `onConflict: "user_id"`; switched to admin client |
| `booking-payment` — `client_diviners` | Added upsert to `client_diviners` join table (was completely missing) |
| `portal/layout.tsx` | `display_name` → `full_name` in select and insert; insert was failing causing whole portal redirect to login |
| `portal/page.tsx` | `display_name` → `full_name` in query + render |
| `portal/profile/page.tsx` | `client.display_name` → `client.full_name` on load; `display_name:` → `full_name:` on save |
| `portal/reschedule/route.ts` | `clients.name` → `full_name`; `diviners.email` removed (column doesn't exist); added admin client to look up diviner email via auth |
| `testimonials/route.ts` | Simplified `clients(display_name, full_name)` → `clients(full_name)` |
| `follow-up-emails/route.ts` | `questionnaire` → `questionnaire_responses`; `clients(display_name, full_name)` → `clients(full_name)` |
| `event-reminders/route.ts` | `clients.display_name` → `full_name` |
| Migration `scheduled_notifications` | Created `20260403000002_scheduled_notifications.sql` — table was referenced in event-reminders cron but didn't exist |
| Booking status `canceled` | Schema CHECK constraint uses `'canceled'` (single L); `cancel-booking-button`, status maps in 3 pages all had `'cancelled'` — fixed everywhere |
| `refund/route.ts` | `amount` → `base_price` in select; `clients.display_name` → `full_name`; fixed cents/dollars: Stripe receives `base_price * 100` (cents), DB stores `base_price` (dollars) |
| `dashboard/bookings/page.tsx` | `duration` → `duration_minutes`, `amount` → `base_price`, `clients.display_name` → `full_name`; removed `/100` division (prices stored as dollars) |
| `portal/bookings/page.tsx` | `amount` → `base_price`; removed `/100` division |
| `booking-detail-sheet.tsx` | Removed `/ 100` from all `formatCurrency(booking.amount)` calls |
| UX: Cancel button error | Added error state + message when Supabase update fails (was silently failing) |
| UX: Payment retry | Added "Try again" button when payment intent creation fails on step 2 of booking wizard |
| UX: No available times | Improved message to say "Try selecting a different day" |

---

### 2026-04-03 — Chrome review + critical bug fixes (session 2)

| Fix | Detail |
|---|---|
| Signup webhook broken | `handleCheckoutCompleted` was inserting `id: userId` (wrong) + non-existent `email`/`stripe_customer_id` columns. Fixed to `user_id: userId` with upsert + reads `username`/`display_name` from auth metadata |
| Stripe debug endpoint removed | `GET /api/stripe/checkout` was publicly accessible and leaked Stripe key prefix + all price IDs. Removed |
| Twilio WebSocket spam | `PhoneWidget` was not destroying the Twilio Device on error — causing WebSocket reconnect flood that froze Chrome. Fixed to `device.destroy()` on error |
| `onboarding/complete` wrong columns | Was selecting non-existent `email` and `onboarding_complete` columns. Fixed to `onboarding_completed` + use `user.email` |
| Portal bookings `share_id` bug | `/portal/bookings` was querying `share_id` which doesn't exist — schema has `recording_share_id`. Fixed; Watch button would never render for completed sessions |
| Test user credentials saved | `test-diviner@astrologypro.com` / `TestDiviner123!` and `test-client@astrologypro.com` / `TestClient123!` saved to memory doc |

### 2026-04-03 — Dashboard route validation (all 16 routes)

| Route | Status | Notes |
|---|---|---|
| `/dashboard` | ✅ | Overview, stats, profile completion checklist all render |
| `/dashboard/profile` | ✅ | Avatar upload, display name, bio, specialties — all working |
| `/dashboard/services` | ✅ | Empty state + Add New Service button |
| `/dashboard/bookings` | ✅ | Empty state + status filter dropdown |
| `/dashboard/calendar` | ✅ | Week view with Block/Add Special Hours buttons |
| `/dashboard/clients` | ✅ | Empty state + search input |
| `/dashboard/testimonials` | ✅ | Empty state |
| `/dashboard/analytics` | ✅ | Today/Week/Unique/Conversion stat cards + 30-day chart + referrers |
| `/dashboard/affiliates` | ✅ | Stats cards + Add Affiliate button (had Chrome timeout on first load — fine on retry) |
| `/dashboard/live` | ✅ | YouTube + Facebook Live fields, save button, instructions |
| `/dashboard/marketing` | ✅ | Push-to-Share, Content Library, Upcoming, Share Tracking tabs |
| `/dashboard/gift-certificates` | ✅ | Stats cards + empty certificate list |
| `/dashboard/discounts` | ✅ | Empty state + Create Discount button |
| `/dashboard/follow-ups` | ✅ | Recording Ready / Reflection / Rebooking sequence cards + follow-up log |
| `/dashboard/intake-builder` | ✅ | "No Services Found" (correct — needs services first) |
| `/dashboard/settings` | ✅ | 6 tabs: Account (active badge), Payments, Calendar, Notifications, Phone, Loyalty |

### 2026-04-03 — Client portal route validation (code review)

| Route | Status | Notes |
|---|---|---|
| `/portal` | ✅ | Upcoming bookings + recent recordings + quick actions. Auto-creates client record on first visit |
| `/portal/bookings` | ✅ | Full booking history with Join/Reschedule/Cancel/Watch/Review/Book-Again actions |
| `/portal/profile` | ✅ | Name, phone, birth date/time/city — sent to diviner before sessions |
| `/portal/review/[bookingId]` | ✅ | Token-based, works without full login; duplicate review prevention |

### 2026-04-03 — Bug fixes from architecture review

| Fix | Detail |
|---|---|
| `stripe_connect_id` → `stripe_account_id` | Onboarding was writing to wrong column; all 3 references fixed in `onboarding/page.tsx` |
| Availability `is_booked` bug | Column doesn't exist in schema; fixed to `is_active = true` + subtract confirmed bookings |
| Availability `end_at` bug | `bookings` has no `end_at`; fixed to compute from `scheduled_at + duration_minutes` in both the API route and webhook handler |
| `is_active` filter on slots | Availability API was returning inactive slot templates; added `.eq("is_active", true)` |
| Stripe Connect `account.updated` webhook | KYC status (`charges_enabled`, `payouts_enabled`) now synced to DB when Stripe fires the event |
| Webhook `end_at` reference | Removed second `end_at` reference in `payment_intent.succeeded` handler |
| Migration file created | `20260403000001_diviner_profile_fields.sql` — all missing `diviners` columns |

### 2026-04-03 — Onboarding & metadata

| Item | Detail |
|---|---|
| Cover image upload | Onboarding Step 1; stored in `avatars` bucket under `covers/${userId}` |
| Phone number field | Optional; saved to `diviners.phone`; note says never shown publicly |
| YouTube Channel ID | Saved to `diviners.youtube_channel_id` |
| Facebook Live URL | Saved to `diviners.facebook_live_url` |
| Favicon + apple-touch-icon | Wired up in root `layout.tsx` via Next.js `icons` metadata |
| OG image in root layout | `run_your_divination.png` used as default OG for all pages |
| Social metadata — all marketing pages | Full OG + Twitter card on `/`, `/features`, `/pricing`, `/for-astrologers`, `/blog`, `/discover`, `/demo`, `/get-started` |
| Dynamic OG for `[username]` pages | Prefers `cover_image_url` → falls back to `avatar_url`; `summary_large_image` when image present |

### Earlier

| Item | Detail |
|---|---|
| Timezone combobox | 70+ IANA zones, searchable, browser auto-detect, custom entry option |
| Specialties multi-select | 29 presets + custom add; saved as `text[]` to `diviners.specialties` |
| Username auto-generation | Slugified from Full Name on signup; locks after manual edit |
| Full Name field | Added to `/get-started`; stored in `user_metadata.name` |
| Display name pre-population | Onboarding reads `user_metadata.name` if DB `display_name` is empty |
| Stripe checkout 500 fix | Trailing `\n` in `NEXT_PUBLIC_APP_URL` → invalid `success_url`; fixed with `.trim()` |
| `./app/` directory removed | Was hijacking Next.js App Router; removed with `git rm -r --cached` |
| Production routing fixed | All 213+ routes compile; `/`, `/get-started`, `/dashboard` all respond |
