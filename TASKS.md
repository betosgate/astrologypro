# AstrologyPro — Daily Task Board

> **Workflow:** Update this file each session. Check off items as you go. Push at end of day.
> **Last updated:** 2026-04-06 (session 20 — platform v2: 8 major modules + billing + video + intake + legal)
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
| Discover page v2 | ✅ Done — sub-type filters (Astrologer/Tarot/Oracle), certified-first sort, URL-synced filters, richer cards, /api/public/diviners cursor-paginated API |
| Return event lifecycle emails | ✅ Done — migration 038; lifecycle_return_events table; return-events.ts math utils; 3 email functions; daily cron (30d/7d/1d/day-of reminders for Saturn/Jupiter/Solar returns) |
| Milestone reading landing pages | ✅ Done — /readings hub + /readings/saturn-return + /readings/jupiter-return + /readings/solar-return; ISR, SEO metadata, diviner grids, FAQ, sitemap |
| Blog v2 — editorial core | ✅ Done — migration 036; 9 tables; status machine (7 states); content_blocks JSONB; block editor; categories/authors/series/tags admin |
| Blog v2 — public experience | ✅ Done — homepage (hero/featured/latest/categories); post detail (TOC/author/series/share/related); category/tag/author/series/search listing pages; RSS feed; sitemap |
| User Management v2 | ✅ Done — migration 037; permissions (29); role_permissions; invitations; user_relationships; user_security_events; comm_prefs; impersonation log; 12 new API routes; rich 7-tab user detail; permission matrix; invitations page; diviners page |
| Admin: payments history | ✅ Done — paginated table from bookings |
| Admin: social advocacy CRUD | ✅ Done |
| Perennial: community welcome email | ✅ Done — wired to Stripe webhook on checkout success |
| Perennial: monthly transit ready email | ✅ Done — fires from cron after generation, deduped per cycle |
| Perennial: subscription cancel/uncancel | ✅ Done — cancel_at_period_end flow + plan page UI |
| Perennial: member discount token (5% cross-sell) | ✅ Done — token issuance/validation, transit CTA, booking payment 20%→15% |
| Perennial: holy books admin CMS | ✅ Done — CRUD, sort, active toggle, library page now DB-driven |
| Perennial: doctrine links admin CMS | ✅ Done — CRUD, sort, active toggle, library page now DB-driven |
| Perennial: Sunday Service book filter + new-episode email | ✅ Done — filter pills, book_name field, publish triggers email blast |
| Perennial: email sequence admin (pause/resume) | ✅ Done — /admin/email-sequences with subscriber counts |
| Perennial: email history + template preview | ✅ Done — /admin/email-history, /admin/email-preview |
| Perennial: dashboard visual hierarchy (tasks 12–15) | ✅ Done — section groups, quick actions, empty states, mobile, cancel banners |
| Calendar module (dual-calendar, booking mgmt) | ✅ Done — Microsoft + Google, availability templates, token-based booking page |
| Admin login (DB-based, no env var dependency) | ✅ Done — admin_users table, requireAdmin(), bootstrap fallback |
| Admin PM content management (gold standard) | ✅ Done — stats, filters, rich create/edit, seed script |
| PM community dashboard enrichment | ✅ Done — donate banner, membership details, chart highlights, family rings, content library cards |
| Family member management + invite login | ✅ Done — rich astro form, profile completion, invite-to-login flow |
| Mystery school enrollment lifecycle | ✅ Done — 4-step upgrade flow, quarter selection, PM→MS upgrade, access guards |
| Mundane Astrology admin (ingress charts) | ✅ Done — gold standard admin, sector filter, rich create/edit, mundane access control |
| Mystery school Foundation Q1 task system | ✅ Done — task-level completion, checklist UI, week unlock logic |
| Mystery school decan curriculum + timeline | ✅ Done — metadata fields, lifecycle dates, grace state, enriched dashboard |
| Mystery school ritual praxis runner | ✅ Done — sequential step enforcement, execution tracking |
| Mystery school scry + mundane journals | ✅ Done — card association, 3-section mundane, server validation |
| Nativity Birth Chart V2 | ✅ Done — city autocomplete, natal wheel, planets/houses/aspects, AI interpretations (20/day limit), chart history |
| Affiliate Commission MVP | ✅ Done — commission rules (% or fixed), immutable ledger, payout records, 3-role dashboards, cursor pagination, full audit trail |
| Mundane Astrology Dashboard Phase 1 | ✅ Done — entity/country registry, entity charts, forecasts CRUD, community hub, admin hub, navigation wired |
| Mystery school tasks 08–11 (missed decan, graduation, tarot, emails) | ✅ Done — see session 15 |
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
| Check-in system | ✅ Done — migration 039; public check-in page + admin management |
| Giveaway system | ✅ Done — migration 040; public entry page + admin management |
| Media gallery | ✅ Done — migration 041; admin management |
| Weekly subscription product | ✅ Done — migration 042; diviner setup UI |
| Stream platform configs | ✅ Done — migration 043; multi-platform live dashboard rebuilt |
| Diviner SaaS plans | ✅ Done — migration 044; billing page, Stripe checkout/portal, webhook handlers |
| Testimonial enhancements | ✅ Done — migration 045 |
| Customer portal enhancements | ✅ Done — migration 046; orders + subscriptions portal pages |
| Video reading system | ✅ Done — migration 047; VideoSDK JWT; room + join pages |
| Dynamic intake templates | ✅ Done — migration 049; field builder UI + renderer |
| Legal policy management | ✅ Done — migration 050; versioned docs CMS + public pages |
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

