# AstrologyPro — Developer Handoff Document

**For the incoming developer.** This document tells you everything you need to pick up this project cold and get productive immediately.

**Last Updated**: 2026-04-02  
**Platform URL**: https://astrologypro.com  
**Repository**: C:\Users\Admin\OneDrive\Documents\ClaudeProjects\AstrologyPro\app  

---

## Critical Architecture Note — Read This First

**AstrologyPro is a business management platform, NOT astrology software.**

The actual astrology charting, birth chart calculation, tarot card reading tools, synastry, transit analysis, and all astrological computation are handled by a **separate Angular back-office application** at `backofficeportal.divineinfinitebeing.com`. Diviners use that tool during sessions (shared via Daily.co screen sharing).

**What this Next.js app handles:**
- Business logistics (bookings, scheduling, payments, CRM)
- Client-facing portal and booking flow
- Marketing automation (social shares, mundane astrology content)
- Communication (video sessions via Daily.co, phone via Twilio, email via Resend)
- The only "astrology" built here is the **mundane astrology marketing system** — automated social share images tied to planetary events (ingress, retrograde, aspects)

**What this app does NOT and SHOULD NOT build:**
- Birth chart display or calculation
- Tarot card reading tools or spread viewers
- Transit tracking or personal ephemeris
- Synastry or composite chart tools

Birth data is collected from clients during booking so the practitioner has it available in their back-office session — it is not processed or displayed by this app.

---

## What Is This?

AstrologyPro is a SaaS platform for professional astrologers and tarot readers ("diviners"). Each diviner gets:
- A branded public landing page (`astrologypro.com/[username]`)
- Online booking system for video sessions and phone readings
- Video session room (Daily.co with SIP dial-in)
- Browser-based phone call widget + mobile forwarding (Twilio)
- Client management CRM
- Payment processing (Stripe — platform takes 20%, diviner gets 80%)
- Marketing tools (automated social share posts with astrology imagery)
- Google Calendar sync
- Gift certificates, loyalty discounts, affiliate tracking
- Post-session follow-up email sequences
- Intake form builder (custom questionnaires per service)
- Follow-up automation dashboard (configurable email sequences)
- Recording playback page for clients
- Self-serve rescheduling in client portal
- "What to Expect" section per service on public profile
- Credentials and verified badge field on diviner profiles
- Sticky "Book Now" CTA on diviner profile pages
- Refund UI in bookings dashboard
- Welcome email for new diviners on account creation
- Blog landing page (`/blog`)
- Pricing page (`/pricing`)
- Comprehensive `/instructions` feature guide page

**Business model**: Diviners pay a monthly subscription to use the platform. Platform takes 20% of every client session payment.

---

## Feature Completion Status (as of 2026-04-02)

All think tank audit items (T1–T9, M1–M8, A4, A6, A8) have been fully implemented. The platform is feature-complete. Remaining work is Stripe live keys + Twilio 10DLC registration — both are infrastructure tasks, not code tasks. See `docs/TODO.md` for the exact checklist.

---

## Immediate Setup (Read First)

### 1. Get All Keys
See `docs/KEYS.md` for every API key and credential.

### 2. Environment Files
The app uses `.env.local` for local dev (already populated — do `vercel env pull` to refresh from Vercel if needed).

### 3. What's NOT Working Yet
See `docs/TODO.md` for the full list. The **most critical blocker** is:
- **Stripe**: All payment keys are placeholders. No real money can move until real Stripe keys are installed.

### 4. Test Account
- Back-office (Angular admin panel): Test@1234
- Supabase dashboard: https://supabase.com/dashboard/project/wyluvclvtvwptsvvtgkv

---

