# Master Task - Campaign Destination Selection + Click Tracking - 2026-04-17

> **START HERE:** Read `docs/tasks/2026-04-17/README.md` first. It contains the global execution order, critical rules, and codebase map that apply to ALL tasks. This feature (Feature B) MUST be built AFTER Feature A (landing pages Tasks 01-05 minimum).

- Status: Not Started
- Priority: P0
- Owner: Full Stack
- Module: Campaigns + Destination Selection + Click Tracking
- PMS Type: Master Task
- Folder Path: `docs/tasks/2026-04-17/campaign-destination-tracking`
- Task File: `docs/tasks/2026-04-17/campaign-destination-tracking/00-master-task.md`
- Sprint Guide: `docs/tasks/2026-04-17/README.md`
- Depends On: `docs/tasks/2026-04-17/diviner-service-landing-pages/` — minimum required: Task 01 (schema), Task 02 (backfill + utilities), Task 03 (service_templates.is_active column). Tasks 04-05 are recommended but not blocking.

## Goal

Extend the existing campaign system so diviners can select a **destination** (their profile page or an enabled service landing page) when creating a campaign. Extend the existing tracking link system (`/r/[code]`) with rich click logging. Connect campaigns to service access control from the landing page system.

## Business Intent

- Diviners create campaigns that point to their profile OR a specific enabled service
- Each campaign gets a unique trackable URL via the existing `/r/[code]` system
- Every click is logged with full attribution (device, geo, referrer, session)
- Analytics show which destination type performs better
- Service access control is enforced — diviner can only pick enabled services
- Future conversion attribution supported without schema redesign

## Architecture Decision: Extend, Don't Rebuild

**Decision:** Extend the existing `affiliate_campaigns` table and `/r/[code]` tracking system. Do NOT create parallel campaign or redirect systems.

**Reason:** The codebase already has:
- `affiliate_campaigns` table with status model, UTM fields, diviner_id, budget, commission (migration `20260413000005`)
- Full CRUD APIs at `/api/dashboard/campaigns/` and `/api/admin/campaigns/`
- Dashboard UI at `/dashboard/campaigns/` and `/admin/campaigns/`
- Tracking link redirect at `/r/[code]` with `tracking_links` table
- Affiliate redirect at `/api/ref/[slug]` with `affiliate_referral_links` + `affiliate_clicks`
- Attribution tracking in `diviner-analytics.ts` with UTM, referral, geo, IP hash
- Rate limiting at `src/lib/rate-limit.ts`
- Bot detection in `src/proxy.ts`
- Geo detection via Vercel headers

### Existing Assets (Do NOT Rebuild)

| Asset | File Path | What It Does |
|---|---|---|
| affiliate_campaigns table | `supabase/migrations/20260413000005_affiliate_campaigns.sql` | Campaign records with status, UTM, commission, budget |
| campaign_affiliates table | Same migration | Affiliate enrollment per campaign |
| campaign_conversions table | Same migration | Conversion tracking per campaign |
| tracking_links table | `supabase/migrations/20260331000001_initial_schema.sql` | Short URL codes with destination, clicks counter |
| Campaign CRUD API (diviner) | `src/app/api/dashboard/campaigns/route.ts` | GET list + POST create |
| Campaign detail API | `src/app/api/dashboard/campaigns/[id]/route.ts` | GET detail + PATCH update + DELETE |
| Campaign affiliates API | `src/app/api/dashboard/campaigns/[id]/affiliates/route.ts` | Affiliate enrollment |
| Campaign reports API | `src/app/api/dashboard/campaigns/reports/route.ts` | Performance reports |
| Admin campaigns API | `src/app/api/admin/campaigns/route.ts` | Admin campaign management |
| Admin reports API | `src/app/api/admin/campaigns/reports/route.ts` | Admin analytics |
| Tracking redirect route | `src/app/r/[code]/route.ts` | Redirect `/r/[code]` to destination |
| Affiliate redirect route | `src/app/api/ref/[slug]/route.ts` | Affiliate link redirect with click logging |
| Campaign defaults | `src/lib/campaign-defaults.ts` | Auto-create default campaigns |
| Diviner campaign dashboard | `src/app/dashboard/campaigns/page.tsx` | Campaign list UI with status badges |
| Campaign detail page | `src/app/dashboard/campaigns/[id]/page.tsx` | Campaign detail with affiliates + conversions |
| Admin campaign page | `src/app/admin/campaigns/page.tsx` | Admin campaign management UI |
| Affiliate campaign page | `src/app/affiliate/campaigns/page.tsx` | Affiliate view of campaigns |
| Advocate campaign page | `src/app/advocate/campaigns/page.tsx` | Advocate view of campaigns |
| Rate limiting | `src/lib/rate-limit.ts` | Sliding window rate limiter |
| Bot detection | `src/proxy.ts` | Social bot UA regex |
| Attribution tracking | `src/lib/diviner-analytics.ts` | UTM, referral, traffic source, geo, IP hash |
| Page tracker | `src/components/landing/page-tracker.tsx` | Client-side view tracking via sendBeacon |

