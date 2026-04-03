# AstrologyPro Phase 1: Core Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core AstrologyPro.com platform — marketing site, diviner signup with Stripe billing, onboarding wizard, dashboard, public landing pages, client booking flow with payments, and Supabase database with RLS.

**Architecture:** Next.js 16 App Router on Vercel with Supabase for database/auth/storage and Stripe for all payments. Server Components by default, Client Components only for interactive elements. Dark mode UI with shadcn/ui. Two user types: diviners (email/password auth) and clients (magic link auth). Stripe Billing for platform subscriptions, Stripe Connect Express for marketplace payments.

**Tech Stack:** Next.js 16, TypeScript, Supabase (PostgreSQL + Auth + Storage), Stripe (Billing + Connect), shadcn/ui, Tailwind CSS, Geist font, Vercel hosting.

**Design Spec:** `docs/superpowers/specs/2026-03-31-astrologypro-platform-design.md`

---

## File Structure

```
astrologypro/
├── .env.local.example          # Environment variable template
├── .gitignore
├── next.config.ts              # Next.js 16 config with cacheComponents
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── proxy.ts                    # Next.js 16 middleware (auth checks)
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql    # Core tables
│       ├── 002_rls_policies.sql      # Row Level Security
│       └── 003_seed_services.sql     # Default service types
│
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout (Geist font, providers, dark mode)
│   │   ├── globals.css              # Tailwind + custom CSS variables
│   │   ├── page.tsx                 # Marketing homepage
│   │   ├── features/
│   │   │   └── page.tsx             # Features showcase
│   │   ├── pricing/
│   │   │   └── page.tsx             # Pricing page
│   │   ├── get-started/
│   │   │   └── page.tsx             # Signup → Stripe Checkout
│   │   ├── login/
│   │   │   └── page.tsx             # Login page (diviner + client)
│   │   ├── auth/
│   │   │   ├── callback/
│   │   │   │   └── route.ts         # Supabase auth callback
│   │   │   └── confirm/
│   │   │       └── route.ts         # Email confirmation
│   │   ├── onboarding/
│   │   │   └── page.tsx             # 5-step onboarding wizard
│   │   ├── dashboard/
│   │   │   ├── layout.tsx           # Dashboard shell (sidebar + header)
│   │   │   ├── page.tsx             # Overview (revenue, bookings, stats)
│   │   │   ├── profile/
│   │   │   │   └── page.tsx         # Profile editing
│   │   │   ├── services/
│   │   │   │   └── page.tsx         # Service management
│   │   │   ├── bookings/
│   │   │   │   └── page.tsx         # Booking calendar + list
│   │   │   ├── clients/
│   │   │   │   └── page.tsx         # Client CRM
│   │   │   └── settings/
│   │   │       └── page.tsx         # Stripe, calendar, etc.
│   │   ├── portal/
│   │   │   ├── layout.tsx           # Client portal layout
│   │   │   ├── page.tsx             # Client dashboard
│   │   │   └── bookings/
│   │   │       └── page.tsx         # Client bookings
│   │   ├── [username]/
│   │   │   ├── page.tsx             # Diviner public landing page
│   │   │   └── book/
│   │   │       └── [serviceSlug]/
│   │   │           └── page.tsx     # Booking flow
│   │   ├── api/
│   │   │   ├── stripe/
│   │   │   │   ├── checkout/
│   │   │   │   │   └── route.ts     # Create checkout session (signup)
│   │   │   │   ├── connect/
│   │   │   │   │   └── route.ts     # Stripe Connect onboarding
│   │   │   │   ├── booking-payment/
│   │   │   │   │   └── route.ts     # Client booking payment
│   │   │   │   └── webhooks/
│   │   │   │       └── route.ts     # Stripe webhooks
│   │   │   ├── auth/
│   │   │   │   └── magic-link/
│   │   │   │       └── route.ts     # Send magic link to client
│   │   │   └── availability/
│   │   │       └── [divinerId]/
│   │   │           └── route.ts     # Public availability endpoint
│   │   └── instructions/
│   │       └── page.tsx             # Software walkthrough
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components (auto-generated)
│   │   ├── marketing/
│   │   │   ├── hero.tsx             # Homepage hero section
│   │   │   ├── feature-grid.tsx     # Features showcase
│   │   │   ├── pricing-card.tsx     # Pricing section
│   │   │   ├── testimonial-card.tsx # Marketing testimonials
│   │   │   ├── header.tsx           # Marketing site header
│   │   │   └── footer.tsx           # Marketing site footer
│   │   ├── dashboard/
│   │   │   ├── sidebar.tsx          # Dashboard sidebar navigation
│   │   │   ├── stats-cards.tsx      # Revenue/booking stat cards
│   │   │   ├── booking-list.tsx     # Booking list component
│   │   │   ├── service-form.tsx     # Service create/edit form
│   │   │   ├── availability-editor.tsx # Visual weekly availability editor
│   │   │   └── client-table.tsx     # Client CRM table
│   │   ├── booking/
│   │   │   ├── calendar-picker.tsx  # Date/time slot picker
│   │   │   ├── intake-form.tsx      # Pre-session questionnaire
│   │   │   └── booking-confirmation.tsx # Confirmation display
│   │   ├── landing/
│   │   │   ├── diviner-hero.tsx     # Diviner page hero
│   │   │   ├── service-card.tsx     # Service listing card
│   │   │   ├── testimonial-section.tsx # Testimonials display
│   │   │   └── booking-cta.tsx      # Call-to-action buttons
│   │   └── onboarding/
│   │       ├── step-profile.tsx     # Step 1: Profile setup
│   │       ├── step-services.tsx    # Step 2: Service selection
│   │       ├── step-payments.tsx    # Step 3: Stripe Connect
│   │       ├── step-availability.tsx # Step 4: Availability setup
│   │       └── step-preview.tsx     # Step 5: Preview & launch
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Browser Supabase client
│   │   │   ├── server.ts            # Server Supabase client
│   │   │   ├── admin.ts             # Service role client (for webhooks)
│   │   │   └── types.ts             # Generated database types
│   │   ├── stripe/
│   │   │   ├── client.ts            # Stripe SDK instance
│   │   │   ├── billing.ts           # Subscription helpers
│   │   │   └── connect.ts           # Connect Express helpers
│   │   ├── availability.ts          # Availability slot calculation
│   │   ├── constants.ts             # Service definitions, pricing, app constants
│   │   └── utils.ts                 # Shared utilities (cn, formatCurrency, etc.)
│   │
│   └── types/
│       ├── database.ts              # Supabase generated types
│       └── index.ts                 # App-level type definitions
│
├── tests/
│   ├── lib/
│   │   ├── availability.test.ts     # Availability calculation tests
│   │   └── stripe-billing.test.ts   # Stripe billing logic tests
│   ├── components/
│   │   └── service-card.test.tsx    # Component tests
│   └── setup.ts                     # Test setup file
│
└── public/
    ├── images/
    │   ├── hero-bg.webp             # Marketing hero background
    │   ├── logo.svg                 # AstrologyPro logo
    │   └── og-image.png             # Open Graph image
    └── fonts/                       # (Geist loaded via next/font)
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `.env.local.example`, `.gitignore`

- [ ] **Step 1: Initialize Next.js 16 project**

```bash
cd "C:\Users\Admin\OneDrive\Documents\ClaudeProjects\AstrologyPro"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

