# AstrologyPro — Daily Task Board

> **Workflow:** Update this file each session. Check off items as you go. Push at end of day.
> **Last updated:** 2026-04-03 (session 10)
> **Migrations:** All applied via `scripts/run-migration.js` — no manual SQL editor needed.

---

## 📊 Progress Overview

| Area | Status |
|---|---|
| Routing & deployment | ✅ Done |
| Stripe checkout (platform billing) | ✅ Done |
| Signup & onboarding flow | ✅ Done |
| SEO & social metadata | ✅ Done |
| Stripe Connect — account + KYC sync | ✅ Done |
| Availability & booking conflict detection | ✅ Done |
| Dashboard routes (all 16) | ✅ Validated |
| Client portal routes (all 4) | ✅ Validated |
| Booking flow (end-to-end) | ✅ Done |
| Refund flow | ✅ Done |
| Gift certificate purchase flow | ✅ Done |
| Follow-up email automation | ✅ Done |
| Event reminder deduplication | ✅ Done |
| Google Calendar sync | ✅ Done |
| Subscription upgrade flow | ✅ Done |
| Admin analytics dashboard | ✅ Done |
| Affiliate tracking & detail page | ✅ Done |
| Session notes (write + API) | ✅ Done |
| Sitemap | ✅ Done |
| Currency bugs (global `/100` sweep) | ✅ Done — 10 files fixed |
| All column name bugs | ✅ Done — display_name, amount, duration, questionnaire, end_at |
| Build errors (Turbopack) | ✅ Done |
| Favicon set (all sizes + PWA manifest) | ✅ Done — SVG + 7 PNG sizes + site.webmanifest |
| Security: debug endpoint removed | ✅ Done — was leaking Stripe key prefix publicly |
| Security: Stripe debug GET removed | ✅ Done |
| Marketing subscribe → DB persist | ✅ Done — was console.log only |
| Content Library tab | ✅ Done — now fetches real saved content from DB |
| Marketing content page file upload | ✅ Done — file input wired; real username in preview |
| Settings/Profile/Live blank screen fix | ✅ Done — `return null` → proper error + Reload button |
| Blog "Notify me" pill | ✅ Done — now links to #subscribe section |
| Portal null recording link | ✅ Done — query now filters `recording_share_id IS NOT NULL` |
| Booking wizard: slot fetch error | ✅ Done — shows toast instead of silent empty list |
| Stripe webhook: Google Cal promise | ✅ Done — orphaned `.then()` fixed |
| Phone billing (standalone calls) | ✅ Done — `if(false)` replaced with real card-on-file check |
| Missing FK indexes (13 columns) | ✅ Done — migration 000009 applied |
| Clients: stripe billing columns | ✅ Done — migration 000010 applied |
| New roles (social_advo, trainee, community) | ✅ Done — migrations 000011 + 000012 applied |
| Login page (4 tabs) | ✅ Done — Diviner, Client, Trainee, Member tabs |
| Advocate portal + sub-pages | ✅ Done — /advocate, /referrals, /earnings, /content, /profile |
| Community portal + sub-pages | ✅ Done — /community, /sessions, /resources, /profile |
| Trainee portal + sub-pages | ✅ Done — /trainee, /sessions, /progress, /resources, /profile |
| Auth callback: community member provisioning | ✅ Done — creates community_members row on first magic link login |
| /api/community/request-access | ✅ Done — sends magic link via Supabase admin |
| /api/trainees/validate-invite | ✅ Done — validates diviner's trainee_invite_code |
| diviners.trainee_invite_code column | ✅ Done — migration 000012 applied |
| Admin user management (search, notes, block, logins) | ✅ Done — unified list, search/filter, detail sheet, login history, block/unblock |
| Email: single template base (email-base.ts) | ✅ Done — buildEmailHtml + 12 helpers; email.ts + email-templates.ts refactored |
| Email notifications (AWS SES) | 🟡 Wired; DNS added; awaiting SES domain verification |
| Phone readings end-to-end | 🟡 Code complete; blocked on Twilio credentials in Vercel |
| Social auto-posting (Ayrshare) | 🟡 Code complete; needs `AYRSHARE_API_KEY` in Vercel |
| OG social image | 🔴 Missing — needs 1200×630 branded card design |
| Stripe Connect webhook | 🔴 `account.updated` not yet registered in Stripe Dashboard |

