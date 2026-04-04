# Sprint Plan — Divine Infinite Being Platform
## Suggested 8-Sprint Roadmap

> **Sprint length:** 2 weeks
> **Team size:** 1–2 developers + Beto (content/decisions)
> **Velocity assumption:** ~25–30 story points per sprint
> **Start date:** 2026-04-07 (first sprint after audit)

---

## Sprint Overview

| Sprint | Dates | Focus | Points |
|---|---|---|---|
| S1 | Apr 7–20 | Security fixes + core billing rules | 22 |
| S2 | Apr 21 – May 4 | Training school foundation | 28 |
| S3 | May 5–18 | Training school completion + AI questions | 26 |
| S4 | May 19 – Jun 1 | Community membership foundation | 28 |
| S5 | Jun 2–15 | Community charts + transits | 29 |
| S6 | Jun 16–29 | Mystery School foundation | 30 |
| S7 | Jun 30 – Jul 13 | Mystery School decans + rituals | 31 |
| S8 | Jul 14–27 | Polish, PayPal, analytics, badges | 25 |

---

## Sprint 1 — Security & Core Platform Rules
**Apr 7–20 | 22 points**

### Goal
Fix critical security issues, establish billing and refund rules, unblock platform for first diviner (Tabby) onboarding.

### Stories & Tasks

| Story | Points | Owner |
|---|---|---|
| E10-S1: Rotate exposed Twilio keys | 1 | Debasis |
| E10-S4: Register Stripe Connect webhook `account.updated` | 1 | Beto (manual) |
| E10-S2: SES domain verification monitoring | 1 | Beto (DNS) |
| E2-S5: Policy acknowledgement checkbox at checkout | 3 | Debasis |
| E2-S3: Diviner no-show → auto-refund webhook | 8 | Debasis |
| E7-S3: Policy display on diviner profile page | 3 | Debasis |
| E9-S2: Certified badge (column + profile + discover page) | 3 | Debasis |
| E6-S1: Booking conflict detection (hold release cron) | 2 | Debasis |

### Sprint 1 Deliverables
- [ ] Twilio keys rotated and verified
- [ ] Stripe `account.updated` webhook live
- [ ] No-show auto-refund logic live (tested in staging)
- [ ] Policy display on every diviner profile page
- [ ] Booking hold-release cron running
- [ ] Certified badge column seeded (activation pending school build)
- [ ] Policy checkbox on checkout (with acknowledgement saved)

### Dependencies / Blockers
- Beto: rotate keys in Twilio console, register Stripe webhook
- Beto: confirm exact policy text wording for checkout

---

## Sprint 2 — Training School Foundation
**Apr 21 – May 4 | 28 points**

### Goal
Build the core school infrastructure — module list, video player, quiz system (without AI generation). Beto shares first batch of completed modules.

### Stories & Tasks

| Story | Points | Owner |
|---|---|---|
| E3-S1: Course module list (DB + API + UI) | 5 | Debasis |
| E3-S2: Video player with slide-triggered quiz | 13 | Debasis |
| E3-S6: Admin course content management (CRUD) | 5 | Debasis |
| E1-S3: Remove duplicate AuthService (Angular cleanup) | 2 | Debasis |
| E1-S2: OTP/password recovery hardening | 3 | Debasis |

### Sprint 2 Deliverables
- [ ] Training modules table seeded with Beto's first batch (Suba to provide)
- [ ] Trainee can open a module and watch video
- [ ] Quiz lightbox appears at slide transitions
- [ ] Wrong answer forces rewatch of segment
- [ ] Module marked complete when all questions pass
- [ ] Admin can add/reorder modules

### Dependencies / Blockers
- Beto/Suba: share completed module slide decks + videos by Apr 20
- Must have exact slide transition timestamps or PowerPoint files
- Beto: review quiz lightbox UX before sprint ends

---

## Sprint 3 — Training School Completion + AI Questions
**May 5–18 | 26 points**

### Goal
Complete the school with graduation, certificate, Tabby booking integration, and AI question generation pipeline.

### Stories & Tasks

| Story | Points | Owner |
|---|---|---|
| E3-S4: Graduation certificate PDF | 5 | Debasis |
| E3-S5: Post-graduation Tabby consultation booking | 5 | Debasis |
| E3-S3: AI question generation pipeline (admin PPTX upload → Claude → review) | 8 | Debasis |
| E8-S2: Training analytics for admin | 5 | Debasis |
| E2-S4: Card-on-file billing 24h after confirmed session | 3 | Debasis (partial) |

