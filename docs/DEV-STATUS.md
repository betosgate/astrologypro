# AstrologyPro Development Status

**Last Updated**: 2026-04-02 (handoff session)
**Status**: ACTIVE — Phone system built; Google Calendar OAuth live; all env vars in Vercel; DB migrations applied; seed data populated; handoff docs written

---

## Session 2026-04-02 (final) — Facebook OG Fix + Instagram Watermark Fix

### Problem 1: Facebook Share Showing Blank Preview

**Root Cause**: Next.js 16 marks any page with dynamic ISR (no `generateStaticParams`) as `Cache-Control: private, no-cache, no-store`. Facebook's scraper refuses to process OG tags from pages with private cache headers. Three prior fix attempts failed (`next.config.ts` custom headers, `unstable_cache`, `export const dynamic = "force-static"`) because they were all overridden by Next.js's dynamic rendering behavior.

**Final Fix: Proxy Bot Detection + Dedicated OG Route Handler**

1. **`src/proxy.ts`** (new file — replaces `src/middleware.ts` per Next.js 16 convention)
   - Detects social media crawler UAs: `facebookexternalhit`, `Facebot`, `LinkedInBot`, `Twitterbot`, `WhatsApp`, `Slackbot`, `TelegramBot`, `Discordbot`, `Applebot`, `pinterest`, `tumblr`, `redditbot`
   - Rewrites `/share/[token]` requests from bots → `/api/share-og?t=TOKEN`
   - Auth logic (Supabase session refresh for `/dashboard`, `/portal`, `/onboarding`) unchanged
   - Matcher now includes `/share/:path*`

2. **`src/app/api/share-og/route.ts`** (new file)
   - Route handler: fetches share batch from Supabase, returns minimal HTML with full OG meta tags
   - Explicitly sets `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`
   - This bypasses Next.js ISR entirely — response is always public and cacheable
   - Regular users (non-bot) still see the full React share page

3. **`next.config.ts`** — Added `/api/share-og` to public Cache-Control headers

**Verified**: `curl -A "facebookexternalhit/1.1" https://astrologypro.com/share/hFYk3mMf0fjun6GXsMZmmzgUKvx66ncL` returns:
- `Cache-Control: public`
- Full og:title, og:description, og:image tags with real content

---

### Problem 2: Instagram Image URL Text Invisible (Blank Bottom)

**Root Cause Chain**:
1. `sharp` composites SVG overlays using `librsvg`
2. `librsvg` requires `fontconfig` (system fonts) to render SVG `<text>` elements
3. Vercel Lambda has NO system fonts — SVG text renders blank
4. Initial fix: embed Geist-Bold.ttf as base64 in SVG `@font-face { src: url('data:...') }` — FAILED because `librsvg` on Vercel doesn't support `data:` URI fonts in `@font-face`
5. Second fix: `outputFileTracingIncludes` to bundle TTF — FAILED because binary assets aren't reliably bundled
6. Third approach: import TTF as base64 string constant from `src/lib/geist-bold-b64.ts` — font loading code ran but SVG rendering was still blank (same `librsvg` root cause)

**Final Fix: Sharp Pango Text Renderer + `/tmp` Font File**

`librsvg` is NOT the right tool. `sharp` has a separate, native **Pango text renderer** accessed via `{ text: { text, fontfile, dpi, rgba } }` input objects. This uses `libvips`/`Pango` directly — no `fontconfig` needed for the rendering itself, just the font file path.

- **`src/lib/geist-bold-b64.ts`** — Geist-Bold.ttf (128KB) embedded as base64 constant, generated at commit time via `node -e "..."`. Kept for the `/tmp` write.
- **`src/app/api/mundane/image/route.ts`** — Completely rewritten:
  - On cold start: writes Geist Bold from base64 constant → `/tmp/geist-bold.ttf` (Lambda `/tmp` is writable, 512MB)
  - Renders white bold text using `sharp({ text: { text: pangoMarkup, fontfile: '/tmp/geist-bold.ttf', dpi: 72, rgba: true } })`
  - Creates semi-transparent dark strip (55% alpha black) at bottom of image for contrast
  - Font size: 4% of image width, minimum 20px
  - Composites dark strip + text layer onto base image