## ✅ Completed This Session (session 20 — 2026-04-06)

| Feature | Detail |
|---|---|
| Check-in system | Migration 039; `check_ins` + `live_sessions` tables; public `/check-in/[username]` page; admin `/admin/check-ins` management; `/api/check-in/[username]` public endpoint |
| Giveaway system | Migration 040; `giveaways` + `giveaway_entries` + `giveaway_winners` tables; public `/giveaways/[id]` entry page; admin `/admin/giveaways` management |
| Media gallery | Migration 041; `media_items` table with type (image/video/audio/document), Supabase Storage URLs; admin `/admin/media-items` management |
| Weekly subscription product | Migration 042; `weekly_subscription_products` + `weekly_subscription_subscribers` + `weekly_subscription_deliveries` tables; diviner toggle/setup UI |
| Stream platform configs | Migration 043; `stream_platform_configs` table; multi-platform live page rebuilt at `/dashboard/live` (YouTube + Facebook + custom RTMP) |
| Diviner SaaS plans | Migration 044; `diviner_plans` + `diviner_plan_addons` + `diviner_plan_subscriptions` + `diviner_invoices` + `telephony_usage_records`; billing page at `/dashboard/billing`; admin plan management; Stripe checkout + portal routes; webhook handlers in `/api/stripe/webhooks` |
| Testimonial enhancements | Migration 045; `verified_at`, `reply_body`, `reply_at`, `reading_type`, `featured_position` on testimonials |
| Customer portal enhancements | Migration 046; `orders` + `order_intake_submissions` + `client_subscriptions` tables; portal orders list + detail pages; portal subscriptions page |
| Video reading system | Migration 047; `video_sessions` + `video_session_participants` tables; `src/lib/videosdk.ts` (VideoSDK JWT via jose); diviner room page `/dashboard/video/[id]`; client join `/portal/video/[id]`; admin `/admin/videos`; API routes: `/api/dashboard/video-sessions`, `/api/video-sessions/[id]/join` |
| Stripe SaaS billing lib | `src/lib/stripe-saas.ts`; getOrCreateDivinerCustomer(), createDivinerPlanCheckout(), createDivinerBillingPortalSession(), cancelDivinerPlanAtPeriodEnd(); billing checkout + portal API routes |
| Dynamic intake templates | Migration 049; `intake_templates` table; `src/lib/intake-fields.ts` (7 field types + PRESET_TEMPLATES); intake builder UI at `/dashboard/intake-builder`; DynamicIntakeForm renderer component |
| Legal policy management | Migration 050; `legal_documents` (versioned, type-checked) + `legal_acceptances` tables; 5 seed documents; admin CMS at `/admin/legal`; public `/legal/[type]` pages; `/api/legal/accept` endpoint |
| Training analytics fix | `/admin/training/analytics` blank page fixed — all 6 fetch calls now have type guards + `.catch()` handlers; no more crash on API failure |