### Sprint 3 Deliverables
- [ ] Graduation auto-detected when all modules complete
- [ ] Printable PDF certificate generated and stored
- [ ] Tabby booking calendar embedded + reminder emails triggered
- [ ] Admin can upload PPTX → review Claude-generated questions → save to DB
- [ ] Training analytics page live in admin dashboard
- [ ] Card-on-file billing cron running (basic version)

### Dependencies / Blockers
- Beto: connect Tabby's Google Calendar by May 1
- Beto: confirm certificate design requirements
- Beto/Suba: provide all remaining PowerPoint files for AI question generation

---

## Sprint 4 — Community Membership Foundation
**May 19 – Jun 1 | 28 points**

### Goal
Community signup, subscription, and family unit management. Beto moves to Vietnam May 22 — ensure no blocking decisions needed during this sprint.

### Stories & Tasks

| Story | Points | Owner |
|---|---|---|
| E4-S1: Community signup & subscription checkout | 8 | Debasis |
| E4-S2: Family unit management (CRUD + birth data) | 8 | Debasis |
| E7-S2: Affiliate agreement e-sign (Angular + Next.js) | 5 | Debasis |
| E7-S1: PayPal Connect for diviners (research + OAuth) | 7 | Debasis |

### Sprint 4 Deliverables
- [ ] Community signup page live with both plan options
- [ ] Stripe subscriptions created per plan
- [ ] Family members can be added with birth data
- [ ] Affiliate agreement modal + e-sign working in both apps
- [ ] PayPal OAuth flow connected (may not be complete — carry over if needed)

### Dependencies / Blockers
- Beto: confirm community Stripe product pricing in Stripe Dashboard before sprint
- Beto: review family member setup UX design before May 19
- No Beto decision required after May 22 for this sprint

---

## Sprint 5 — Community Charts & Transits
**Jun 2–15 | 29 points**

### Goal
Make the community back office valuable with natal charts, relationship charts, and monthly transits.

### Stories & Tasks

| Story | Points | Owner |
|---|---|---|
| E4-S3: Natal chart generation + display | 13 | Debasis |
| E4-S4: Relationship charts | 8 | Debasis |
| E4-S5: Monthly transits auto-generation | 8 | Debasis |

### Sprint 5 Deliverables
- [ ] Natal charts generated on family member creation
- [ ] Charts displayed as both visual wheel and text interpretation
- [ ] Child-mode content applied for < 14
- [ ] All family pairings get relationship charts
- [ ] Monthly transits cron running (1st of each month)
- [ ] "Book a reading" CTA with 5% discount on transits page

### Dependencies / Blockers
- Astrology API credentials and plan in `environment.ts`
- Chart wheel SVG design (can use existing library or build custom)

---

## Sprint 6 — Community Content + Mystery School Foundation
**Jun 16–29 | 30 points**

### Goal
Finish the community portal content library, and build the Mystery School enrollment and foundation training.

### Stories & Tasks

| Story | Points | Owner |
|---|---|---|
| E4-S6: Content library (PDFs + doctrine links) | 3 | Debasis |
| E4-S7: Sunday Service section | 3 | Debasis |
| E5-S1: Mystery School enrollment & subscription | 8 | Debasis |
| E5-S2: Foundation 12-week training | 8 | Debasis |
| E9-S1: AstrologyPro.com marketing copy rewrite | 3 | Debasis + Beto |
| E2-S4: Card-on-file billing (complete + tested) | 5 | Debasis |

### Sprint 6 Deliverables
- [ ] Community portal complete and launch-ready
- [ ] Holy book PDFs uploaded and accessible
- [ ] Sunday Service archive live
- [ ] Mystery School enrollment + $97/$27 Stripe products
- [ ] Foundation 12 weeks content with audio player
- [ ] AstrologyPro.com homepage copy updated
- [ ] Session billing working end-to-end

### Dependencies / Blockers
- Beto: upload holy book PDFs to Supabase storage
- Beto: provide audio introductions for all 12 foundation weeks (from Vietnam)
- Beto: approve new homepage copy draft

---