**Verified in production**: White bold `astrologypro.com/mystic-maya` text clearly visible on dark strip at the bottom of the Uranus-sextile-Neptune image.

---

### Next.js 16 Migration: middleware.ts → proxy.ts

Per Next.js 16 convention, `middleware.ts` is renamed `proxy.ts` and the exported function is renamed from `middleware` to `proxy`. Defaults to Node.js runtime (no `runtime` export needed). See: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`

**Files changed**:
- `src/middleware.ts` → DELETED
- `src/proxy.ts` → CREATED (same logic + bot detection added)

---

### Commits This Session
- `bef66c0` — OG route handler + proxy bot detection + middleware→proxy migration
- `216b9a1` — `outputFileTracingIncludes` for font (later superseded)
- `79c9fc2` — Geist Bold embedded as build-time base64 constant
- `78f492a` — Pango text renderer with `/tmp` font file (final fix)

---

## Session 2026-04-02 (morning) — Mundane Shares Quality Overhaul + Image Fix

### Critical Bug Fixed: Image Naming (aspectImageFile)
All 3 of 5 aspect types were producing 404 images due to wrong filename mapping. **Verified against real bucket**:
- `conjunction` → `conjunction` (was wrongly mapped to `conjunct`)
- `opposition`  → `opposition` (was wrongly mapped to `opposite`)
- `square`      → `squared` (was wrong)
- `sextile`, `trine` → unchanged (were correct)

Fix in `src/lib/mundane-events.ts` `aspectImageFile()` function.

### Content Voice Overhaul (mundane-content.ts)
Complete rewrite of Claude prompt:
- **Before**: Generic 3rd-person ("Uranus sextile Neptune brings a harmonious flow...")
- **After**: 1st-person authoritative ("I'm watching Uranus form a rare sextile to Neptune — these two outer planets moving slowly...")
- Event type context passed to Claude (ingress/retrograde/direct/aspect each has distinct framing)
- 3-4 rich sentences with world-level specifics and "watch for" prediction
- Fallback content also uses event-type-specific hooks

### Caption Format Improvements
```
{emoji} {event_label}          # ✨🔄⬆️⚡ by event type
[3-4 sentence first-person content]
[10 hashtags]
🔮 Book a reading: https://astrologypro.com/{username}
```

### New Moon / Full Moon Support
- Moon-Sun conjunction → event_label = "New Moon", image = `moon-conjunction-sun.jpg`
- Moon-Sun opposition → event_label = "Full Moon", image = `moon-opposition-sun.jpg`
- Both images verified 200 in bucket
- Priority bumped to 1 (same as retrograde stations)

### Image Overlay Fix
Changed from `www.astrologypro.com/{username}` to `astrologypro.com/{username}` in the compositing API.

### Marketing Dashboard (Real Data)
Rewrote `src/app/dashboard/marketing/page.tsx` + created `marketing-tabs.tsx`:
- Server component fetches real share_batches from Supabase
- Shows today's mundane shares with "Share Now →" CTA
- Real analytics computed from actual data (not hardcoded placeholder)
- Real per-platform share breakdown with color-coded chips

### Instructions Page Update
Added step 2.18 "Daily Cosmic Content (Mundane Shares)" explaining full pipeline, platform tips, how AI generation works.

### Seed Data
3 historical share batches for mystic-maya with realistic first-person captions seeded directly to Supabase via REST API.

---

## Session 2026-04-02 (evening) — Mundane Astrology Daily Shares System

### What Was Done

**New system: twice-daily branded mundane astrology content sent to diviners + affiliates**

#### Core files added
- `src/lib/ephemeris.ts` — Pure astronomical calculations using `astronomy-engine` npm package. Detects: sign ingresses, retrograde stations, direct stations, exact aspects (1.5° orb). Functions: `getEclipticLongitude`, `getSign`, `isRetrograde`, `stationsRetrograde`, `stationsDirect`, `hasIngressed`, `findExactAspects`.
- `src/lib/mundane-events.ts` — `getMundaneEventsForDate(date)` returns prioritized list of real planetary events. `selectDailyEvents()` deduplicates against already-sent event keys. Image filename builders (e.g. `mars-in-capricorn.jpg`). Event keys: `mars-capricorn`, `mercury-retrograde-2026-04`, `jupiter-sextile-mercury-2026-04`.
- `src/lib/mundane-content.ts` — Claude haiku API generates 2-3 sentence mundane interpretation + 10 hashtags for each event. Falls back gracefully if `ANTHROPIC_API_KEY` missing.
- `src/app/api/mundane/image/route.ts` — Node.js route (uses `sharp`). Fetches base image from Supabase Storage, composites diviner's URL (`www.astrologypro.com/{username}`) as white text with black stroke onto bottom 25% of image. Returns JPEG with 24h cache.
- `src/app/api/cron/mundane-shares/route.ts` — Protected by `CRON_SECRET` header. `?n=1` = 9 AM ET share, `?n=2` = 5 PM ET share. Idempotent (checks `share_batches` for today). Sends to all diviners with `share_notifications_enabled=true` AND their active affiliates.

#### DB migration
- `supabase/migrations/20260402000002_mundane_shares.sql` — Creates `mundane_event_log` table (dedup by unique `event_key`), extends `share_batches` with `share_number`, `share_date`, `is_mundane`, `mundane_event_id`, `affiliate_id`, `recipient_email`, `recipient_name`, `diviner_username` columns.
- **⚠️ MIGRATION NOT YET APPLIED** — Must apply via Supabase SQL editor: https://supabase.com/dashboard/project/wyluvclvtvwptsvvtgkv/sql/new

#### Storage
- Supabase Storage bucket `mundane-images` created (public)
- **746/748 images uploaded** from local `MundaneAstrology/` folder via `scripts/upload-mundane-images.js`
- Public URL pattern: `https://wyluvclvtvwptsvvtgkv.supabase.co/storage/v1/object/public/mundane-images/{filename}`