---

## 🔴 Needs Your Action (Cannot be done in code)

| # | Item | Where |
|---|---|---|
| A1 | **Twilio credentials** | Fix invalid keys in Vercel → phone readings return 20101 error on every load |
| A2 | **Stripe Connect webhook** | Stripe Dashboard → Webhooks → add `account.updated` event |
| A3 | **Ayrshare API key** | Vercel env vars → add `AYRSHARE_API_KEY` to activate social auto-posting |
| A4 | **OG social image** | Design a 1200×630 branded card and save to `/public/images/home/og-card.jpg` |

---

## 🟠 High Priority (Code work remaining)

| # | Task | Notes |
|---|---|---|
| H1 | **Stripe: save `stripe_customer_id` on clients** | When a client books and pays, store their Stripe customer ID on `clients.stripe_customer_id` so phone billing can look it up. Currently the column exists but is never populated. |
| H2 | **Stripe: save `default_payment_method_id` on clients** | Same — save the payment method from the booking payment intent to enable card-on-file phone readings. |
| H3 | **OG image path update** | Once OG card is designed, update `layout.tsx` `OG_IMAGE` constant from `run_your_divination.png` to new card |

---

## 🟡 Normal Priority

| # | Task | Notes |
|---|---|---|
| N1 | **Phone readings — full E2E test** | Once Twilio creds fixed: test inbound call → queue → diviner answers → billing |
| N2 | **Ayrshare — full E2E test** | Once API key added: test social post creation from marketing dashboard |
| N3 | **SES domain verification** | Monitor DNS propagation for `divineinfinitebeing.com`; test email delivery once verified |

---

## 🟢 Backlog / Ideas

- Mobile app (React Native)
- CMS-driven blog (replace hardcoded coming-soon posts)
- Diviner discovery page improvements (filters, search)
- Client-facing cancellation with automatic refund trigger

---

## ✅ Completed This Session (session 11 — 2026-04-03)

| Fix | Detail |
|---|---|
| `email-base.ts` | New single source of truth for all HTML emails — `buildEmailHtml` + 12 helpers |
| `email.ts` refactored | Removed private `emailTemplate()` + 5 helpers; now imports from `email-base.ts`; all 17 calls renamed |
| `email-templates.ts` refactored | `welcomeDivinerEmail` + `rescheduleRequestEmail` now use `buildEmailHtml` + `numberedSteps` |
| Migration 000013 | `admin_user_notes`, `user_login_logs`, `user_blocks` tables with service_role-only RLS |
| Auth callback: login logging | Every login captured to `user_login_logs` — IP, User-Agent, Cloudflare city/country |
| `/api/admin/users/[userId]/notes` | GET + POST — fetch/add admin notes on any user |
| `/api/admin/users/[userId]/notes/[noteId]` | DELETE — remove individual note |
| `/api/admin/users/[userId]/block` | POST — ban via Supabase Auth + record in user_blocks |
| `/api/admin/users/[userId]/unblock` | POST — lift ban + close block record |
| `/api/admin/users/[userId]/logins` | GET — login history (IP, browser, OS, city, country) |
| `UserManagementClient` component | Unified user list with search (name/email/phone/role) + role filter dropdown + actions menu |
| `UserDetailSheet` component | 3-tab sheet: Info (+ block/unblock button), Notes (add/delete), Login History |
| `/admin/users` page | Rewritten — fetches all users + ban status server-side, passes to `UserManagementClient` |

---

## ✅ Completed This Session (session 10 — 2026-04-03)

