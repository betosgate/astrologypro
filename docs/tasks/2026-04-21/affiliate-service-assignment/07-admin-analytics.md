# Task 07 — Admin Analytics

- Status: Not Started
- Priority: P1
- Depends On: Tasks 01, 02, 03 (data must flow; UI tasks 04–05 can ship in parallel)
- Blocks: Nothing — closes out admin visibility needed for production operation

## Goal

Give the platform admin a single consolidated surface to see all affiliate activity, all campaigns, and all commission outflow across every diviner and every affiliate — with drill-downs by any dimension (affiliate, campaign, service, diviner, scope, date, channel, geo, device) and CSV exports for accounting.

Without this, an admin has to SSH into the DB to understand where money is flowing. That's unacceptable for a live platform with real commission liabilities.

## Current State

- `/admin/analytics/landing-pages` exists (Sprint 2026-04-17) — gives admin cross-diviner visibility for landing pages.
- `/admin/campaigns` lists campaigns from every diviner but has no cross-affiliate analytics layer.
- No admin view of the `diviner_service_affiliates` table or `campaign_conversions` aggregates.

## Implementation Steps

### 1. `/admin/analytics/affiliates` — Affiliate Leaderboard

Route: `src/app/admin/analytics/affiliates/page.tsx` (new).

**KPI strip at top:**
- Active affiliates (count of distinct `affiliate_id` with at least one active assignment)
- Active assignments (count of `diviner_service_affiliates.is_active = true`)
- Commission paid this month (SUM `commission_amount_cents` WHERE `converted_at` in month)
- Commission paid all-time
- Average commission as % of GMV

**Main table — per-affiliate rows:**

| Column | Source |
|---|---|
| Affiliate | JOIN to user profile |
| Type | `diviner_service_affiliates.affiliate_type` |
| Active Assignments | COUNT(*) FROM diviner_service_affiliates WHERE affiliate_id = row AND is_active |
| Active Campaigns | COUNT(*) FROM affiliate_campaigns WHERE owner_affiliate_id = row AND status='active' |
| Clicks (period) | COUNT(*) FROM campaign_clicks WHERE affiliate_id = row AND clicked_at in period AND NOT is_bot |
| Unique Clicks (period) | COUNT(*) FROM campaign_clicks WHERE … AND is_unique_click |
| Conversions (period) | COUNT(*) FROM campaign_conversions WHERE affiliate_id = row AND converted_at in period AND reversed_at IS NULL |
| GMV Driven (period) | SUM order_amount_cents FROM campaign_conversions WHERE … |
| Commission Earned (period) | SUM commission_amount_cents FROM campaign_conversions WHERE … |

Sortable by every metric. Default sort: Commission Earned descending.

**Filters:**
- Period: 7d / 30d / 90d / This month / All time / Custom
- Affiliate type: all / diviner_affiliate / social_advocate
- Status: all / with active assignments / with active campaigns / inactive
- Min commission threshold (hide noise)

**Row click → `/admin/analytics/affiliates/[id]`** (step 2).

### 2. `/admin/analytics/affiliates/[id]` — Single-Affiliate Deep Dive

Route: `src/app/admin/analytics/affiliates/[id]/page.tsx` (new).

**Header:** affiliate avatar + name + type + joined_at + status.

**KPI strip:** Same 5 KPIs as leaderboard but scoped to this affiliate.

**Sections:**

1. **Active Assignments** — table of every `diviner_service_affiliates` row this affiliate holds across ALL diviners. Columns: Diviner (clickable), Scope, Commission, Campaigns running, Performance (30d), Status.

2. **All Campaigns** — table of every `affiliate_campaigns` row owned by this affiliate (current + historical). Columns: Name, Diviner, Status, Destination, Code, Clicks, Conversions, GMV, Commission, Dates.

3. **By Diviner breakdown** — bar chart + table showing which diviners this affiliate earns most from.

4. **By Service breakdown** — bar chart + table showing which service templates convert best for this affiliate.

5. **Time-series chart** — clicks, conversions, commission by day/week for the selected period.

6. **Conversion log** — paginated `campaign_conversions` rows with booking_id, diviner, service, amount, commission, reversed_at. Link each booking_id to `/admin/bookings/[id]`.

7. **Red-flag panel (abuse detection):**
   - Click → conversion ratio anomalies (too high click volume with zero conversions)
   - IP clustering (many clicks from same `ip_hash`)
   - Bot rate (percent of clicks with `is_bot = true`)
   - Clicks that happen within seconds of each other from the same session

### 3. `/admin/analytics/campaigns` — Campaign Leaderboard

Route: `src/app/admin/analytics/campaigns/page.tsx` (new).

All `affiliate_campaigns` across the platform, both owner types. Same structure as the affiliate leaderboard but rows = campaigns.

Extra filter: `owner_type` (diviner / affiliate / all).

Each row shows: Name, Owner (diviner or affiliate), Destination (Profile or Service name), Code, Status, Clicks, Conversions, GMV, Commission, Start/End.

Row click → existing `/admin/campaigns/[id]` OR a new admin-facing detail page.

### 4. `/admin/analytics/commission` — Financial View

Route: `src/app/admin/analytics/commission/page.tsx` (new).

Focus: "how much does the platform owe whom, and what's been paid".

**Summary cards:**
- Commission earned this month (sum of active conversions)
- Commission paid this month (if payout system exists — else 0)
- Outstanding (earned - paid)
- Reversed/clawback (sum of `reversed_at IS NOT NULL`)

**Main table — per-affiliate monthly rows:**

| Affiliate | Month | Conversions | GMV | Commission Earned | Paid | Outstanding |

Sortable by outstanding descending (largest liabilities first).

