# AstrologyPro — Daily Task Board

> **Workflow:** Update this file each session. Check off items as you go. Push at end of day.
> **Last updated:** 2026-04-03

---

## 📊 Progress Overview

| Area | Status |
|---|---|
| Routing & deployment | ✅ Fixed |
| Stripe checkout | ✅ Working |
| Signup flow | ✅ Complete |
| Onboarding — profile fields | ✅ Complete |
| SEO & social metadata | ✅ Complete |
| Database migrations | 🔴 Pending |
| Email notifications | 🔴 Not started |
| Stripe Connect payouts | 🟡 Partial |

---

## 🔴 Critical — Blocking

### Database: missing columns in `diviners` table

The onboarding form saves these fields but **they don't persist without the columns in Supabase**.

Run this migration in Supabase SQL editor:

```sql
ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS cover_image_url  text,
  ADD COLUMN IF NOT EXISTS phone            text,
  ADD COLUMN IF NOT EXISTS youtube_channel_id text,
  ADD COLUMN IF NOT EXISTS facebook_live_url  text;
```

- [ ] Run migration in production
- [ ] Run migration in staging/dev

---

## 🟠 High Priority

| # | Task | Notes |
|---|---|---|
| H1 | **OG social image** | Create a proper 1200×630px branded card. Currently using `run_your_divination.png` as fallback — works but not ideal |
| H2 | **Apple touch icon** | `png_logo_1.png` is used as apple-touch-icon. Replace with a proper square 180×180px version |
| H3 | **Verify Vercel production domain** | After each push confirm astrologypro.com points to the new deployment (Vercel auto-deploys but check aliasing) |
| H4 | **Public profile page — new fields** | `cover_image_url`, specialties, social links are saved but not yet _displayed_ on the `[username]` public page |

---

## 🟡 Normal Priority

| # | Task | Notes |
|---|---|---|
| N1 | **Sitemap audit** | Verify `sitemap.ts` includes all routes: `/for-astrologers`, `/demo`, `/blog`, `/discover`, `/glossary`, etc. |
| N2 | **Login page metadata** | Add title/description to `/login` (low SEO impact, still worth doing) |
| N3 | **Booking confirmation emails** | Send confirmation to client + diviner when a booking is created |
| N4 | **Stripe Connect onboarding** | Complete the payout setup flow in onboarding Step 2 so diviners can receive money |
| N5 | **Phone verification** | Optional: verify phone number via SMS OTP before saving |
| N6 | **Cover image on public profile** | Display the banner image at the top of the `[username]` landing page |

---

## 🟢 Backlog / Ideas

- Affiliate / referral tracking improvements
- Google Calendar sync for availability
- Reviews & ratings system for diviners
- Gift readings (purchasable vouchers)
- Live stream embed (YouTube + Facebook Live) on public profile
- Loyalty rewards program
- Mobile app (React Native)

---

## ✅ Completed

### 2026-04-03

| Item | Detail |
|---|---|
| Cover image upload | Onboarding Step 1; stored in `avatars` bucket under `covers/${userId}` |
| Phone number field | Optional; saved to `diviners.phone`; note says never shown publicly |
| YouTube Channel ID | Saved to `diviners.youtube_channel_id` |
| Facebook Live URL | Saved to `diviners.facebook_live_url` |
| Favicon + apple-touch-icon | Wired up in root `layout.tsx` via Next.js `icons` metadata |
| OG image in root layout | `run_your_divination.png` used as default OG for all pages |
| Social metadata — all marketing pages | Full OG + Twitter card on `/`, `/features`, `/pricing`, `/for-astrologers`, `/blog`, `/discover`, `/demo`, `/get-started` |
| Dynamic OG for `[username]` pages | Prefers `cover_image_url` → falls back to `avatar_url`; uses `summary_large_image` when image present |

### Earlier

| Item | Detail |
|---|---|
| Timezone combobox | 70+ IANA zones, searchable, browser auto-detect, custom entry option |
| Specialties multi-select | 29 presets + custom add; saved as `text[]` to `diviners.specialties` |
| Username auto-generation | Slugified from Full Name on signup; locks after manual edit |
| Full Name field | Added to `/get-started`; stored in `user_metadata.name` |
| Display name pre-population | Onboarding reads `user_metadata.name` if DB `display_name` is empty |
| Stripe checkout 500 fix | Trailing `\n` in `NEXT_PUBLIC_APP_URL` → invalid `success_url`; fixed with `.trim()` in `constants.ts` |
| `./app/` directory removed | Was hijacking Next.js App Router (`findDir()` picks `./app/` over `./src/app/`); removed with `git rm -r --cached` |
| Production routing fixed | All 213+ routes compile correctly; `/`, `/get-started`, `/dashboard` all respond |
