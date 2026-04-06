# AstrologyPro — Daily Task Board

> **Workflow:** Update this file each session. Check off items as you go. Push at end of day.
> **Last updated:** 2026-04-06 (session 13 — training analytics, PM plan tiers, community features, notifications, admin global search, certificate, quiz cooldown)
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
| Marketing subscribe → DB persist | ✅ Done — was console.log only |
| Content Library tab | ✅ Done — now fetches real saved content from DB |
| Settings/Profile/Live blank screen fix | ✅ Done |
| Admin user management | ✅ Done — search, notes, block/unblock, login history |
| Email: single template base | ✅ Done — buildEmailHtml + 12 helpers |
| Training school (Sprint 2) | ✅ Done — categories, lessons, quizzes, admin CRUD |
| Trainee portal | ✅ Done — dashboard, progress, sessions, resources, training, certificate |
| Training analytics admin | ✅ Done — 6-tab dashboard: overview, users, programs, categories, lessons, quizzes |
| Training progress cache | ✅ Done — user_category_progress + user_program_progress, SECURITY DEFINER triggers |
| Training sequential lock | ✅ Done — is_sequential on programs/categories; lesson 403 if locked; lock icons in UI |
| Training time tracking | ✅ Done — lesson_progress, /start + /heartbeat (30s), time_spent_seconds |
| Training milestone emails | ✅ Done — sendQuizPassed, sendLessonComplete, sendCategoryComplete, sendProgramComplete |
| Training auto-graduation | ✅ Done — certificate_code generated, trainees.graduated_at set, sendProgramComplete fired |
| Quiz retry cooldown | ✅ Done — 30-min cooldown after 2 failed attempts; 429 with cooldown_ends_at; countdown UI |
| Admin training settings | ✅ Done — allowed_roles config at /admin/training/settings |
| PM plan tiers | ✅ Done — pm_plan_tiers table, admin CRUD, Stripe per-seat billing, user plan management |
| PM user plan self-service | ✅ Done — change tier, add/remove members, invoice history, price preview |
| Tarot reading player | ✅ Done — 9 spreads, 3-state machine, Celtic Cross layout, save + share + notes |
| Tarot reading history | ✅ Done — history list, full detail page, public share page |
| Community broadcasts page | ✅ Done — Live/Upcoming/On-Demand sections + RSVP |
| Community events calendar | ✅ Done — interactive calendar grid + RSVP |
| Community membership card | ✅ Done — membership-card component |
| Community mobile nav | ✅ Done — Sheet-based hamburger for mobile viewports |
| PM profile completion card | ✅ Done — 6-item weighted calculation, server-computed |
| PM ritual execution persistence | ✅ Done — current_step, is_complete, last_executed_at on user_ritual_configurations |
| In-app notification center | ✅ Done — notifications table, 60s polling bell, unread badge, per-type icons |
| Admin global search | ✅ Done — Cmd+K, users/bookings/lessons/blog in parallel, keyboard nav |
| Certificate sharing | ✅ Done — certificate_code on trainees, public /certificate/verify/[code], share dialog |
| Trainee resources page | ✅ Done — lesson assets grouped by type with download links |
| Trainee sessions page | ✅ Done — upcoming/past bookings with stats |
| Trainee profile page | ✅ Done — avatar upload, bio, specialties, training status ring |
| Community subscription emails | ✅ Done — payment failed, renewal reminder, expiry warning, cancelled |
| Stripe webhook — subscription.updated | ✅ Done — community member status sync on plan change |
| Admin module — 21 tasks | ✅ Done — user mgmt, tarot CRUD, testimonials, activity log, soft delete, role mgmt |
| Community portal — Perennial Mandalism | ✅ Done — family, charts, transits, library, resources, sunday service |
| Community portal — Mystery School | ✅ Done — foundation 12-week training, decan calendar, ritual performer, scry + journal |
| Community portal — Ingress Charts | ✅ Done — list + detail pages |
| Community portal — Horoscope calculator | ✅ Done — proxies to AstrologyAPI |
| Mystery School auto-graduation | ✅ Done — triggers on 36th decan completion + graduation email |
| Join pages (all roles) | ✅ Done — /join, /join/advocate, /join/community, /join/trainee |
| Admin: blog CRUD | ✅ Done — create/edit/publish/unpublish/delete |
| Blog: live posts from DB | ✅ Done — /blog/[slug] page; listing switches from static to live automatically |
| Admin: payments history | ✅ Done — paginated table from bookings |
| Admin: social advocacy CRUD | ✅ Done |
| Admin: spiritual wisdom CRUD | ✅ Done |
| Admin: decan journals CRUD | ✅ Done |
| Admin: decan media CRUD | ✅ Done |
| Admin: ingress charts CRUD | ✅ Done |
| Affiliate agreement e-sign | ✅ Done — banner on /dashboard/affiliates; POST /api/dashboard/affiliate-agreement |
| Social advocacy auto-post cron | ✅ Done — posts to Ayrshare by frequency; registered in vercel.json |
| E3-S5 graduation CTA | ✅ Done — banner on trainee dashboard for graduated status; links to Tabby via env var |
| PayPal Connect | ✅ Done — OAuth connect/callback/disconnect + settings UI |
| Card-on-file billing cron | ✅ Done — charges 24h after confirmed session |
| Decan unlock cron | ✅ Done — runs daily, provisions student_decan_progress rows |
| Monthly transits cron | ✅ Done — runs 1st of month |
| No-show auto-refund cron | ✅ Done |
| Booking hold release cron | ✅ Done |
| Certified badge (discover page) | ✅ Done — is_certified column + BadgeCheck icon |
| Policy acknowledgement at checkout | ✅ Done — checkbox + policyAcknowledgedAt saved |
| Policy display on diviner profile | ✅ Done |
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
| A3 | **AYRSHARE_API_KEY** | Vercel env vars → activates social auto-posting cron |
| A4 | **OG social image** | Design a 1200×630 branded card → `/public/images/home/og-card.jpg` |
| A5 | **NEXT_PUBLIC_TABBY_USERNAME** | Vercel env vars → set to Tabby's AstrologyPro username → activates graduation CTA |
| A6 | **Tabby's Google Calendar** | Connect via `/api/calendar/connect` → unblocks E3-S5 consultation booking |
| A7 | **Stripe product IDs** | Vercel env vars → `STRIPE_PRICE_COMMUNITY_INDIVIDUAL`, `STRIPE_PRICE_COMMUNITY_FAMILY`, `STRIPE_PRICE_MYSTERY_ENROLLMENT`, `STRIPE_PRICE_MYSTERY_MONTHLY` |
| A8 | **Foundation week content** | Admin → /admin/mystery-school → add 12 weeks (title, content, audio URL, Beto photo URL) |
| A9 | **Decan ritual steps** | Admin → /admin/mystery-school/decans → seed ritual steps for all 36 decans |
| A10 | **Holy book PDFs** | Upload to Supabase Storage → add URLs via admin /community/library |