**Row click → affiliate detail page (step 2) scoped to that month.**

### 5. APIs

All under `src/app/api/admin/analytics/`:

- `GET /affiliates` — leaderboard payload. Query params: `period`, `affiliate_type`, `status`, `min_commission_cents`, `page`, `page_size`, `sort_by`, `sort_dir`.
- `GET /affiliates/[id]` — single-affiliate aggregate.
- `GET /affiliates/[id]/conversions` — paginated conversion log.
- `GET /affiliates/[id]/campaigns` — paginated campaign list.
- `GET /campaigns` — cross-platform campaign leaderboard.
- `GET /commission` — financial view.
- `GET /commission/export` — CSV streaming response.

All routes authenticate with `getAdminUser()` and reject non-admins with 403.

### 6. Shared SQL views (optional but recommended)

Create materialised views or plain views in a DB migration to keep the API queries readable and fast:

```sql
CREATE OR REPLACE VIEW v_affiliate_performance AS
  SELECT
    cc.affiliate_id,
    cc.affiliate_type,
    DATE_TRUNC('day', cc.clicked_at) AS day,
    COUNT(*) FILTER (WHERE NOT cc.is_bot) AS human_clicks,
    COUNT(*) FILTER (WHERE cc.is_unique_click AND NOT cc.is_bot) AS unique_clicks
  FROM campaign_clicks cc
  WHERE cc.affiliate_id IS NOT NULL
  GROUP BY 1, 2, 3;

CREATE OR REPLACE VIEW v_affiliate_commission AS
  SELECT
    cv.affiliate_id,
    cv.affiliate_type,
    ac.diviner_id,
    ac.destination_type,
    ac.destination_service_template_id,
    DATE_TRUNC('month', cv.converted_at) AS month,
    COUNT(*) FILTER (WHERE cv.reversed_at IS NULL) AS conversions,
    SUM(cv.order_amount_cents) FILTER (WHERE cv.reversed_at IS NULL) AS gmv_cents,
    SUM(cv.commission_amount_cents) FILTER (WHERE cv.reversed_at IS NULL) AS commission_cents
  FROM campaign_conversions cv
  JOIN affiliate_campaigns ac ON ac.id = cv.campaign_id
  GROUP BY 1, 2, 3, 4, 5, 6;
```

The API queries then read from these views instead of reassembling the aggregations per-request.

### 7. CSV exports

Every table view has a "Export CSV" button. Server streams CSV with the same filters applied. Use `Content-Type: text/csv` and `Content-Disposition: attachment; filename="…"`.

### 8. Admin nav entry

Add the three new pages to the admin sidebar under a new **"Analytics"** group or extend the existing one. Reuse the pattern in `src/app/admin/analytics/landing-pages/page.tsx`.

## Verification Plan

1. Seed data: 2 diviners, 3 affiliates, 4 assignments, 5 campaigns (3 affiliate-owned, 2 diviner-owned), 20 clicks, 4 conversions totalling $500 GMV and $100 commission.

2. Navigate to `/admin/analytics/affiliates` as admin. Verify:
   - KPI strip shows 3 active affiliates, 4 active assignments, $100 commission paid (all-time), correct averages.
   - Table lists 3 rows sorted by Commission Earned desc.
   - `SELECT COUNT(DISTINCT affiliate_id) FROM diviner_service_affiliates WHERE is_active` returns 3.
   - `SELECT SUM(commission_amount_cents) FROM campaign_conversions WHERE reversed_at IS NULL` returns `10000`.

3. Change period filter to "7d" → table re-queries and row values shrink accordingly.

4. Change affiliate_type filter to `social_advocate` → only matching rows remain.

5. Click row for Affiliate A → land on detail page. Verify all 7 sections render with correct data, red-flag panel correctly shows 0% bot rate.

6. Navigate to `/admin/analytics/campaigns` → 5 campaigns listed. Filter by `owner_type=affiliate` → 3 rows.

7. Navigate to `/admin/analytics/commission`. Verify outstanding = $100 (since no payouts yet). Filter by month → current month row only.

8. Click CSV export on each table → downloadable file with matching row count.

9. Log in as non-admin user → try to hit `/admin/analytics/affiliates` directly → redirect to login or 403.

10. Reverse one conversion (set `reversed_at`). Reload all pages. Verify the reversed row is excluded from commission totals.

## Edge Cases

- Affiliate with no conversions → row still shows in leaderboard with zeroes (not hidden unless min_commission filter is set).
- Affiliate type change is disallowed at schema level; no special UI handling needed.
- Very high commission filter → empty state with helpful message.
- Date range spans > 1 year → paginate or aggregate by week/month to keep page snappy.
- Concurrent conversions during report generation → snapshot with `FOR SHARE` or accept small discrepancies; the audit view is eventually-consistent.
- Reversed conversion → excluded from all SUMs and COUNTs but still visible in detail page conversion log with "Reversed" badge.

## Rollback Plan

- Remove routes from admin sidebar → pages become orphaned but still accessible by URL.
- Or delete the route files entirely — no data mutation occurred, just read endpoints.
- The SQL views can be dropped if added: `DROP VIEW IF EXISTS v_affiliate_performance; DROP VIEW IF EXISTS v_affiliate_commission;`.

## Performance notes

- Leaderboard queries can scan many rows on large datasets. Ensure these indexes (added in Task 01) are in use:
  - `idx_campaign_clicks_affiliate (affiliate_id, affiliate_type) WHERE affiliate_id IS NOT NULL`
  - `idx_campaign_conversions_booking (booking_id)`
- For platforms with > 1M clicks, migrate the views to materialized views refreshed nightly.
- Period filters default to 30 days to avoid full-table scans.
