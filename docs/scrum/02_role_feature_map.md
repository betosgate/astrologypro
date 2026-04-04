# Role × Feature Map
## What exists vs what's missing
## `divine-infinite-being-angular-ui` + `divine-infinite-being-nest-api`

> Cross-referenced with meeting notes: `docs/meetings/2026-04-03_meeting_notes.md`

---

## Role 1 — Admin

**Portal:** `/admin-dashboard` (Angular)
**Auth:** `user_type === 'is_admin'` in `login_user_details` cookie

### ✅ What Exists

| Module | Features |
|---|---|
| **Dashboard** | User list with all roles; mundane astrology access toggle; preview modal; training % tracking |
| **User Management** | CRUD for all users; role assignment; status toggle; state/city/zip fields |
| **Role Management** | Create/edit system roles with priority and slug |
| **Training Management** | Training categories, lessons, quizzes, assignments; CKEditor for content; pre-requisite chains |
| **Package Management** | Service package CRUD; Single/Multiple/Subscription purchase types; price, package type |
| **Payment Management** | Transaction list; preview; refund initiation |
| **Webinar Management** | Webinar CRUD |
| **Social Advocacy Content** | Social advo posts with frequency, image, audio, link |
| **Tarot Spreads** | Spread templates + individual tarot card CRUD |
| **Ritual Invocation** | Ritual configuration CRUD |
| **Wheel Sign Management** | Zodiac wheel sign CRUD with date ranges, images, priority |
| **Astro Decan Info** | Decan info (sign/planet/tarot/daemon) + video/PDF uploads per decan |
| **General Content (Journal)** | Journal content per sign/decan |
| **Spiritual Wisdom** | Text/document + YouTube content management |
| **Content Management** | Perennial mandalism content — Live Stream, Video, Document, YouTube, Announcement with access control |
| **Calendar of Events** | Event CRUD; public/members/students/guests access control |
| **Refund Requests** | Refund list, preview, approve/reject, comments, evidence upload |
| **Orders** | Order list |
| **Class Configuration** | Quarter/class setup with admin assignment and session scheduling |
| **Report** | Report list — quarter, schedule, click time analytics |
| **Assignment Notifications** | Training assignment notifications from trainees |

### 🔴 Missing / Needs Building

| Feature | Source | Priority |
|---|---|---|
| **Certified Diviner Badge Management** — manually award/revoke "Divine Infinite Being Certified" badge | Meeting | High |
| **Community Member Management** — view/manage community subscriptions, family units, natal chart status | Meeting | High |
| **Mystery School Student Management** — decan progress, approve missed decan waivers | Meeting | Medium |
| **Training Analytics Dashboard** — per-module pass/fail rates, average time, quiz difficulty scoring | Meeting | Medium |
| **Subscription Revenue Dashboard** — community + mystery school MRR by period | Meeting | Medium |
| **Sunday Service Content Management** — schedule + publish Beto's weekly live commentary | Meeting | Low |
| **Policy Document Management** — manage refund/booking policy text per product type | Meeting | Medium |
| **Diviner No-Show / Refund Override** — admin view/override of auto-refund events | Meeting | Medium |
| **Card-on-file Billing Review** — admin view of pending/completed 24h-post-session charges | Meeting | Medium |
| **AstrologyPro.com Marketing Copy Admin** — update homepage copy via admin | Meeting | Low |

---

## Role 2 — Astrologer / Tarot Reader

**Portal:** `/astrologer-dashboard` (Angular)
**Auth:** `user_type === 'is_astrologer' | 'is_tarotreader' | 'is_astrologer_tarotreader'`

### ✅ What Exists

| Module | Features |
|---|---|
| **Dashboard** | 8-view KPI dashboard: Customers, Sales, New Customers, Appointments, By System, By Link, Total Revenue, Video Library |
| **Customer Management** | Customer list with preview, status change, delete, gift packages |
| **Customer Notes** | Per-customer notes (add/edit/delete via `notes/*` API) |
| **Conference Room** | Participant list dialog; link to Amplify-hosted video conference |
| **Calendar Management** | Availability slots, booked slots, event list, create/edit events via external Calendar Lambda |
| **Training Center** | Training content delivery — category → lesson navigation |
| **Appointments** | Appointment/session list with video gallery integration |
| **Testimonials** | Request testimonials from customers; create/edit testimonials |
| **Profile Management** | View and edit own astrologer profile |
| **Package Management** | Create/manage own service packages |
| **Tarot Readings** | (Tarot reading sessions — accessed via `/tarot-card` routes) |