## Tech Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Framework | **Next.js 16.2.1** (App Router) | Breaking changes from 15! Read AGENTS.md. |
| Language | TypeScript 5.x | Strict mode |
| React | 19.2.4 | |
| Database + Auth | **Supabase** (PostgreSQL) | Project ID: `wyluvclvtvwptsvvtgkv` |
| Payments | **Stripe** | Billing + Connect Express + SetupIntents |
| Video | **Daily.co** | SDK 0.89.x, SIP dial-in enabled |
| Phone/Voice | **Twilio** | Voice queue + browser widget + SMS |
| Email | **Resend** | Transactional + follow-ups |
| Calendar | **Google Calendar API v3** | OAuth2 per diviner |
| AI Content | **Anthropic** (claude-haiku-4-5) | Mundane astrology content |
| UI | **shadcn/ui** + Radix + Tailwind 4 | |
| Hosting | **Vercel** (Pro) | |

---

## Project Structure

```
app/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── page.tsx              # Marketing homepage
│   │   ├── [username]/           # Public diviner profile + booking
│   │   │   ├── page.tsx          # Diviner landing page
│   │   │   ├── book/[serviceSlug]/page.tsx  # Booking flow
│   │   │   ├── session/[bookingId]/page.tsx # Video session room
│   │   │   └── gift/page.tsx     # Gift certificate purchase
│   │   ├── dashboard/            # Diviner admin panel (auth required)
│   │   │   ├── layout.tsx        # Auth guard + sidebar + phone widget
│   │   │   ├── page.tsx          # Overview (stats, revenue chart)
│   │   │   ├── bookings/         # Booking management
│   │   │   ├── clients/          # Client CRM
│   │   │   ├── services/         # Service catalog management
│   │   │   ├── calendar/         # Availability + Google Calendar
│   │   │   ├── analytics/        # Page view analytics
│   │   │   ├── affiliates/       # Affiliate management
│   │   │   ├── testimonials/     # Review management
│   │   │   ├── marketing/        # Social share content
│   │   │   ├── live/             # YouTube/Facebook live settings
│   │   │   ├── profile/          # Profile editor
│   │   │   └── settings/         # Settings (billing, phone, etc.)
│   │   ├── portal/               # Client portal (auth required)
│   │   │   ├── page.tsx          # Client home
│   │   │   ├── bookings/         # Client's bookings
│   │   │   └── profile/          # Client profile
│   │   ├── api/                  # Route handlers
│   │   │   ├── daily/create-room/   # Create Daily.co room
│   │   │   ├── stripe/              # Stripe webhooks + checkout
│   │   │   ├── twilio/voice/        # Twilio voice webhooks
│   │   │   │   ├── incoming/        # Client calls in → queue
│   │   │   │   ├── wait-music/      # Hold music TwiML
│   │   │   │   ├── notify/          # Notify diviner of call
│   │   │   │   └── dequeue/         # Bridge client + diviner
│   │   │   ├── twilio/token/        # Browser voice token
│   │   │   ├── calendar/            # Google Calendar OAuth
│   │   │   ├── share-og/            # OG meta tags for social bots
│   │   │   ├── mundane/image/       # Astrology image generation
│   │   │   └── cron/                # Scheduled jobs
│   │   │       ├── share/           # Weekly share batch
│   │   │       ├── follow-ups/      # Post-session emails
│   │   │       └── mundane/         # Mundane event detection
│   │   ├── share/[token]/        # Social share landing page
│   │   ├── gift/[code]/          # Gift certificate redemption
│   │   ├── affiliate/[code]/     # Affiliate tracking page
│   │   ├── session/[shareId]/recording/  # Recording share page
│   │   ├── discover/             # Browse all diviners
│   │   ├── onboarding/           # New diviner onboarding wizard
│   │   ├── login/                # Auth page
│   │   ├── refund-policy/        # Refund policy page
│   │   ├── features/             # Features marketing page
│   │   ├── instructions/         # Platform instructions page
│   │   ├── guides/               # SEO content guides
│   │   └── [many SEO pages]      # zodiac, tarot, houses, planets, etc.
│   ├── components/
│   │   ├── ui/                   # shadcn/ui primitives
│   │   ├── dashboard/            # Dashboard-specific components
│   │   │   ├── sidebar.tsx       # Main nav sidebar
│   │   │   ├── mobile-nav.tsx    # Mobile bottom nav
│   │   │   ├── phone-widget.tsx  # Browser call receiver (Twilio Voice SDK)
│   │   │   ├── phone-widget-loader.tsx  # SSR-safe wrapper for phone widget
│   │   │   ├── booking-detail-sheet.tsx
│   │   │   ├── client-detail-sheet.tsx
│   │   │   ├── service-edit-sheet.tsx
│   │   │   ├── revenue-chart.tsx
│   │   │   ├── profile-strength.tsx
│   │   │   └── todays-sessions.tsx
│   │   ├── landing/              # Public profile page components
│   │   ├── marketing/            # Marketing site components
│   │   ├── booking/              # Booking flow components
│   │   ├── portal/               # Client portal components
│   │   └── session/              # Video session components
│   ├── lib/
│   │   ├── supabase/             # Supabase client (server + browser)
│   │   ├── stripe.ts             # Stripe client
│   │   ├── twilio.ts             # Twilio client
│   │   ├── daily.ts              # Daily.co API client
│   │   ├── format.ts             # Currency, date formatters
│   │   ├── constants.ts          # APP_URL, etc.
│   │   ├── service-images.ts     # Service image URL resolver
│   │   └── geist-bold-b64.ts    # Geist Bold font as base64 (for image gen)
│   └── proxy.ts                  # Next.js 16 middleware (auth + bot detection)
├── supabase/
│   └── migrations/               # 12 SQL migrations (see Database section)
├── public/
│   ├── HomeAbove/               # Custom hero images
│   └── [service images]         # Service type imagery
├── docs/                        # This documentation folder
│   ├── HANDOFF.md               # This file
│   ├── KEYS.md                  # All API credentials
│   ├── TODO.md                  # What's left to build
│   ├── DEV-STATUS.md            # Session-by-session build history
│   ├── DEVELOPER-GUIDE.md       # Deep technical reference
│   └── superpowers/specs/       # Design specs for each feature
└── .env.local                   # Local env vars (all populated)
```