| Fix | Detail |
|---|---|
| `/join` hub page | Central signup page listing all 6 role paths with cards |
| `/auth/reset` route | Was missing — password reset emails redirected to 404. Now exchanges code → `/update-password` |
| `/account` page + layout | My Account: shows all active portals, profile info, change password, sign out |
| `ChangePasswordForm` component | Re-authenticates with current password then calls `updateUser({ password })` |
| `/switch` page | Multi-role portal picker — shown when user has 2+ portals |
| `src/lib/user-roles.ts` | `getUserPortals()` — checks all 5 role tables in parallel |
| `src/components/shared/portal-switcher.tsx` | Compact header links to other portals when user has multiple roles |
| `/admin/users` page | Tabbed view of all 5 user types + invite user dialog |
| `InviteUserForm` component | Admin modal: email + role → POST `/api/admin/invite-user` |
| `/api/admin/invite-user` | Admin-only: calls `inviteUserByEmail` with role metadata + redirect |
| Admin layout nav | Added Analytics + Users nav links |
| Auth callback: multi-role routing | Detects all portals, routes to `/switch` when 2+ exist |
| Auth callback: admin invite flow | Invited users routed to the right join/onboarding page |
| All portal layouts: role switcher | advocate, community, trainee, portal layouts updated |
| Dashboard sidebar: Account link | "My Account" added to both desktop and mobile sidebar |
| Join pages: invited flow | `/join/advocate` and `/join/trainee` handle `?invited=true` — skip email/password for pre-authed users |
| `SignOutButton` export | Added alias export from portal/logout-button.tsx |

---

## ✅ Completed This Session (session 9 — 2026-04-03)

| Fix | Detail |
|---|---|
| Migration 000011 applied | `social_advocates`, `community_members`, `trainees` tables + RLS |
| Migration 000012 applied | `diviners.trainee_invite_code` column for mentor invite system |
| Login page: 4 tabs | Added Trainee (password) and Member (magic link) tabs to existing Diviner/Client login |
| Advocate portal | `/advocate` layout + dashboard + referrals + earnings + content + profile pages |
| Community portal | `/community` layout + dashboard + sessions + resources + profile pages |
| Trainee portal | `/trainee` layout + dashboard + sessions + progress + resources + profile pages |
| Auth callback: community provisioning | On magic link click, creates `community_members` row if `pending_membership` in metadata |
| `/api/community/request-access` | POST: sends magic link with membership type in user metadata |
| `/api/trainees/validate-invite` | GET: validates `trainee_invite_code` against diviners table |
| `/join/advocate`, `/join/community`, `/join/trainee` | All 3 signup pages created (previous session) |
| `src/types/user.ts` | `UserRole` type + `ROLE_DESTINATIONS` + `getRoleDestination()` |

---

## ✅ Completed This Session (session 8 — 2026-04-03)

| Fix | Detail |
|---|---|
| Phone billing re-enabled | `if (false)` → `if (client.stripe_customer_id && client.default_payment_method_id)` — schema was blocking it |
| Migration 000010 applied | `clients.stripe_customer_id` + `clients.default_payment_method_id` added to production |
| Settings/Profile/Live blank screens | All 3 had silent `return null` on DB failure; now show error + Reload button |
| Content Library tab | Was showing 6 hardcoded fake cards forever; now fetches real content from `/api/marketing/content` |
| Marketing content file upload | "Choose File" button had no `<input type="file">` — wired with drag-drop + file name display |
| Caption preview username | Was hardcoded "CosmicReader"; now fetches real diviner username via new `/api/diviners/me` |
| `/api/diviners/me` | New route returning username, displayName, avatarUrl for client components |
| `/api/marketing/subscribe` | Was `console.log` only; now upserts to `blog_subscribers` table with `source: "marketing"` |
| Blog "Notify me" pill | Was unstyled plain text; now `<a href="#subscribe">` with hover state |
| `api/debug` deleted | Was publicly exposing Stripe key prefix + all price IDs — security hole |
| Migration 000009 applied | 13 missing FK indexes across 7 tables (affiliate_referrals, gift_certificates, phone_sessions, etc.) |
| Booking wizard toast | Slot fetch failure was silent; now shows `toast.error()` |
| Portal recording link | `recording_share_id IS NOT NULL` filter added — prevented `/session/null/recording` |
| Stripe webhook promise | Google Calendar event ID update was inside orphaned `.then(() => {})` — fixed to chain properly |
| Favicon set complete | SVG design + 7 PNG sizes + proper ICO (multi-res binary format) + site.webmanifest + layout.tsx wired |
| Migrations automated | All migrations now applied via `scripts/run-migration.js` — no manual SQL editor needed |