### 🔴 Missing / Needs Building

| Feature | Source | Priority |
|---|---|---|
| **Certified Badge CTA** — soft banner inside dashboard linking to certification school | Meeting | High |
| **PayPal Connect** — connect PayPal account alongside Stripe earnings | Meeting | High |
| **Affiliate Policy E-sign** — astrologer must sign policy before affiliate system activates | Meeting | High |
| **Affiliate Affiliate Earnings View** — see calculated commissions owed to their own affiliates | Meeting | High |
| **Policy Confirmation View** — confirm refund/no-show policies shown on public `/profile/:name` | Meeting | Medium |
| **Training Progress Detail** — per-lesson quiz scores, time spent, completion % | Meeting | Medium |
| **Post-graduation Consultation Booking** — book 2hr Tabby session after certification (Next.js side) | Meeting | High |
| **No-show Auto-refund Visibility** — view auto-refund events triggered for own sessions | Meeting | Low |
| **Card-on-file Billing Status** — see pending/processed 24h-post-session charges | Meeting | Low |

---

## Role 3 — Customer / Social Advocate

**Portal:** `/customer-dashboard` (Angular)
**Auth:** `user_type === 'is_customer' | 'is_social_advo' | 'is_customer_socialadvo'`

### ✅ What Exists

| Module | Features |
|---|---|
| **Package List** | View purchased packages with price, webinars, dates |
| **Social Advocacy** | Social advo posts access |
| **Profile Management** | Basic profile view/edit |
| **Tarot Readings** | Access to tarot reading sessions |

### 🔴 Missing / Needs Building

| Feature | Source | Priority |
|---|---|---|
| **Community Membership Upgrade CTA** — prompt to join community for $9.97/month | Meeting | Medium |
| **5% Member Discount at Checkout** — apply discount if also a community member (AstrologyPro side) | Meeting | Medium |
| **No-show Policy Acknowledgement** — explicit checkbox at checkout (AstrologyPro side) | Meeting | High |
| **Pre-populated Charts at Booking** — use natal chart from community membership during booking | Meeting | Medium |
| **Referral Tracking** — clicks + conversions properly attributed to social advocate code | Existing (partial) | High |
| **Payout Request** — advocate requests payout; admin approves/initiates | Meeting | Medium |
| **Affiliate Agreement E-sign** — must sign policy before going live as advocate | Meeting | High |

---

## Role 4 — Perennial Mandalism Member

**Portal:** `/perennial-mandalism-dashboard` (Angular)
**Auth:** `is_perennial_mandalism === 1` OR `user_type === 'is_Perennial_Mandalism'`
**Subscription:** `perennial_mandalism_status === 'subscription running'` — else Stripe modal

### ✅ What Exists

| Module | Features |
|---|---|
| **Dashboard** | Membership data display via `fetch-membership-details` |
| **Product Detail** | Product/service accordion view |
| **My Rituals** | List of completed rituals |
| **Ritual Result** | Per-ritual result/configuration display |
| **Additional Member** | Add family member |
| **Edit Member** | Edit family member details |
| **Relationship Details** | Accordion view for relationship info |
| **Stripe Subscription Guard** | Auto-prompts Stripe payment if subscription lapsed |

### 🔴 Missing / Needs Building

| Feature | Source | Priority |
|---|---|---|
| **Natal Chart Generation + Display** — generate once per person; child mode < 14 yrs | Meeting | High |
| **Time-of-birth Prompt** — soft non-blocking prompt to improve chart accuracy | Meeting | Medium |
| **Relationship Chart Display** — auto-generate all pairings within family unit | Meeting | High |
| **Monthly Transits Auto-generation** — cron job once/month per adult member | Meeting | High |
| **Transits Dashboard** — view current month's transits with chart visual | Meeting | High |
| **"Book a Reading" CTA with 5% Discount** — upsell from transits to AstrologyPro booking | Meeting | High |
| **Holy Books PDF Library** — Bhagavad Gita, Gospel of Thomas, Tao Te Ching | Meeting | Medium |
| **Central Doctrine Links** — YouTube playlist + website pages for Central Doctrine | Meeting | Medium |
| **Five-fold Creed Link** — prominent link/button to creed video | Meeting | Medium |
| **Sunday Service Section** — archive of weekly recordings; live stream link | Meeting | Medium |
| **"Become a Certified Diviner" CTA** — links to school/diviner info | Meeting | Medium |
| **Subscription Management** — upgrade to Mystery School (replaces $9.97 with $27) | Meeting | High |
| **Family Unit CRUD (full)** — name, birthdate, birth time, location per member | Meeting | High |
| **Social features** — *(deferred to 2027)* | Meeting | Backlog |