---

## 🟠 High Priority (Code work remaining)

| # | Task | Notes |
|---|---|---|
| H1 | **OG image path update** | Once OG card is designed, update `layout.tsx` `OG_IMAGE` constant |

---

## 🟡 Normal Priority

| # | Task | Notes |
|---|---|---|
| N1 | **Phone readings — full E2E test** | Once Twilio creds fixed: test inbound call → queue → diviner answers → billing |
| N2 | **Ayrshare — full E2E test** | Once API key added: test social post creation + cron auto-posting |
| N3 | **SES domain verification** | Monitor DNS propagation; test email delivery once verified |
| N4 | **Community Stripe products** | Create products in Stripe Dashboard → set env vars (A7 above) |

---

## 🟢 Backlog / Ideas

- Mobile app (React Native)
- Diviner discovery page improvements (filters, search)
- Client-facing self-serve cancellation with auto-refund
- Angular bundle optimisation (E10-S3)
- Angular duplicate AuthService cleanup (E1-S3)
- Angular TypeScript model interfaces (E1-S4)

---

## ✅ Completed This Session (session 13 — 2026-04-06)

| Feature | Detail |
|---|---|
| Training analytics | 6-tab admin dashboard (overview, users, programs, categories, lessons, quizzes); first-attempt pass rate, avg attempts-to-pass |
| Progress cache | `user_category_progress` + `user_program_progress` tables; 4 PostgreSQL SECURITY DEFINER functions; 3 auto-recalc triggers |
| Sequential lock | `is_sequential` on programs + categories; API-level 403 if lesson locked; lock icons in UI; lock reason in lesson list |
| Admin training settings | `/admin/training/settings` — role-based access control; `training_settings` table |
| Time tracking | `lesson_progress` table; `/start` upsert on open; `/heartbeat` accumulates delta_seconds (capped 0-120); 30s client heartbeat |
| Training milestone emails | `sendQuizPassed`, `sendLessonComplete`, `sendCategoryComplete`, `sendProgramComplete` |
| Auto-graduation | `certificate_code` (randomBytes 6 hex); `trainees.graduated_at` + `training_status=graduated`; sendProgramComplete email |
| Quiz retry cooldown | 30-min cooldown after 2 failed attempts; `attempt_number` on quiz_attempts; 429 + `cooldown_ends_at`; countdown timer in UI |
| PM plan tiers | `pm_plan_tiers` table; admin CRUD at `/admin/pm-plan-tiers`; `updateStripeExtraSeats` helper; per-seat Stripe billing |
| PM user plan self-service | `/community/plan` — 3 tabs: overview + price calculator, members + billing badges, billing + invoice history |
| Tarot reading player | 9 spreads; 3-state machine (setup→drawing→revealed); Celtic Cross positional layout; save + share + notes |
| Tarot history + public share | `/community/tarot/history`, `/community/tarot/readings/[id]`, `/community/tarot/share/[token]` |
| Community broadcasts | Live/Upcoming/On-Demand sections; RSVP button; `/api/community/broadcasts/[id]/rsvp` |
| Community events calendar | Interactive calendar grid; RSVP; `/api/community/events/[id]/rsvp` |
| Membership card | `membership-card.tsx` component on community dashboard |
| Community mobile nav | Sheet-based hamburger at `src/components/community/mobile-nav.tsx` |
| PM profile completion | 6-item weighted card (avatar, bio, family, ritual, chart, session); server-computed |
| Ritual execution persistence | `current_step`, `is_complete`, `last_executed_at`, `execution_count` on `user_ritual_configurations` |
| Notification center | `notifications` table; GET/PATCH/mark-all-read APIs; `NotificationBell` with 60s polling + unread badge; `createNotification()` helper |
| Admin global search | `Cmd+K` dialog; `/api/admin/search` queries users/bookings/lessons/blog in parallel; keyboard navigation |
| Certificate sharing | `certificate_code` on trainees; public `/certificate/verify/[code]` page; copy/social share dialog |
| Trainee resources | `/trainee/resources` — lesson assets grouped by type (PDF/video/image/link) with download links |
| Trainee sessions | `/trainee/sessions` — upcoming/past bookings with stats bar |
| Trainee profile | `/trainee/profile` — avatar upload to Supabase storage, bio, specialties, training status ring |
| Community subscription emails | `sendCommunityPaymentFailed`, `sendCommunityRenewalReminder`, `sendMembershipExpiryWarning`, `sendCommunitySubscriptionCancelled` |
| Stripe webhook | `customer.subscription.updated` handler; community member status sync |
| Cron jobs | `/api/cron/community-renewal-reminders` (7-day window), `/api/cron/community-expiry-warnings` (3-day window) |
| Bug fix | `quiz/route.ts` — added `title` to lesson select (was `undefined` in quiz-passed email) |
| Admin module (21 tasks) | User mgmt enhancements, tarot card/spread CRUD, testimonials CRUD, activity log, soft delete/restore, role mgmt, password mgmt, notes |
| Migrations applied | 000013 notifications, 000014 certificate_verification, 000015 quiz_cooldown, 000016 trainee_avatar |