#### Cron schedule (vercel.json)
- `0 13 * * *` UTC = 9 AM ET → `/api/cron/mundane-shares?n=1`
- `0 21 * * *` UTC = 5 PM ET → `/api/cron/mundane-shares?n=2`

#### Helper scripts added
- `scripts/upload-mundane-images.js` — One-time image upload to Supabase Storage
- `scripts/run-migration.js` — Run SQL migration via Supabase REST API (use dashboard instead)

### Commits
`cd3bc01`, `68a7a3a`, `f764bf3`, `09e3f3d` — pushed to master, deployed to production

### Still Needed to Activate
1. **Apply DB migration** at https://supabase.com/dashboard/project/wyluvclvtvwptsvvtgkv/sql/new
2. **Add `ANTHROPIC_API_KEY`** to Vercel env vars (content generation)
3. **Add `CRON_SECRET`** to Vercel env vars (cron auth)
4. Test: `curl "https://astrologypro.com/api/cron/mundane-shares?n=1" -H "Authorization: Bearer {CRON_SECRET}"`

---

## Session 2026-04-02 (afternoon) — Multi-Guest Video Sessions

### What Was Done
- `src/lib/intake-questions.ts` — `RELATIONSHIP_SLUGS` expanded to 10 slugs; `isRelationshipService` now accepts optional `category` param with regex fallback
- `src/components/booking/intake-form.tsx` — `secondPersonEmail` field added to `IntakeData`; shown conditionally when guest is "yes" or "maybe"
- `src/components/booking/booking-wizard.tsx` — `secondPersonEmail` flows through to questionnaire payload
- `src/lib/email.ts` — `sendGuestBookingInvite` and `sendGuestRoomLink` added
- `src/app/api/stripe/booking-payment/route.ts` — fires `sendGuestBookingInvite` at booking confirmation when guest email present
- `src/app/api/daily/create-room/route.ts` — `max_participants` is now 3 (vs 2) for relationship readings; fires `sendGuestRoomLink` when diviner creates the room
- `src/components/dashboard/session-prep.tsx` — attendance badge (green/amber/neutral), guest email line, 2-column birth data grid