---

## Role 5 — Mystery School Student

**Portal:** `/mystery-school-dashboard` (Angular)
**Auth:** `is_mystery_school === 1` AND `mystery_school_status === 'subscription running'`
**Subscription:** $97 one-time + $27/month
**Guard:** Opens `MysteryStripeModal` if subscription not active

### ✅ What Exists

| Module | Features |
|---|---|
| **Dashboard** | 12 Zodiac Cards with locked/unlocked states; training progress via API |
| **Training Center** | Training category navigation |
| **Training Lessons** | Lesson content view (`:_id` param) |
| **Stripe Subscription Guard** | Auto-prompts payment if lapsed |

### 🔴 Missing / Needs Building

| Feature | Source | Priority |
|---|---|---|
| **Foundation 12-week Training** — week-by-week content from Ritual & Praxis instruction book | Meeting | High |
| **Beto's Audio Introduction per Week** — audio clip + photo per week | Meeting | High |
| **Decan Unlock Logic** — 1 week before seasonal start, 3-decan set unlocks | Meeting | High |
| **Decan Calendar Display** — exact date range per 10-day decan with bold start dates | Meeting | High |
| **Ritual Performer** — step-by-step pre-built ritual per decan (read-only during school) | Meeting | High |
| **Scry & Journal Submission** — form per decan for scrying record | Meeting | High |
| **Mundane Impact Journal** — journaling on relationship/business/perception changes | Meeting | High |
| **Decan Completion Check** — at least 1 ritual + 1 scry + 1 journal within 10-day window | Meeting | High |
| **2-day Grace Period** — allow submissions up to 2 days past decan end | Meeting | High |
| **Missed Decan → Repeat Logic** — flag missed; reschedule same decan for next year | Meeting | High |
| **Beto's Audio Journal Archive** — per-decan daily audio clips (Beto records from autumn 2026) | Meeting | Medium |
| **Progress Map** — visual 36-decan map showing complete/in-progress/locked | Meeting | Medium |
| **Graduation to Priest/Priestess** — all 36 decans complete → ritual builder unlocks | Meeting | High |
| **Ritual Builder Post-graduation** — full custom ritual creation tool | Meeting | High |
| **Enrollment / $97 One-time Checkout** | Meeting | High |
| **$27/month Subscription** (replaces community fee) | Meeting | High |

---

## Role 6 — Diviner

**Portal:** `/diviner` (Angular)
**Auth:** Cookie flag `userinfo.is_diviner === 1`

> **Note:** Primary Diviner portal is in AstrologyPro (Next.js). Angular `/diviner` appears to be a supplementary/legacy view.

### ✅ What Exists (Angular)

| Module | Features |
|---|---|
| **Diviner Dashboard** | Basic dashboard shell |
| **Transactions** | Stripe transaction list via `stripe/transaction-list-fetch` |

### ✅ What Exists (AstrologyPro — Next.js)

| Module | Features |
|---|---|
| Dashboard | Booking overview, earnings, calendar |
| Services | CRUD service offerings |
| Availability | Set available time slots |
| Bookings | View/manage bookings |
| Calendar | Google Calendar sync |
| Clients | Client list, notes |
| Payments | Stripe Connect onboarding + earnings |
| Session Notes | Write/view per-booking notes |
| Marketing | Ayrshare social posting, blog subscribe |
| Settings | Profile, subscription tier |
| Analytics | Revenue, bookings trend |
| Recordings | Session recording links |

### 🔴 Missing / Needs Building

| Feature | Source | Priority |
|---|---|---|
| **Certified Badge** — "Divine Infinite Being Certified" badge on discover page | Meeting | High |
| **Subtle Certification CTA** — soft banner: "Get certified, get your badge" | Meeting | High |
| **PayPal Connect** — alongside existing Stripe Connect in settings | Meeting | High |
| **Policy Display on Profile** — `/[username]` page shows all booking/refund policies | Meeting | High |
| **No-show Auto-Refund** — diviner no-join within 5 min → 100% auto-refund (webhook) | Meeting | High |
| **Client No-show 50% Refund** — client no-show → 50% refund, 50% kept (webhook) | Meeting | High |
| **Card-on-file Billing** — bill saved card 24h after confirmed session | Meeting | High |
| **Affiliate Agreement E-sign** — must sign before affiliate system activates | Meeting | High |
| **Trainee Management View** — see own trainees' progress (mentor view) | Meeting | Medium |