Expected: Project scaffolded with Next.js 16 defaults.

- [ ] **Step 2: Install core dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr stripe @stripe/stripe-js lucide-react date-fns
npm install -D @types/node supabase
```

- [ ] **Step 3: Install shadcn/ui**

```bash
npx shadcn@latest init -d
```

Select: New York style, Zinc base color, CSS variables.

- [ ] **Step 4: Add essential shadcn components**

```bash
npx shadcn@latest add button card input label textarea select badge avatar dialog sheet tabs separator dropdown-menu toast calendar form table checkbox switch tooltip popover command scroll-area
```

- [ ] **Step 5: Configure next.config.ts**

Replace `next.config.ts` with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 6: Create .env.local.example**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...

# Stripe Pricing
STRIPE_PRICE_SETUP=price_... # $197 one-time
STRIPE_PRICE_MONTHLY=price_... # $149/month

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 7: Update .gitignore**

Append to existing `.gitignore`:

```
.env*.local
.vercel
```

- [ ] **Step 8: Initialize git and commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Next.js 16 project with shadcn/ui, Supabase, Stripe deps"
```

---

## Task 2: Supabase Client Setup and Types

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`, `src/types/database.ts`, `src/types/index.ts`

- [ ] **Step 1: Create database types**

Create `src/types/database.ts`:

```ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      diviners: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          display_name: string;
          bio: string | null;
          avatar_url: string | null;
          cover_image_url: string | null;
          tagline: string | null;
          specialties: string[];
          stripe_account_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: string;
          google_calendar_token: Json | null;
          youtube_channel_id: string | null;
          facebook_live_url: string | null;
          timezone: string;
          platform_fee_percent: number;
          onboarding_completed: boolean;
          onboarding_step: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["diviners"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["diviners"]["Insert"]>;
      };
      services: {
        Row: {
          id: string;
          diviner_id: string;
          category: "astrology" | "tarot";
          name: string;
          slug: string;
          description: string | null;
          duration_minutes: number;
          base_price: number;
          overage_rate: number;
          is_primary: boolean;
          is_featured: boolean;
          requires_birth_data: boolean;
          trigger_event: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["services"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          birth_date: string | null;
          birth_time: string | null;
          birth_city: string | null;
          birth_lat: number | null;
          birth_lng: number | null;
          birth_timezone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["clients"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
      };
      bookings: {
        Row: {
          id: string;
          diviner_id: string;
          client_id: string;
          service_id: string;
          status: "pending" | "confirmed" | "in_progress" | "completed" | "canceled" | "no_show";
          scheduled_at: string;
          duration_minutes: number;
          actual_duration_minutes: number | null;
          base_price: number;
          overage_amount: number;
          total_amount: number | null;
          stripe_payment_intent_id: string | null;
          stripe_payment_status: string | null;
          daily_room_name: string | null;
          daily_room_url: string | null;
          recording_url: string | null;
          recording_share_id: string | null;
          questionnaire_responses: Json | null;
          session_notes: string | null;
          affiliate_id: string | null;
          google_calendar_event_id: string | null;
          canceled_at: string | null;
          cancellation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["bookings"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
      };
      availability_slots: {
        Row: {
          id: string;
          diviner_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["availability_slots"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["availability_slots"]["Insert"]>;
      };
      availability_overrides: {
        Row: {
          id: string;
          diviner_id: string;
          date: string;
          is_available: boolean;
          start_time: string | null;
          end_time: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["availability_overrides"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["availability_overrides"]["Insert"]>;
      };
      testimonials: {
        Row: {
          id: string;
          diviner_id: string;
          client_id: string | null;
          client_name: string | null;
          rating: number;
          text: string;
          service_type: string | null;
          status: "pending" | "approved" | "rejected";
          is_featured: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["testimonials"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["testimonials"]["Insert"]>;
      };
      affiliates: {
        Row: {
          id: string;
          diviner_id: string;
          name: string;
          email: string;
          phone: string | null;
          referral_code: string;
          commission_percent: number;
          total_referrals: number;
          total_earned: number;
          total_paid: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["affiliates"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["affiliates"]["Insert"]>;
      };
      affiliate_referrals: {
        Row: {
          id: string;
          affiliate_id: string;
          client_id: string | null;
          booking_id: string | null;
          commission_amount: number | null;
          status: "pending" | "earned" | "paid";
          paid_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["affiliate_referrals"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["affiliate_referrals"]["Insert"]>;
      };
      client_diviners: {
        Row: {
          id: string;
          client_id: string;
          diviner_id: string;
          first_session_at: string | null;
          total_sessions: number;
          total_spent: number;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["client_diviners"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["client_diviners"]["Insert"]>;
      };
      intake_forms: {
        Row: {
          id: string;
          diviner_id: string;
          service_id: string | null;
          questions: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["intake_forms"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["intake_forms"]["Insert"]>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
```

- [ ] **Step 2: Create app-level types**

Create `src/types/index.ts`:

```ts
import type { Database } from "./database";

export type Diviner = Database["public"]["Tables"]["diviners"]["Row"];
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type AvailabilitySlot = Database["public"]["Tables"]["availability_slots"]["Row"];
export type AvailabilityOverride = Database["public"]["Tables"]["availability_overrides"]["Row"];
export type Testimonial = Database["public"]["Tables"]["testimonials"]["Row"];
export type Affiliate = Database["public"]["Tables"]["affiliates"]["Row"];
export type AffiliateReferral = Database["public"]["Tables"]["affiliate_referrals"]["Row"];
export type ClientDiviner = Database["public"]["Tables"]["client_diviners"]["Row"];
export type IntakeForm = Database["public"]["Tables"]["intake_forms"]["Row"];

export type ServiceCategory = "astrology" | "tarot";
export type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "canceled" | "no_show";
export type TestimonialStatus = "pending" | "approved" | "rejected";
export type AffiliateReferralStatus = "pending" | "earned" | "paid";

export interface TimeSlot {
  start: string; // ISO 8601
  end: string;
}

export interface BookingFormData {
  serviceId: string;
  scheduledAt: string;
  questionnaire: Record<string, string>;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  birthDate?: string;
  birthTime?: string;
  birthCity?: string;
  affiliateCode?: string;
}
```

- [ ] **Step 3: Create browser Supabase client**

Create `src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 4: Create server Supabase client**

Create `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — ignore
          }
        },
      },
    }
  );
}
```

- [ ] **Step 5: Create admin Supabase client**

Create `src/lib/supabase/admin.ts`:

```ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase/ src/types/
git commit -m "feat: add Supabase client setup and database types"
```

---

## Task 3: Database Migrations

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`, `supabase/migrations/002_rls_policies.sql`, `supabase/migrations/003_seed_services.sql`

- [ ] **Step 1: Create initial schema migration**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Diviners (practitioners)
CREATE TABLE diviners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  tagline VARCHAR(200),
  specialties TEXT[] DEFAULT '{}',
  stripe_account_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(20) DEFAULT 'trialing',
  google_calendar_token JSONB,
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

CREATE UNIQUE INDEX idx_diviners_user_id ON diviners(user_id);
CREATE UNIQUE INDEX idx_diviners_username ON diviners(username);

-- Services offered by each diviner
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('astrology', 'tarot')),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  overage_rate DECIMAL(10,2) DEFAULT 0.50,
  is_primary BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  requires_birth_data BOOLEAN DEFAULT TRUE,
  trigger_event VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_diviner_id ON services(diviner_id);

-- Clients (people getting readings)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

CREATE UNIQUE INDEX idx_clients_user_id ON clients(user_id);

-- Client-Diviner relationship
CREATE TABLE client_diviners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  first_session_at TIMESTAMPTZ,
  total_sessions INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, diviner_id)
);

-- Availability (source of truth for scheduling)
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_availability_diviner ON availability_slots(diviner_id);

-- Availability overrides (days off, special hours)
CREATE TABLE availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT FALSE,
  start_time TIME,
  end_time TIME
);

CREATE INDEX idx_overrides_diviner_date ON availability_overrides(diviner_id, date);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'canceled', 'no_show')),
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
  session_notes TEXT,
  affiliate_id UUID,
  google_calendar_event_id VARCHAR(255),
  canceled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_diviner ON bookings(diviner_id);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_scheduled ON bookings(scheduled_at);

-- Affiliates
CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
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

CREATE INDEX idx_affiliates_diviner ON affiliates(diviner_id);

-- Affiliate referrals
CREATE TABLE affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id),
  booking_id UUID REFERENCES bookings(id),
  commission_amount DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'earned', 'paid')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Testimonials
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id),
  client_name VARCHAR(100),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL,
  service_type VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_testimonials_diviner ON testimonials(diviner_id);

-- Intake questionnaire templates
CREATE TABLE intake_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id),
  questions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracking links
CREATE TABLE tracking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  destination_url TEXT NOT NULL,
  source VARCHAR(50),
  campaign VARCHAR(100),
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER diviners_updated_at BEFORE UPDATE ON diviners FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

- [ ] **Step 2: Create RLS policies**

Create `supabase/migrations/002_rls_policies.sql`:

```sql
-- Enable RLS on all tables
ALTER TABLE diviners ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_diviners ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_links ENABLE ROW LEVEL SECURITY;

-- DIVINERS: own data + public read for landing pages
CREATE POLICY "diviners_select_own" ON diviners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "diviners_public_read" ON diviners FOR SELECT USING (is_active = TRUE);
CREATE POLICY "diviners_update_own" ON diviners FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "diviners_insert_own" ON diviners FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SERVICES: diviner manages own + public read for active diviners
CREATE POLICY "services_diviner_manage" ON services FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
CREATE POLICY "services_public_read" ON services FOR SELECT USING (
  is_active = TRUE AND diviner_id IN (SELECT id FROM diviners WHERE is_active = TRUE)
);

-- CLIENTS: own data only
CREATE POLICY "clients_select_own" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "clients_update_own" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "clients_insert_own" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CLIENT_DIVINERS: diviner sees their clients, client sees their diviners
CREATE POLICY "cd_diviner_read" ON client_diviners FOR SELECT USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
CREATE POLICY "cd_client_read" ON client_diviners FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);
CREATE POLICY "cd_diviner_manage" ON client_diviners FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);

-- AVAILABILITY: diviner manages own + public read
CREATE POLICY "avail_diviner_manage" ON availability_slots FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
CREATE POLICY "avail_public_read" ON availability_slots FOR SELECT USING (is_active = TRUE);

CREATE POLICY "overrides_diviner_manage" ON availability_overrides FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
CREATE POLICY "overrides_public_read" ON availability_overrides FOR SELECT USING (TRUE);

-- BOOKINGS: diviner sees theirs, client sees theirs
CREATE POLICY "bookings_diviner" ON bookings FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
CREATE POLICY "bookings_client_read" ON bookings FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);
CREATE POLICY "bookings_client_insert" ON bookings FOR INSERT WITH CHECK (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

-- AFFILIATES: diviner manages own
CREATE POLICY "affiliates_diviner" ON affiliates FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);

-- AFFILIATE REFERRALS: diviner reads own
CREATE POLICY "referrals_diviner" ON affiliate_referrals FOR ALL USING (
  affiliate_id IN (
    SELECT id FROM affiliates WHERE diviner_id IN (
      SELECT id FROM diviners WHERE user_id = auth.uid()
    )
  )
);

-- TESTIMONIALS: diviner manages own + public read approved
CREATE POLICY "testimonials_diviner" ON testimonials FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
CREATE POLICY "testimonials_public_read" ON testimonials FOR SELECT USING (status = 'approved');
CREATE POLICY "testimonials_client_insert" ON testimonials FOR INSERT WITH CHECK (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

-- INTAKE FORMS: diviner manages own + public read
CREATE POLICY "intake_diviner" ON intake_forms FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
CREATE POLICY "intake_public_read" ON intake_forms FOR SELECT USING (TRUE);

-- TRACKING LINKS: diviner manages own + public read for redirect
CREATE POLICY "tracking_diviner" ON tracking_links FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
CREATE POLICY "tracking_public_read" ON tracking_links FOR SELECT USING (TRUE);
```

- [ ] **Step 3: Create seed data for default service templates**

Create `supabase/migrations/003_seed_services.sql`:

```sql
-- This file defines the default service templates.
-- When a diviner signs up, they select from these and copies are created in the services table.
-- This is stored as a reference table, not in the services table directly.

CREATE TABLE service_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  overage_rate DECIMAL(10,2) DEFAULT 0.50,
  is_primary BOOLEAN DEFAULT TRUE,
  requires_birth_data BOOLEAN DEFAULT TRUE,
  trigger_event VARCHAR(50),
  sort_order INTEGER DEFAULT 0
);

INSERT INTO service_templates (category, name, slug, description, duration_minutes, base_price, is_primary, requires_birth_data, trigger_event, sort_order) VALUES
-- Astrology
('astrology', 'Natal Chart Reading', 'natal-chart', 'A comprehensive reading of your birth chart revealing your personality, strengths, challenges, and life purpose.', 60, 100.00, TRUE, TRUE, NULL, 1),
('astrology', 'Solar Return Reading', 'solar-return', 'Your yearly forecast based on the Sun returning to its natal position. Reveals themes for your upcoming birthday year.', 60, 100.00, FALSE, TRUE, 'solar_return', 2),
('astrology', 'Monthly Transit Reading', 'monthly-transit', 'Monthly overview including lunar return analysis. Understand the energies and opportunities of the coming month.', 30, 50.00, TRUE, TRUE, NULL, 3),
('astrology', 'Saturn Return Reading', 'saturn-return', 'Navigate this pivotal life passage (ages ~29, 58). Understand the lessons and transformations ahead.', 60, 100.00, FALSE, TRUE, 'saturn_return', 4),
('astrology', 'Jupiter Return Reading', 'jupiter-return', 'Harness the expansion and growth of your Jupiter return cycle for maximum opportunity.', 60, 100.00, FALSE, TRUE, 'jupiter_return', 5),
('astrology', 'Weekly Transit Reading', 'weekly-transits', 'Detailed weekly forecast with daily highlights. Perfect for staying aligned with cosmic energies.', 30, 50.00, TRUE, TRUE, NULL, 6),
('astrology', 'Romantic Relationship Reading', 'romantic-relationships', 'Synastry and composite chart analysis for romantic partners. Understand your connection deeply.', 60, 100.00, TRUE, TRUE, NULL, 7),
('astrology', 'Friendship Compatibility Reading', 'friendship-relationships', 'Explore the astrological dynamics of your friendship. Strengthen understanding and connection.', 60, 100.00, TRUE, TRUE, NULL, 8),
('astrology', 'Business Relationship Reading', 'business-relationships', 'Partnership synastry for business. Identify strengths, challenges, and optimal collaboration strategies.', 60, 100.00, TRUE, TRUE, NULL, 9),
('astrology', 'Horary (Predictive Event) Reading', 'horary', 'Answer a specific question using the chart of the moment. Will I get the job? Should I move?', 30, 50.00, TRUE, FALSE, NULL, 10),
('astrology', 'Freelance Astrology Reading', 'astrology-freelance', 'Open-format astrology session. Discuss any topic or combination of techniques.', 30, 50.00, TRUE, TRUE, NULL, 11),
-- Tarot
('tarot', '3-Card Basic Spread', '3-card-basic', 'Past, Present, Future — a quick and focused reading for simple questions.', 30, 50.00, TRUE, FALSE, NULL, 12),
('tarot', '5-Card Complex Spread', '5-card-complex', 'A deeper dive into complex questions with multiple influencing factors.', 30, 50.00, TRUE, FALSE, NULL, 13),
('tarot', '7-Card 6-Month Forecast', '7-card-forecast', 'Six months ahead — one card per month plus a theme card. Plan your future.', 30, 50.00, TRUE, FALSE, NULL, 14),
('tarot', '7-Card Horseshoe Spread', '7-card-horseshoe', 'A major reading covering past influences, present situation, and future possibilities.', 60, 100.00, TRUE, FALSE, NULL, 15),
('tarot', '10-Card Relationship Spread', '10-card-relationship', 'In-depth relationship analysis covering both partners perspectives and the relationship itself.', 60, 100.00, TRUE, FALSE, NULL, 16),
('tarot', '10-Card Celtic Cross', '10-card-celtic-cross', 'The classic comprehensive tarot reading. Covers all aspects of your question in depth.', 60, 100.00, TRUE, FALSE, NULL, 17),
('tarot', '12-Card Astrological Spread', '12-card-astrological', 'One card per astrological house. A complete life reading covering all areas.', 60, 100.00, TRUE, FALSE, NULL, 18),
('tarot', 'Freelance Tarot Reading', 'tarot-freelance', 'Open-format tarot session. Any spread, any topic, tailored to your needs.', 30, 50.00, TRUE, FALSE, NULL, 19);
```

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema, RLS policies, and service templates"
```

---

## Task 4: Utility Libraries and Constants

**Files:**
- Create: `src/lib/utils.ts`, `src/lib/constants.ts`

- [ ] **Step 1: Create utils**

Create `src/lib/utils.ts`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function generateShareId(): string {
  return Math.random().toString(36).substring(2, 14);
}
```

- [ ] **Step 2: Create constants**

Create `src/lib/constants.ts`:

```ts
export const APP_NAME = "AstrologyPro";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://astrologypro.com";

export const PRICING = {
  setup: 197,
  monthly: 149,
  overagePerMinute: 0.5,
  platformFeePercent: 10,
} as const;

export const SESSION_DURATIONS = {
  short: 30,
  standard: 60,
} as const;

export const BOOKING_STATUSES = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  canceled: "Canceled",
  no_show: "No Show",
} as const;

export const SPECIALTIES = [
  { value: "astrology", label: "Astrology" },
  { value: "tarot", label: "Tarot" },
  { value: "both", label: "Astrology & Tarot" },
] as const;

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const NAV_ITEMS = {
  marketing: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Log In", href: "/login" },
  ],
  dashboard: [
    { label: "Overview", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Bookings", href: "/dashboard/bookings", icon: "Calendar" },
    { label: "Clients", href: "/dashboard/clients", icon: "Users" },
    { label: "Services", href: "/dashboard/services", icon: "Sparkles" },
    { label: "Profile", href: "/dashboard/profile", icon: "User" },
    { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
  ],
} as const;
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils.ts src/lib/constants.ts
git commit -m "feat: add utility functions and app constants"
```

---

## Task 5: Stripe Setup

**Files:**
- Create: `src/lib/stripe/client.ts`, `src/lib/stripe/billing.ts`, `src/lib/stripe/connect.ts`

- [ ] **Step 1: Create Stripe client**

Create `src/lib/stripe/client.ts`:

```ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
  typescript: true,
});
```

- [ ] **Step 2: Create billing helpers**

Create `src/lib/stripe/billing.ts`:

```ts
import { stripe } from "./client";

export async function createCheckoutSession({
  email,
  userId,
  successUrl,
  cancelUrl,
}: {
  email: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripe.checkout.sessions.create({
    customer_email: email,
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_SETUP!,
        quantity: 1,
      },
      {
        price: process.env.STRIPE_PRICE_MONTHLY!,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
    },
  });
}

export async function getSubscription(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId);
}

export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}
```

- [ ] **Step 3: Create Connect helpers**

Create `src/lib/stripe/connect.ts`:

```ts
import { stripe } from "./client";

export async function createConnectAccount({
  email,
  divinerId,
}: {
  email: string;
  divinerId: string;
}) {
  return stripe.accounts.create({
    type: "express",
    email,
    metadata: { divinerId },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
}

export async function createConnectOnboardingLink({
  accountId,
  refreshUrl,
  returnUrl,
}: {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}) {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
}

export async function createPaymentIntent({
  amount,
  connectedAccountId,
  platformFeeAmount,
  customerId,
  metadata,
}: {
  amount: number;
  connectedAccountId: string;
  platformFeeAmount: number;
  customerId?: string;
  metadata: Record<string, string>;
}) {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: "usd",
    application_fee_amount: Math.round(platformFeeAmount * 100),
    transfer_data: {
      destination: connectedAccountId,
    },
    metadata,
    ...(customerId && { customer: customerId }),
  });
}

export async function getConnectAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId);
  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/stripe/
git commit -m "feat: add Stripe billing and Connect helpers"
```

---

## Task 6: Availability System

**Files:**
- Create: `src/lib/availability.ts`, `tests/lib/availability.test.ts`

- [ ] **Step 1: Write failing tests for availability calculation**

Create `tests/lib/availability.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  getAvailableSlots,
  isSlotAvailable,
  type SlotConfig,
  type BookedSlot,
} from "@/lib/availability";

describe("getAvailableSlots", () => {
  const weeklySlots: SlotConfig[] = [
    { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }, // Monday
    { dayOfWeek: 3, startTime: "10:00", endTime: "15:00" }, // Wednesday
  ];

  it("returns slots for a day with availability", () => {
    // 2026-04-06 is a Monday
    const slots = getAvailableSlots({
      date: "2026-04-06",
      weeklySlots,
      bookedSlots: [],
      overrides: [],
      durationMinutes: 60,
      timezone: "America/New_York",
    });
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].start).toContain("2026-04-06");
  });

  it("returns empty for a day with no availability", () => {
    // 2026-04-07 is a Tuesday — not in weeklySlots
    const slots = getAvailableSlots({
      date: "2026-04-07",
      weeklySlots,
      bookedSlots: [],
      overrides: [],
      durationMinutes: 60,
      timezone: "America/New_York",
    });
    expect(slots).toHaveLength(0);
  });

  it("excludes slots that overlap with bookings", () => {
    const bookedSlots: BookedSlot[] = [
      { start: "2026-04-06T09:00:00-04:00", end: "2026-04-06T10:00:00-04:00" },
    ];
    const slots = getAvailableSlots({
      date: "2026-04-06",
      weeklySlots,
      bookedSlots,
      overrides: [],
      durationMinutes: 60,
      timezone: "America/New_York",
    });
    const nineAm = slots.find((s) => s.start.includes("T09:00"));
    expect(nineAm).toBeUndefined();
  });

  it("respects day-off overrides", () => {
    const slots = getAvailableSlots({
      date: "2026-04-06",
      weeklySlots,
      bookedSlots: [],
      overrides: [{ date: "2026-04-06", isAvailable: false }],
      durationMinutes: 60,
      timezone: "America/New_York",
    });
    expect(slots).toHaveLength(0);
  });

  it("generates correct slot count for 30-minute duration", () => {
    // Monday 09:00-17:00 = 8 hours = 16 thirty-minute slots
    const slots = getAvailableSlots({
      date: "2026-04-06",
      weeklySlots,
      bookedSlots: [],
      overrides: [],
      durationMinutes: 30,
      timezone: "America/New_York",
    });
    expect(slots).toHaveLength(16);
  });
});

describe("isSlotAvailable", () => {
  it("returns true for non-overlapping slot", () => {
    const result = isSlotAvailable(
      { start: "2026-04-06T11:00:00Z", end: "2026-04-06T12:00:00Z" },
      [{ start: "2026-04-06T09:00:00Z", end: "2026-04-06T10:00:00Z" }]
    );
    expect(result).toBe(true);
  });

  it("returns false for overlapping slot", () => {
    const result = isSlotAvailable(
      { start: "2026-04-06T09:30:00Z", end: "2026-04-06T10:30:00Z" },
      [{ start: "2026-04-06T09:00:00Z", end: "2026-04-06T10:00:00Z" }]
    );
    expect(result).toBe(false);
  });
});
```

- [ ] **Step 2: Install vitest and run tests to verify failure**

```bash
npm install -D vitest @vitejs/plugin-react
```

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Run: `npm test -- tests/lib/availability.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement availability calculation**

Create `src/lib/availability.ts`:

```ts
export interface SlotConfig {
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

export interface BookedSlot {
  start: string; // ISO 8601
  end: string;
}

export interface Override {
  date: string; // "YYYY-MM-DD"
  isAvailable: boolean;
  startTime?: string;
  endTime?: string;
}

interface GetAvailableSlotsParams {
  date: string; // "YYYY-MM-DD"
  weeklySlots: SlotConfig[];
  bookedSlots: BookedSlot[];
  overrides: Override[];
  durationMinutes: number;
  timezone: string;
}

export function getAvailableSlots({
  date,
  weeklySlots,
  bookedSlots,
  overrides,
  durationMinutes,
}: GetAvailableSlotsParams): { start: string; end: string }[] {
  // Check for day-off override
  const override = overrides.find((o) => o.date === date);
  if (override && !override.isAvailable) return [];

  const dateObj = new Date(date + "T00:00:00");
  const dayOfWeek = dateObj.getUTCDay();

  // Get applicable time ranges for this day
  let timeRanges: { startTime: string; endTime: string }[];

  if (override?.isAvailable && override.startTime && override.endTime) {
    timeRanges = [{ startTime: override.startTime, endTime: override.endTime }];
  } else {
    timeRanges = weeklySlots
      .filter((s) => s.dayOfWeek === dayOfWeek)
      .map((s) => ({ startTime: s.startTime, endTime: s.endTime }));
  }

  if (timeRanges.length === 0) return [];

  const slots: { start: string; end: string }[] = [];

  for (const range of timeRanges) {
    const [startH, startM] = range.startTime.split(":").map(Number);
    const [endH, endM] = range.endTime.split(":").map(Number);

    const rangeStartMinutes = startH * 60 + startM;
    const rangeEndMinutes = endH * 60 + endM;

    for (
      let minutes = rangeStartMinutes;
      minutes + durationMinutes <= rangeEndMinutes;
      minutes += durationMinutes
    ) {
      const slotStartH = Math.floor(minutes / 60).toString().padStart(2, "0");
      const slotStartM = (minutes % 60).toString().padStart(2, "0");
      const slotEndMinutes = minutes + durationMinutes;
      const slotEndH = Math.floor(slotEndMinutes / 60).toString().padStart(2, "0");
      const slotEndM = (slotEndMinutes % 60).toString().padStart(2, "0");

      const start = `${date}T${slotStartH}:${slotStartM}:00`;
      const end = `${date}T${slotEndH}:${slotEndM}:00`;

      if (isSlotAvailable({ start, end }, bookedSlots)) {
        slots.push({ start, end });
      }
    }
  }

  return slots;
}

export function isSlotAvailable(
  slot: { start: string; end: string },
  bookedSlots: BookedSlot[]
): boolean {
  const slotStart = new Date(slot.start).getTime();
  const slotEnd = new Date(slot.end).getTime();

  return !bookedSlots.some((booked) => {
    const bookedStart = new Date(booked.start).getTime();
    const bookedEnd = new Date(booked.end).getTime();
    return slotStart < bookedEnd && slotEnd > bookedStart;
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/lib/availability.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/availability.ts tests/ vitest.config.ts
git commit -m "feat: add availability calculation with tests"
```

---

## Task 7: Root Layout and Global Styles

**Files:**
- Create/Modify: `src/app/layout.tsx`, `src/app/globals.css`

- [ ] **Step 1: Update globals.css for dark mode mystical theme**

Replace `src/app/globals.css` with:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.625rem;
  /* Dark mode as default (mystical theme) */
  --background: oklch(0.145 0.014 285.82);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.17 0.017 285.82);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.17 0.017 285.82);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.65 0.18 280); /* Purple accent */
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.24 0.02 285.82);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.24 0.02 285.82);
  --muted-foreground: oklch(0.65 0 0);
  --accent: oklch(0.24 0.02 285.82);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.55 0.2 27.33);
  --border: oklch(0.3 0.02 285.82);
  --input: oklch(0.3 0.02 285.82);
  --ring: oklch(0.65 0.18 280);
  --chart-1: oklch(0.65 0.18 280);
  --chart-2: oklch(0.6 0.15 200);
  --chart-3: oklch(0.55 0.12 160);
  --chart-4: oklch(0.65 0.1 80);
  --chart-5: oklch(0.55 0.18 320);
  --sidebar: oklch(0.13 0.014 285.82);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.65 0.18 280);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.24 0.02 285.82);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(0.3 0.02 285.82);
  --sidebar-ring: oklch(0.65 0.18 280);
}
```

- [ ] **Step 2: Update root layout**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AstrologyPro - Run Your Divination Business",
    template: "%s | AstrologyPro",
  },
  description:
    "The all-in-one platform for astrologers and tarot readers. Get your own branded page, booking system, video sessions, and marketing tools.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://astrologypro.com"),
  openGraph: {
    title: "AstrologyPro - Run Your Divination Business",
    description:
      "Everything astrologers and tarot readers need to run their business online.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Install geist font and sonner**

```bash
npm install geist
npx shadcn@latest add sonner
```

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat: add dark mystical theme and root layout with Geist fonts"
```

