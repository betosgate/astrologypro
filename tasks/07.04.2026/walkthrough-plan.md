# AstrologyPro — Architecture Walkthrough Plan
Generated: 2026-04-07

## Platform Overview
- **Tech Stack**: Next.js 15 App Router, Supabase (PostgreSQL), Stripe Connect, AWS S3/SES
- **Portals**: Admin (114 pages), Dashboard/Diviner (38 pages), Portal/Customer (8 pages), Community/Member (36 pages), Mystery School (10 pages), Trainee (5 pages), Public (30+ pages)
- **API Routes**: 465+ route handlers, 19 cron jobs, 7 Stripe endpoints, calendar webhooks
- **DB Tables**: 100+ tables with RLS, 94 migrations applied

---

## Module Walkthrough

### 1. Public-Facing Pages
- **Homepage** (`/`) — hero, features, testimonials, diviner directory CTA
- **Discover** (`/discover`) — search + filter diviner directory
- **Diviner Profile** (`/[username]`) — bio, services, testimonials, check-in (live only), media
- **Booking Wizard** (`/[username]/book/[serviceSlug]`) — date/time selection, payment, notes
- **Blog** (`/blog`) — listing, detail, search, category/tag/author/series pages, RSS feed
- **Join Paths** — `/join` hub, `/get-started` (diviner), `/join/trainee`, `/join/advocate`, `/join/community`
- **Auth** — login (email + magic link), reset-password, update-password, account settings
- **Educational** — guides, learn (planets/aspects/houses), zodiac, tarot, glossary, readings
- **Legal** — privacy, terms, refund policy, dynamic legal pages

### 2. Admin Back Office (114 pages)
- **Dashboard** — KPIs: bookings, revenue, page views, role breakdowns, top diviners
- **People** — users (list/detail/edit/delete/restore), diviners (list/detail), affiliates (list/detail/disputes), roles, invitations, social advocacy
- **Commerce** — orders (list/detail), bookings (list/detail/status), payments, refunds, packages
- **Content** — blog (full CMS: posts/categories/tags/series/authors/CTA blocks/analytics), general content, spiritual wisdom, media items
- **Astrology** — horoscope (V2 with AI + S3 images), tarot (cards/spreads CRUD), wheel signs, ingress charts, mundane (entities/leaders/events/forecasts/research/chart studio/world map/event calendar/search)
- **Programs** — mystery school (students/decans/journals/excuse), training school (programs/categories/lessons/quizzes/analytics/settings with trigger-based quiz engine), perennial mandalism, rituals
- **Schedule** — my schedule, bookings, availability, calendar connections
- **Community** — PM plan tiers, broadcasts, calendar events, holy books, doctrine links, sunday service
- **Email** — sequences (pause/resume), history, preview
- **Support** — tickets (list/detail with thread+internal notes), queues, SLA dashboard
- **Reports** — activity log (with CSV export), user reports
- **Config** — diviner plans/add-ons, legal pages, class config

### 3. Diviner Dashboard (38 pages)
- **Overview** — profile completeness, recent bookings/orders, revenue chart, upcoming
- **Schedule** — bookings, schedule (week view), availability, calendar connections
- **Orders** — full order list with stats, search, filters, pagination
- **Clients** — client list with sessions/spent, detail sheet
- **Engagement** — check-ins, giveaways (with draw), testimonials, media gallery
- **Services** — product catalog with active/featured toggles
- **Subscriptions** — weekly subscription config, subscriber list, deliveries
- **Affiliates** — affiliate commission management, links, commissions, payouts
- **Marketing** — email campaigns, content templates
- **Analytics** — reading reports, revenue analytics
- **Live** — stream platform config (YouTube/Twitch/etc.)
- **Rituals** — create (4 presets + Planetary Zodiacal configurator), list, playback
- **Mundane** — mundane astrology workspace
- **Support** — create/view tickets, ticket detail with messaging