### Commits
`ba5a2a2`, `ee61b4a`, `65a1215` — pushed to master, deployed to production

---

## Session 2026-04-02 — Intake Form Expansion

### What Was Done
- `src/lib/intake-questions.ts` (558 lines) — service-specific question config, universal questions, relationship questions, dynamic renderer
- `src/components/booking/intake-form.tsx` (657 lines) — full rewrite with 6 collapsible sections:
  1. Your Information
  2. Birth Information (conditional on `requires_birth_data`)
  3. About the Other Person (relationship readings only — includes `secondPersonAttending` yes/no/maybe)
  4. Your Questions (life area + focus question)
  5. About Your Reading (service-specific questions)
  6. Preferences & Comfort (collapsed by default)
- `src/components/booking/booking-wizard.tsx` — `INITIAL_INTAKE` updated with all new fields, `IntakeForm` receives `serviceSlug` + `serviceCategory`, questionnaire payload now includes second person + extras + birth geo
- `src/app/api/stripe/booking-payment/route.ts` — birth geo extracted from questionnaire object (no separate top-level fields), `questionnaire` type widened to `Record<string, string | number | undefined>`
- `src/components/dashboard/session-prep.tsx` — questionnaire type widened, now shows second person section and service-specific extras

### Commit
`d48dd49` — pushed to master

## Quick Resume

```bash
cd C:\Users\Admin\OneDrive\Documents\ClaudeProjects\AstrologyPro\app
npm install
npm run dev        # Start dev server at localhost:3000
npm run seed       # Repopulate test data
vercel --prod      # Deploy to production
```

## Project Locations