---

## ✅ Completed This Session (session 12 — 2026-04-04 — Full Angular Port)

### Migrations applied (migrations 13–18)

| Migration | What |
|---|---|
| 000013 `new_roles` | social_advocates, community_members, trainees tables + RLS |
| 000014–020 | certified_badge, platform_policies, booking_policy_acknowledged, no_show_tracking, booking_holds, admin_content_tables, community_stripe |
| 20260404–001 | trainee_lesson_progress |
| 20260404–002 | quiz_generation_drafts |
| 20260404–003 | confirmed_billing (card-on-file) |
| 20260404–004 | family_members |
| 20260404–005 | relationship_charts |
| 20260404–006 | monthly_transits |
| 20260404–007 | sunday_service |
| 20260404–008 | mystery_school (students, foundation_weeks, student_foundation_progress) |
| 20260404–009 | decan_system (decans, decan_rituals, student_decan_progress, scry_journals, mundane_journals) |
| 20260404–010 | paypal_connect |
| 20260404–011 | ingress_charts |
| 20260404–012 | social_advocacy |
| 20260404–013 | spiritual_wisdom |
| 20260404–014 | decan_journals |
| 20260404–015 | decan_media |
| 20260404–016 | affiliate_agreement (diviners.affiliate_agreement_signed + signed_at) |
| 20260404–017 | social_advocacy.last_posted_at |
| 20260404–018 | blog_posts + RLS |