### 4. Customer Portal (8 pages)
- **Dashboard** — upcoming bookings, recent recordings
- **Orders** — list with status tabs, detail with intake form + timeline
- **Bookings** — booking list, video session join
- **Subscriptions** — list with cancel button
- **Profile** — account settings

### 5. Community Member (36 pages)
- **Dashboard** — membership card, charts summary, family, sacred content, quick actions
- **Astrology** — natal chart, relationship charts, monthly transits, horoscope, ingress charts
- **Sacred** — rituals (CRUD + playback), tarot (spread runner), mundane
- **Library** — holy books, doctrine links, spiritual resources
- **Community** — sunday service (with book filter), events, broadcasts, sessions
- **Family** — member management, chart generation per member
- **Plan** — subscription management (cancel/upgrade/downgrade)

### 6. Mystery School (10 pages)
- **Decans** — 36-decan grid with lifecycle states (locked/preview/active/grace/missed/complete)
- **Decan Detail** — ritual runner (step-by-step guided), scrying journal (50-char min), mundane journal
- **Training** — foundation Q1 (12 weeks, task-driven), category/lesson views
- **Graduation** — eligibility check, certificate, post-grad ritual builder

### 7. Training School (5 pages)
- **Programs** — program list with priority ordering
- **Categories** — category list within program
- **Lessons** — video player with trigger-based quiz engine, 10s position save, rewatch enforcement
- **Graduation** — certificate page + verification

---

## Key Integrations
- **Stripe** — Connect accounts, booking payments, subscriptions, refunds, webhooks
- **AWS S3** — astrology images (divineastroimage bucket), media uploads
- **AWS SES** — transactional emails (23+ email functions)
- **Google Calendar** — OAuth sync, event creation, webhook reconciliation
- **Microsoft Outlook** — OAuth sync, event creation, webhook reconciliation
- **Supabase Auth** — email/password, magic link, MFA-ready
- **AI (OpenAI)** — horoscope interpretations, quiz generation

---

## Recent Enhancements (2026-04-07)
1. TipTap rich text editor for availability descriptions
2. D3/SVG astrology wheel chart studio
3. Leaflet world map intelligence with entity/event/forecast overlays
4. Calendar webhook reconciliation (channel→diviner mapping)
5. `force-dynamic` on all 465+ API routes
6. Loading skeletons + error boundaries on all 6 portals
7. Custom 404 page + global error handler
8. S3 astro image fetch with Conjunction/Conjunct fallback
9. Blog post scheduling cron job
10. User impersonation with audit logging

---

## P1 Gaps Remaining (for next session)
1. **Admin testimonials** — not linked in sidebar navigation
2. **Admin dashboard KPIs** — needs growth metrics, conversion rate, active users today
3. **Diviner services API** — POST/PUT/DELETE routes missing (UI uses modals)
4. **Portal deliverable viewer** — no page for viewing purchased readings
5. **Community relationship chart** — results display is placeholder
6. **Weekly subscription API** — returns 501 (stubbed)
7. **Admin mystery school sub-nav** — decans/students/journals orphaned from sidebar

---

## Walkthrough Flow (1 hour)
1. **Public (10 min)** — Homepage → Discover → Diviner Profile → Book → Blog
2. **Customer Portal (5 min)** — Login → Orders → Order Detail → Intake → Subscriptions
3. **Community (10 min)** — Dashboard → Charts → Transits → Rituals → Library → Sunday Service
4. **Mystery School (5 min)** — Decan Grid → Decan Ritual → Training → Graduation
5. **Diviner Dashboard (15 min)** — Overview → Bookings → Orders → Clients → Services → Affiliates → Check-Ins → Giveaways → Live → Rituals → Support
6. **Admin (15 min)** — Dashboard → Users → Diviners → Orders → Bookings → Tickets → Blog → Training → Mystery School → Mundane → Chart Studio → World Map
