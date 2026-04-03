# AstrologyPro Developer Guide

Complete developer handbook for the AstrologyPro platform. This document covers everything you need to understand, set up, run, extend, and deploy the application.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Getting Started](#getting-started)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Authentication](#authentication)
6. [Payment System](#payment-system)
7. [Billing Model (20/80 Split)](#billing-model-2080-split)
8. [Refund System](#refund-system)
9. [Phone System](#phone-system)
10. [Video Sessions](#video-sessions)
11. [Booking System](#booking-system)
12. [Pricing Controls](#pricing-controls)
13. [Gift Certificates](#gift-certificates)
14. [Client Loyalty Discounts](#client-loyalty-discounts)
15. [Marketing Features](#marketing-features)
16. [Push-to-Share System](#push-to-share-system)
17. [Post-Session Follow-Up Emails](#post-session-follow-up-emails)
18. [Premium Visual Design](#premium-visual-design)
19. [Cron Jobs](#cron-jobs)
20. [Session Bridge (Angular Back-Office Integration)](#session-bridge-angular-back-office-integration)
21. [Deployment](#deployment)
22. [Third-Party Services](#third-party-services)
23. [Testing](#testing)
24. [Common Tasks](#common-tasks)

---

## Project Overview

### What is AstrologyPro?

AstrologyPro is a SaaS platform for professional astrologers and tarot readers ("diviners"). It gives each diviner a branded online presence with a public landing page, booking system, video session room, phone reading line, payment processing, client management, and marketing tools. Think of it as "Calendly + Stripe + Zoom + a phone hotline" built specifically for the divination profession.

**Target users:**
- **Diviners** (practitioners): Astrologers and tarot readers who sign up, pay a platform subscription, and use AstrologyPro to run their practice online.
- **Clients** (seekers): People who visit a diviner's public page, book sessions, attend video readings, call in for phone readings, and receive recordings.

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.1 |
| Language | TypeScript | 5.x |
| React | React | 19.2.4 |
| Database + Auth | Supabase (PostgreSQL + GoTrue) | Client 2.101.x |
| Payments | Stripe (Billing + Connect Express + SetupIntents) | SDK 21.x |
| Video | Daily.co | SDK 0.89.x |
| Phone / Voice | Twilio Programmable Voice + SMS | REST API |
| Email | Resend | REST API |
| Calendar | Google Calendar API v3 | REST API |
| UI Components | shadcn/ui + Radix UI | Latest |
| Styling | Tailwind CSS | 4.x |
| Hosting | Vercel (Pro plan) | - |
| Forms | react-hook-form + zod | 7.x / 4.x |
| Icons | lucide-react | 1.7.x |
| Toasts | sonner | 2.x |

### Architecture Diagram

```
                         +---------------------------+
                         |      astrologypro.com     |
                         |     (Vercel, Next.js)     |
                         +---------------------------+
                        /       |        |       \
                       /        |        |        \
            +---------+   +----------+  +---------+  +-----------+
            | Supabase|   |  Stripe  |  | Daily.co|  |  Twilio   |
            | (DB +   |   | (Billing |  | (Video  |  | (Voice +  |
            |  Auth)  |   | +Connect)|  | +Record |  |  SMS)     |
            +---------+   +----------+  | +SIP)   |  +-----------+
                                        +---------+       |
                                             |       +---------+
                                       SIP Bridge    | Resend  |
                                       (Phone->Room) | (Email) |
                                                     +---------+
                                                          |
                                                     +---------+
                                                     | Google  |
                                                     | Calendar|
                                                     +---------+

    SESSION BRIDGE (JWT)
    ====================

    +---------------------------+        JWT (RS256)       +----------------------------+
    |   AstrologyPro.com        | -----------------------> | backofficeportal           |
    |   (Next.js on Vercel)     |                          | .divineinfinitebeing.com   |
    |                           |  <-- Screen sharing --   | (Angular on AWS)           |
    |   - Client booking        |      via Daily.co        |                            |
    |   - Video session room    |                          | - Chart calculations       |
    |   - Phone readings        |                          | - Tarot card software      |
    |   - Payment processing    |                          | - Western horoscope v2     |
    |   - Client management     |                          |                            |
    +---------------------------+                          +----------------------------+

    BILLING FLOW (20/80 Split)
    ==========================

    Client pays $100 for a session
        |
        v
    Stripe destination charge:
        - $100 total amount
        - $20 application fee (20%) -> AstrologyPro
        - $80 net -> Diviner's Connect Express account
```

### The Two-System Relationship

AstrologyPro is the **client-facing platform** -- it handles everything the diviner and client interact with: the marketing site, signup, subscription billing, booking, video sessions, phone readings, payments, recording delivery, and marketing automation.

The **Angular back-office** at `backofficeportal.divineinfinitebeing.com` is a separate, pre-existing application that contains the actual astrology chart calculation engine and tarot card software. Diviners use it to compute natal charts, overlay transits, draw cards, etc.

During a live video session, AstrologyPro generates a signed JWT containing the client's birth data and questionnaire responses. This JWT is sent to the Angular back-office, which verifies it and pre-populates the diviner's tools. The diviner then screen-shares the Angular back-office through the Daily.co video room so the client can see the charts/cards.

Full integration spec: `docs/session-bridge-integration.md`

---

## Getting Started

### Prerequisites

- **Node.js 24+** (LTS recommended)
- **npm** (ships with Node.js)
- **Git**
- **Vercel CLI**: `npm install -g vercel`
- **Supabase CLI**: `npm install -g supabase`

### Clone and Install

```bash
git clone https://github.com/betosgate/astrologypro.git
cd astrologypro/app
npm install
```

### Environment Setup

Copy the example environment file and fill in the values:

```bash
cp .env.local.example .env.local
```

Every environment variable and its purpose:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (`https://wyluvclvtvwptsvvtgkv.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only, bypasses RLS) |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (starts with `sk_test_` or `sk_live_`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key (starts with `pk_test_` or `pk_live_`) |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret (starts with `whsec_`) |
| `STRIPE_PRICE_TAROT_SETUP` | Yes | Stripe Price ID for Tarot plan $197 setup |
| `STRIPE_PRICE_TAROT_MONTHLY` | Yes | Stripe Price ID for Tarot plan $97/mo |
| `STRIPE_PRICE_ASTROLOGY_SETUP` | Yes | Stripe Price ID for Astrology plan $197 setup |
| `STRIPE_PRICE_ASTROLOGY_MONTHLY` | Yes | Stripe Price ID for Astrology plan $97/mo |
| `STRIPE_PRICE_BOTH_SETUP` | Yes | Stripe Price ID for Oracle (both) plan $297 setup |
| `STRIPE_PRICE_BOTH_MONTHLY` | Yes | Stripe Price ID for Oracle (both) plan $147/mo |
| `NEXT_PUBLIC_APP_URL` | Yes | Full URL of the running app (`http://localhost:3000` dev / `https://astrologypro.com` prod) |
| `DAILY_API_KEY` | Yes | Daily.co API key for video room creation |
| `DAILY_WEBHOOK_SECRET` | Yes | Secret for verifying Daily.co webhook signatures |
| `RESEND_API_KEY` | Yes | Resend API key for transactional email (starts with `re_`) |
| `TWILIO_ACCOUNT_SID` | Yes | Twilio Account SID (for SMS and Voice) |
| `TWILIO_AUTH_TOKEN` | Yes | Twilio Auth Token (used for REST API auth and webhook signature verification) |
| `TWILIO_PHONE_NUMBER` | Yes | Twilio platform sending phone number for SMS (e.g., `+18001234567`) |
| `GOOGLE_CLIENT_ID` | Yes | Google Cloud OAuth2 client ID for Calendar integration |
| `GOOGLE_CLIENT_SECRET` | Yes | Google Cloud OAuth2 client secret |
| `GOOGLE_REDIRECT_URI` | Yes | OAuth2 redirect URI (`https://astrologypro.com/api/calendar/callback`) |
| `CRON_SECRET` | Yes (prod) | Secret token for authenticating Vercel Cron requests |
| `SESSION_BRIDGE_PRIVATE_KEY` | Yes | RSA private key (PEM) for signing session bridge JWTs |

**Twilio Voice-specific notes:** The `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are used both for SMS sending and for the Programmable Voice API (provisioning phone numbers, authenticating webhooks). Each diviner gets their own provisioned Twilio phone number stored in the `diviners` table -- there is no single voice number env var. The platform-level `TWILIO_PHONE_NUMBER` is used only for outbound SMS notifications.

**Important:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never put secrets in `NEXT_PUBLIC_` variables. The `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY` must remain server-only.

### Database Setup

Link to the existing Supabase project and push migrations:

```bash
cd app
npx supabase link --project-ref wyluvclvtvwptsvvtgkv
npx supabase db push
```

This applies all migration files in `supabase/migrations/` in order:

1. `20260331000001_initial_schema.sql` -- Core tables (diviners, services, clients, bookings, etc.)
2. `20260331000002_rls_policies.sql` -- Row Level Security policies
3. `20260331000003_seed_services.sql` -- 19 default service templates
4. `20260331000004_share_content.sql` -- Marketing content + share batches tables
5. `20260331000005_seed_marketing_content.sql` -- Default marketing content templates
6. `20260331000006_follow_ups.sql` -- Post-session follow-up email sequences table
7. `20260331000007_gift_certificates.sql` -- Gift certificate table
8. `20260331000008_loyalty_discounts.sql` -- Loyalty discount rules table
9. `20260401000001_phone_billing.sql` -- Phone sessions, card-on-file, pricing controls, refund tracking, 20/80 split

### Seed Data

Populate the database with demo accounts and sample data:

```bash
npm run seed
```

This creates:
- 2 diviner accounts with full profiles, services, and availability
- 3 client accounts with birth data
- 8 bookings (4 completed, 2 confirmed, 2 pending)
- 6 testimonials
- 2 affiliate records

See the [Testing](#testing) section for account credentials.

### Run Development Server

```bash
npm run dev
```

Opens at `http://localhost:3000`.

### Deploy to Production

```bash
vercel --prod
```

The project is already linked to Vercel. Environment variables must be set in the Vercel dashboard (Settings > Environment Variables) for production.

---

## Project Structure

```
app/
├── scripts/
│   ├── seed.ts                        # Database seeding script
│   └── seed-run.sh                    # Shell wrapper for seed
├── src/
│   ├── app/                           # Next.js App Router pages and API routes
│   │   ├── layout.tsx                 # Root layout (cosmic dark theme, fonts, Toaster)
│   │   ├── page.tsx                   # Marketing homepage
│   │   ├── globals.css                # Tailwind + custom CSS (cosmic palette, noise texture)
│   │   ├── login/page.tsx             # Login (diviner email/password + client magic link)
│   │   ├── get-started/page.tsx       # Diviner signup -> Stripe Checkout
│   │   ├── onboarding/page.tsx        # 5-step onboarding wizard
│   │   ├── features/page.tsx          # Features marketing page
│   │   ├── pricing/page.tsx           # Pricing marketing page
│   │   ├── instructions/page.tsx      # How-it-works page
│   │   ├── demo/page.tsx              # Interactive demo page
│   │   ├── refund-policy/page.tsx     # Public refund policy page
│   │   │
│   │   ├── dashboard/                 # --- DIVINER DASHBOARD ---
│   │   │   ├── layout.tsx             # Dashboard shell (sidebar + topbar)
│   │   │   ├── page.tsx               # Dashboard home (stats, upcoming bookings)
│   │   │   ├── bookings/page.tsx      # Booking management (status filters, detail sheet, refund button)
│   │   │   ├── clients/page.tsx       # Client CRM (search, detail sheet)
│   │   │   ├── services/page.tsx      # Service management (toggle, edit, pricing controls)
│   │   │   ├── profile/page.tsx       # Profile editing (avatar, bio, specialties)
│   │   │   ├── settings/page.tsx      # Stripe, calendar, phone, notification settings
│   │   │   ├── affiliates/page.tsx    # Affiliate list + create
│   │   │   ├── affiliates/[affiliateId]/page.tsx  # Affiliate detail + referrals
│   │   │   ├── testimonials/page.tsx  # Testimonial management (approve/reject)
│   │   │   ├── live/page.tsx          # YouTube/Facebook live embed settings
│   │   │   ├── marketing/page.tsx     # Marketing hub (share content, tracking links)
│   │   │   └── marketing/content/page.tsx  # Content library
│   │   │
│   │   ├── portal/                    # --- CLIENT PORTAL ---
│   │   │   ├── layout.tsx             # Portal shell
│   │   │   ├── page.tsx               # Client dashboard
│   │   │   ├── bookings/page.tsx      # Client's bookings list
│   │   │   └── profile/page.tsx       # Client profile edit (includes card-on-file setup)
│   │   │
│   │   ├── [username]/                # --- PUBLIC DIVINER PAGES ---
│   │   │   ├── page.tsx               # Public landing page (hero, services, testimonials)
│   │   │   ├── book/[serviceSlug]/page.tsx  # 3-step booking wizard
│   │   │   ├── gift/page.tsx          # Gift certificate purchase page
│   │   │   └── session/[bookingId]/page.tsx  # Video session room
│   │   │
│   │   ├── affiliate/[code]/page.tsx  # Affiliate landing page
│   │   ├── gift/[code]/page.tsx       # Gift certificate redemption
│   │   ├── share/[token]/page.tsx     # Share content hub (sequential sharing wizard)
│   │   ├── session/[shareId]/recording/page.tsx  # Shared recording playback
│   │   ├── r/[code]/route.ts          # Tracking link redirect
│   │   │
│   │   ├── auth/                      # --- AUTH ---
│   │   │   ├── callback/route.ts      # Supabase auth code exchange
│   │   │   └── confirm/route.ts       # Email OTP verification
│   │   │
│   │   └── api/                       # --- API ROUTES (28 endpoints) ---
│   │       ├── stripe/
│   │       │   ├── checkout/route.ts       # Create Stripe Checkout session (subscription)
│   │       │   ├── webhooks/route.ts       # Handle Stripe webhook events
│   │       │   ├── connect/route.ts        # Stripe Connect Express onboarding
│   │       │   ├── booking-payment/route.ts # Client booking payment (destination charge)
│   │       │   ├── setup-intent/route.ts   # Create SetupIntent for card-on-file
│   │       │   └── refund/route.ts         # Issue refund for a booking
│   │       ├── twilio/
│   │       │   ├── provision-number/route.ts    # Provision a Twilio phone number for a diviner
│   │       │   └── voice/
│   │       │       ├── incoming/route.ts   # TwiML webhook for incoming phone calls
│   │       │       └── status/route.ts     # Post-call billing callback
│   │       ├── availability/[divinerId]/route.ts  # Available time slots for a date
│   │       ├── daily/
│   │       │   ├── create-room/route.ts    # Create Daily.co video room
│   │       │   ├── end-session/route.ts    # End session + calculate overage + enqueue follow-ups
│   │       │   └── webhook/route.ts        # Daily.co recording webhook
│   │       ├── calendar/
│   │       │   ├── connect/route.ts        # Initiate Google Calendar OAuth
│   │       │   └── callback/route.ts       # Google Calendar OAuth callback
│   │       ├── gift/purchase/route.ts      # Gift certificate purchase
│   │       ├── share/track/route.ts        # Track share link clicks
│   │       ├── social/post/route.ts        # Social media posting
│   │       ├── generate-bio/route.ts       # AI-assisted bio generation
│   │       └── cron/
│   │           ├── event-reminders/route.ts     # Astrological event reminders
│   │           ├── follow-up-emails/route.ts    # Post-session follow-up sequence
│   │           ├── weekly-content/route.ts      # Push-to-Share content distribution
│   │           └── weekly-digest/route.ts       # Diviner practice digest email
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui primitives (button, card, dialog, etc.)
│   │   ├── booking/                   # Booking flow components
│   │   │   ├── booking-wizard.tsx     # 3-step booking wizard
│   │   │   ├── calendar-picker.tsx    # Date/time picker with availability
│   │   │   └── intake-form.tsx        # Pre-session questionnaire
│   │   ├── dashboard/                 # Diviner dashboard components
│   │   │   ├── sidebar.tsx            # Navigation sidebar
│   │   │   ├── mobile-nav.tsx         # Mobile navigation
│   │   │   ├── booking-detail-sheet.tsx    # Booking detail slide-over (with refund action)
│   │   │   ├── bookings-filter.tsx    # Booking status filter tabs
│   │   │   ├── client-detail-sheet.tsx     # Client detail slide-over
│   │   │   ├── clients-search.tsx     # Client search bar
│   │   │   ├── service-edit-sheet.tsx # Service editing slide-over (with price range validation)
│   │   │   ├── service-toggles.tsx    # Service enable/disable toggles
│   │   │   ├── session-prep.tsx       # Pre-session preparation checklist
│   │   │   ├── profile-strength.tsx   # Profile completeness meter
│   │   │   ├── revenue-chart.tsx      # Revenue visualization
│   │   │   ├── roi-banner.tsx         # ROI calculation banner
│   │   │   └── testimonial-actions.tsx # Approve/reject testimonials
│   │   ├── landing/                   # Public diviner landing page components
│   │   │   ├── diviner-hero.tsx       # Hero section with avatar + tagline
│   │   │   ├── service-card.tsx       # Service card with pricing
│   │   │   └── testimonial-section.tsx # Testimonial carousel
│   │   ├── marketing/                 # Marketing site components
│   │   │   ├── header.tsx             # Site header + nav
│   │   │   ├── footer.tsx             # Site footer
│   │   │   ├── hero.tsx               # Homepage hero
│   │   │   ├── feature-grid.tsx       # Features grid
│   │   │   ├── pricing-card.tsx       # Pricing card
│   │   │   ├── comparison-table.tsx   # Competitor comparison
│   │   │   ├── revenue-calculator.tsx # ROI calculator
│   │   │   ├── faq-section.tsx        # FAQ accordion
│   │   │   ├── social-proof-banner.tsx # Social proof numbers
│   │   │   ├── diviner-testimonials.tsx # Diviner testimonials
│   │   │   └── astro-decorations.tsx  # Decorative astrology elements (SVG illustrations)
│   │   ├── portal/                    # Client portal components
│   │   │   ├── cancel-booking-button.tsx   # Booking cancellation
│   │   │   ├── logout-button.tsx      # Client logout
│   │   │   ├── testimonial-dialog.tsx # Review dialog
│   │   │   └── testimonial-form.tsx   # Review form
│   │   ├── session/                   # Video session components
│   │   │   ├── session-room.tsx       # Full session room (consent, video, timer, chat, notes)
│   │   │   └── recording-share.tsx    # Recording share/playback
│   │   └── share/
│   │       └── share-hub.tsx          # Sequential sharing wizard with confetti
│   │
│   └── lib/                           # Shared utilities and service clients
│       ├── supabase/
│       │   ├── server.ts              # Server-side Supabase client (uses cookies for auth)
│       │   ├── client.ts              # Browser-side Supabase client
│       │   └── admin.ts              # Service role client (bypasses RLS, for webhooks/crons)
│       ├── stripe/
│       │   ├── client.ts              # Stripe SDK instance
│       │   ├── billing.ts             # Platform subscription (checkout, retrieve, cancel)
│       │   └── connect.ts             # Marketplace payments (Connect account, payment intents)
│       ├── twilio-voice.ts            # Twilio phone number provisioning + release
│       ├── availability.ts            # Slot calculation (weekly slots + overrides + booked)
│       ├── constants.ts               # App name, pricing (20/80 split, phone rates), nav items
│       ├── format.ts                  # Currency, date, time formatters + ID generators
│       ├── email.ts                   # Resend email sender + all email templates
│       ├── sms.ts                     # Twilio SMS sender
│       ├── google-calendar.ts         # Google Calendar OAuth + FreeBusy + event creation
│       └── utils.ts                   # Tailwind `cn()` helper
│
├── supabase/
│   └── migrations/                    # Database migration SQL files (9 files)
│
├── vercel.json                        # Cron job schedules (4 crons)
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config.ts
```

### Complete Route Map (59 routes)

**Pages (31 routes):**

| Route | Type | Description |
|-------|------|-------------|
| `/` | Page | Marketing homepage |
| `/login` | Page | Login (diviner password + client magic link) |
| `/get-started` | Page | Diviner signup + Stripe Checkout |
| `/onboarding` | Page | 5-step onboarding wizard |
| `/features` | Page | Features marketing page |
| `/pricing` | Page | Pricing marketing page |
| `/instructions` | Page | How-it-works page |
| `/demo` | Page | Interactive demo page |
| `/refund-policy` | Page | Public refund policy |
| `/dashboard` | Page | Diviner dashboard home |
| `/dashboard/bookings` | Page | Booking management |
| `/dashboard/clients` | Page | Client CRM |
| `/dashboard/services` | Page | Service management |
| `/dashboard/profile` | Page | Profile editing |
| `/dashboard/settings` | Page | Settings (Stripe, calendar, phone, notifications) |
| `/dashboard/affiliates` | Page | Affiliate list + create |
| `/dashboard/affiliates/[affiliateId]` | Page | Affiliate detail |
| `/dashboard/testimonials` | Page | Testimonial management |
| `/dashboard/live` | Page | Live stream settings |
| `/dashboard/marketing` | Page | Marketing hub |
| `/dashboard/marketing/content` | Page | Content library |
| `/portal` | Page | Client dashboard |
| `/portal/bookings` | Page | Client bookings list |
| `/portal/profile` | Page | Client profile + card-on-file |
| `/[username]` | Page | Public diviner landing page |
| `/[username]/book/[serviceSlug]` | Page | 3-step booking wizard |
| `/[username]/gift` | Page | Gift certificate purchase |
| `/[username]/session/[bookingId]` | Page | Video session room |
| `/affiliate/[code]` | Page | Affiliate landing page |
| `/gift/[code]` | Page | Gift certificate redemption |
| `/share/[token]` | Page | Push-to-Share hub |
| `/session/[shareId]/recording` | Page | Recording playback |

**API Routes (28 routes):**

| Route | Method | Description |
|-------|--------|-------------|
| `/r/[code]` | GET | Tracking link redirect |
| `/auth/callback` | GET | Supabase auth code exchange |
| `/auth/confirm` | GET | Email OTP verification |
| `/api/stripe/checkout` | POST | Create Stripe Checkout session (subscription) |
| `/api/stripe/webhooks` | POST | Handle Stripe webhook events |
| `/api/stripe/connect` | POST | Stripe Connect Express onboarding |
| `/api/stripe/booking-payment` | POST | Client booking payment (destination charge) |
| `/api/stripe/setup-intent` | POST | Create SetupIntent for card-on-file |
| `/api/stripe/refund` | POST | Issue refund for a booking |
| `/api/twilio/provision-number` | POST | Provision a Twilio phone number for a diviner |
| `/api/twilio/voice/incoming` | POST | TwiML webhook -- incoming call handler |
| `/api/twilio/voice/status` | POST | Post-call billing callback |
| `/api/availability/[divinerId]` | GET | Available time slots for a date |
| `/api/daily/create-room` | POST | Create Daily.co video room |
| `/api/daily/end-session` | POST | End session + calculate overage + enqueue follow-ups |
| `/api/daily/webhook` | POST | Daily.co recording webhook |
| `/api/calendar/connect` | GET | Initiate Google Calendar OAuth |
| `/api/calendar/callback` | GET | Google Calendar OAuth callback |
| `/api/gift/purchase` | POST | Gift certificate purchase |
| `/api/share/track` | POST | Track share link clicks |
| `/api/social/post` | POST | Social media posting |
| `/api/generate-bio` | POST | AI-assisted bio generation |
| `/api/cron/event-reminders` | GET | Astrological event reminders (daily 9 AM) |
| `/api/cron/follow-up-emails` | GET | Post-session follow-up sequence (every 2h) |
| `/api/cron/weekly-content` | GET | Push-to-Share content distribution (Mon 10 AM) |
| `/api/cron/weekly-digest` | GET | Diviner practice digest (Mon 2 PM) |

### Key Architectural Patterns

**Supabase client variants:**
- `createClient()` from `lib/supabase/server.ts` -- Used in Server Components and Route Handlers. Reads auth cookies to identify the logged-in user. Queries respect RLS policies.
- `createClient()` from `lib/supabase/client.ts` -- Used in Client Components (`"use client"`). Creates a browser-side client with the anon key.
- `createAdminClient()` from `lib/supabase/admin.ts` -- Uses the service role key, **bypasses all RLS**. Used only in webhooks, cron jobs, and admin operations that need unrestricted access.

**Route protection:** Dashboard routes check for an authenticated diviner by calling `supabase.auth.getUser()` and then querying the `diviners` table for a matching `user_id`. Portal routes do the same against the `clients` table.

---

## Database Schema

### Migrations (9 files)

| Migration | Description |
|-----------|-------------|
| `20260331000001_initial_schema.sql` | Core tables: diviners, services, clients, bookings, availability, affiliates, testimonials, intake_forms, tracking_links |
| `20260331000002_rls_policies.sql` | Row Level Security policies for all tables |
| `20260331000003_seed_services.sql` | 19 default service templates (11 astrology + 8 tarot) |
| `20260331000004_share_content.sql` | marketing_content + share_batches tables |
| `20260331000005_seed_marketing_content.sql` | Default marketing content templates |
| `20260331000006_follow_ups.sql` | follow_up_sequences table |
| `20260331000007_gift_certificates.sql` | gift_certificates table |
| `20260331000008_loyalty_discounts.sql` | discount_rules table |
| `20260401000001_phone_billing.sql` | phone_sessions, card-on-file columns, pricing controls, refund columns, 20% platform fee |

### Tables (20+)

#### `diviners` -- Practitioner profiles
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID (FK -> auth.users) | Supabase Auth user ID |
| `username` | VARCHAR(50) UNIQUE | URL-safe username (e.g., `mystic-maya`) |
| `display_name` | VARCHAR(100) | Public display name |
| `bio` | TEXT | Profile biography |
| `avatar_url` | TEXT | Profile image URL |
| `cover_image_url` | TEXT | Cover/banner image URL |
| `tagline` | VARCHAR(200) | Short tagline |
| `specialties` | TEXT[] | Array of specialty strings |
| `stripe_account_id` | VARCHAR(255) | Stripe Connect Express account ID |
| `stripe_subscription_id` | VARCHAR(255) | Platform subscription ID |
| `subscription_status` | VARCHAR(20) | `trialing`, `active`, `past_due`, `canceled` |
| `google_calendar_token` | JSONB | Stored Google Calendar refresh token |
| `youtube_channel_id` | VARCHAR(30) | YouTube channel for live embed |
| `facebook_live_url` | TEXT | Facebook Live URL |
| `timezone` | VARCHAR(50) | IANA timezone (default: `America/New_York`) |
| `platform_fee_percent` | DECIMAL(5,2) | Platform fee on bookings (default: 20%) |
| `phone` | VARCHAR(20) | Diviner's phone (for SMS notifications) |
| `twilio_phone_number` | VARCHAR(20) | Provisioned Twilio phone number for incoming calls |
| `twilio_phone_sid` | VARCHAR(50) | Twilio phone number SID (for release API) |
| `phone_dialin_enabled` | BOOLEAN | Whether this diviner accepts incoming phone calls |
| `share_notifications_enabled` | BOOLEAN | Opt-in for weekly share content |
| `onboarding_completed` | BOOLEAN | Whether onboarding wizard is done |
| `onboarding_step` | INTEGER | Current onboarding step (0-5) |
| `is_active` | BOOLEAN | Whether profile is publicly visible |
| `created_at` | TIMESTAMPTZ | Auto-generated |
| `updated_at` | TIMESTAMPTZ | Auto-updated via trigger |

#### `services` -- Services offered by each diviner
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `diviner_id` | UUID (FK -> diviners) | Owning diviner |
| `category` | VARCHAR(20) | `astrology`, `tarot`, or `phone` |
| `name` | VARCHAR(100) | Service display name |
| `slug` | VARCHAR(100) | URL slug (e.g., `natal-chart`) |
| `description` | TEXT | Service description |
| `duration_minutes` | INTEGER | 20, 30, or 60 |
| `base_price` | DECIMAL(10,2) | Price in dollars |
| `overage_rate` | DECIMAL(10,2) | Per-minute rate after scheduled time (default: $0.50) |
| `is_primary` | BOOLEAN | Whether this is a main service type |
| `is_featured` | BOOLEAN | Whether to feature on landing page |
| `requires_birth_data` | BOOLEAN | Whether client must provide birth info |
| `trigger_event` | VARCHAR(50) | Astrological event slug for auto-reminders |
| `is_active` | BOOLEAN | Whether service is bookable |
| `sort_order` | INTEGER | Display order |

#### `clients` -- People who book readings
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID (FK -> auth.users) | Supabase Auth user ID |
| `email` | VARCHAR(255) | Client email |
| `full_name` | VARCHAR(100) | Client name |
| `phone` | VARCHAR(20) | Client phone (used for caller ID lookup on incoming calls) |
| `birth_date` | DATE | Birth date |
| `birth_time` | TIME | Birth time (24h) |
| `birth_city` | VARCHAR(100) | Birth city |
| `birth_lat` | DECIMAL(10,7) | Birth latitude |
| `birth_lng` | DECIMAL(10,7) | Birth longitude |
| `birth_timezone` | VARCHAR(50) | Birth timezone (IANA) |
| `stripe_customer_id` | VARCHAR(255) | Stripe Customer ID (for card-on-file billing) |
| `default_payment_method_id` | VARCHAR(255) | Saved payment method for off-session charges |
| `card_consent_at` | TIMESTAMPTZ | When client consented to card-on-file charges |

#### `bookings` -- Session bookings
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `diviner_id` | UUID (FK) | Diviner |
| `client_id` | UUID (FK) | Client |
| `service_id` | UUID (FK) | Service being provided |
| `status` | VARCHAR(20) | `pending`, `confirmed`, `in_progress`, `completed`, `canceled`, `no_show` |
| `scheduled_at` | TIMESTAMPTZ | Scheduled start time |
| `duration_minutes` | INTEGER | Scheduled duration |
| `actual_duration_minutes` | INTEGER | Actual duration (set on completion) |
| `base_price` | DECIMAL(10,2) | Base session price |
| `overage_amount` | DECIMAL(10,2) | Overtime charge |
| `total_amount` | DECIMAL(10,2) | Final total (base + overage) |
| `stripe_payment_intent_id` | VARCHAR(255) | Stripe Payment Intent |
| `stripe_payment_status` | VARCHAR(20) | Payment status |
| `daily_room_name` | VARCHAR(255) | Daily.co room name |
| `daily_room_url` | TEXT | Daily.co room URL |
| `recording_url` | TEXT | Recording download URL |
| `recording_share_id` | VARCHAR(50) UNIQUE | Public share ID for recording |
| `questionnaire_responses` | JSONB | Client's pre-session answers |
| `session_notes` | TEXT | Diviner's private session notes |
| `affiliate_id` | UUID | Referring affiliate (if any) |
| `google_calendar_event_id` | VARCHAR(255) | Synced Google Calendar event |
| `canceled_at` | TIMESTAMPTZ | Cancellation timestamp |
| `cancellation_reason` | TEXT | Why it was canceled |
| `refund_amount` | DECIMAL(10,2) | Refund amount in dollars (NULL if not refunded) |
| `refunded_at` | TIMESTAMPTZ | When refund was issued |
| `refund_reason` | TEXT | Reason for refund |

#### `phone_sessions` -- Phone reading sessions
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `booking_id` | UUID (FK -> bookings) | Linked booking (for scheduled dial-in calls) |
| `diviner_id` | UUID (FK -> diviners) | Diviner receiving the call |
| `client_id` | UUID (FK -> clients) | Client making the call |
| `caller_phone` | VARCHAR(20) | The caller's phone number |
| `twilio_call_sid` | VARCHAR(50) | Twilio Call SID for tracking |
| `daily_room_name` | VARCHAR(255) | Daily.co room name (for SIP bridge) |
| `session_type` | VARCHAR(20) | `scheduled_dialin` or `standalone` |
| `started_at` | TIMESTAMPTZ | Call start time |
| `ended_at` | TIMESTAMPTZ | Call end time |
| `duration_seconds` | INTEGER | Call duration in seconds |
| `platform_cost` | DECIMAL(10,2) | Twilio costs ($0.04/min) |
| `amount_charged` | DECIMAL(10,2) | Amount billed to client |
| `stripe_payment_intent_id` | VARCHAR(255) | Stripe Payment Intent for the charge |
| `recording_url` | TEXT | Recording URL (if recorded) |
| `status` | VARCHAR(20) | `pending`, `active`, `completed`, `failed` |
| `created_at` | TIMESTAMPTZ | Auto-generated |

#### `client_diviners` -- Relationship tracking
| Column | Type | Description |
|--------|------|-------------|
| `client_id` | UUID (FK) | Client |
| `diviner_id` | UUID (FK) | Diviner |
| `first_session_at` | TIMESTAMPTZ | First session date |
| `total_sessions` | INTEGER | Lifetime session count |
| `total_spent` | DECIMAL(10,2) | Lifetime spend |
| `notes` | TEXT | Diviner's notes about this client |

#### `availability_slots` -- Weekly recurring availability
| Column | Type | Description |
|--------|------|-------------|
| `diviner_id` | UUID (FK) | Diviner |
| `day_of_week` | INTEGER | 0 (Sunday) through 6 (Saturday) |
| `start_time` | TIME | Start time (e.g., `09:00`) |
| `end_time` | TIME | End time (e.g., `17:00`) |
| `is_active` | BOOLEAN | Whether this slot is active |

#### `availability_overrides` -- Day-specific overrides
| Column | Type | Description |
|--------|------|-------------|
| `diviner_id` | UUID (FK) | Diviner |
| `date` | DATE | Specific date |
| `is_available` | BOOLEAN | `false` = day off, `true` = custom hours |
| `start_time` | TIME | Custom start (when `is_available = true`) |
| `end_time` | TIME | Custom end |

#### `affiliates` -- Referral partners
| Column | Type | Description |
|--------|------|-------------|
| `diviner_id` | UUID (FK) | Diviner who created the affiliate |
| `name` | VARCHAR(100) | Affiliate name |
| `email` | VARCHAR(255) | Affiliate email |
| `referral_code` | VARCHAR(20) UNIQUE | Referral code (e.g., `COSMIC15`) |
| `commission_percent` | DECIMAL(5,2) | Commission percentage |
| `total_referrals` | INTEGER | Lifetime referral count |
| `total_earned` | DECIMAL(10,2) | Lifetime earnings |
| `total_paid` | DECIMAL(10,2) | Amount paid out |

#### `affiliate_referrals` -- Individual referral records
Links affiliate -> client -> booking with commission amount and status (`pending`, `earned`, `paid`).

#### `testimonials` -- Client reviews
Rating 1-5, text, service type. Status is `pending`, `approved`, or `rejected`. Diviner approves/rejects from dashboard.

#### `intake_forms` -- Custom questionnaire templates
JSONB `questions` field stores custom questions per service.

#### `tracking_links` -- UTM tracking links
Code, destination URL, source, campaign, click count.

#### `service_templates` -- Default service catalog
20 pre-built service definitions (11 astrology + 8 tarot + 1 phone) that get copied to a diviner's `services` table during onboarding. Includes `min_price` and `max_price` columns for pricing controls.

| Column | Type | Description |
|--------|------|-------------|
| `min_price` | DECIMAL(10,2) | Minimum price (100% of base -- the floor) |
| `max_price` | DECIMAL(10,2) | Maximum price (200% of base -- the ceiling) |

#### `marketing_content` -- Share content templates
Caption templates with placeholder variables (`{username}`, `{link}`), category, platform tags, image URLs.

#### `share_batches` -- Weekly content packages sent to diviners
Links a diviner to a marketing_content template with a unique token, personalized caption, and tracking URL.

#### `follow_up_sequences` -- Post-session email automation
Three steps per booking: (1) recording ready, (2) reflection check-in at 3 days, (3) rebooking nudge at 30 days.

#### `gift_certificates` -- Gift certificates
Purchaser info, recipient info, amount, remaining balance, code, Stripe payment, 1-year expiry.

#### `discount_rules` -- Loyalty discount rules
Type is `session_count` (discount after N sessions) or `package`. Per-diviner, with activation toggle.

### RLS Policies

Every table has Row Level Security enabled. The general pattern:

- **Diviners** can manage their own records and see other active diviners' public info
- **Clients** can read their own records and insert bookings/testimonials
- **Phone sessions** are visible to the owning diviner (all ops) and the client (read-only)
- **Public read** is allowed on: active services, approved testimonials, service templates, availability slots, tracking links, share batches
- **Admin operations** (webhooks, crons, Twilio callbacks) use the service role client which bypasses RLS entirely

### How to Add New Migrations

```bash
# Create a new migration file
npx supabase migration new my_migration_name

# This creates supabase/migrations/YYYYMMDDHHMMSS_my_migration_name.sql
# Write your SQL, then push:
npx supabase db push
```

---

## Authentication

### Diviner Authentication

Diviners sign up with email and password through the `/get-started` page, which also creates a Stripe Checkout session for the platform subscription. After payment, the Stripe webhook creates their `diviners` row and they proceed to the `/onboarding` wizard.

Login is standard email/password via Supabase Auth at `/login`.

### Client Authentication

Clients authenticate via **magic link** (passwordless email). When a client books a session, they enter their email. Supabase sends a one-time login link. Clicking it exchanges an auth code at `/auth/callback`, creating their session.

### Auth Flow

```
User enters credentials at /login
    |
    v
Supabase Auth verifies (email/password or magic link)
    |
    v
/auth/callback exchanges code for session cookies
    |
    v
Middleware/route handler reads cookies via createClient()
    |
    v
supabase.auth.getUser() returns the authenticated user
    |
    v
Query diviners or clients table to determine role
    |
    v
Redirect to /dashboard (diviner) or /portal (client)
```

### Route Protection

Dashboard routes (`/dashboard/*`) check for an authenticated user with a matching `diviners` row. If not found, the user is redirected to `/login`.

Portal routes (`/portal/*`) check for a matching `clients` row.

API routes verify auth via `supabase.auth.getUser()` and cross-reference the appropriate table. Cron routes verify the `CRON_SECRET` bearer token instead. Twilio webhook routes (voice/incoming, voice/status) use the admin client since they are called by Twilio, not by authenticated users.

---

## Payment System

AstrologyPro uses Stripe in three distinct ways:

### 1. Platform Subscriptions (Stripe Billing)

Diviners pay AstrologyPro to use the platform. Three tiers are available:

| Plan | Name | Setup | Monthly | Services |
|------|------|-------|---------|----------|
| `tarot` | The Tarot Reader | $197 | $97/mo | 8 tarot spreads + freelance |
| `astrology` | The Astrologer | $197 | $97/mo | 11 astrology readings + freelance |
| `both` | The Oracle | $297 | $147/mo | All 19 + phone readings |

Plan definitions live in `src/lib/plans.ts` — this is the single source of truth for plan names, prices, Stripe env key mappings, feature lists, and display order.

Implementation in `src/lib/stripe/billing.ts`:
- `createCheckoutSession({ planId })` looks up the correct Stripe price IDs from env vars based on the plan, then creates a Checkout session with both setup + monthly prices
- The checkout API at `/api/stripe/checkout` accepts `{ email, userId, planId }` and validates the plan before creating the session
- The Stripe webhook at `/api/stripe/webhooks` listens for `checkout.session.completed` to activate the diviner account (metadata includes `planId`)
- `getSubscription()` and `cancelSubscription()` manage the subscription lifecycle

Each plan requires two Stripe Price IDs as env vars (e.g., `STRIPE_PRICE_TAROT_SETUP` and `STRIPE_PRICE_TAROT_MONTHLY`). Six total.

### 2. Marketplace Payments (Stripe Connect Express)

Client payments for bookings flow through the diviner's Stripe Connect Express account:

```
Client pays $100 for a session
    |
    v
Stripe creates a destination charge:
    - $100 total amount
    - $20 application fee (20% platform fee) -> AstrologyPro's Stripe account
    - $80 net -> Diviner's Connect Express account
```

Implementation in `src/lib/stripe/connect.ts`:
- `createConnectAccount()` creates a new Express account for a diviner
- `createConnectOnboardingLink()` generates the Stripe-hosted onboarding link
- `createPaymentIntent()` creates a destination charge with the platform fee calculated
- `getConnectAccountStatus()` checks if the account can accept payments

### 3. Card-on-File (Stripe SetupIntents)

For phone readings, clients must have a saved payment method so they can be charged after the call ends (off-session). Implementation at `/api/stripe/setup-intent`:

1. Creates a Stripe Customer if one does not exist
2. Creates a SetupIntent attached to that customer
3. Returns the `clientSecret` for the frontend to collect card details
4. On confirmation, the `default_payment_method_id` and `card_consent_at` timestamp are stored on the `clients` row

### Overage Billing

Sessions can run overtime. The overage rate is $0.50/minute by default (configurable per service). When the diviner ends the session via `/api/daily/end-session`:

1. Calculate `overageMinutes = actualDuration - scheduledDuration`
2. Calculate `overageAmount = overageMinutes * overageRate`
3. Update the booking's `total_amount`

---

## Billing Model (20/80 Split)

The platform operates on a **post-session billing** model with a **20/80 revenue split**:

### How It Works

- **Platform takes 20%** of every client payment as an application fee
- **Diviner receives 80%** directly into their Stripe Connect Express account
- The `platform_fee_percent` column on `diviners` is set to `20.00` (updated via migration `20260401000001`)

### Post-Session Billing

AstrologyPro charges clients **after** service delivery, not via pre-authorization:

1. **Video sessions**: Client pays upfront at booking time via destination charge. Overage is calculated on session end.
2. **Phone readings**: Client is charged **after the call ends** using their saved card (off-session payment). The `/api/twilio/voice/status` callback calculates the duration and creates a PaymentIntent with `off_session: true` and `confirm: true`.
3. **Standalone phone calls**: $25 base for 20 minutes + $0.50/min overage, charged post-call.
4. **Scheduled dial-in calls**: No extra charge -- included in the video session booking price.

### Card-on-File Consent

For off-session charges to work, clients must:
1. Save a card via the SetupIntent flow at `/api/stripe/setup-intent`
2. The `card_consent_at` timestamp is recorded on their `clients` row
3. The incoming call handler checks for `stripe_customer_id`, `default_payment_method_id`, and `card_consent_at` before allowing standalone phone readings

### Pricing Constants

Plan pricing is defined in `src/lib/plans.ts` (see Platform Subscriptions above). Other pricing constants in `src/lib/constants.ts`:

```typescript
export const PRICING = {
  overagePerMinute: 0.5,            // Video session overage rate
  platformFeePercent: 20,           // 20% platform take
  PHONE_READING_BASE_PRICE: 25,    // $25 base for phone reading
  PHONE_READING_BASE_MINUTES: 20,  // 20 minutes included in base
  PHONE_READING_OVERAGE_RATE: 0.50, // $0.50/min after 20 min
  PHONE_COST_PER_MINUTE: 0.04,     // Platform Twilio cost per minute
};
```

---

## Refund System

Diviners can issue refunds for completed bookings directly from the dashboard.

### Flow

1. Diviner opens booking detail sheet in `/dashboard/bookings`
2. Clicks "Issue Refund" button with optional reason text
3. Frontend calls `POST /api/stripe/refund` with `{ bookingId, reason }`

### `/api/stripe/refund` Endpoint

The endpoint performs these steps:

1. **Auth check**: Verifies the caller is an authenticated diviner
2. **Ownership check**: Confirms the booking belongs to this diviner
3. **Duplicate check**: Rejects if `refunded_at` is already set
4. **Payment check**: Verifies `stripe_payment_intent_id` exists on the booking
5. **Stripe refund**: Calls `stripe.refunds.create()` with the payment intent, full amount, and metadata
6. **Record update**: Sets `refund_amount`, `refunded_at`, and `refund_reason` on the booking
7. **Notification**: Sends refund confirmation email to the client via `sendRefundProcessed()`

### Key Details

- Refunds are **full refunds** (the entire booking amount)
- The Stripe `reason` is set to `requested_by_customer`
- Metadata includes `booking_id`, `diviner_id`, and `refund_reason`
- Public refund policy page is at `/refund-policy`

---

## Phone System

The phone system gives each diviner a dedicated phone number that clients can call for readings.

### Architecture

```
Client dials diviner's Twilio number
    |
    v
Twilio sends POST to /api/twilio/voice/incoming (TwiML webhook)
    |
    v
App looks up diviner by To number, client by From number
    |
    +--- Scheduled booking exists? ---> SIP bridge to Daily.co room
    |                                    (session_type: scheduled_dialin)
    |
    +--- Client has card on file? ----> Standalone phone reading
    |                                    (session_type: standalone)
    |
    +--- Unknown caller? ------------> "Please book at astrologypro.com"
    |
    v
Call ends -> Twilio sends POST to /api/twilio/voice/status
    |
    v
Calculate duration & charges -> Stripe off-session charge -> Receipt email
```

### Phone Number Provisioning

Each diviner gets **one persistent Twilio phone number**. Implementation in `src/lib/twilio-voice.ts`:

1. **`POST /api/twilio/provision-number`** -- Authenticated diviner endpoint
   - Searches for an available US local number via Twilio API
   - Purchases the number and configures webhooks:
     - `VoiceUrl` -> `{APP_URL}/api/twilio/voice/incoming`
     - `StatusCallback` -> `{APP_URL}/api/twilio/voice/status`
   - Stores `twilio_phone_number`, `twilio_phone_sid`, and sets `phone_dialin_enabled = true` on the diviner record

2. **`releasePhoneNumber(divinerId)`** -- Called when diviner cancels or disables phone
   - DELETEs the number via Twilio REST API
   - Clears the phone columns on the diviner record

### Incoming Call Handling (`/api/twilio/voice/incoming`)

This is a TwiML webhook that returns XML instructions to Twilio. It handles three scenarios:

**Scenario 1: Scheduled session dial-in**
- Client has a confirmed or in-progress booking with this diviner within a +/- 15-30 min window
- The booking already has a `daily_room_name` (video room is active)
- Returns TwiML `<Dial><Sip>sip:{room}@sip.daily.co</Sip></Dial>` to bridge the phone call into the Daily.co video room
- Creates a `phone_sessions` record with `session_type = 'scheduled_dialin'`

**Scenario 2: Standalone phone reading**
- Client has no active booking but has a card on file (`stripe_customer_id`, `default_payment_method_id`, `card_consent_at`)
- Returns TwiML with a pricing announcement ("$25 for the first 20 minutes...") and queues the call
- Creates a `phone_sessions` record with `session_type = 'standalone'`

**Scenario 3: Unknown caller / no card**
- Returns TwiML directing them to book at astrologypro.com
- Call is hung up

### Post-Call Billing (`/api/twilio/voice/status`)

Called by Twilio when a call ends (`CallStatus = completed`):

1. Looks up the `phone_sessions` record by `twilio_call_sid`
2. Calculates platform cost: `duration_minutes * $0.04`
3. For standalone calls: calculates client charge ($25 base + $0.50/min overage after 20 min)
4. For scheduled dial-in calls: no extra charge (included in booking)
5. Creates a Stripe PaymentIntent with `off_session: true` and `confirm: true` using the client's saved card
6. Applies the 20/80 split via `transfer_data.destination`
7. Sends a receipt email to the client

### Daily.co SIP Bridge

Phone calls can be connected to active Daily.co video rooms via SIP:
- Daily.co provides SIP endpoints at `sip:{room_name}@sip.daily.co`
- The TwiML `<Dial><Sip>` verb bridges the Twilio phone call into the video room
- The phone caller appears as an audio-only participant in the video session
- This enables the scheduled dial-in flow where a client can join by phone instead of video

### Phone Reading Pricing

| Component | Amount |
|-----------|--------|
| Base price (first 20 minutes) | $25.00 |
| Overage rate (after 20 min) | $0.50/minute |
| Platform Twilio cost | $0.04/minute |
| Platform take | 20% of client charge |
| Diviner receives | 80% of client charge |

---

## Video Sessions

### Daily.co Integration

Video sessions use Daily.co's embedded iframe approach:

1. **Room creation** (`/api/daily/create-room`): When a diviner clicks "Start Session" from the dashboard, this API creates a Daily.co room with:
   - Cloud recording enabled
   - Screen sharing enabled
   - 2-participant limit
   - Expiration set to scheduled time + duration + 30 min buffer

2. **Session room** (`/{username}/session/{bookingId}`): Both diviner and client join through the `SessionRoom` component, which:
   - Shows a recording consent screen first
   - Embeds the Daily.co room in an iframe
   - Displays a live timer counting up from session start
   - Shows an overtime warning overlay when exceeding scheduled duration
   - Shows running cost calculation (base + overage)
   - Provides mute/video-off/screen-share controls
   - Shows a sidebar (desktop) or sheets (mobile) with:
     - Billing info
     - Client birth data and questionnaire (diviner only)
     - Session notes textarea (diviner only)
     - Text chat

3. **Session end** (`/api/daily/end-session`): The diviner clicks "End Session", which:
   - Records actual duration
   - Calculates overage charges
   - Updates booking status to `completed`
   - Creates the 3-step follow-up email sequence

4. **Recording webhook** (`/api/daily/webhook`): Daily.co sends a `recording.ready-to-download` event with the recording URL. The webhook:
   - Matches the room name to a booking
   - Stores the recording URL and generates a share ID
   - The recording becomes available at `/session/{shareId}/recording`

### Session Bridge

During a session, AstrologyPro generates an RS256-signed JWT containing client data and sends it to the Angular back-office. The diviner then screen-shares the back-office tools through the Daily.co video room.

See `docs/session-bridge-integration.md` for the full specification.

---

## Booking System

### Availability Calculation

The availability engine is in `src/lib/availability.ts`. It works by:

1. Getting the target date's `day_of_week` (0-6)
2. Checking `availability_overrides` first -- if the date is explicitly unavailable, return empty
3. If there is an override with custom hours, use those; otherwise use the matching `availability_slots`
4. For each time window, generate slots of the service's `duration_minutes` length
5. Filter out slots that overlap with existing `bookings` for that diviner
6. The API at `/api/availability/{divinerId}?date=YYYY-MM-DD&duration=60` returns the available slots

Google Calendar integration adds another layer: if the diviner has connected their calendar, the `getAvailableSlotsFromGoogle()` function queries the FreeBusy API to also exclude busy times.

### Booking Flow

The 3-step booking wizard at `/{username}/book/{serviceSlug}`:

**Step 1: Date and Time Selection**
- Calendar picker showing available dates
- Time slot selector filtered by availability

**Step 2: Questionnaire**
- Client enters their name, email, phone
- Birth data fields (date, time, city) if the service requires it
- Focus question (free text)
- Life area selector (career, love, health, spiritual, general)
- Additional notes
- Custom questions from the diviner's intake form (if configured)

**Step 3: Payment**
- Shows booking summary
- Loyalty discount auto-applied if eligible (see [Client Loyalty Discounts](#client-loyalty-discounts))
- Gift certificate balance applied if redemption code present
- Stripe payment via destination charge (20/80 split)
- On success: booking is created, confirmation email sent, Google Calendar event created (if connected)

### Google Calendar Sync

Implementation in `src/lib/google-calendar.ts`:

- **OAuth flow**: Diviner connects via Settings > Calendar. Redirect to Google consent > callback stores refresh token.
- **FreeBusy query**: When calculating availability, busy slots from the diviner's primary Google Calendar are treated as booked.
- **Event creation**: On booking confirmation, a calendar event is created with session details and the client as an attendee.
- **Disconnect**: Diviner can disconnect, which clears the stored token.

---

## Pricing Controls

Diviners can customize their service prices within platform-defined boundaries.

### How It Works

- `service_templates` defines `base_price`, `min_price`, and `max_price` for each service type
- `min_price` = `base_price` (100% of base) -- the floor
- `max_price` = `base_price * 2` (200% of base) -- the ceiling
- When a diviner edits a service in `service-edit-sheet.tsx`, the price input is validated against these bounds
- Diviners can set any price from 100% to 200% of the base price

### Example

| Service | Base Price | Min (100%) | Max (200%) |
|---------|-----------|-----------|-----------|
| Natal Chart Reading | $75 | $75 | $150 |
| Tarot Spread | $50 | $50 | $100 |
| Phone Reading | $25 | $25 | $50 |

### Implementation

The `min_price` and `max_price` columns were added to `service_templates` in migration `20260401000001_phone_billing.sql`. The service edit form reads these values and enforces them with client-side validation.

---

## Gift Certificates

### Purchase Flow (`/{username}/gift`)

1. Purchaser visits the diviner's gift page
2. Enters recipient info (name, email), amount, and personal message
3. Payment processed via `POST /api/gift/purchase`
4. A unique alphanumeric code is generated and stored in `gift_certificates`
5. Two emails are sent:
   - **Purchaser**: Confirmation with the gift code
   - **Recipient**: Gift notification with the code and a link to redeem

### Redemption Flow (`/gift/{code}`)

1. Recipient visits the redemption page with their code
2. The page validates the code and shows the remaining balance
3. When booking a session, the gift balance is applied before charging the card
4. Partial redemptions are supported -- remaining balance is tracked

### Key Details

- Gift certificates expire after 1 year from purchase
- Remaining balance is tracked in `gift_certificates.remaining_balance`
- Codes are unique and URL-safe

---

## Client Loyalty Discounts

### How It Works

Diviners can create discount rules that automatically apply when clients meet certain criteria.

### `discount_rules` Table

| Column | Description |
|--------|-------------|
| `diviner_id` | Owning diviner |
| `type` | `session_count` or `package` |
| `threshold` | Number of sessions required (for session_count type) |
| `discount_percent` | Percentage discount to apply |
| `is_active` | Whether this rule is currently active |

### Types

- **session_count**: "After 5 sessions, get 10% off" -- checks `client_diviners.total_sessions` against the threshold
- **package**: Percentage discount for bulk session purchases

### Behavior

- Discounts are **auto-applied at checkout** during the booking flow (Step 3: Payment)
- The system finds the best matching active discount rule for the client-diviner relationship
- Diviners configure rules from Dashboard > Settings
- The discount is shown to the client before payment confirmation

---

## Marketing Features

### Affiliate System

Each diviner can create affiliates with unique referral codes and commission percentages:

- Affiliate landing page at `/affiliate/{code}` displays the diviner's info and a "Book Now" link with the referral code attached
- When a client books through a referral link, the `affiliate_id` is stored on the booking
- The dashboard shows referral counts, earned commissions, and paid-out amounts
- The diviner marks commissions as paid manually (Stripe payouts are handled outside the platform)

### Astrological Event Reminders

The `/api/cron/event-reminders` cron job runs daily at 9 AM and:

1. Fetches all clients who have birth dates and a relationship with a diviner
2. Calculates upcoming astrological events:
   - **Solar Return** (birthday): Reminds at 30, 7, and 1 day before
   - **Saturn Return** (age ~29 or ~58): Reminds when in the window
   - **Jupiter Return** (~12-year cycle): Reminds when near a multiple
3. Sends beautifully themed emails with one-click booking links to the relevant service
4. Tracks sent notifications in `scheduled_notifications` to prevent duplicates

### Weekly Practice Digest

The `/api/cron/weekly-digest` cron runs every Monday at 2 PM and sends each diviner a rich HTML email with:
- This week's revenue, bookings, new clients, completed sessions
- Week-over-week trend comparisons
- Top performing service
- Tracking link click totals
- Suggested action based on performance
- Link to the full dashboard

---

## Push-to-Share System

Replaces the expensive Ayrshare social media posting API ($500+/mo) with a zero-cost alternative.

### How It Works

Instead of auto-posting to social media (which requires expensive API access), AstrologyPro generates ready-to-share content and delivers it to diviners via email and SMS. The diviner then shares it manually with one tap per platform.

### Mundane Astrology Daily Shares (Primary System — LIVE)

The main share system generates **twice-daily** astrological content based on real planetary events:

**Pipeline:**
```
astronomy-engine (npm) → ephemeris.ts → mundane-events.ts → mundane-content.ts (Claude Haiku) → cron route → Supabase → share/[token]
```

**Cron schedule (vercel.json):**
- `0 13 * * *` UTC = 10 AM ET → `/api/cron/mundane-shares?n=1` (Share 1)
- `0 20 * * *` UTC = 3 PM ET → `/api/cron/mundane-shares?n=2` (Share 2)
- Auth: `Authorization: Bearer {CRON_SECRET}`

**Event types detected:** Sign ingresses, retrograde stations, direct stations, exact aspects (1.5° orb), New Moon (Moon-Sun conjunction), Full Moon (Moon-Sun opposition)

**Event priority:** 1 = stations + lunar phases, 2 = ingresses, 3 = other aspects. Share 1 gets highest priority event, Share 2 gets second-highest.

**Deduplication:** `mundane_event_log` table stores sent `event_key` values. Ingress/retrograde events sent once; aspects deduped monthly.

**Image naming (Supabase Storage bucket `mundane-images`):**
- Aspect: `{planet_a}-{aspect}-{planet_b}.jpg` (alphabetical planet order)
  - conjunction, opposition, sextile, trine use the word as-is
  - square → `squared` (e.g. `mars-squared-saturn.jpg`)
- Ingress: `{planet}-in-{sign}.jpg`
- Retrograde/Direct: `{planet}-retrograde.jpg`
- New Moon: `moon-conjunction-sun.jpg`
- Full Moon: `moon-opposition-sun.jpg`

**Content voice:** 1st-person authoritative astrologer. "I'm watching...", "Right now...", "Pay attention to...". 3-4 sentences + 10 hashtags + CTA.

**Caption format:**
```
{emoji} {event_label}

{3-4 sentence 1st-person analysis}

{10 hashtags}

🔮 Book a reading: https://astrologypro.com/{username}
```

### Image Compositing API (`/api/mundane/image`)

Adds a diviner's URL watermark to any base image.

**How it works:**
1. Fetches `?img=<url>` (base planet image from Supabase Storage)
2. Writes Geist Bold TTF from `src/lib/geist-bold-b64.ts` to `/tmp/geist-bold.ttf` on cold start
3. Renders `astrologypro.com/{username}` using sharp's Pango text renderer (NOT SVG — librsvg has no fonts on Lambda)
4. Composites semi-transparent dark strip + white text at bottom of image
5. Returns JPEG with `Cache-Control: public, max-age=86400`

**Critical note on Vercel Lambda text rendering:** SVG text via librsvg requires fontconfig (system fonts). Vercel Lambda has NONE. Use sharp's `{ text: { text, fontfile, dpi, rgba } }` input format instead. Font file must be written to `/tmp` first (Lambda `/tmp` = writable, 512MB).

### Facebook / LinkedIn OG Preview Architecture

The share page `/share/[token]` uses Next.js ISR, which sets `Cache-Control: private`. Facebook refuses to process OG tags from private pages.

**Fix: `src/proxy.ts` bot detection + dedicated OG route:**

1. `src/proxy.ts` (Next.js 16 — replaces `middleware.ts`) detects social crawler UAs
2. Rewrites `/share/TOKEN` → `/api/share-og?t=TOKEN` for bots
3. `/api/share-og/route.ts` returns lightweight HTML with full OG tags + `Cache-Control: public, s-maxage=3600`
4. Regular human visitors still get the full React share page

**Bot UAs detected:** facebookexternalhit, Facebot, LinkedInBot, Twitterbot, WhatsApp, Slackbot, TelegramBot, Discordbot, Applebot, pinterest, tumblr, redditbot

### Per-Platform Share Strategy

| Platform | Mechanism | OG image shown |
|----------|-----------|----------------|
| Facebook | Share page URL | ✅ Yes (via OG route) |
| LinkedIn | Share page URL | ✅ Yes (via OG route) |
| Twitter/X | Caption (250 char limit) + URL | ✅ Yes (via OG route) |
| WhatsApp | Caption + share page URL appended | ✅ Yes (via OG route) |
| Instagram | Download composited image, copy caption | Image with URL watermark |
| TikTok | Download composited image, copy caption | Image with URL watermark |

### Share Hub Page (`/share/{token}`)

The Share Hub provides a sequential sharing wizard:

1. Shows the pre-written, personalized caption (tap to copy)
2. One-tap share buttons for: Instagram, Facebook, Twitter/X, TikTok, WhatsApp, Threads
3. The wizard guides the diviner through sharing to each platform one at a time
4. Confetti animation plays after each successful share
5. The tracking URL embeds UTM parameters that route to the diviner's landing page

### Weekly Content Generation Cron (Legacy)

`/api/cron/weekly-content` runs every Monday at 10 AM UTC for non-mundane shares (generic marketing templates):

1. Selects a random `marketing_content` template for each active diviner
2. Personalizes the caption with `{username}` and `{link}` placeholders
3. Creates a `share_batches` record with a unique token
4. Sends email + SMS notifications with a link to the Share Hub

### Cost Comparison

| Approach | Monthly Cost |
|----------|-------------|
| Ayrshare API (previous plan) | $500+/mo |
| Push-to-Share (current) | $0/mo |

---

## Post-Session Follow-Up Emails

### 3-Step Sequence

When a session ends (`/api/daily/end-session`), three follow-up records are created in `follow_up_sequences`:

| Step | Timing | Email Type | Purpose |
|------|--------|-----------|---------|
| 1 | +1 hour | `recording_ready` | Send recording link + testimonial request |
| 2 | +3 days | `reflection` | Check-in, suggest journaling, offer rebooking |
| 3 | +30 days | `rebooking` | Nudge to book another session |

### Processing

The `/api/cron/follow-up-emails` cron runs **every 2 hours** and:

1. Queries `follow_up_sequences` for records where `scheduled_at <= NOW()` and `sent_at IS NULL`
2. Sends the appropriate email template for each step
3. Marks the record as sent with `sent_at = NOW()`

### `follow_up_sequences` Table

| Column | Description |
|--------|-------------|
| `booking_id` | The completed booking |
| `step` | 1, 2, or 3 |
| `email_type` | `recording_ready`, `reflection`, or `rebooking` |
| `scheduled_at` | When the email should be sent |
| `sent_at` | When it was actually sent (NULL = pending) |

---

## Premium Visual Design

The platform uses a distinctive cosmic night aesthetic to match the astrology/divination domain.

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Background (deepest) | `#06080f` | Page backgrounds |
| Background (dark) | `#0a0e27` | Card backgrounds |
| Celestial gold | `#c9a84c` | Primary accent, buttons, highlights |
| Gold (light variant) | Lighter gold tints | Hover states, subtle accents |

### Typography

- **Display font**: Cormorant Garamond (serif) -- used for headings, hero text, and decorative typography
- **Body font**: Geist / system sans-serif -- used for body text, UI labels, and form fields

### Glass-Morphism Cards

Cards use a glass-morphism effect:
- Semi-transparent backgrounds (`bg-white/5` or `bg-white/10`)
- `backdrop-blur` for frosted glass effect
- Subtle border with `border-white/10`
- Used throughout dashboard, booking wizard, and public pages

### Noise Texture Overlay

A subtle noise texture is applied as a CSS background overlay on the root layout to add visual depth and prevent flat-looking dark gradients.

### SVG Illustrations

8 custom SVG illustration mockups are used across the marketing site and dashboard:
- Celestial themed (stars, moons, zodiac symbols)
- Implemented in `src/components/marketing/astro-decorations.tsx`
- Used in the hero section, feature grid, and empty states

---

## Cron Jobs

Defined in `vercel.json`:

| Path | Schedule | Description |
|------|----------|-------------|
| `/api/cron/event-reminders` | `0 9 * * *` (daily 9 AM UTC) | Scan clients for upcoming solar/saturn/jupiter returns and send reminder emails |
| `/api/cron/weekly-content` | `0 10 * * 1` (Monday 10 AM UTC) | Generate and distribute weekly Push-to-Share content to all active diviners |
| `/api/cron/follow-up-emails` | `0 */2 * * *` (every 2 hours) | Process pending post-session follow-up emails (recording ready, reflection, rebooking) |
| `/api/cron/weekly-digest` | `0 14 * * 1` (Monday 2 PM UTC) | Send weekly practice performance digest to all onboarded diviners |

**Authentication:** All cron routes verify `Authorization: Bearer {CRON_SECRET}`. Vercel automatically includes this header when invoking crons.

**Testing locally:**

```bash
# Set a test cron secret
export CRON_SECRET=test-secret-123

# Call the cron endpoint directly
curl -H "Authorization: Bearer test-secret-123" http://localhost:3000/api/cron/event-reminders
curl -H "Authorization: Bearer test-secret-123" http://localhost:3000/api/cron/follow-up-emails
curl -H "Authorization: Bearer test-secret-123" http://localhost:3000/api/cron/weekly-content
curl -H "Authorization: Bearer test-secret-123" http://localhost:3000/api/cron/weekly-digest
```

---

## Session Bridge (Angular Back-Office Integration)

The session bridge connects AstrologyPro's video session room to the existing Angular back-office that contains astrology chart calculators and tarot card software.

**Quick summary:**
1. When a diviner starts a session, AstrologyPro generates an RS256-signed JWT containing session metadata, client birth data, and questionnaire responses
2. The JWT is sent to the Angular back-office via URL parameter or `postMessage`
3. The Angular app verifies the JWT against AstrologyPro's JWKS endpoint, extracts the data, and pre-populates the diviner's tools
4. The diviner screen-shares the Angular tools through the Daily.co video room

**Full specification:** `docs/session-bridge-integration.md`

**Quick start for the Angular team:** `docs/SESSION-BRIDGE-QUICKSTART.md`

---

## Deployment

### Vercel Setup

The project is already linked to Vercel:
- **Vercel Project**: `betosgates-projects/app`
- **Production URL**: `https://astrologypro.com`
- **Preview URL**: `https://app-seven-jade-30.vercel.app`
- **Framework**: Auto-detected as Next.js

### Environment Variables

All environment variables listed in the [Environment Setup](#environment-setup) section must be added in the Vercel dashboard:
- Settings > Environment Variables
- Set separate values for Production, Preview, and Development as needed
- `NEXT_PUBLIC_APP_URL` should be `https://astrologypro.com` in Production

### Deploy Commands

```bash
# Preview deployment (creates a unique URL)
vercel

# Production deployment
vercel --prod
```

### GitHub Integration

The repo at `github.com/betosgate/astrologypro` is connected to Vercel:
- Push to `master` triggers a production deployment
- Push to any other branch triggers a preview deployment
- Each PR gets its own preview URL

### Domain Setup

`astrologypro.com` is configured as a custom domain on the Vercel project.

### Twilio Webhook Configuration

After deploying, ensure the Twilio webhook URLs match the production domain. When a diviner provisions a phone number, the webhooks are automatically set to:
- Voice URL: `https://astrologypro.com/api/twilio/voice/incoming`
- Status Callback: `https://astrologypro.com/api/twilio/voice/status`

If the `NEXT_PUBLIC_APP_URL` is wrong when provisioning, the webhooks will point to the wrong host.

---

## Third-Party Services

| Service | Purpose | Env Var(s) | Dashboard | Monthly Cost | Status |
|---------|---------|-----------|-----------|-------------|--------|
| **Supabase** | Database (PostgreSQL), Auth, Storage | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | [supabase.com/dashboard](https://supabase.com/dashboard) | Free tier / ~$25 Pro | **Configured** |
| **Stripe** | Platform subscriptions (Billing), Marketplace payments (Connect Express), Card-on-file (SetupIntents), Refunds | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_SETUP`, `STRIPE_PRICE_MONTHLY` | [dashboard.stripe.com](https://dashboard.stripe.com) | 2.9% + $0.30 per txn | **Configured** |
| **Daily.co** | Video conferencing with recording, screen share, and SIP bridge for phone-to-video | `DAILY_API_KEY`, `DAILY_WEBHOOK_SECRET` | [dashboard.daily.co](https://dashboard.daily.co) | Free tier / ~$12 scale | **Configured** |
| **Resend** | Transactional email (booking confirmations, follow-ups, digests, refund notifications, phone receipts) | `RESEND_API_KEY` | [resend.com/dashboard](https://resend.com/dashboard) | Free tier (100/day) / $20/mo | **Configured** |
| **Twilio** | SMS notifications + Programmable Voice (phone readings, per-diviner phone numbers) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | [console.twilio.com](https://console.twilio.com) | ~$1/mo/number + $0.04/min voice + $0.0079/SMS | **Configured** |
| **Google Cloud** | Calendar API for availability sync and event creation | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | [console.cloud.google.com](https://console.cloud.google.com) | Free | **Configured** |
| **Vercel** | Hosting, serverless functions, cron jobs, edge network | (project linked via CLI) | [vercel.com/dashboard](https://vercel.com/dashboard) | Pro plan $20/mo | **Deployed** |
| **GitHub** | Source code repository | (SSH/HTTPS auth) | [github.com/betosgate/astrologypro](https://github.com/betosgate/astrologypro) | Free | **Configured** |

**Note:** Email and SMS libraries gracefully degrade in development -- they log to console instead of sending when API keys are placeholders.

---

## Testing

### Test Accounts

After running `npm run seed`:

| Role | Email | Password |
|------|-------|----------|
| Diviner (Astrologer) | `demo.astrologer@astrologypro.com` | `DemoAstro2026!` |
| Diviner (Tarot Reader) | `demo.tarot@astrologypro.com` | `DemoTarot2026!` |
| Client 1 | `sarah.johnson@example.com` | `ClientTest2026!` |
| Client 2 | `michael.chen@example.com` | `ClientTest2026!` |
| Client 3 | `emma.garcia@example.com` | `ClientTest2026!` |

Back-office test accounts (for session bridge testing):

| Role | Email | Password |
|------|-------|----------|
| Astrologer | `testastrologer.divine@yopmail.com` | (existing back-office password) |
| Tarot Reader | `testtarot.divine@yopmail.com` | (existing back-office password) |

### Stripe Test Cards

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 3220` | Requires 3D Secure authentication |
| `4000 0000 0000 9995` | Payment declined |

Use any future expiry date and any CVC. For SetupIntent (card-on-file) testing, use the same test card numbers.

### Seed Data Details

- **Mystic Maya** (`/mystic-maya`): 12 services (11 astrology + 1 tarot), Mon-Fri 9-5 + Sat 10-2 ET
- **Luna Starweaver** (`/luna-readings`): 10 services (8 tarot + 2 astrology), Tue-Sat 11-7 PT
- 8 bookings: 4 completed (with session notes), 2 confirmed (upcoming), 2 pending
- 6 testimonials (3 per diviner, all approved)
- 2 affiliates for Maya (COSMIC15 at 15%, SPIRIT10 at 10%)
- All 3 clients have full birth data set

### Manual Testing Checklist

**Marketing site:**
- [ ] Visit `/` -- homepage renders with cosmic theme, hero, features, pricing, FAQ
- [ ] Visit `/features`, `/pricing`, `/instructions` -- all render
- [ ] Visit `/refund-policy` -- refund policy page renders
- [ ] Visit `/mystic-maya` -- diviner landing page shows bio, services, testimonials
- [ ] Visit `/luna-readings` -- same for the second diviner

**Booking flow:**
- [ ] Visit `/mystic-maya/book/natal-chart` -- booking wizard loads
- [ ] Select a date -- available slots appear
- [ ] Select a time slot -- moves to questionnaire step
- [ ] Fill out questionnaire (birth data, focus question)
- [ ] Payment step shows summary with any applicable loyalty discount
- [ ] Payment processes (requires Stripe test keys)

**Gift certificates:**
- [ ] Visit `/mystic-maya/gift` -- gift purchase page loads
- [ ] Complete purchase with test card
- [ ] Visit `/gift/{code}` -- redemption page shows balance
- [ ] Use gift during booking checkout

**Dashboard:**
- [ ] Log in as `demo.astrologer@astrologypro.com` -- redirects to `/dashboard`
- [ ] Dashboard shows stats and upcoming bookings
- [ ] `/dashboard/bookings` -- list of bookings with status filters
- [ ] Booking detail sheet shows refund button for completed bookings
- [ ] `/dashboard/clients` -- client list with search
- [ ] `/dashboard/services` -- toggle services on/off, edit pricing within min/max range
- [ ] `/dashboard/profile` -- edit bio, tagline, specialties
- [ ] `/dashboard/settings` -- Stripe, calendar, phone provisioning settings
- [ ] `/dashboard/testimonials` -- approve/reject reviews

**Phone system (requires Twilio keys):**
- [ ] Provision a phone number from Settings
- [ ] Incoming call to provisioned number returns TwiML
- [ ] Status callback processes correctly after call ends

**Client portal:**
- [ ] Log in as `sarah.johnson@example.com` -- redirects to `/portal`
- [ ] `/portal/bookings` -- shows client's bookings
- [ ] `/portal/profile` -- edit birth data, set up card-on-file

**Video session (requires Daily.co key):**
- [ ] Diviner creates a room from booking detail
- [ ] Both participants see consent screen
- [ ] Timer counts up during session
- [ ] Overtime warning appears after scheduled duration
- [ ] End session calculates overage and shows summary

**Push-to-Share:**
- [ ] Trigger weekly content cron manually
- [ ] Visit `/share/{token}` -- share hub renders with copy button and platform buttons
- [ ] Share to a platform -- confetti plays

---

## Common Tasks

### How to Add a New Service Template

1. Create a new migration:
   ```bash
   npx supabase migration new add_new_service_template
   ```

2. Insert into `service_templates`:
   ```sql
   INSERT INTO service_templates (category, name, slug, description, duration_minutes, base_price, min_price, max_price, overage_rate, is_primary, requires_birth_data, trigger_event, sort_order)
   VALUES ('astrology', 'Lunar Return', 'lunar-return', 'Monthly lunar return chart...', 30, 50.00, 50.00, 100.00, 0.50, true, true, 'lunar-return', 25);
   ```

3. Push the migration:
   ```bash
   npx supabase db push
   ```

4. Add the service slug to the session bridge mapping in `docs/session-bridge-integration.md` if it needs a specific back-office route.

### How to Add a New Dashboard Page

1. Create `src/app/dashboard/my-page/page.tsx`
2. The page automatically inherits the dashboard layout (sidebar + topbar) from `src/app/dashboard/layout.tsx`
3. Add a nav item in `src/lib/constants.ts` under `NAV_ITEMS.dashboard`
4. Add the same item to `src/components/dashboard/sidebar.tsx` if the nav is hardcoded there

### How to Modify the Booking Flow

The booking wizard lives in `src/components/booking/booking-wizard.tsx` with sub-components:
- `calendar-picker.tsx` for Step 1 (date/time)
- `intake-form.tsx` for Step 2 (questionnaire)
- Step 3 (payment) is inline in the wizard

The parent page is `src/app/[username]/book/[serviceSlug]/page.tsx` which fetches the service and diviner data.

### How to Add a New Cron Job

1. Create the route handler at `src/app/api/cron/my-job/route.ts`:
   ```typescript
   import { NextRequest, NextResponse } from "next/server";

   export async function GET(request: NextRequest) {
     const authHeader = request.headers.get("authorization");
     if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
     }

     // Your cron logic here

     return NextResponse.json({ success: true });
   }
   ```

2. Add the schedule to `vercel.json`:
   ```json
   {
     "crons": [
       { "path": "/api/cron/my-job", "schedule": "0 */6 * * *" }
     ]
   }
   ```

3. Test locally:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/my-job
   ```

### How to Update the Marketing Site

Marketing pages are at:
- `src/app/page.tsx` (homepage)
- `src/app/features/page.tsx`
- `src/app/pricing/page.tsx`
- `src/app/instructions/page.tsx`

Marketing components are in `src/components/marketing/`. The header and footer are shared across all marketing pages.

Plan pricing is in `src/lib/plans.ts`. Other pricing constants are in `src/lib/constants.ts` under `PRICING`.

### How to Add a New Twilio Voice Feature

1. Create a new route handler under `src/app/api/twilio/voice/`
2. Use `createAdminClient()` since Twilio callbacks are not authenticated users
3. Return TwiML XML responses using the `twimlResponse()` helper pattern:
   ```typescript
   function twimlResponse(twiml: string): NextResponse {
     return new NextResponse(twiml.trim(), {
       headers: { "Content-Type": "text/xml" },
     });
   }
   ```
4. Register the webhook URL when provisioning numbers in `src/lib/twilio-voice.ts`

### How to Issue a Refund Programmatically

```typescript
const response = await fetch('/api/stripe/refund', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bookingId: 'uuid-of-booking',
    reason: 'Client requested reschedule'
  })
});
```

---

## Quick Reference

| What | Where |
|------|-------|
| Supabase project ref | `wyluvclvtvwptsvvtgkv` |
| Supabase URL | `https://wyluvclvtvwptsvvtgkv.supabase.co` |
| GitHub repo | `github.com/betosgate/astrologypro` |
| Vercel project | `betosgates-projects/app` |
| Production URL | `https://astrologypro.com` |
| Preview URL | `https://app-seven-jade-30.vercel.app` |
| Dev server | `http://localhost:3000` |
| Platform pricing | 3 tiers: Tarot/Astrology $197+$97/mo, Oracle $297+$147/mo (see `src/lib/plans.ts`) |
| Platform fee | 20% of booking/phone payments |
| Video overage rate | $0.50/minute (default) |
| Phone base price | $25 for 20 minutes |
| Phone overage rate | $0.50/minute after 20 min |
| Session durations | 20 (phone), 30, or 60 minutes |
| Total routes | 59 (31 pages + 28 API routes) |
| Database migrations | 9 files |
| Database tables | 20+ |
| Cron jobs | 4 |
| Service templates | 20 (11 astrology + 8 tarot + 1 phone) |
