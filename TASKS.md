# AstrologyPro — Daily Task Board

> **Workflow:** Update this file each session. Check off items as you go. Push at end of day.
> **Last updated:** 2026-04-03

---

## 📊 Progress Overview

| Area | Status |
|---|---|
| Routing & deployment | ✅ Fixed |
| Stripe checkout (platform billing) | ✅ Working |
| Signup flow | ✅ Complete |
| Onboarding — profile fields | ✅ Complete |
| SEO & social metadata | ✅ Complete |
| Database migration (profile fields) | ✅ Migration file created — **run in Supabase** |
| Stripe Connect — account creation | ✅ Fixed (`stripe_account_id` field name corrected) |
| Stripe Connect — KYC status sync | ✅ `account.updated` webhook added |
| Availability booking conflict detection | ✅ Fixed (`end_at` bug + `is_active` filter) |
| Email notifications | 🟡 Templates exist; delivery unclear |
| Phone readings (Twilio) | 🔴 Stub only |
| Marketing automation | 🔴 Forms exist; nothing posts |

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

- [ ] Run migration in **production** Supabase project
- [ ] Run migration in **dev/staging** Supabase project

---

## 🟠 High Priority

| # | Task | Notes |
|---|---|---|
| H1 | **OG social image** | Create a proper 1200×630px branded card. Currently using `run_your_divination.png` as fallback |
| H2 | **Apple touch icon** | `png_logo_1.png` used as apple-touch-icon — needs a proper square 180×180px version |
| H3 | **Verify Stripe Connect webhook** | Register `account.updated` in the Stripe Dashboard webhook config (currently only platform events are registered) |
| H4 | **Email delivery** | Confirm emails actually send. Identify the email provider (no SendGrid/Mailgun/Resend env vars found) |

---

## 🟡 Normal Priority

| # | Task | Notes |
|---|---|---|
| N1 | **Sitemap audit** | Verify `sitemap.ts` includes all routes: `/for-astrologers`, `/demo`, `/blog`, `/discover`, `/glossary`, etc. |
| N2 | **Session notes UI** | `bookings.session_notes` field exists but no UI to write notes post-session |
| N3 | **Phone readings** | Twilio SDK integrated; call routing is a stub — provisioning, inbound routing, and billing need wiring |
| N4 | **Marketing automation** | `follow_up_sequences` and `marketing_content` tables complete; cron routes exist but don't actually send/post |
| N5 | **Google Calendar sync** | OAuth token stored; bookings should push events on confirmation |
| N6 | **Subscription upgrade flow** | No logic to upgrade tarot→both or astrology→both (with proration) |

---

## 🟢 Backlog / Ideas

- Admin analytics dashboard (page_views table exists, no UI)
- Reviews & ratings UI improvements
- Gift readings public page
- Mobile app (React Native)
- Referral tracking improvements

---

## ✅ Completed

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
