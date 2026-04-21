# Master Task — Service-Scoped Affiliate Assignments + Affiliate-Owned Campaigns — 2026-04-21

> **START HERE:** Read `docs/tasks/2026-04-21/README.md` first. It defines the execution order, critical rules, and dependencies.

- Status: Not Started
- Priority: P0
- Owner: Full Stack
- Module: Affiliates + Campaigns + Attribution
- PMS Type: Master Task
- Folder Path: `docs/tasks/2026-04-21/affiliate-service-assignment`
- Task File: `docs/tasks/2026-04-21/affiliate-service-assignment/00-master-task.md`
- Sprint Guide: `docs/tasks/2026-04-21/README.md`
- Depends On: Sprint `2026-04-17` — specifically Feature A (`diviner_services`, service access control) and Feature B (campaigns with entity-based destinations, `/r/[code]` redirect, `campaign_clicks` table)

## Goal

Replace the current "affiliates enrolled per-campaign" model with a cleaner two-tier design:

1. **Diviners assign affiliates to their profile or specific services** with a pre-defined commission rate stored once on the assignment.
2. **Affiliates create their own campaigns** from their own dashboard, each scoped to one assignment they hold.

Diviner-owned campaigns lose the affiliate/commission dimension entirely and become pure marketing runs. Attribution of clicks and conversions flows through the URL (`?ref=` param) — no browser cookies — so cross-diviner and cross-product contamination becomes architecturally impossible.

## Business Intent

- Affiliates get autonomy: one time setup per assignment, then they run as many campaigns as they want without diviner involvement.
- Diviners get predictable commission contracts: the rate is locked at assignment time, not per-campaign.
- No cookie/consent surface: the system never sets tracking cookies; attribution lives on URLs and booking rows only.
- Clean separation: campaigns measure marketing performance, assignments govern commercial partnership.
- Every click and conversion is recorded uniformly so analytics work end-to-end.

## Architecture Decisions (Confirmed by Product)

| # | Decision | Answer |
|---|---|---|
| 1 | Where does the affiliate relationship live? | `diviner_service_affiliates` — scoped by (diviner, destination_type, destination_id) |
| 2 | Can diviner-owned campaigns carry commission? | No. `owner_type='diviner'` campaigns have zero affiliate/commission dimension |
| 3 | Who creates affiliate-owned campaigns? | The affiliate, from their own dashboard. A campaign requires an active assignment |
| 4 | How is attribution carried? | URL-only via `?ref=<campaign_code>`. No cookies |
| 5 | SERVICE vs PROFILE precedence on conversion? | No precedence — campaign's destination picks the scope directly |
| 6 | Attribution window | Scoped to the URL session — ends when the visitor leaves the tagged path |
| 7 | Can an affiliate create a campaign without an assignment? | No — blocked at creation |
| 8 | What happens to existing `campaign_affiliates`? | Backfill to `diviner_service_affiliates`, keep read-only, retire after cutover |

## Existing Codebase Assets (Extend, Do NOT Rebuild)

| Asset | File Path | What It Does |
|---|---|---|
| `affiliate_campaigns` table | `supabase/migrations/20260413000005_affiliate_campaigns.sql` | Campaign records — extend with `owner_type`, `owner_affiliate_id`, `owner_affiliate_type`, `commission_value_snapshot` |
| `campaign_affiliates` table | Same migration | Deprecated — migrate data then retire |
| `campaign_conversions` table | Same migration | Extend with `ref_code_snapshot`, `commission_source` columns if useful |
| `campaign_clicks` table | `supabase/migrations/20260417000010_campaign_destinations_and_clicks.sql` | Extend with `affiliate_id`, `affiliate_type`, `commission_value_snapshot` |
| `tracking_links` table | `supabase/migrations/20260331000001_initial_schema.sql` | Unchanged |
| `/r/[code]` route | `src/app/r/[code]/route.ts` | Extend: read campaign's owner_affiliate_id, log click with affiliate, append `?ref=` to redirect URL |
| Campaign create/update APIs | `src/app/api/dashboard/campaigns/route.ts`, `.../[id]/route.ts` | Extend to accept owner_type. Reject affiliate-owned campaigns without a valid assignment |
| Affiliate-side campaign APIs | `src/app/api/advocate/campaigns/` (NEW — or reuse dashboard APIs with scope) | Create, update, list affiliate's own campaigns |
| Public landing page | `src/app/[username]/services/[slug]/page.tsx`, `src/app/[username]/page.tsx` | Already reads `ref` — extend to propagate on every internal link |
| `RefLinkPreserver` | `src/app/[username]/services/[slug]/ref-link-preserver.tsx` | Reuse: already handles ref propagation for book CTA |
| Booking create API | `src/app/api/.../bookings/...` | Extend: read `ref` from request body, persist on booking row |
| Page tracker | `src/components/landing/page-tracker.tsx` | Extend to record affiliate attribution from URL on every page view |
| Bot detection | `src/proxy.ts` | Reused for click filtering |