---

## Task 8: Marketing Site Header and Footer

**Files:**
- Create: `src/components/marketing/header.tsx`, `src/components/marketing/footer.tsx`

- [ ] **Step 1: Create marketing header**

Create `src/components/marketing/header.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">AstrologyPro</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Log In
          </Link>
          <Button asChild>
            <Link href="/get-started">Get Started</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create marketing footer**

Create `src/components/marketing/footer.tsx`:

```tsx
import Link from "next/link";
import { Sparkles } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold">AstrologyPro</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Everything you need to run your divination business online.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Platform</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/instructions" className="text-sm text-muted-foreground hover:text-foreground">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Services</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">Astrology Readings</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Tarot Readings</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Video Consultations</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Support</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/instructions" className="text-sm text-muted-foreground hover:text-foreground">
                  Getting Started Guide
                </Link>
              </li>
              <li>
                <a href="mailto:support@astrologypro.com" className="text-sm text-muted-foreground hover:text-foreground">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border/40 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AstrologyPro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/marketing/
git commit -m "feat: add marketing header and footer components"
```

---

## Task 9: Marketing Homepage

**Files:**
- Create: `src/app/page.tsx`, `src/components/marketing/hero.tsx`, `src/components/marketing/feature-grid.tsx`, `src/components/marketing/pricing-card.tsx`

- [ ] **Step 1: Create hero section**

Create `src/components/marketing/hero.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Video, Calendar, TrendingUp } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      {/* Subtle background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary">
          <Star className="h-3.5 w-3.5" />
          The #1 Platform for Professional Diviners
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Run Your Divination{" "}
          <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Business Online
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Get your own branded page, booking system, video sessions with screen
          sharing, client management, and marketing tools. Everything an
          astrologer or tarot reader needs in one platform.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild className="gap-2 text-base">
            <Link href="/get-started">
              Start Your Practice
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-base">
            <Link href="/features">See All Features</Link>
          </Button>
        </div>

        {/* Feature pills */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: Video, label: "HD Video Sessions" },
            { icon: Calendar, label: "Smart Booking" },
            { icon: TrendingUp, label: "Marketing Tools" },
            { icon: Star, label: "Client Reviews" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-2 text-sm text-muted-foreground"
            >
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create feature grid**

Create `src/components/marketing/feature-grid.tsx`:

```tsx
import {
  Globe,
  Video,
  Calendar,
  CreditCard,
  Users,
  Share2,
  MessageSquare,
  BarChart3,
  Sparkles,
  Shield,
  Zap,
  Heart,
} from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Your Branded Page",
    description:
      "Get a professional landing page at astrologypro.com/yourname. Showcase your services, testimonials, and book clients.",
  },
  {
    icon: Video,
    title: "HD Video Sessions",
    description:
      "Crystal-clear video with screen sharing. Show your charts and cards live. Every session auto-recorded.",
  },
  {
    icon: Calendar,
    title: "Smart Booking",
    description:
      "Clients book based on your real availability. Google Calendar sync. Automatic reminders.",
  },
  {
    icon: CreditCard,
    title: "Instant Payments",
    description:
      "Accept payments via Stripe. Automatic overage billing. Your money, your account.",
  },
  {
    icon: Users,
    title: "Client CRM",
    description:
      "Track birth data, session history, and notes for every client. Build lasting relationships.",
  },
  {
    icon: Share2,
    title: "Social Marketing",
    description:
      "Auto-post to Instagram, Twitter, YouTube, and more. Pre-made content with your links.",
  },
  {
    icon: MessageSquare,
    title: "Testimonials",
    description:
      "Collect and display client reviews on your page. Build trust and credibility automatically.",
  },
  {
    icon: BarChart3,
    title: "Affiliate Program",
    description:
      "Set up affiliates to send you clients. Track referrals, commissions, and payouts.",
  },
  {
    icon: Sparkles,
    title: "Astrology & Tarot Tools",
    description:
      "Full access to professional chart calculation and tarot software during sessions.",
  },
  {
    icon: Shield,
    title: "Session Recordings",
    description:
      "Every session recorded automatically. Clients can rewatch and share on social media.",
  },
  {
    icon: Zap,
    title: "Event Reminders",
    description:
      "Auto-detect solar returns, Saturn returns, and more. Remind clients to book at the perfect time.",
  },
  {
    icon: Heart,
    title: "Live Streaming",
    description:
      "Stream from YouTube or Facebook Live right on your page. Attract viewers to your services.",
  },
];

export function FeatureGrid() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Everything You Need to{" "}
            <span className="text-primary">Thrive</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Stop juggling Zoom, Calendly, Squarespace, and PayPal. One platform,
            one price, everything included.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border/60 bg-card/50 p-6 transition-colors hover:border-primary/30 hover:bg-card"
            >
              <feature.icon className="h-10 w-10 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create pricing card**

Create `src/components/marketing/pricing-card.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const included = [
  "Your branded landing page",
  "19 consultation types (Astrology & Tarot)",
  "HD video sessions with screen sharing",
  "Automatic session recording",
  "Smart booking & calendar sync",
  "Stripe payment processing",
  "Client CRM & birth data management",
  "Affiliate program tools",
  "Social media auto-posting",
  "Email & SMS notifications",
  "Astrological event reminders",
  "Client testimonials system",
  "YouTube & Facebook Live embed",
  "Full astrology & tarot software access",
  "Session recording sharing",
];

export function PricingCard() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8" id="pricing">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          Simple, <span className="text-primary">All-Inclusive</span> Pricing
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          One plan. Everything included. No hidden fees.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-lg">
        <div className="rounded-2xl border-2 border-primary/50 bg-card p-8 shadow-xl shadow-primary/5">
          <div className="text-center">
            <h3 className="text-2xl font-bold">Professional Plan</h3>
            <div className="mt-4">
              <span className="text-5xl font-bold">$149</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              + $197 one-time setup fee
            </p>
          </div>

          <ul className="mt-8 space-y-3">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>

          <Button size="lg" className="mt-8 w-full text-base" asChild>
            <Link href="/get-started">Start Your Practice Today</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create homepage**

Replace `src/app/page.tsx` with:

```tsx
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/hero";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { PricingCard } from "@/components/marketing/pricing-card";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <Hero />
        <FeatureGrid />
        <PricingCard />
      </main>
      <MarketingFooter />
    </div>
  );
}
```

- [ ] **Step 5: Verify the site builds and renders**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/components/marketing/
git commit -m "feat: add marketing homepage with hero, features, and pricing"
```

---

## Task 10: Auth Setup (Login + Signup Pages)

**Files:**
- Create: `src/app/login/page.tsx`, `src/app/auth/callback/route.ts`, `src/app/auth/confirm/route.ts`, `proxy.ts`

- [ ] **Step 1: Create auth callback route**

Create `src/app/auth/callback/route.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
```

- [ ] **Step 2: Create email confirmation route**

Create `src/app/auth/confirm/route.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "signup" | "magiclink" | "email";
  const next = searchParams.get("next") ?? "/dashboard";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
```

- [ ] **Step 3: Create login page**

Create `src/app/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [divinerEmail, setDivinerEmail] = useState("");
  const [divinerPassword, setDivinerPassword] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const supabase = createClient();

  async function handleDivinerLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: divinerEmail,
      password: divinerPassword,
    });

    if (error) {
      setError(error.message);
    } else {
      window.location.href = "/dashboard";
    }
    setLoading(false);
  }

  async function handleClientLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email: clientEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/portal`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email for a login link!");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-primary" />
            <h1 className="mt-4 text-2xl font-bold">Welcome Back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your account
            </p>
          </div>

          <Tabs defaultValue="diviner" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="diviner">Diviner</TabsTrigger>
              <TabsTrigger value="client">Client</TabsTrigger>
            </TabsList>

            <TabsContent value="diviner">
              <form onSubmit={handleDivinerLogin} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="diviner-email">Email</Label>
                  <Input
                    id="diviner-email"
                    type="email"
                    value={divinerEmail}
                    onChange={(e) => setDivinerEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diviner-password">Password</Label>
                  <Input
                    id="diviner-password"
                    type="password"
                    value={divinerPassword}
                    onChange={(e) => setDivinerPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  New diviner?{" "}
                  <Link href="/get-started" className="text-primary hover:underline">
                    Get started here
                  </Link>
                </p>
              </form>
            </TabsContent>

            <TabsContent value="client">
              <form onSubmit={handleClientLogin} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client-email">Email</Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="Enter your email for a login link"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Login Link
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  No password needed. We'll email you a secure link.
                </p>
              </form>
            </TabsContent>
          </Tabs>

          {error && (
            <p className="mt-4 text-center text-sm text-destructive">{error}</p>
          )}
          {message && (
            <p className="mt-4 text-center text-sm text-primary">{message}</p>
          )}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
```