---

## ✅ Completed This Session (session 15 — 2026-04-06)

| Feature | Detail |
|---|---|
| Mystery school task 08 — missed decan retry | Migration 026; `retried_at` + `retry_reason` on student_decan_progress; decan-unlock cron adds retry pass; admin student detail page with full progress + excuse modal |
| Mystery school task 09 — graduation + ritual builder | Migration 027; `graduation.ts` service; graduation-check cron; `/community/training/graduation` ceremony page; post-grad personal ritual builder (`/community/training/ritual-builder`) with CRUD API |
| Mystery school task 10 — tarot seed | Migration 028; tarot card seed data for all 36 decans wired to decan detail pages |
| Mystery school task 11 — lifecycle emails | `ms-email-reminders` cron: enrollment welcome, decan-unlock notification, inactivity warning (7d), graduation congratulations; registered in vercel.json |
| PM content library | `mandalism-content` API; `MandalismContentPreview` component; type-specific cards (video/youtube/live/announcement/doc); `/community/library` rewritten server-first with type filter pills |
| CRON_SECRET whitespace fix | `instrumentation.ts` trims env var at startup + Vercel env var updated directly to clean value via browser; Vercel redeployment triggered |
| Affiliate Commission task docs | Diviner Affiliate Commission Requirements.docx + overview.md saved to `tasks/06.04.2026/affiliate-commission/` |

---

## ✅ Completed This Session (session 14 — 2026-04-06)

| Feature | Detail |
|---|---|
| Calendar module | Microsoft/Outlook OAuth + Google Calendar update/delete; availability templates; booking management page; reschedule/cancel APIs (dual-auth: booking_token + session); 24h/1h reminder cron; booking notes + metadata capture; CopyBookingLink; CalendarConnections; booking wizard skeleton + timezone display |
| Admin test user | admin@astrologypro.com / Admin@AstroPro2026! seeded in admin_users table + docs/test-users.md |
| CRON_SECRET fix | Shared verifyCronAuth helper — trims whitespace before comparison; all 15 cron/twilio routes updated |
| Admin login overhaul | DB-based admin_users table; requireAdmin() lib; 113 admin routes migrated from inline ADMIN_EMAILS check |
| Admin PM content (gold standard) | Stats bar, type/status/access/search filters, rich create/edit forms (YouTube embed preview, thumbnail, duration), AlertDialog deletes, seed script (10 items) |
| PM community dashboard enrichment | Donate banner (top), rich membership details + member slot progress, own chart readiness + family chart rings, MS join banner (bottom) |
| Family member management | Rich add-member form (all astro fields + live completion ring), edit form, detail page enrichment, invite-to-login flow (invite_token), sendFamilyMemberInvite email |
| Mystery school enrollment lifecycle | Migration 020 (12 lifecycle columns on mystery_school_students); quarter utility (2026–2030 dates); 4-step upgrade flow; access guard requireMysterySchoolAccess; training layout guard |
| Mundane Astrology admin | Gold standard ingress charts admin (stats, filters, sector multi-select, rich create/edit with interpretation/chart ruler/challenges+strengths); admin mundane access control page; community detail enrichment; seed script |
| Mystery school foundation Q1 | Task-level completion system; per-task check API; week unlock based on all-tasks-done; admin foundation task authoring |
| Mystery school decan curriculum | Metadata fields (decan_name, tarot_card_ref, artwork_url); student_decan_progress lifecycle (window_open/close, grace_close); enriched decan grid + detail; admin student progress overview |
| Mystery school ritual runner | Step-by-step guided runner with sequential enforcement; ritual_executions table; 3-second read delay per step; admin publish/version controls |
| Mystery school journals | scry_journals (card association, experience text); mundane_journals (3 required sections, 100-char minimum); server-side validation; admin journal review |

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
