# Implementation Guide — 2026-04-21 Sprint

## READ THIS FIRST

**App location:** `/home/this-pc/Documents/Indra/Beto Project/astrologypro/`
**Stack:** Next.js 13 (App Router), Supabase (PostgreSQL), TypeScript, Tailwind, shadcn/ui
**Project rules:** See `CLAUDE.md` at the repo root. Non-negotiable.

---

## Features in this sprint folder

Two independent workstreams share this folder. Each has its own master task doc, migration plan, and rules.

| Folder | Status | Entry point |
|---|---|---|
| [`affiliate-service-assignment/`](affiliate-service-assignment/00-master-task.md) | In progress | `affiliate-service-assignment/00-master-task.md` |
| [`landing-page-simplification/`](landing-page-simplification/00-master-task.md) | Not started | `landing-page-simplification/00-master-task.md` |

**The rest of this README covers only the affiliate work.** For landing-page-simplification, start at its own master task doc — its design, migration strategy, and acceptance criteria are distinct from the affiliate sprint.

---

## What You Are Building (affiliate workstream)

This workstream refactors the affiliate–campaign relationship so affiliates are tied to a diviner's **service or profile** (not to individual campaigns), and affiliates create their own campaigns from their own dashboard. Attribution is **URL-only** (`?ref=` query param) — no cookies.

### Feature: Service-Scoped Affiliate Assignments + Affiliate-Owned Campaigns
**Folder:** `affiliate-service-assignment/`
**Summary:** Diviner assigns affiliates to their profile or to specific services with a pre-defined commission. Affiliates see those assignments on their dashboard and create their own campaigns to promote them. Diviner campaigns lose the affiliate/commission dimension entirely and become pure marketing runs. All clicks and conversions are attributed through the URL (`?ref=`), never through cookies.

---

## Global Execution Order (Follow Exactly)

```
STEP  TASK FILE                                                WHAT IT DOES
────  ─────────────────────────────────────────────────────    ──────────────────────────────────────────
 1    01-schema-foundation.md
      → Supabase migration: diviner_service_affiliates table, extend affiliate_campaigns with owner_type/owner_affiliate_id, extend campaign_clicks + campaign_conversions, booking.ref_code column, indexes, RLS

 2    02-url-attribution-pipeline.md
      → Extend /r/[code] to capture affiliate-owned campaign context; propagate ?ref= on every internal link; ensure booking row persists ref_code at creation

 3    03-conversion-attribution-hook.md
      → Post-payment hook reads booking.ref_code → campaign → owner_affiliate_id → commission from diviner_service_affiliates; inserts campaign_conversions row

 4    04-diviner-assignment-ui.md
      → New Assignments UI in the diviner dashboard (/dashboard/affiliates): assign by Profile or Service, set commission, view performance, revoke

 5    05-affiliate-dashboard-ui.md
      → Affiliate portal: My Assignments list, Create Campaign flow (pre-scoped to an active assignment), earnings breakdown

 6    06-migration-and-deprecation.md
      → Backfill existing campaign_affiliates rows into the new model, read-only legacy UI, telemetry cutover plan

 7    07-admin-analytics.md
      → Cross-affiliate / cross-campaign / cross-diviner admin analytics: affiliate leaderboard, affiliate deep-dive, campaign leaderboard, commission financial view, CSV exports
```

---

## Critical Rules

### Rule 1: URL-only attribution — no cookies
The attribution pipeline reads `?ref=` on every request and writes it to the booking row at creation. No `ap_aff` cookie, no localStorage, no browser-side persistence. All internal links on landing pages and booking flows MUST preserve the `?ref=` parameter.

### Rule 2: Commission lives on the assignment, not on the campaign
`diviner_service_affiliates.commission_value` is the source of truth. When an affiliate creates a campaign for a destination they're assigned to, the commission is frozen at creation into `affiliate_campaigns.commission_value_snapshot` and into each `campaign_clicks` / `campaign_conversions` row.

### Rule 3: Diviner campaigns ≠ Affiliate campaigns
`affiliate_campaigns.owner_type = 'diviner'` → no commission, no affiliate credit ever.
`affiliate_campaigns.owner_type = 'affiliate'` → requires an active `diviner_service_affiliates` row for the chosen destination; commission is mandatory.

### Rule 4: SERVICE and PROFILE are independent scopes
No precedence logic. An affiliate with both a PROFILE-level and a SERVICE-level assignment for the same diviner has **two independent commission streams**. The campaign's destination picks which one applies at conversion time.

### Rule 5: Don't break existing data
Existing `campaign_affiliates` rows stay readable. Existing diviner-owned campaigns continue to work. Migration backfills, doesn't delete. A feature flag controls whether the new flow is active.

### Rule 6: Migration delivery — 3 files per migration, run via `/admin/db/migrations`

This project uses a custom in-app migration runner. Every migration requires THREE files; applying it = clicking Run on that admin page after deploy. Full guide: `docs/db-migrations.md`.

- `supabase/migrations/<id>.sql` — canonical SQL, idempotent (`IF NOT EXISTS`, `ON CONFLICT`, etc.)
- `src/data/migrations/<id>.ts` — bundled mirror (generated via the Python helper in Task 01)
- Entry in `src/lib/db/migrations.ts` — registers it in the allowlist

Migration IDs use the timestamp prefix `20260421NNNNNN_description`. The same ID appears in all three places and must match exactly.

**No DROPs in any migration this sprint.** Dropping the legacy `campaign_affiliates` table happens in a separate follow-up migration (spec'd in Task 06) ~30 days after cutover.

### Rule 7: Attribution logged everywhere
Every click and every page view that carries `?ref=` gets the affiliate logged. No silent drops. No partial attribution.

---

## Dependencies from Prior Sprints

- `diviner_services.is_enabled` (Sprint 2026-04-17) — affiliate can only be assigned to a service the admin has enabled for that diviner
- `service_templates` table — scope of SERVICE-level assignments
- `affiliate_campaigns` / `campaign_clicks` / `campaign_conversions` — extended, not replaced
- `/r/[code]` route — extended with affiliate capture
- `tracking_links` — unchanged

---

## Success Criteria

1. A diviner can assign any active affiliate to their profile or any enabled service, with a pre-defined commission.
2. An affiliate sees every assignment they hold on their own dashboard.
3. An affiliate can create a campaign only for an active assignment they hold. Campaign creation is blocked otherwise.
4. Every click on a campaign URL is logged with affiliate attribution when applicable.
5. Every booking with a `?ref=` that resolves to an affiliate-owned campaign creates a `campaign_conversions` row with the correct commission.
6. No cookies are set by the attribution pipeline.
7. All internal links on landing pages and booking flows preserve `?ref=`.
8. Existing diviner-owned campaigns continue to work unchanged.
9. Existing `campaign_affiliates` data migrated into `diviner_service_affiliates` without loss.

---

## Out of Scope (for this sprint)

- Payout disbursement to affiliates (separate sprint)
- Multi-level / tiered affiliate programs
- Email notifications when assignments change
- Admin-level affiliate governance beyond what the diviner sees

---

## Start Here

1. Read this README completely.
2. Read `CLAUDE.md` at the repo root.
3. Open `affiliate-service-assignment/00-master-task.md`.
4. Execute the child tasks in order (01 → 06).
5. After each task, run its verification plan before advancing.