## Key Decisions (Confirmed by Product)

| # | Decision | Answer |
|---|---|---|
| 1 | New campaigns table or extend existing? | Extend `affiliate_campaigns` with destination columns |
| 2 | New redirect route or extend existing? | Extend `/r/[code]` with rich click logging |
| 3 | Service disabled after campaign created? | Auto-pause the campaign |
| 4 | Campaign code format | Prefixed: `cmp_` + 8 alphanumeric chars (e.g., `cmp_8FK29XQ`) |

## Connection to Landing Page System

This feature depends on the Diviner Service Landing Page Access Control system (Tasks 01-08 in `docs/tasks/2026-04-17/diviner-service-landing-pages/`).

Specifically requires:
- `diviner_services` table with `is_enabled` column (Task 01)
- `diviner_services` backfill complete (Task 02)
- `checkDivinerServiceAccess()` utility (Task 02)
- Service access enforcement (Task 05)

```
Landing Page System              Campaign System
──────────────────              ───────────────
diviner_services.is_enabled ──→ campaign destination validation
service_templates ─────────────→ destination options API
/{username}/services/{slug} ───→ campaign redirect target
service landing analytics ─────→ campaign click attribution
```

## Child Tasks In Scope

### Phase 1 - Data Layer
1. `01-extend-campaigns-with-destinations.md` - Add destination columns to affiliate_campaigns, create campaign_clicks table, extend tracking_links

### Phase 2 - Destination Selection API + Validation
2. `02-destination-selection-api.md` - Destination options API, campaign creation validation, auto-pause on service disable

### Phase 3 - Rich Click Tracking
3. `03-extend-tracking-redirect.md` - Extend `/r/[code]` with rich click logging, unique click logic, bot filtering

### Phase 4 - Campaign Creation UI Update
4. `04-update-campaign-creation-ui.md` - Add destination selection to campaign form, URL preview, service access enforcement

### Phase 5 - Campaign Analytics
5. `05-campaign-destination-analytics.md` - Destination performance comparison, click analytics, admin reporting

## Delivery Expectations

1. Extend existing tables and routes — no new parallel systems
2. All existing campaign functionality continues working (backward compatible)
3. Destination validation enforces `diviner_services.is_enabled`
4. Campaign auto-pauses when linked service is disabled by admin
5. `/r/[code]` logs full click details (device, geo, referrer, session)
6. Unique vs total click distinction implemented
7. Analytics compare profile vs service campaign performance
8. Campaign codes use `cmp_` prefix format
9. Conversion attribution schema supports future event linking

## Done Definition

- affiliate_campaigns has destination_type + destination_id columns
- campaign_clicks table logs every click with full attribution
- Diviner campaign form shows destination selection (profile / enabled services)
- Disabled services cannot be selected as campaign destinations
- Campaign auto-pauses when its linked service is disabled
- `/r/[code]` logs rich click data and resolves destination by entity ID
- Unique click logic works (24h window per visitor per campaign)
- Admin can view destination performance comparison
- All existing campaign CRUD/UI continues working
- All 5 child tasks complete

## Verification Gate

1. Review each child task before implementation
2. Execute in phase order (1 through 5)
3. After each phase, verify no regression in existing campaign flows
4. Run security test: diviner cannot select disabled service as destination
5. Run UAT: diviner creates campaign → selects service → gets URL → visitor clicks → click logged → redirected correctly → admin sees analytics