---

## ✅ Completed Earlier (sessions 1–7)

### session 7 — Bug sweep + Ayrshare + tracking RPC

| Fix | Detail |
|---|---|
| `twilio/voice/status` — `display_name` bug | Clients table has `full_name`; was silently selecting null |
| `twilio/voice/status` — TODO resolved | `sendPhonePaymentFailed` email added; fetches diviner username for CTA |
| `email.ts` — `sendPhonePaymentFailed` | Template 14: notifies client with amount + diviner link |
| `r/[code]/route.ts` — race condition | Replaced read-then-write click increment with atomic RPC |
| Migration 000006 | `scheduled_posts` table |
| Migration 000007 | `blog_subscribers` table |
| Migration 000008 | `increment_tracking_link_clicks()` RPC |
| Ayrshare integration | `/api/social/post` calls Ayrshare when key set; stores post ID or error |
| `POST /api/marketing/content` | New route to save custom content to `marketing_content` |
| Content management page | Title field added; "Save to Library" wired to API |

### sessions 5–6 — Currency sweep + affiliate + gift

| Fix | Detail |
|---|---|
| Global `/100` division bug | 10 files fixed — DECIMAL(10,2) stores dollars, not cents |
| Affiliate detail page | Wrong columns + join rewrite + `/100` removed |
| Gift purchase flow | Redesigned — Stripe Checkout → webhook creates cert (was creating cert before payment) |
| Revenue chart, ROI banner, weekly digest | All `/100` removed |

### session 4 — Vercel deploy + column bugs

| Fix | Detail |
|---|---|
| Vercel linked + 18 env vars pushed | Including CRON_SECRET, ADMIN_EMAILS, AWS SES vars |
| `daily/end-session` | `amount` → `base_price`, `duration` → `duration_minutes` |
| `cron/weekly-digest` | `amount` → `base_price` ×3 |
| Marketing automation unblocked | CRON_SECRET was missing — all 5 crons returned 401 |
| Admin analytics dashboard | `/admin` — KPI cards, top diviners, recent bookings |

### session 3b — Feature completion + RLS

| Fix | Detail |
|---|---|
| `booking-payment` RLS | All DB writes switched to `adminSupabase` |
| Sitemap | `/blog`, `/discover`, `/zodiac` added |
| Session notes UI | `PATCH /api/bookings/session-notes`; textarea in booking detail sheet |
| Google Calendar sync | `createCalendarEvent()` in `payment_intent.succeeded` webhook |
| Subscription upgrade | `POST /api/stripe/upgrade` + Settings page "Upgrade to Oracle" button |

### session 3 — Schema audit + API + UX

| Fix | Detail |
|---|---|
| `booking-payment` — `service.price` | `base_price` everywhere |
| `booking-payment` — booking insert | `end_at` removed, `questionnaire` → `questionnaire_responses` |
| Portal layout | `display_name` → `full_name` across all portal files |
| Testimonials, follow-ups, event-reminders | Column renames throughout |
| Booking status `canceled` | Single-L fix across all UI |
| Refund | Cents/dollars fix; correct column names |

### sessions 1–2 — Initial fixes + Chrome review

| Fix | Detail |
|---|---|
| Signup webhook | Wrong columns on insert; fixed to upsert with correct fields |
| Twilio WebSocket spam | Device now destroyed on error |
| Portal bookings `recording_share_id` | Was `share_id` — fixed |
| All 16 dashboard routes | Validated via Chrome review |
| All 4 portal routes | Validated via code review |