---

## Role 7 — Trainee (Certification School Student)

**Portal:** `/trainee` (AstrologyPro — Next.js shell only)
**Auth:** Supabase, row in `trainees` table

### ✅ What Exists

| Module | Status |
|---|---|
| Portal shell | ✅ Basic layout + navigation |
| Sessions | ✅ Basic list |
| Progress | ✅ Placeholder |
| Resources | ✅ Placeholder |
| Profile | ✅ Basic |

### 🔴 Missing / Needs Building (ENTIRE SCHOOL SYSTEM)

| Feature | Source | Priority |
|---|---|---|
| **Course Module List** — ordered list of ~60 modules with locked/available/completed states | Meeting | High |
| **Video Player with Slide Detection** — play training video; detect slide transitions | Meeting | High |
| **Slide-triggered Quiz** — lightbox at each slide with 2 MCQ questions | Meeting | High |
| **Wrong Answer → Force Rewatch** — rewatch segment before retry on wrong answer | Meeting | High |
| **Progress Bar per Module** — visual per-module progress | Meeting | High |
| **Overall Course Progress %** — across all ~60 modules | Meeting | High |
| **Module Unlock Logic** — complete module N to unlock N+1 | Meeting | High |
| **Graduation Detection** — all modules 100% → graduated | Meeting | High |
| **Graduation Certificate PDF** — printable; lists astrology + tarot categories covered | Meeting | High |
| **Post-graduation Tabby Booking** — embedded Google Calendar for 2hr consultation | Meeting | High |
| **Email Nudges** — reminder if Tabby booking not scheduled within X days | Meeting | Medium |
| **Mentor Connection** — link to mentor (diviner who invited via code) | Existing | Medium |
| **AI Question Bank** — Claude reads PowerPoint → generates 2 MCQs per slide | Meeting | High |
| **Admin PPTX Upload** — admin uploads slide deck → AI generates questions → review → save | Meeting | High |

---

## Role 8 — Affiliate

**Portal:** `/affiate-dashboard` (Angular)
**Auth:** `is_affiliate` role

### ✅ What Exists

| Module | Features |
|---|---|
| **Affiliate Dashboard** | User list filtered by affiliate ID; KPI cards (Sales, Revenue, Diviners, Commission, Clicks, Conversions) |
| **Affiliate User List** | Diviner lookup by name/email; table with total_amount_paid, total_commission |

### 🔴 Missing / Needs Building

| Feature | Source | Priority |
|---|---|---|
| **Real Referral Tracking Hook** — clicks + conversions actually attributed in booking flow | Existing (partial) | High |
| **Payout Request** — affiliate requests payout; admin approves/initiates | Meeting | Medium |
| **Affiliate Agreement E-sign** — must sign policy before going live | Meeting | High |

---

## Cross-Cutting Missing Features

These span multiple roles/modules:

| Feature | Roles Affected | Priority |
|---|---|---|
| **Stripe `account.updated` Webhook** — register in Stripe Dashboard | Admin/Diviner | P1 |
| **Booking Conflict Detection Hold Release** — cron to release held booking slots | All | P1 |
| **Policy Checkbox at Checkout** — client acknowledges no-show fee policy | Client | P1 |
| **Policy Display on Diviner Profile** — refund/no-show policy on every `/[username]` page | Diviner/Client | P1 |
| **No-show Auto-refund Webhooks** — diviner no-show → 100%, client no-show → 50% | Diviner/Client | P1 |
| **Card-on-file Billing Cron** — 24h post-confirmed-session billing | Diviner/Client | P1 |
| **Community Signup + Stripe Products** — $9.97 individual / $19.97 family subscriptions | Community Member | P1 |
| **Mystery School Checkout** — $97 one-time + $27/month | Mystery Student | P1 |
| **Certified Badge Column** — DB column + profile display + discover page badge | Diviner | P1 |
| **PayPal Connect** (both Angular and Next.js) | Diviner/Astrologer | P2 |
| **Ayrshare Social Auto-posting** — activate with `AYRSHARE_API_KEY` | Diviner | P3 |
| **AstrologyPro.com Homepage Copy Rewrite** | Public | P3 |