| Item | Location |
|------|----------|
| Code | `C:\Users\Admin\OneDrive\Documents\ClaudeProjects\AstrologyPro\app\` |
| Docs | `C:\Users\Admin\OneDrive\Documents\ClaudeProjects\AstrologyPro\docs\` |
| GitHub | https://github.com/betosgate/astrologypro (29 commits, all pushed) |
| Vercel | Pro plan, deployed at https://astrologypro.com |
| Supabase | Project: wyluvclvtvwptsvvtgkv (East US) |
| Latest Commit | `78f492a` on master, pushed to origin |

## Tech Stack

Next.js 16.2.1 (Turbopack), TypeScript, Supabase (PostgreSQL + Auth + Storage + RLS), Stripe (Billing + Connect + SetupIntents + Refunds), Daily.co (Video + SIP + Recording), Twilio (SMS + Voice + Phone Numbers), Resend (Email), shadcn/ui, Tailwind CSS, Poppins + Cormorant Garamond + Geist fonts, Playwright

## Pricing Model (3 Tiers)

| Plan | Name | Setup | Monthly | Services |
|------|------|-------|---------|----------|
| tarot | The Tarot Reader | $197 | $97/mo | 8 tarot spreads + freelance |
| both | The Oracle (featured) | $297 | $147/mo | All 19 + phone readings |
| astrology | The Astrologer | $197 | $97/mo | 11 astrology readings + freelance |

Plan definitions: `src/lib/plans.ts`

## API Keys

| Service | Status |
|---------|--------|
| Supabase (URL + Anon + Service) | CONFIGURED |
| Daily.co | CONFIGURED |
| Resend | CONFIGURED |
| Twilio (SID + Auth + Phone) | CONFIGURED (+17622516895) |
| Stripe | **PLACEHOLDER** — needs 6 price IDs (see below) |
| Google Cloud | **NOT SET** |
| CRON_SECRET | ✅ CONFIGURED |
| ANTHROPIC_API_KEY | ✅ CONFIGURED |

### Stripe Price IDs Needed (6 total)

| Env Var | Price | Type |
|---------|-------|------|
| `STRIPE_PRICE_TAROT_SETUP` | $197 | One-time |
| `STRIPE_PRICE_TAROT_MONTHLY` | $97 | Recurring |
| `STRIPE_PRICE_ASTROLOGY_SETUP` | $197 | One-time |
| `STRIPE_PRICE_ASTROLOGY_MONTHLY` | $97 | Recurring |
| `STRIPE_PRICE_BOTH_SETUP` | $297 | One-time |
| `STRIPE_PRICE_BOTH_MONTHLY` | $147 | Recurring |

## Stats

200+ routes, 220+ source files, 43 git commits, 11 DB migrations, 20+ tables, 13 email templates, 6 cron jobs, 748 mundane images in Supabase Storage, 19 product images, 28 home hero images, 135 SEO content pages, 706KB content data, 50+ features

---

## SEO Content Library (Built 2026-04-01 afternoon)

### Content Pages (135 total, all statically generated)

| Content Type | Count | Route Pattern | Data File |
|---|---|---|---|
| Zodiac Signs | 12 + hub | `/zodiac/[sign]` | `src/data/zodiac-signs.ts` (119KB) |
| Tarot Card Meanings | 78 + hub | `/tarot/[card]` | `src/data/tarot-cards.ts` (238KB) |
| Tarot Spreads | 8 + hub | `/tarot/spreads/[spread]` | `src/data/tarot-spreads.ts` (46KB) |
| Astrological Houses | 12 | `/learn/houses/[house]` | `src/data/houses.ts` (90KB) |
| Planets/Celestial Bodies | 12 | `/learn/planets/[planet]` | `src/data/planets.ts` (100KB) |
| Aspects | 5 | `/learn/aspects/[aspect]` | `src/data/aspects.ts` (42KB) |
| Glossary (160+ terms) | 1 | `/glossary` | `src/data/glossary.ts` (73KB) |
| Guides | 6 + hub | `/guides/*` | Inline content |
| B2B Landing | 1 | `/for-astrologers` | Inline content |
| Privacy Policy | 1 | `/privacy` | Inline content |
| Terms of Service | 1 | `/terms` | Inline content |
| Learning Hub | 1 | `/learn` | N/A |

### SEO Infrastructure

| Component | File | Purpose |
|---|---|---|
| Sitemap | `src/app/sitemap.ts` | Dynamic sitemap covering all 200+ URLs |
| Robots | `src/app/robots.ts` | Blocks /dashboard, /portal, /api, /auth, /onboarding |
| JSON-LD | `src/components/seo/json-ld.tsx` | Reusable structured data injector |
| Breadcrumbs | `src/components/seo/breadcrumbs.tsx` | Visual + BreadcrumbList schema |
| FAQ Section | `src/components/seo/faq-section.tsx` | Accordion + FAQPage schema |
| CTA Banner | `src/components/seo/cta-banner.tsx` | Client/practitioner dual-purpose CTA |

### Mega Footer

6-column layout with 30+ internal links:
- Brand, Platform (6 links), Learn Astrology (7 links), Tarot Guide (7 links), Guides (5 links), Support (5 links)
- Zodiac sign strip with all 12 signs
- File: `src/components/marketing/footer.tsx`

### Header Update

Added "Learn" nav link → `/learn` (between Features and See Demo)

---

## Previous Build (2026-04-01 morning)

### Custom Homepage Hero & Navigation (from /HomeAbove/)
- **New marketing header**: Logo image (`png_logo_1.png`, 60px tall), uppercase nav links (Features, Learn, See Demo, Pricing, Find a Reader), Log In + gold gradient "Get Started" button
- **New homepage hero**: Layered background images, headline as image files, red/white gradient CTAs, 6 feature boxes
- **Backups**: `header.backup.tsx` and `hero.backup.tsx` — rename to revert
- Hero images: `public/images/home/` (28 files)

### Diviner Landing Page Redesign
- Hero: horizontal band — avatar left, cover image right with gradient fade
- Service cards: two-column — text left, price + product image right
- 19 product images in `public/images/services/` via `src/lib/service-images.ts`

### Three-Tier Pricing
- `/get-started` = full sales page (hero, pain points, 3 cards, features, comparison, FAQ, signup form)

### Removed Fake Social Proof
- All "200+ practitioners", "10,000+ sessions" claims removed
- Replaced with honest trust signals

---

## To Go Live (Config Only)

1. Create 6 Stripe products/prices + add keys to Vercel
2. Google Cloud project → Calendar API → OAuth credentials
3. Generate CRON_SECRET → add to Vercel
4. ✅ Daily.co webhook registered: `https://astrologypro.com/api/daily/webhook` (via API 2026-04-02)
5. Register Twilio 10DLC
6. Set up Daily.co SIP pinless dialin

## Known Issues

1. Dashboard screenshots blank in Playwright (client-side auth) — NOT user-facing
2. Stripe payments non-functional until real keys added
3. `.next` cache sometimes gets EPERM errors on Windows — fix with `rm -rf .next` before build
4. Existing share batches (created before 2026-04-02 final session) have blank bottom strip on images — next cron run regenerates fresh composited images

## Next.js 16 Notes (IMPORTANT for new devs)

- **`middleware.ts` is deprecated** — the file is now `src/proxy.ts`, exported function is `proxy` (not `middleware`)
- **`params` is a runtime API** — `await params` in pages/layouts returns values only at request time; cannot be used in `'use cache'` functions directly
- **`searchParams` in route handlers** — `new URL(request.url).searchParams` is SYNCHRONOUS in route handlers (the async `searchParams` only applies to page props). The build validator may flag this incorrectly — it is a false positive.
- **`async headers()` in next.config.ts** — the config callback is correctly async; this is NOT the same as `import { headers } from 'next/headers'`. Build validator false positive.
- **SVG text via librsvg** — does NOT work on Vercel Lambda (no system fonts, data: URI fonts unsupported). Use sharp's Pango text input with `fontfile` pointing to a `/tmp`-written font file instead.
- **`outputFileTracingIncludes`** — unreliable for binary assets. Embed fonts as base64 TypeScript constants instead.

## All Key Files

| Purpose | File |
|---------|------|
| **Mundane Shares (Social Media)** | |
| Proxy / bot detection | `src/proxy.ts` (replaces middleware.ts) |
| OG metadata endpoint for bots | `src/app/api/share-og/route.ts` |
| Image compositing API | `src/app/api/mundane/image/route.ts` |
| Geist Bold font (embedded base64) | `src/lib/geist-bold-b64.ts` |
| Mundane event detection | `src/lib/mundane-events.ts` |
| AI content generation | `src/lib/mundane-content.ts` |
| Ephemeris calculations | `src/lib/ephemeris.ts` |
| Cron route (2x daily) | `src/app/api/cron/mundane-shares/route.ts` |
| Share page (React, for humans) | `src/app/share/[token]/page.tsx` |
| Share UI components | `src/components/share/share-hub.tsx` |
| Marketing dashboard | `src/app/dashboard/marketing/page.tsx` |
| **Content Data** | |
| Zodiac sign data | `src/data/zodiac-signs.ts` |
| Tarot card data | `src/data/tarot-cards.ts` |
| Houses data | `src/data/houses.ts` |
| Planets data | `src/data/planets.ts` |
| Aspects data | `src/data/aspects.ts` |
| Glossary data | `src/data/glossary.ts` |
| Tarot spreads data | `src/data/tarot-spreads.ts` |
| **SEO Components** | |
| JSON-LD injector | `src/components/seo/json-ld.tsx` |
| Breadcrumbs + schema | `src/components/seo/breadcrumbs.tsx` |
| FAQ accordion + schema | `src/components/seo/faq-section.tsx` |
| CTA banner | `src/components/seo/cta-banner.tsx` |
| Dynamic sitemap | `src/app/sitemap.ts` |
| Robots.txt | `src/app/robots.ts` |
| **Marketing** | |
| Mega footer (6-col) | `src/components/marketing/footer.tsx` |
| Header (with Learn link) | `src/components/marketing/header.tsx` |
| Header backup (old) | `src/components/marketing/header.backup.tsx` |
| Homepage hero | `src/components/marketing/hero.tsx` |
| Hero backup (old) | `src/components/marketing/hero.backup.tsx` |
| **Business** | |
| Plan definitions | `src/lib/plans.ts` |
| Service image map | `src/lib/service-images.ts` |
| Sales/signup page | `src/app/get-started/page.tsx` |
| Stripe billing | `src/lib/stripe/billing.ts` |
| Pricing cards | `src/components/marketing/pricing-card.tsx` |
| **Diviner Pages** | |
| Diviner hero | `src/components/landing/diviner-hero.tsx` |
| Service card | `src/components/landing/service-card.tsx` |
| Product images | `public/images/services/*.png` (19 files) |
| Home hero images | `public/images/home/` (28 files) |

## Content Page Routes (complete list)

### Zodiac Signs
`/zodiac` (hub), `/zodiac/aries`, `/zodiac/taurus`, `/zodiac/gemini`, `/zodiac/cancer`, `/zodiac/leo`, `/zodiac/virgo`, `/zodiac/libra`, `/zodiac/scorpio`, `/zodiac/sagittarius`, `/zodiac/capricorn`, `/zodiac/aquarius`, `/zodiac/pisces`

### Tarot Cards
`/tarot` (hub), `/tarot/the-fool`, `/tarot/the-magician`, `/tarot/the-high-priestess`, `/tarot/the-empress`, `/tarot/the-emperor`, `/tarot/the-hierophant`, `/tarot/the-lovers`, `/tarot/the-chariot`, `/tarot/strength`, `/tarot/the-hermit`, `/tarot/wheel-of-fortune`, `/tarot/justice`, `/tarot/the-hanged-man`, `/tarot/death`, `/tarot/temperance`, `/tarot/the-devil`, `/tarot/the-tower`, `/tarot/the-star`, `/tarot/the-moon`, `/tarot/the-sun`, `/tarot/judgement`, `/tarot/the-world`, + 56 minor arcana (ace through king of wands/cups/swords/pentacles)

### Tarot Spreads
`/tarot/spreads` (hub), `/tarot/spreads/celtic-cross`, `/tarot/spreads/three-card-spread`, `/tarot/spreads/one-card-daily-pull`, `/tarot/spreads/relationship-spread`, `/tarot/spreads/career-path-spread`, `/tarot/spreads/year-ahead-spread`, `/tarot/spreads/full-moon-spread`, `/tarot/spreads/new-moon-intentions`

### Learn Astrology
`/learn` (hub), `/learn/houses/1st-house` through `/learn/houses/12th-house`, `/learn/planets/sun`, `/learn/planets/moon`, `/learn/planets/mercury`, `/learn/planets/venus`, `/learn/planets/mars`, `/learn/planets/jupiter`, `/learn/planets/saturn`, `/learn/planets/uranus`, `/learn/planets/neptune`, `/learn/planets/pluto`, `/learn/planets/chiron`, `/learn/planets/north-node`, `/learn/aspects/conjunction`, `/learn/aspects/opposition`, `/learn/aspects/trine`, `/learn/aspects/square`, `/learn/aspects/sextile`

### Guides
`/guides` (hub), `/guides/saturn-return`, `/guides/mercury-retrograde`, `/guides/start-astrology-business`, `/guides/start-tarot-business`, `/guides/pricing-your-readings`, `/guides/how-astrology-readings-work`

### Other New Pages
`/for-astrologers`, `/glossary`, `/privacy`, `/terms`

---

## Session 2026-04-02 (handoff) — Phone System + Google Calendar + Keys + Seed Data + Handoff Docs

### Features Built

**Phone System (Full Stack)**
- `src/app/api/twilio/voice/incoming/route.ts` — Client calls in, enqueues with hold music
- `src/app/api/twilio/voice/wait-music/route.ts` — TwiML hold loop
- `src/app/api/twilio/voice/notify/route.ts` — Notifies diviner via mobile + browser
- `src/app/api/twilio/voice/dequeue/route.ts` — Bridges client + diviner when answered
- `src/app/api/twilio/token/route.ts` — Issues Twilio Voice JS SDK token (VoiceGrant)
- `src/components/dashboard/phone-widget.tsx` — Floating browser call widget (Twilio Voice SDK)
- `src/components/dashboard/phone-widget-loader.tsx` — SSR-safe wrapper (`"use client"` + `ssr:false`)
- `supabase/migrations/20260402000010_phone_columns.sql` — `phone_mobile`, `phone_answer_mode` columns; fixed `services_category_check` constraint to include `'phone'`

**Google Calendar OAuth**
- Google Cloud project "AstrologyPro" created
- Client ID: `318346779756-0ggtj4dichr3jo7fod5tl97riekaok54.apps.googleusercontent.com`
- Redirect URI: `https://astrologypro.com/api/calendar/callback`
- All 3 env vars added to Vercel + `.env.local`
- ⚠️ OAuth app still in "Testing" mode — add diviner emails as test users OR publish app for production

**Env Vars Added to Vercel**
- `TWILIO_API_KEY_SID` = `SK1fb32c6caebb9b417bd99eeaf5e5fc94`
- `TWILIO_API_KEY_SECRET` = `X7a6P7fdlmvXLwPrWnEesoLavlYIFsXH`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

**DB Migration Applied to Production**
- `supabase/migrations/20260402000010_phone_columns.sql` applied via Supabase MCP
- `diviners.phone_mobile` (VARCHAR 20) — mobile number for call forwarding
- `diviners.phone_answer_mode` (VARCHAR 20, default 'both') — 'mobile' | 'browser' | 'both'
- `services_category_check` — fixed to include 'phone' category

**Seed Data**
- `mystic-maya`: 42 total bookings across 6 months (Nov 2025–Apr 2026), clean growth curve: $353 → $556 → $614 → $758 → $202 → $1,400
- 5 upcoming bookings (2 today, 3 this week) for dashboard screenshot
- 120 page_views across past 30 days for analytics screenshot
- `client_diviners` totals updated with correct session counts

**Dashboard Improvement**
- Added "View Live Profile" external link to Quick Actions
- Added profile URL badge (`astrologypro.com/[username]`) at top of dashboard header

### Handoff Documents Created
- `docs/HANDOFF.md` — Full developer handoff for incoming developer
- `docs/KEYS.md` — All API keys and credentials with Vercel status
- `docs/TODO.md` — Prioritized list of remaining work (Stripe is #1)

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Astrologer | demo.astrologer@astrologypro.com | DemoAstro2026! |
| Tarot Reader | demo.tarot@astrologypro.com | DemoTarot2026! |
| Client 1 | sarah.johnson@example.com | ClientTest2026! |
| Client 2 | michael.chen@example.com | ClientTest2026! |
| Client 3 | emma.garcia@example.com | ClientTest2026! |

Demo pages: /mystic-maya, /luna-readings

## Back-Office

- Angular: https://www.backofficeportal.divineinfinitebeing.com/
- Test: testastrologer.divine@yopmail.com / testtarot.divine@yopmail.com (Test@1234)

## Documentation

- `docs/DEVELOPER-GUIDE.md` — Complete developer handbook
- `docs/DEV-STATUS.md` — This file
- `docs/SESSION-BRIDGE-QUICKSTART.md` — Angular team guide
- `docs/session-bridge-integration.md` — JWT spec + webhooks
- `docs/superpowers/specs/2026-04-01-seo-content-library-design.md` — SEO content library design spec
- `docs/superpowers/specs/2026-03-31-astrologypro-platform-design.md` — Original platform design spec