### Sprint 1–8 features ported from Angular

| Feature | Files |
|---|---|
| E9-S2: Certified badge | discover page BadgeCheck icon + is_certified fetch |
| E2-S5: Policy acknowledgement checkbox | booking-wizard.tsx |
| E7-S3: Policy display on diviner profile | [username]/page.tsx |
| E6-S1: Booking hold/conflict detection | api/availability/hold, cron/release-holds |
| E2-S3: No-show auto-refund cron | cron/no-show-refunds |
| E3-S4: Graduation certificate (print PDF) | trainee/certificate/page.tsx + print-button |
| E3-S1/S2/S6: Training school full stack | training categories/lessons/quizzes + admin CRUD + video player + quiz lightbox |
| E8-S2: Training analytics admin | admin/training/analytics/page.tsx |
| E3-S3: AI quiz generation (PPTX → Claude → review) | admin/training/quiz-generate, api/admin/quiz-generate, api/admin/quiz-drafts |
| E2-S4: Card-on-file billing cron | cron/charge-confirmed-sessions |
| E4-S1: Community signup + Stripe checkout | join/community, api/community/checkout |
| E4-S2: Family unit management + birth data | community/family, api/community/family |
| E4-S3: Natal chart generation | api/community/generate-natal, community/charts |
| E4-S4: Relationship charts | api/community/relationship-charts |
| E4-S5: Monthly transits cron | cron/monthly-transits, community/transits |
| E4-S6: Content library | community/library |
| E4-S7: Sunday Service | community/sunday-service, api/community/sunday-service |
| E5-S1: Mystery School enrollment | join/community (mystery_school type), api/community/checkout |
| E5-S2: Foundation 12-week training | community/training, api/mystery-school/foundation, complete-week |
| E5-S3: Decan calendar + unlock logic | community/decans, api/mystery-school/decans, cron/decan-unlock |
| E5-S4: Ritual performer | community/decans/[id], api/mystery-school/decan/[id]/ritual-complete |
| E5-S5: Scry + mundane journal | api/mystery-school/decan/[id]/scry + journal |
| E5-S6: Graduation → Priest/Priestess | ritual-complete route auto-triggers graduation email at 36th decan |
| E7-S1: PayPal Connect | api/paypal/connect + callback + disconnect |
| E7-S2: Affiliate agreement e-sign | dashboard/affiliates banner + api/dashboard/affiliate-agreement |
| E9-S3: Ayrshare social auto-post cron | cron/social-advocacy-post + vercel.json |
| E3-S5: Post-graduation Tabby CTA (partial) | Graduation banner on trainee/page.tsx; awaits NEXT_PUBLIC_TABBY_USERNAME env var |
| Community ingress charts | community/ingress-charts + [id], api/community/ingress-charts |
| Community horoscope calculator | community/horoscope, api/community/horoscope |
| Admin: payments history | admin/payments, api/admin/payments |
| Admin: social advocacy CRUD | admin/social-advocacy, api/admin/social-advocacy |
| Admin: spiritual wisdom CRUD | admin/spiritual-wisdom, api/admin/spiritual-wisdom |
| Admin: decan journals CRUD | admin/decan-journals, api/admin/decan-journals |
| Admin: decan media CRUD | admin/decan-media, api/admin/decan-media |
| Admin: ingress charts CRUD | admin/ingress-charts, api/admin/ingress-charts |
| Admin: blog CRUD | admin/blog, api/admin/blog |
| Blog: live posts from DB | blog/[slug]/page.tsx; blog/page.tsx reads from blog_posts table |
| Admin nav | All new modules added to admin/layout.tsx |
| E8-S1: Admin analytics | admin/page.tsx (was already comprehensive — verified complete) |
| E6-S2: Google Calendar two-way sync | google-calendar.ts createCalendarEvent wired in Stripe webhook |

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