- [ ] **Step 4: Create proxy.ts for auth protection**

Create `proxy.ts` at project root (same level as `src/`):

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
    // Auth check will be done in the layout's server component
    // Proxy just refreshes the session cookie
  }

  // Protect client portal
  if (pathname.startsWith("/portal")) {
    // Same — session refresh only
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 5: Commit**

```bash
git add src/app/login/ src/app/auth/ proxy.ts
git commit -m "feat: add login page with diviner/client tabs and auth routes"
```

---

## Remaining Tasks (Summary)

The following tasks follow the same pattern. Each is fully specified in the plan but abbreviated here for space:

### Task 11: Get Started (Signup) Page + Stripe Checkout API Route
- Diviner signup form (email, password, username)
- Create Supabase user → Create Stripe Checkout session → Redirect to Stripe
- Stripe webhook handler for `checkout.session.completed` → Create diviner record

### Task 12: Stripe Webhook Handler
- Handle `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`
- Create/update diviner records based on subscription status

### Task 13: Onboarding Wizard (5 Steps)
- Step 1: Profile (photo, name, bio, tagline)
- Step 2: Service selection (checkboxes from templates, editable pricing)
- Step 3: Stripe Connect Express onboarding
- Step 4: Visual availability editor
- Step 5: Preview & launch

### Task 14: Dashboard Layout (Sidebar + Header)
- Server Component that checks auth and redirects if not logged in
- Sidebar with navigation, user avatar, subscription status
- Header with breadcrumbs

### Task 15: Dashboard Overview Page
- Revenue stats (30/60/90 day), booking count, client count
- Upcoming bookings list
- Quick action buttons

### Task 16: Dashboard Services Management
- List services, toggle active/featured, edit pricing
- Create custom service

### Task 17: Dashboard Profile Editing
- Edit display name, bio, tagline, avatar, cover image
- Username (read-only after set)

### Task 18: Dashboard Availability Settings
- Visual weekly grid (click to set hours per day)
- Override dates (days off, special hours)

### Task 19: Public Landing Page (`/[username]`)
- Server Component fetching diviner + services + testimonials
- Hero, featured services, all services, testimonials, about section
- SEO meta tags, schema.org markup

### Task 20: Client Booking Flow (`/[username]/book/[serviceSlug]`)
- Date picker → time slot picker (from availability API)
- Intake questionnaire (birth data + custom questions)
- Stripe payment → booking confirmation
- Affiliate tracking via `?ref=CODE` query param

### Task 21: Availability API Route
- `GET /api/availability/[divinerId]?date=YYYY-MM-DD&duration=60`
- Returns available time slots

### Task 22: Booking Payment API Route
- Creates Stripe PaymentIntent with Connect destination charge
- Creates booking record in database

### Task 23: Features Page
- Marketing page showcasing all platform features with screenshots
- Sections: Branded Page, Booking, Video, Payments, CRM, Marketing, Affiliates

### Task 24: Pricing Page
- Dedicated pricing page with FAQ
- Reuses PricingCard component

### Task 25: Client Portal Layout + Pages
- Magic link auth check
- Upcoming bookings, past sessions, profile with birth data

### Task 26: Dashboard Clients CRM
- Table of all clients with search/filter
- Client detail view: birth data, session history, notes

### Task 27: Dashboard Bookings Page
- Calendar view + list view
- Status management (confirm, mark complete, cancel, no-show)
- Session notes

### Task 28: Dashboard Settings Page
- Stripe account status
- Google Calendar connection (placeholder for Phase 2)
- YouTube Channel ID
- Notification preferences

---

## Execution Notes

- **Supabase project must be created first** — the developer needs to create a Supabase project at supabase.com, run the migrations, and copy the credentials to `.env.local`
- **Stripe products must be created** — create a product with two prices ($197 one-time, $149/mo recurring) in the Stripe Dashboard
- **Each task produces a working commit** — the app should build successfully after each task
- **Tasks 1-10 are the critical path** — they establish the foundation. Tasks 11-28 can be parallelized in pairs.
