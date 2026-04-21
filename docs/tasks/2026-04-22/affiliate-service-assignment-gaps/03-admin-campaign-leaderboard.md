# Task 03 — Admin Campaign Leaderboard

- Status: Not Started
- Priority: P0 (Critical)
- Depends On: 2026-04-21 Task 01 (schema), Task 07 (existing admin analytics surface)
- Blocks: Operations visibility across campaigns platform-wide

## Goal

Give admins a single surface that ranks every campaign — both `owner_type='diviner'` and `owner_type='affiliate'` — by performance. Parent Task 07 Phase 7 Step 3 called for this; it was not built. Without it, admins cannot see which campaigns drive the most clicks/conversions/revenue across the platform.

## Current State

- `/admin/analytics/affiliates/page.tsx` — affiliate leaderboard, per-affiliate deep-dive, present.
- `/admin/analytics/commission/page.tsx` — commission financial view, present.
- No `/admin/analytics/campaigns` page.
- No `GET /api/admin/analytics/campaigns` API.
- Underlying data already exists in `affiliate_campaigns` + `campaign_clicks` + `campaign_conversions`.

## Implementation Steps

### 1. API: `GET /api/admin/analytics/campaigns`

Create `src/app/api/admin/analytics/campaigns/route.ts`.

Query parameters:
- `range` — `7d` | `30d` | `90d` | `all` (default `30d`)
- `owner_type` — `all` | `diviner` | `affiliate` (default `all`)
- `status` — `all` | `active` | `paused` | `archived` (default `all`)
- `search` — free-text over campaign name / code
- `sort` — `clicks` | `conversions` | `commission` | `revenue` | `ctr` | `cvr` (default `clicks`)
- `order` — `asc` | `desc` (default `desc`)
- `limit` — default 50, max 500
- `offset` — default 0

Auth: admin-only. Return 403 for non-admins. Use the existing admin-auth helper (look at `src/app/api/admin/analytics/affiliates/route.ts` for the pattern).

Response shape (RFC 9457 errors on failure):

```ts
{
  range: "30d",
  rows: [
    {
      campaign_id: string,
      campaign_name: string,
      campaign_code: string,
      owner_type: "diviner" | "affiliate",
      diviner_id: string,
      diviner_username: string,
      owner_affiliate_id: string | null,
      owner_affiliate_type: "diviner_affiliate" | "social_advocate" | null,
      owner_affiliate_username: string | null,
      destination_type: "PROFILE" | "SERVICE",
      destination_label: string,  // service title or "Profile"
      status: string,
      clicks: number,
      unique_clicks: number,
      views: number,
      conversions: number,
      ctr: number,   // clicks / views
      cvr: number,   // conversions / clicks
      order_revenue_cents: number,
      commission_cents: number,
      created_at: string
    }
  ],
  total: number,
  generated_at: string
}
```

Aggregation query shape:

```sql
WITH click_agg AS (
  SELECT campaign_id,
         COUNT(*) AS clicks,
         COUNT(DISTINCT COALESCE(anonymous_visitor_id, ip_hash)) AS unique_clicks
  FROM campaign_clicks
  WHERE clicked_at >= $1
  GROUP BY campaign_id
),
view_agg AS (
  SELECT ac.id AS campaign_id, COUNT(pv.id) AS views
  FROM affiliate_campaigns ac
  LEFT JOIN page_views pv
    ON pv.ref_code = ac.campaign_code AND pv.created_at >= $1
  GROUP BY ac.id
),
conv_agg AS (
  SELECT campaign_id,
         COUNT(*) AS conversions,
         SUM(order_amount_cents) AS order_revenue_cents,
         SUM(commission_amount_cents) AS commission_cents
  FROM campaign_conversions
  WHERE converted_at >= $1
    AND reversed_at IS NULL
  GROUP BY campaign_id
)
SELECT ac.*, ... FROM affiliate_campaigns ac
LEFT JOIN click_agg ca ON ca.campaign_id = ac.id
LEFT JOIN view_agg va  ON va.campaign_id = ac.id
LEFT JOIN conv_agg cva ON cva.campaign_id = ac.id
WHERE (...filters...)
ORDER BY (...sort...) , ac.id   -- deterministic tie-breaker (Hard Law #16)
LIMIT $N OFFSET $M;
```

Keep the query in a dedicated SQL function or a well-commented TS query builder. Deterministic ORDER BY ending in `ac.id` is mandatory.

### 2. Page: `/admin/analytics/campaigns/page.tsx`

Server Component by default (Hard Law #17). Client islands only for the interactive filter controls.

Layout:
- Header: "Campaign Leaderboard" + date range selector + owner-type filter + status filter
- Search input
- Table columns: Campaign, Owner, Destination, Clicks, Views, CTR, Conversions, CVR, Revenue, Commission, Status
- Row click → opens the per-campaign detail drawer or routes to existing campaign detail page
- Pagination: keyset if row counts justify (Hard Law #16); offset is acceptable to start
- Empty state + skeleton

Reuse components from `src/app/admin/analytics/affiliates/page.tsx` (date picker, filter chips, table shell).

### 3. Add a link in the admin analytics nav

Wherever `/admin/analytics/affiliates` and `/admin/analytics/commission` are surfaced (nav / index page), add a "Campaigns" entry pointing at the new route.

### 4. CSV export hook

Out of scope here — handled in [Task 04](04-admin-analytics-csv-exports.md). But the page should render the export button as a stub that the next task wires up.

## Verification Plan

### A. API
1. `GET /api/admin/analytics/campaigns?range=30d` as admin → 200, payload matches shape above.
2. Same as non-admin → 403 with RFC 9457 problem+json body.
3. `sort=revenue&order=desc` → rows sorted by `order_revenue_cents DESC, id DESC`.
4. `owner_type=affiliate&status=active` → only rows matching both filters.
5. Pagination determinism: call twice with the same params, assert identical ordering.

### B. Page
1. Visit `/admin/analytics/campaigns` → table renders with real data.
2. Switch date range → rows refresh, counts change.
3. Search for a known campaign name → filters correctly.
4. Click a row → opens detail (or navigates to campaign detail page).

### C. Query performance
1. `EXPLAIN ANALYZE` the aggregation query (Hard Law #20). With existing indexes from parent sprint, expect index scans on `campaign_clicks.campaign_id`, `page_views.ref_code`, `campaign_conversions.campaign_id`.
2. If any seq-scan on a large table appears, add an index in a follow-up migration (not this sprint — additive only, coordinate separately).

## Edge Cases

- Campaigns with zero clicks / conversions: must appear with zeros, not be filtered out.
- Reversed conversions (`reversed_at IS NOT NULL`): excluded from counts and commission totals.
- Campaigns with NULL `campaign_code`: should not exist, but guard the page-views join (`ref_code = ac.campaign_code` returns no rows when code is NULL — safe).
- Commission snapshot null on diviner-owned campaigns: represent as 0 cents commission in the response, never NaN.

## Out of Scope

- Per-campaign conversion funnel chart (views → clicks → bookings over time). Separate future task.
- Real-time updates. This is a batch read.

## Rollback Plan

Delete the route file + the page file + the nav link. No schema change.