## Known Blockers to Resolve During Implementation

| Blocker | Severity | Detail | Resolution |
|---|---|---|---|
| `?ref=` propagation gaps | High | Some sections in the landing-page builder may render CTAs that don't preserve `ref` | Audit every CTA in `src/components/landing/sections/*` and thread `ref` through. Add a test for propagation |
| Affiliate portal surface | Medium | No `/advocate/campaigns` UI exists for affiliate-side creation yet | Build from scratch following the `/dashboard/campaigns` patterns |
| Existing bookings lack `ref_code` | Low | Legacy bookings can't be retroactively attributed | Column is nullable, legacy rows stay null, only forward traffic is attributed |
| Dual affiliate_type | Low | Both `diviner_affiliate` and `social_advocate` rows must coexist in new table | UNIQUE constraint includes affiliate_type so both are allowed per (diviner, destination) pair |

## Child Tasks In Scope

### Phase 1 — Data Layer Foundation
1. `01-schema-foundation.md` — New `diviner_service_affiliates` table; extend `affiliate_campaigns`, `campaign_clicks`, `campaign_conversions`; add `ref_code` to `bookings`; RLS and indexes

### Phase 2 — URL Attribution Pipeline
2. `02-url-attribution-pipeline.md` — `/r/[code]` captures affiliate from campaign owner, propagates `?ref=` on redirect; landing page tracker logs affiliate on every view; every internal link audited for `ref` propagation

### Phase 3 — Conversion Attribution
3. `03-conversion-attribution-hook.md` — Post-payment hook reads `booking.ref_code` → resolves campaign → credits `owner_affiliate_id` with commission from `diviner_service_affiliates`; writes `campaign_conversions` row

### Phase 4 — Diviner Assignment UI
4. `04-diviner-assignment-ui.md` — Assignments management in `/dashboard/affiliates`: create (Profile / Service scope), set commission, list, revoke, view performance per affiliate

### Phase 5 — Affiliate Dashboard UI
5. `05-affiliate-dashboard-ui.md` — Affiliate portal gets: My Assignments list, Create Campaign flow pre-scoped to an active assignment, Earnings dashboard breaking down clicks/conversions/commissions per campaign and per diviner

### Phase 6 — Migration and Deprecation
6. `06-migration-and-deprecation.md` — Backfill existing `campaign_affiliates` rows into the new model; convert each enrolled affiliate in a diviner-owned campaign into either a `diviner_service_affiliates` row + fresh affiliate campaign OR preserve with read-only legacy UI; telemetry cutover plan

### Phase 7 — Admin Analytics
7. `07-admin-analytics.md` — Cross-affiliate / cross-campaign / cross-diviner admin analytics surface: affiliate leaderboard, per-affiliate deep-dive page with abuse-detection red flags, campaign leaderboard across both owner types, commission financial view (outstanding vs paid), CSV exports. Reads from the existing tables; no new schema.

## Delivery Expectations

1. No cookies set by the attribution pipeline.
2. All internal links on landing pages preserve `?ref=` (verified by test).
3. Existing diviner-owned campaigns continue to work unchanged.
4. Affiliates cannot create a campaign without an active assignment (server-enforced).
5. Commission credited only when `booking.ref_code` resolves to an affiliate-owned campaign with a matching assignment.
6. Every click on an affiliate campaign URL records `campaign_clicks.affiliate_id`.
7. Analytics surfaces show per-affiliate breakdowns from the new `affiliate_id` column.
8. Existing `campaign_affiliates` data preserved for 30 days post-cutover.

## Done Definition

- `diviner_service_affiliates` table exists with RLS
- `affiliate_campaigns.owner_type` in use with constraint enforcing the affiliate-campaign-requires-assignment rule
- `/r/[code]` logs affiliate to `campaign_clicks`
- Bookings store `ref_code`
- Conversion hook runs and credits commission
- Diviner dashboard has a working Assignments page
- Affiliate dashboard has a working Assignments + Campaigns + Earnings page
- Migration script moves existing data without loss
- Admin analytics pages (affiliate leaderboard, deep-dive, campaign leaderboard, commission financial view) are live with CSV exports
- All 7 child tasks complete

## Verification Gate

1. Execute child tasks in phase order (1 through 6). Do NOT skip ahead.
2. After each phase, verify no regression in existing campaign / booking flows.
3. Run the URL-propagation audit: click an affiliate campaign URL, navigate through every CTA and intermediate page, confirm `?ref=` is on every URL and lands on the booking row.
4. Run end-to-end UAT: diviner creates an assignment → affiliate logs in, sees it, creates a campaign → visitor clicks campaign URL → books → commission credited with the exact rate from the assignment.
5. Security test: try to create an affiliate-owned campaign for a destination with no active assignment — must be rejected with 403. Try to view another diviner's assignments as an affiliate — must be forbidden.
