# AstrologyPro.com Platform Design Specification

**Date**: 2026-03-31
**Status**: Approved (user delegated all decisions)
**Version**: 1.0

---

## 1. Executive Summary

AstrologyPro.com is a SaaS platform that gives astrologers and tarot readers ("diviners") everything they need to run their divination business online. It wraps around an existing Angular back-office system (at backofficeportal.divineinfinitebeing.com) that handles chart calculations and tarot software, adding the client-facing, business, marketing, and payment layers.

**Two audiences**:
- **Diviners**: Pay $197 setup + $149/mo for a complete business-in-a-box
- **Clients**: Book and pay for readings, attend video sessions, share recordings

---

## 2. Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 16 (App Router) | Server Components, Cache Components, proxy.ts, best Vercel integration |
| Hosting | Vercel | Zero-config deploys, Edge Network, Fluid Compute, Cron Jobs |
| Database | Supabase (PostgreSQL + RLS) | Auth, storage, real-time, Row Level Security for multi-tenant isolation |
| Auth | Supabase Auth | Magic links for clients, email/password for diviners, JWT-based session bridge |
| Payments | Stripe Billing (platform) + Stripe Connect Express (marketplace) | Subscriptions, destination charges, platform fee collection |
| Video | Daily.co | Best React SDK, built-in recording, screen sharing, shareable playback URLs |
| Calendar | Custom availability system + Google Calendar sync | Own system as source of truth, Google Calendar as convenience sync |
| Social Posting | Ayrshare API | Multi-platform posting, OAuth per diviner, scheduling, link tracking |
| SMS | Twilio | Industry standard, MMS support, 10DLC compliance |
| Email | Resend | Developer-friendly, React Email templates, good Vercel integration |
| Live Streaming | YouTube embed (primary) + Facebook manual URL (secondary) | Zero-API-call auto-detection via /embed/live_stream?channel=X |
| File Storage | Supabase Storage + Vercel Blob (recordings) | Blob for large video files, Supabase for images/documents |
| Monitoring | Sentry + Vercel Analytics | Error tracking + performance monitoring |
| UI | shadcn/ui + Tailwind CSS + Geist font | Dark mode dashboard, clean design system |
| Link Tracking | Self-hosted redirects + UTM params | Zero cost, full control, server-side attribution |

---

## 3. Architecture Overview

```
astrologypro.com (Next.js 16 on Vercel)
├── / ........................... Marketing website (public)
├── /pricing ................... Plans and pricing
├── /features .................. Software showcase
├── /get-started ............... Diviner signup + payment
├── /login ..................... Auth (diviner + client)
├── /dashboard ................. Diviner dashboard (protected)
│   ├── /dashboard/overview .... Revenue, bookings, analytics
│   ├── /dashboard/profile ..... Bio, photo, services config
│   ├── /dashboard/bookings .... Calendar, upcoming/past sessions
│   ├── /dashboard/clients ..... Client CRM
│   ├── /dashboard/recordings .. Session recordings management
│   ├── /dashboard/affiliates .. Affiliate management
│   ├── /dashboard/marketing ... Social media, content library
│   ├── /dashboard/testimonials  Review and publish testimonials
│   ├── /dashboard/settings .... Stripe, Calendar, Social accounts
│   └── /dashboard/live ........ Live stream configuration
├── /portal .................... Client portal (protected)
│   ├── /portal/bookings ....... Upcoming/past bookings
│   ├── /portal/recordings ..... Watch past sessions
│   └── /portal/profile ........ Birth data, preferences
├── /[username] ................ Diviner public landing page
│   ├── /[username]/book/[service] Booking flow
│   ├── /[username]/testimonials   Public testimonials
│   └── /[username]/session/[id]   Session room (video)
├── /session/[id]/recording .... Shareable recording playback
├── /instructions .............. Software walkthrough
├── /api ....................... API routes
│   ├── /api/auth .............. Auth endpoints
│   ├── /api/stripe ............ Webhooks + payment flows
│   ├── /api/daily ............. Video session management
│   ├── /api/calendar .......... Google Calendar OAuth + sync
│   ├── /api/social ............ Ayrshare posting
│   ├── /api/sms ............... Twilio notifications
│   └── /api/bridge ............ Session bridge to back-office
└── /r/[code] .................. Affiliate/tracking redirects
```

### Session Bridge to Back-Office

The existing Angular back-office and this platform share sessions via signed JWTs:

1. Diviner logs into AstrologyPro.com (Supabase Auth)
2. When entering a session that needs the back-office tools, the platform generates a **signed JWT** (RS256, 15-min expiry) containing: `diviner_id`, `session_id`, `client_birth_data`, `service_type`
3. This JWT is passed to the Angular app via a secure redirect or postMessage in an iframe
4. The Angular app validates the JWT against AstrologyPro's public key
5. The Angular app grants access to the astrology/tarot tools for that session
6. Screen sharing via Daily.co shows the Angular app's output to the client

A separate integration document will be provided for the Angular dev team.

---

## 4. Database Schema (Supabase PostgreSQL)

### Core Tables

```sql
-- Diviners (practitioners)
CREATE TABLE diviners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  tagline VARCHAR(200),
  specialties TEXT[], -- ['astrology', 'tarot', 'both']
  stripe_account_id VARCHAR(255), -- Stripe Connect Express account
  stripe_subscription_id VARCHAR(255), -- Platform subscription
  subscription_status VARCHAR(20) DEFAULT 'trialing', -- active, past_due, canceled
  google_calendar_token JSONB, -- encrypted refresh token
  youtube_channel_id VARCHAR(30),
  facebook_live_url TEXT,
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  platform_fee_percent DECIMAL(5,2) DEFAULT 10.00,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services offered by each diviner
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE,
  category VARCHAR(20) NOT NULL, -- 'astrology' or 'tarot'
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL, -- 30 or 60
  base_price DECIMAL(10,2) NOT NULL,
  overage_rate DECIMAL(10,2) DEFAULT 0.50, -- per minute
  is_primary BOOLEAN DEFAULT TRUE, -- vs secondary (event-triggered)
  is_featured BOOLEAN DEFAULT FALSE, -- shown prominently on landing page
  requires_birth_data BOOLEAN DEFAULT TRUE,
  trigger_event VARCHAR(50), -- 'solar_return', 'jupiter_return', etc.
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients (people getting readings)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  phone VARCHAR(20),
  birth_date DATE,
  birth_time TIME,
  birth_city VARCHAR(100),
  birth_lat DECIMAL(10,7),
  birth_lng DECIMAL(10,7),
  birth_timezone VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client-Diviner relationship
CREATE TABLE client_diviners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE,
  first_session_at TIMESTAMPTZ,
  total_sessions INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  notes TEXT, -- diviner's private notes about this client
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, diviner_id)
);

-- Availability (source of truth for scheduling)
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Availability overrides (days off, special hours)
CREATE TABLE availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT FALSE,
  start_time TIME,
  end_time TIME
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, in_progress, completed, canceled, no_show
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  actual_duration_minutes INTEGER,
  base_price DECIMAL(10,2) NOT NULL,
  overage_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2),
  stripe_payment_intent_id VARCHAR(255),
  stripe_payment_status VARCHAR(20),
  daily_room_name VARCHAR(255),
  daily_room_url TEXT,
  recording_url TEXT,
  recording_share_id VARCHAR(50) UNIQUE,
  questionnaire_responses JSONB,
  session_notes TEXT, -- diviner's notes after session
  affiliate_id UUID REFERENCES affiliates(id),
  google_calendar_event_id VARCHAR(255),
  canceled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliates
CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  commission_percent DECIMAL(5,2) NOT NULL,
  total_referrals INTEGER DEFAULT 0,
  total_earned DECIMAL(10,2) DEFAULT 0,
  total_paid DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate referrals
CREATE TABLE affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  booking_id UUID REFERENCES bookings(id),
  commission_amount DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending', -- pending (booked), earned (session completed), paid
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Testimonials
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  client_name VARCHAR(100),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL,
  service_type VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled notifications (astrological events, reminders)
CREATE TABLE scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'solar_return', 'jupiter_return', 'saturn_return', 'follow_up', 'session_reminder'
  service_id UUID REFERENCES services(id),
  send_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  channel VARCHAR(20) DEFAULT 'email', -- 'email', 'sms', 'both'
  subject VARCHAR(200),
  body TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social media accounts connected via Ayrshare
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL, -- 'instagram', 'twitter', 'youtube', 'tiktok', 'facebook'
  ayrshare_profile_key VARCHAR(255),
  account_name VARCHAR(100),
  is_connected BOOLEAN DEFAULT TRUE,
  connected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketing content library (pre-created posts)
CREATE TABLE marketing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  caption_template TEXT, -- with {username}, {link} placeholders
  platforms TEXT[], -- which platforms this works for
  category VARCHAR(50), -- 'astrology_general', 'tarot_general', 'seasonal', 'promotional'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled social posts
CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE,
  content_id UUID REFERENCES marketing_content(id),
  platforms TEXT[],
  scheduled_at TIMESTAMPTZ NOT NULL,
  posted_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, posted, failed
  ayrshare_post_id VARCHAR(255),
  tracking_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link tracking
CREATE TABLE tracking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL,
  destination_url TEXT NOT NULL,
  source VARCHAR(50), -- 'instagram', 'twitter', 'affiliate', etc.
  campaign VARCHAR(100),
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intake questionnaire templates
CREATE TABLE intake_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  questions JSONB NOT NULL, -- array of { label, type, required, options }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Waitlist for fully-booked slots
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  preferred_date DATE,
  preferred_time_range JSONB, -- { start: "09:00", end: "17:00" }
  status VARCHAR(20) DEFAULT 'waiting', -- waiting, notified, booked, expired
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gift certificates
CREATE TABLE gift_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL,
  purchaser_email VARCHAR(255) NOT NULL,
  recipient_email VARCHAR(255),
  recipient_name VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  remaining_amount DECIMAL(10,2) NOT NULL,
  message TEXT,
  stripe_payment_intent_id VARCHAR(255),
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

Every table gets RLS policies ensuring:
- Diviners only see their own data
- Clients only see their own bookings/recordings
- Public landing page data is readable by anyone
- Admin role can access all data

---

## 5. Feature Specifications

### 5.1 Marketing Website (Public)

**Pages**: `/`, `/features`, `/pricing`, `/get-started`

The marketing site showcases:
- What diviners get (landing page, booking, video sessions, CRM, affiliates, marketing tools)
- Screenshots/demos of the back-office astrology and tarot software
- Pricing ($197 setup + $149/mo)
- Testimonials from diviners using the platform
- "Get Started" CTA that leads to signup + payment

**Design**: Dark mode, mystical/professional aesthetic. Geist font. Purple/indigo accent color on dark zinc backgrounds. Subtle star/constellation decorative elements. Professional, not kitchy.

### 5.2 Diviner Onboarding Wizard

After paying $197 + first $149/mo via Stripe Checkout, diviners enter a 5-step wizard:

1. **Profile**: Upload photo, display name, bio, tagline
2. **Services**: Select which of the 19 service types they offer (checkboxes with recommended pricing pre-filled, editable). Mark 3-4 as featured.
3. **Payments**: Connect Stripe via Stripe Connect Express onboarding flow
4. **Availability**: Visual weekly calendar — click to set available hours per day
5. **Preview & Launch**: See their `/[username]` page live. "Your page is ready!"

Everything else (Google Calendar, social media, affiliates) is discoverable later in the dashboard settings, not required at signup.

### 5.3 Diviner Dashboard

Dark mode dashboard with sidebar navigation:

- **Overview**: Revenue chart (30/60/90 days), upcoming bookings (today/week), client count, session count, top referral sources
- **Bookings**: Calendar view + list view of all bookings. Filter by status, service type. Click to see details, session notes, recording.
- **Clients (CRM)**: All clients with birth data, session history, total spent, last session, upcoming transits. Click into a client to see full history and add notes.
- **Recordings**: All session recordings with search, filter, share links. Set retention (auto-delete after X days).
- **Testimonials**: Pending/approved/rejected. Approve to publish on landing page.
- **Affiliates**: Add affiliates (name, email, commission %). View referral tracking, earnings reports. Mark payments as paid.
- **Marketing**: Connected social accounts, content library, scheduled posts, posting schedule, analytics (clicks, bookings from social).
- **Settings**: Profile editing, service management, availability, Stripe account, Google Calendar connect, YouTube Channel ID, notification preferences.
- **Live**: Set up live stream configuration. Show YouTube Channel ID field, Facebook Live URL field, and a preview of how it looks on their page.

### 5.4 Diviner Landing Page (`/[username]`)

Public page optimized for conversion. Includes:

- **Hero**: Diviner photo, name, tagline, "Book a Reading" CTA
- **Live Stream** (conditional): If YouTube live detected or Facebook URL set, show video player with "LIVE" badge
- **Featured Services** (3-4): Cards with service name, description, duration, price, "Book Now" button
- **All Services**: Collapsible sections (Astrology / Tarot) with full catalog
- **"Not Sure?" Quiz**: 3 quick questions → recommended service (optional, diviner can enable/disable)
- **Testimonials**: Star rating + text from approved client testimonials
- **About**: Full bio, specialties, experience
- **Gift Certificate**: "Buy a reading for someone" CTA
- **Social Links**: Connected social profiles

SEO optimized: meta tags, Open Graph, schema.org `LocalBusiness` + `Service` markup, dynamic sitemap.

### 5.5 Booking Flow (`/[username]/book/[service]`)

1. **Select Date/Time**: Calendar showing available slots (from diviner's availability system). Client sees times in their local timezone.
2. **Intake Questionnaire**: Birth date, birth time, birth city (for astrology). Plus diviner's custom questions per service type. E.g., "What questions do you want answered?" "What area of life are you focused on?"
3. **Payment**: Stripe Checkout. Pre-authorize full session amount. Show price breakdown (base + estimated overage policy).
4. **Confirmation**: Email + SMS confirmation with calendar invite (.ics file). Session link for joining video.

Affiliate tracking: If `?ref=CODE` is in the URL, store the affiliate referral.

### 5.6 Video Sessions

**Pre-session** (5 min before):
- Client and diviner get email/SMS reminders with session link
- Session room page shows countdown

**During session**:
- Daily.co embedded video call (1-on-1)
- Screen sharing: Diviner shares their screen showing the Angular back-office tools
- Session timer visible to both parties
- Recording starts automatically (with consent banner shown to client on join)
- Back-office bridge: Signed JWT passed to the Angular app for this session's data

**Post-session**:
- Calculate actual duration vs. base duration
- If overage: charge additional $0.50/min against stored payment method
- Send recording link to client (email + SMS)
- Send testimonial request (email, 24 hours later)
- Create follow-up reminder in 30/60/90 days
- Check for upcoming astrological events and schedule product reminders

### 5.7 Client Portal (`/portal`)

Lightweight portal (magic link auth — no passwords):

- **Upcoming Bookings**: With session links, reschedule/cancel buttons
- **Past Sessions**: Recordings with playback, "Book Again" button, share links
- **Profile**: Birth data (stored once, reused), contact info, notification preferences
- **Testimonials**: Submit testimonials for past sessions

### 5.8 Affiliate System

Diviners manage their own affiliates:

- **Create Affiliate**: Name, email, commission % (e.g., 15%)
- **Referral Code**: Auto-generated, used in tracking links (`astrologypro.com/[username]?ref=CODE`)
- **Pre-created Media**: Affiliates get access to marketing images/posts with their unique tracking links embedded
- **Dashboard for Affiliates**: Simple page (no account needed, accessed via unique link) showing: clicks, bookings, completed sessions, earnings, payment status
- **Commission Tracking**: Commissions only earned on completed sessions (not no-shows)
- **Mark as Paid**: Diviner marks affiliate payments as paid (we don't process these)

### 5.9 Social Media Auto-Posting

Via Ayrshare:

- **Connect Accounts**: Diviner connects Instagram, Twitter/X, YouTube, TikTok via OAuth through Ayrshare
- **Content Library**: Platform provides pre-created marketing images/posts. Each has caption templates with `{username}` and `{link}` placeholders
- **Scheduling**: Auto-post on a configurable schedule (e.g., 3x/week)
- **Custom Links**: Each post gets a tracking URL (`astrologypro.com/r/[code]`) that redirects to the diviner's landing page with UTM params
- **Facebook Workaround**: For Facebook personal profiles, send SMS/email with a pre-filled share link. Encourage diviners to create Facebook Pages for full automation.
- **Analytics**: Track clicks per post, per platform, per campaign

### 5.10 Astrological Event Reminders

For clients with birth data on file:

- Calculate upcoming astrological events (solar return = birthday, Saturn return ~29.5 year cycle, Jupiter return ~12 year cycle)
- For secondary services tied to these events, send automated emails:
  - 30 days before: "Your Solar Return is coming up! Book a reading."
  - 7 days before: Reminder
  - 1 day before: Final reminder
- Implemented via cron job that checks `scheduled_notifications` table hourly
- Emails sent via Resend with React Email templates, branded per diviner

### 5.11 Session Recordings & Sharing

- Recorded via Daily.co (composite recording — both video feeds + screen share)
- Stored in Vercel Blob (cost-effective for large files)
- Each recording gets a unique share ID: `astrologypro.com/session/[id]/recording`
- Share page: Video player, session details, "Book Another Reading" CTA
- Social share buttons: Copy link, email, Facebook share dialog, Twitter share, WhatsApp
- Retention: 90 days default, client can download. Diviner can extend.

### 5.12 Gift Certificates

- Client buys a gift certificate on any diviner's page
- Generates unique code
- Recipient gets email with code + link to diviner's page
- Code applied at checkout to reduce/cover session cost

### 5.13 Live Streaming

- **YouTube** (primary): Diviner enters their YouTube Channel ID once in settings. Landing page auto-embeds via `/embed/live_stream?channel=X`. When live, it shows; when not, the section hides.
- **Facebook** (secondary): Diviner pastes their Facebook Live URL when going live. Embed via iframe plugin. Clear when done.
- Server-side live detection (YouTube Data API, cached 5 min) for "LIVE NOW" badge on landing page.

---

## 6. Third-Party Accounts Needed

| Service | Purpose | Account Type | Est. Cost |
|---------|---------|-------------|-----------|
| **Vercel** | Hosting, deploys, cron | Pro plan | $20/mo |
| **Supabase** | Database, auth, storage | Pro plan | $25/mo |
| **Stripe** | Payments (platform + marketplace) | Standard | 2.9% + $0.30 per txn |
| **Daily.co** | Video conferencing + recording | Scale plan | $0.004/min video + $0.02/min recording |
| **Ayrshare** | Social media posting | Business plan | $499/mo (scales with profiles) |
| **Twilio** | SMS notifications | Pay-as-you-go | ~$0.0079/SMS + $1.15/mo per number |
| **Resend** | Transactional email | Free → Pro | Free up to 3K emails/mo |
| **Google Cloud** | Calendar API + YouTube API | Free tier | Free (quota-based) |
| **Sentry** | Error monitoring | Developer plan | Free |
| **GitHub** | Source code | Free | Free |

**Total monthly platform cost at launch**: ~$575/mo + per-usage fees
**Break-even**: ~4 active diviners covers fixed costs

---

## 7. Implementation Phases

### Phase 1: Core Platform (MVP)
- Next.js 16 project setup with Supabase
- Marketing website (home, features, pricing)
- Diviner signup + Stripe Billing subscription
- Diviner onboarding wizard (5 steps)
- Diviner dashboard (profile, services, availability)
- Public landing page `/[username]`
- Client booking flow with intake questionnaire
- Stripe Connect for client payments
- Supabase RLS policies

### Phase 2: Sessions & Communication
- Daily.co video integration with screen sharing
- Session recording + shareable playback
- Session bridge (JWT) to back-office Angular app
- Email notifications (Resend)
- SMS notifications (Twilio)
- Post-session automation (recording link, feedback request)
- Client portal (magic link auth)

### Phase 3: Marketing & Growth
- Affiliate system (tracking, reporting, mark-as-paid)
- Social media integration (Ayrshare)
- Content library + scheduled posting
- Link tracking with analytics
- Astrological event reminders (cron-based)
- YouTube live stream embed
- Facebook live URL embed

### Phase 4: Polish & Extras
- Gift certificates
- Testimonial system
- Client CRM view for diviners
- "Not Sure?" service quiz
- Waitlist for fully-booked slots
- SEO optimization (sitemap, schema.org)
- `/instructions` walkthrough page
- Playwright screenshots for documentation
- Integration document for Angular dev team

---

## 8. Session Bridge Integration Document (for Angular team)

A separate document (`docs/session-bridge-integration.md`) will specify:
- JWT structure and signing algorithm (RS256)
- Public key endpoint for token verification
- Token payload schema (diviner_id, session_id, client_birth_data, service_type, exp)
- CORS configuration requirements
- Iframe vs. redirect integration patterns
- Error handling for expired/invalid tokens
- Testing endpoints for development

---

## 9. Key Design Decisions

1. **Own availability system over Google Calendar dependency**: Google Calendar syncs as convenience, not source of truth. If token expires, bookings still work.

2. **Daily.co over LiveKit for launch**: Faster implementation, no ops burden. Migrate to self-hosted LiveKit if costs exceed $5K/mo.

3. **Supabase Auth over Clerk**: Simpler, cheaper, native to our database. Magic links for clients, email/password for diviners.

4. **Ayrshare over direct APIs**: Saves months of OAuth/posting implementation across 5 platforms. Swap to direct APIs later if cost justifies.

5. **Dark mode dashboard, mystical-professional marketing site**: Matches the divination aesthetic while staying professional and clean.

6. **Platform-owned availability over Cal.com/Calendly**: Domain-specific needs (birth data collection, astrology session types) make generic tools a poor fit.

7. **Post-session capture for overage billing**: Simpler than Stripe metered billing. Calculate after session ends, charge stored payment method.

8. **No PayPal at launch**: Stripe Connect can accept PayPal as a payment method. Avoids dual-processor complexity.

9. **90-day recording retention default**: Balances storage costs with user value. Clients can download.

10. **Resend over SendGrid**: Better DX, React Email templates, good Vercel ecosystem integration.