---

## Next.js 16 Critical Gotchas

**Read AGENTS.md first.** This version has breaking changes:

1. **`params` and `searchParams` are Promises** — always `await` them in page components
2. **`ssr: false` only works in Client Components** — use `PhoneWidgetLoader` pattern (a `"use client"` wrapper for `next/dynamic`)
3. **`middleware.ts` is now `proxy.ts`** with a `proxy` export (not `middleware`)
4. **ISR pages always get `Cache-Control: private`** — bots see blank OG previews unless you use the proxy bot-detection pattern (see DEV-STATUS.md)
5. **Async `headers()` in `next.config.ts`** is the config callback, NOT the `import { headers }` runtime API — no await needed

---

## Database Schema (Summary)

**All migrations are in `supabase/migrations/`. Applied in order. Total: 12 files.**

Core tables:
- **`diviners`** — Practitioner accounts (linked to auth.users)
- **`services`** — What a diviner offers (astrology/tarot/phone/freelance)
- **`clients`** — People booking readings (linked to auth.users)
- **`client_diviners`** — Many-to-many relationship + stats
- **`bookings`** — Session bookings with payment info
- **`availability_slots`** — Weekly recurring hours
- **`availability_overrides`** — Time off / special hours
- **`testimonials`** — Client reviews
- **`affiliates`** / **`affiliate_referrals`** — Referral tracking
- **`gift_certificates`** — Gift card system
- **`discount_rules`** — Loyalty/package discounts
- **`phone_sessions`** — Phone reading sessions + billing
- **`share_batches`** — Weekly social content packages
- **`mundane_event_log`** — Astrology event triggers (ingress/retrograde etc.)
- **`follow_up_sequences`** — Post-session email schedule
- **`page_views`** — Analytics tracking