## Sprint 7 — Mystery School Decans & Rituals
**Jun 30 – Jul 13 | 31 points**

### Goal
Full 36-decan system with unlock logic, ritual performer, and journaling.

### Stories & Tasks

| Story | Points | Owner |
|---|---|---|
| E5-S3: Decan calendar + unlock logic | 13 | Debasis |
| E5-S4: Pre-built ritual performer | 8 | Debasis |
| E5-S5: Scry and journal submissions | 5 | Debasis |
| E5-S6: Graduation to Priest/Priestess | 5 | Debasis |

### Sprint 7 Deliverables
- [ ] All 36 decans seeded with date ranges
- [ ] Decan unlock cron running
- [ ] Progress map visual
- [ ] Ritual step-through UI per decan
- [ ] Scrying and mundane journals submittable
- [ ] Grace period and missed decan logic
- [ ] Graduation triggers + email + ritual builder unlock

### Dependencies / Blockers
- Beto/Suba: provide all 36 decan ritual content in structured format
- Beto: confirm start quarter date calculation rules
- Beto begins personal decan practice autumn equinox (Sep 22) — audio journal pipeline must be ready before then

---

## Sprint 8 — Polish, Analytics & Launch Prep
**Jul 14–27 | 25 points**

### Goal
Platform-wide quality pass, analytics, PayPal completion, and launch readiness.

### Stories & Tasks

| Story | Points | Owner |
|---|---|---|
| E7-S1: PayPal Connect (complete remaining tasks) | 3 | Debasis |
| E8-S1: Admin analytics dashboard | 5 | Debasis |
| E9-S3: Ayrshare social auto-posting (activate) | 2 | Debasis |
| E10-S3: Angular bundle size optimisation | 5 | Debasis |
| E1-S4: TypeScript models for all API contracts (Angular) | 5 | Debasis |
| E6-S2: Google Calendar two-way sync (final testing) | 5 | Debasis |

### Sprint 8 Deliverables
- [ ] PayPal Connect fully working end-to-end
- [ ] Admin analytics dashboard complete
- [ ] Ayrshare posting activated (AYRSHARE_API_KEY in Vercel)
- [ ] Angular bundle optimised
- [ ] All Angular services typed with interfaces
- [ ] Google Calendar sync tested end-to-end

---

## Backlog (Post-Sprint 8 / v2)

| Story | Points | Notes |
|---|---|---|
| E4-S?: Community social features | 13+ | Deferred to 2027 per Beto |
| E10-S3: Angular bundle full rewrite | 13 | Large undertaking |
| E2-S2: Lead folder view all tabs | 8 | Angular — nice to have |
| Mobile app (React Native) | — | Post v1 roadmap item |
| CMS-driven blog | — | Replace hardcoded posts |
| Diviner discovery filters + search | — | Improve discovery UX |
| Client-facing cancellation + auto-refund | — | Self-serve cancel |
| Beto audio journal ingestion pipeline | 5 | For autumn equinox decan cycle |

---

## Definition of Done (DoD)

A story is **Done** when:
- [ ] All acceptance criteria checked off
- [ ] Code reviewed (self-review if solo dev)
- [ ] Deployed to development environment
- [ ] Tested on staging with real data (not mocked)
- [ ] No TypeScript errors on build
- [ ] API route has error handling for all edge cases
- [ ] Success and failure email templates exist (if story involves email)
- [ ] TASKS.md updated with what was completed
- [ ] Any new DB migration applied via `scripts/run-migration.js`

---

## Key Dates & Milestones

| Date | Milestone |
|---|---|
| 2026-04-07 | Sprint 1 starts |
| 2026-04-10 | Tabby onboarded on AstrologyPro (Beto target) |
| 2026-04-20 | Suba delivers first module batch to Debasis |
| 2026-05-04 | Training school MVP live (modules + quiz) |
| 2026-05-18 | Training school complete (cert + Tabby booking) |
| 2026-05-22 | Beto moves to Vietnam |
| 2026-06-01 | Community signup + family units live |
| 2026-06-15 | Community charts + transits live |
| 2026-06-29 | Mystery School enrollment open |
| 2026-07-13 | Mystery School decans live |
| 2026-07-27 | Full platform v1 launch-ready |
| 2026-09-22 | Beto begins personal decan journey (autumn equinox) — audio journal pipeline must be ready |