All tables have RLS. Use `SUPABASE_SERVICE_ROLE_KEY` in server-only API routes when you need to bypass RLS.

---

## Authentication Flow

**Diviners:**
1. Sign up at `/login` (Supabase auth)
2. Complete onboarding wizard at `/onboarding` (creates `diviners` row)
3. Redirected to `/dashboard`

**Clients:**
1. Sign up at `/login`
2. No onboarding — go directly to portal or can browse public profiles
3. Portal at `/portal`

**Auth guard**: `proxy.ts` checks Supabase session for all `/dashboard`, `/portal`, `/onboarding` routes. Redirects to `/login` if no session.

---

## Payment System

**Platform model**: 20% platform fee, 80% to diviner.

**Subscription billing**: Diviners pay monthly via Stripe. 3 tiers:
- Tarot only: $97/mo + $197 setup
- Astrology only: $97/mo + $197 setup  
- Oracle/Both: $147/mo + $297 setup

**Session billing**: Clients pay per booking. Stripe SetupIntent captures card on file, charges after session ends with overage for extra time.

**⚠️ STRIPE IS CURRENTLY IN PLACEHOLDER MODE** — see `docs/TODO.md`

---

## Phone System

Built in session 2026-04-02. Full stack:

1. **Client calls** Twilio number → `POST /api/twilio/voice/incoming` → `<Enqueue>` into queue
2. **Hold music**: `GET /api/twilio/voice/wait-music` → TwiML with loop
3. **Diviner notified**: `POST /api/twilio/voice/notify` → calls diviner mobile + browser simultaneously (based on `phone_answer_mode`)
4. **Bridge**: Diviner answers → `<Dequeue>` connects client + diviner
5. **Browser widget**: `src/components/dashboard/phone-widget.tsx` — floating bottom-right button, uses Twilio Voice JS SDK
6. **Settings**: Diviner can set `phone_mobile` number and `phone_answer_mode` (mobile/browser/both) in Settings page

**Key env vars**: `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET` (for browser token), `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

---

## Video System

- Daily.co rooms created per-booking via `POST /api/daily/create-room`
- SIP dial-in enabled on every room (`sip_mode: "dial-in"`)
- Session room at `/[username]/session/[bookingId]`
- Uses Daily.co React SDK
- Recordings available after session; shared via `/session/[shareId]/recording`

---

## Mundane Astrology System (Social Shares)

The platform auto-generates social content around astrological events:

1. **Cron**: `POST /api/cron/mundane` — detects current astrology events using ephemeris data
2. **Image generation**: `GET /api/mundane/image?key=[event_key]` — generates Instagram-optimized image with event name + `astrologypro.com/[username]` watermark
3. **Share page**: `/share/[token]` — landing page for shared content
4. **Bot detection**: `proxy.ts` rewrites bot requests for `/share/[token]` to `/api/share-og` which returns public-cached OG meta tags

Images use: background astrology photo + dark strip at bottom + white Pango text (Geist Bold, written to `/tmp` on cold start).

---

## Google Calendar Integration

- Google Cloud project: "AstrologyPro" 
- OAuth type: External web application
- Redirect URI: `https://astrologypro.com/api/calendar/callback`
- Diviners connect via OAuth from Settings page
- Token stored in `diviners.google_calendar_token` (JSONB)
- **⚠️ OAuth app is in "Testing" mode** — real diviners need to be added as test users OR the app needs to be published

---

## Marketing Content

The homepage has:
- Hero section (custom layered image from `/public/HomeAbove/`)
- Feature grid
- Revenue calculator (interactive)
- Diviner testimonials
- Pricing card

SEO: 135+ content pages for astrology/tarot topics (zodiac signs, houses, planets, aspects, glossary, guides).

---

## Cron Jobs

All at `POST /api/cron/[name]`, protected by `Authorization: Bearer {CRON_SECRET}`:

| Route | Schedule | Purpose |
|-------|----------|---------|
| `/api/cron/share` | Weekly | Generate share batches for all diviners |
| `/api/cron/follow-ups` | Daily | Send post-session follow-up emails |
| `/api/cron/mundane` | Daily | Detect astrology events + generate images |

Configured in `vercel.json` cron section.

---

## Angular Back-Office Integration

There is a separate Angular application at `backofficeportal.divineinfinitebeing.com`. It connects to AstrologyPro via:
- JWT (RS256) passed from AstrologyPro to Angular for session authorization
- The Angular app handles: astrological chart calculations, tarot card software, advanced tools

This is a **read-only integration** — AstrologyPro sends a token, Angular uses it to identify the session. No data flows back from Angular to AstrologyPro's DB.

---

## Deployment

**All deploys go through Vercel.**

1. Push to `master` branch → Vercel auto-deploys
2. Production URL: `https://astrologypro.com`
- Vercel project: `prj_VWvXg9C4qKNmcDAyVZi4RfLeZz4j`
- Team: `team_5HTrZX6cOPZ2FK88t8QQ0Hsh`

**Database migrations**: Run via Supabase MCP (`apply_migration` tool) or paste into Supabase dashboard SQL editor at https://supabase.com/dashboard/project/wyluvclvtvwptsvvtgkv/sql

---

## Key Relationships to Understand

```
auth.users
  └── diviners (1:1)
        ├── services (1:many)
        ├── availability_slots (1:many)
        ├── bookings (1:many) ←→ clients
        ├── affiliates (1:many)
        ├── testimonials (1:many) ←→ clients
        ├── share_batches (1:many)
        └── mundane_event_log (global, not per-diviner)

auth.users
  └── clients (1:1)
        ├── client_diviners (many-to-many with diviners)
        └── bookings (1:many) ←→ diviners
```

---

## Where the Previous Developer Left Off

**Session ended 2026-04-02. Platform is feature-complete.** Status at handoff:
- All phone system code committed and pushed ✅
- DB migration for phone columns applied to production ✅
- All API keys added to Vercel and `.env.local` ✅
- Google Calendar OAuth credentials created ✅
- All think tank audit items (T1–T9, M1–M8, A4, A6, A8) implemented ✅
- Gift certificate dashboard built ✅
- Discount rules UI built ✅
- Follow-up automation dashboard built ✅
- Intake form builder built ✅
- Recording playback page built ✅
- Pricing page (`/pricing`) built ✅
- Blog landing page (`/blog`) built ✅
- Testimonial review bug (T8) fixed ✅
- Email capture on landing page added ✅
- Aggregate social proof stats in hero added ✅
- Revenue calculator moved above fold ✅
- 30-day guarantee badge added to hero ✅
- Sticky "Book Now" CTA on diviner profile added ✅
- "What to Expect" section per service card added ✅
- Credentials/verified field on profiles added ✅
- Self-serve rescheduling in client portal added ✅
- Welcome email for new diviners added ✅
- `/instructions` comprehensive feature guide page built ✅

**Next immediate action**: See `docs/TODO.md` — Stripe live keys is the single remaining blocker for real money movement.

---

## Getting Help

- **Full session history**: `docs/DEV-STATUS.md` 
- **Deep technical reference**: `docs/DEVELOPER-GUIDE.md`
- **All API keys**: `docs/KEYS.md`
- **What's left**: `docs/TODO.md`
- **Design specs**: `docs/superpowers/specs/`
- **Build plan**: `docs/superpowers/plans/`
- **Back-office test creds**: Test@1234
- **Supabase dashboard**: https://supabase.com/dashboard/project/wyluvclvtvwptsvvtgkv
- **Vercel dashboard**: https://vercel.com/betosgatess-projects/app
