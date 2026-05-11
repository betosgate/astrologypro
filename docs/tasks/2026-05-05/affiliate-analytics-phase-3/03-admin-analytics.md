# Task 03 — Admin Consolidated Analytics Page

- Status: Not Started
- Priority: P0
- Depends on: —

## Goal

One page at `/admin/reports/affiliate-analytics` that gives operations
+ finance the platform-level picture: how the affiliate program is
performing financially, how fast money moves, where risk lives, and
which campaigns have ROI.

## Files to create / modify

| # | File | Action |
|---|---|---|
| 1 | `src/app/admin/reports/affiliate-analytics/page.tsx` | **Create** — server component, top-level page |
| 2 | `src/app/api/admin/reports/affiliate-analytics/route.ts` | **Create** — single endpoint returning all platform metrics |
| 3 | `src/app/admin/reports/affiliate-analytics/_components/PlatformMetricsGrid.tsx` | **Create** — 8-card grid |
| 4 | `src/app/admin/reports/affiliate-analytics/_components/PayoutVelocityChart.tsx` | **Create** — histogram of time-to-payout |
| 5 | `src/app/admin/reports/affiliate-analytics/_components/CampaignROITable.tsx` | **Create** — sortable table |
| 6 | `src/app/admin/reports/affiliate-analytics/_components/RiskSignalsPanel.tsx` | **Create** — affiliates with high reversal / refund rates |
| 7 | `src/app/admin/_components/AdminNav.tsx` (verify path) | **Modify** — add "Affiliate Analytics" nav link |
| 8 | `supabase/migrations/20260505000004_affiliate_phase_3_analytics.sql` (or whatever's next) | **Create** — Postgres helper functions for the heavy aggregations |
| 9 | `src/app/api/admin/reports/affiliate-analytics/cron-health/route.ts` | **Create** — cron health probe |
| 10 | `src/app/admin/reports/affiliate-analytics/_components/CronHealthBadge.tsx` | **Create** — pill + minutes-since-last-tick |
| 11 | `src/app/api/admin/reports/affiliate-analytics/intl-demand/route.ts` | **Create** — international-demand signal from rejections log |
| 12 | `src/app/admin/reports/affiliate-analytics/_components/IntlDemandCard.tsx` | **Create** — top-15 rejected countries |

## Platform metrics (9 cards)

| # | Metric | Formula |
|---|---|---|
| 1 | **Total commission paid out** (period) | `SUM net_transferred_cents WHERE status='completed'` |
| 2 | **Total commission outstanding** (held + ripe + paying) | `SUM commission_amount_cents WHERE payout_status IN ('unpaid','ripe','paying') AND reversed_at IS NULL` |
| 3 | **Median time-to-payout** (days) | `MEDIAN(paid_at - converted_at)` filtered to paid |
| 4 | **Average payout amount** | `AVG(net_transferred_cents) WHERE status='completed'` over the period |
| 5 | **Payout success rate** | `completed / (completed + failed)` over the period |
| 6 | **Reversal rate** | `reversed_count / total_conversions` |
| 7 | **Refund-after-payout rate** | `offset_applied_count / paid_count` |
| 8 | **Commission as % of GMV** | `total_commission_paid / total_gross_recognized` |
| 9 | **Active affiliates** (≥1 conversion in period) | `COUNT DISTINCT affiliate_account_id WHERE converted_at >= cutoff` |

## Edit 1 — Postgres helper functions

These three functions handle the heavy aggregations. Define in
`supabase/migrations/20260505000004_affiliate_phase_3_analytics.sql`
(re-verify next free ordinal; bump if needed):

```sql
-- ─── Median time-to-payout in days ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION affiliate_median_time_to_payout_days(
  p_cutoff TIMESTAMPTZ
)
RETURNS NUMERIC LANGUAGE SQL STABLE AS $$
  SELECT percentile_cont(0.5) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (paid_at - converted_at)) / 86400
  )
  FROM campaign_conversions
  WHERE payout_status = 'paid'
    AND paid_at IS NOT NULL
    AND converted_at IS NOT NULL
    AND (p_cutoff IS NULL OR converted_at >= p_cutoff);
$$;

-- ─── Payout velocity histogram ─────────────────────────────────────────────
-- Returns buckets of (days_band, count) for the chart.
CREATE OR REPLACE FUNCTION affiliate_payout_velocity_histogram(
  p_cutoff TIMESTAMPTZ
)
RETURNS TABLE (days_band TEXT, count BIGINT) LANGUAGE SQL STABLE AS $$
  WITH days AS (
    SELECT EXTRACT(EPOCH FROM (paid_at - converted_at)) / 86400 AS d
      FROM campaign_conversions
     WHERE payout_status = 'paid'
       AND paid_at IS NOT NULL
       AND (p_cutoff IS NULL OR converted_at >= p_cutoff)
  )
  SELECT
    CASE
      WHEN d < 1 THEN '<1d'
      WHEN d < 2 THEN '1-2d'
      WHEN d < 3 THEN '2-3d'
      WHEN d < 7 THEN '3-7d'
      WHEN d < 14 THEN '7-14d'
      ELSE '14d+'
    END AS days_band,
    COUNT(*)::BIGINT
  FROM days
  GROUP BY 1
  ORDER BY MIN(d);
$$;

-- ─── Campaign ROI ──────────────────────────────────────────────────────────
-- For each campaign, compute total gross + total commission + ROI.
-- ROI = (gross - commission - platform_fee) / commission. Negative if
-- platform retained less than the commission paid (rare but possible
-- with promotional rates).
CREATE OR REPLACE FUNCTION affiliate_campaign_roi(
  p_cutoff TIMESTAMPTZ
)
RETURNS TABLE (
  campaign_id UUID,
  campaign_name TEXT,
  conversion_count BIGINT,
  gross_cents BIGINT,
  commission_paid_cents BIGINT,
  platform_fee_cents BIGINT,
  net_to_platform_cents BIGINT,
  roi NUMERIC
)
LANGUAGE SQL STABLE AS $$
  SELECT
    c.campaign_id,
    ac.name AS campaign_name,
    COUNT(*)::BIGINT AS conversion_count,
    SUM(c.order_amount_cents)::BIGINT AS gross_cents,
    SUM(c.commission_amount_cents)::BIGINT AS commission_paid_cents,
    -- Approximate platform fee at 15% (real value comes from ledger if available)
    SUM(ROUND(c.order_amount_cents * 0.15))::BIGINT AS platform_fee_cents,
    SUM(ROUND(c.order_amount_cents * 0.15) - c.commission_amount_cents)::BIGINT
      AS net_to_platform_cents,
    CASE
      WHEN SUM(c.commission_amount_cents) > 0
      THEN (SUM(ROUND(c.order_amount_cents * 0.15) - c.commission_amount_cents)::NUMERIC
            / SUM(c.commission_amount_cents)::NUMERIC)
      ELSE NULL
    END AS roi
  FROM campaign_conversions c
  JOIN affiliate_campaigns ac ON ac.id = c.campaign_id
  WHERE c.reversed_at IS NULL
    AND (p_cutoff IS NULL OR c.converted_at >= p_cutoff)
  GROUP BY c.campaign_id, ac.name
  ORDER BY commission_paid_cents DESC;
$$;
```

> The campaign ROI function uses a hardcoded 15% platform-fee approximation
> for simplicity. **Verify** whether the platform fee is uniform across
> all bookings or varies (check `revenue_ledger_entries.platform_fee_cents`
> distribution). If non-uniform, replace the approximation with a JOIN to
> the ledger row per booking. Adds query time but produces accurate ROI.

## Edit 2 — Endpoint

**File:** `src/app/api/admin/reports/affiliate-analytics/route.ts`

```ts
import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Period = "30d" | "90d" | "365d" | "all";
function periodCutoff(p: Period) {
  const days: Record<Period, number | null> = { "30d": 30, "90d": 90, "365d": 365, all: null };
  const d = days[p];
  return d === null ? null : new Date(Date.now() - d * 86400000).toISOString();
}

export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const period = (url.searchParams.get("period") ?? "90d") as Period;
  const cutoff = periodCutoff(period);

  const admin = createAdminClient();

  // Aggregate counters
  let payoutsQ = admin
    .from("affiliate_payouts")
    .select("status, net_transferred_cents", { count: "exact" });
  if (cutoff) payoutsQ = payoutsQ.gte("created_at", cutoff);
  const { data: payouts } = await payoutsQ;

  let totalPaidCents = 0, completedCount = 0, failedCount = 0;
  for (const p of payouts ?? []) {
    if (p.status === "completed") {
      completedCount += 1;
      totalPaidCents += Number(p.net_transferred_cents ?? 0);
    } else if (p.status === "failed") {
      failedCount += 1;
    }
  }
  const payoutSuccessRate = (completedCount + failedCount) > 0
    ? completedCount / (completedCount + failedCount)
    : null;
  const avgPayoutCents = completedCount > 0
    ? Math.round(totalPaidCents / completedCount)
    : 0;

  let convQ = admin
    .from("campaign_conversions")
    .select("payout_status, paid_amount_cents, commission_amount_cents, reversed_at, affiliate_account_id, order_amount_cents", { count: "exact" });
  if (cutoff) convQ = convQ.gte("converted_at", cutoff);
  const { data: convs } = await convQ;

  let outstandingCents = 0, reversedCount = 0, paidCount = 0, offsetCount = 0, totalGrossCents = 0;
  const activeAffiliates = new Set<string>();
  for (const c of convs ?? []) {
    if (c.reversed_at) {
      reversedCount += 1;
      continue;
    }
    activeAffiliates.add(c.affiliate_account_id as string);
    totalGrossCents += Number(c.order_amount_cents ?? 0);
    if (["unpaid", "ripe", "paying"].includes(c.payout_status as string)) {
      outstandingCents += Number(c.commission_amount_cents ?? 0);
    } else if (c.payout_status === "paid") {
      paidCount += 1;
    } else if (c.payout_status === "offset_applied") {
      offsetCount += 1;
    }
  }

  const reversalRate = (convs?.length ?? 0) > 0 ? reversedCount / (convs!.length) : 0;
  const refundAfterPayoutRate = paidCount > 0 ? offsetCount / paidCount : 0;
  const commissionPctOfGmv = totalGrossCents > 0 ? totalPaidCents / totalGrossCents : 0;

  // Median time-to-payout via the helper function
  const { data: medianRow } = await admin.rpc("affiliate_median_time_to_payout_days", { p_cutoff: cutoff });
  const medianDaysToPayout = Number(medianRow ?? 0);

  return NextResponse.json({
    period,
    metrics: {
      totalPaidCents,
      outstandingCents,
      medianDaysToPayout,
      avgPayoutCents,
      payoutSuccessRate,
      reversalRate,
      refundAfterPayoutRate,
      commissionPctOfGmv,
      activeAffiliateCount: activeAffiliates.size,
    },
  });
}
```

## Edit 3 — Velocity histogram + ROI table endpoints

`/api/admin/reports/affiliate-analytics/velocity` — calls
`affiliate_payout_velocity_histogram` RPC, returns the buckets.

`/api/admin/reports/affiliate-analytics/campaign-roi` — calls
`affiliate_campaign_roi`, returns top-20 by `commission_paid_cents`.

Both same auth pattern (`getAdminUser`), same period filter, same RPC
return shape.

## Edit 4 — Risk signals endpoint

`/api/admin/reports/affiliate-analytics/risk-signals`

Per-affiliate aggregation flagging:
- Reversal rate >25% — possible click fraud
- Refund-after-payout rate >15% — possible chargeback abuse
- Conversion spike >3× their 30-day moving average — possible
  collusion with a single client

```ts
// Pseudo-SQL — implement via three separate queries + a JOIN in JS:
// SELECT affiliate_account_id, sum(...) FROM campaign_conversions
// GROUP BY affiliate_account_id
// HAVING reversal_rate > 0.25 OR refund_rate > 0.15
```

## UI — `PlatformMetricsGrid.tsx`

8 cards, 4×2 on desktop, 2×4 on mobile. Each card:

```
┌────────────────────────────────────────┐
│ [icon] Median time to payout           │
│                                         │
│       1.4 days                          │
│       ↓ 12% from previous period        │
└────────────────────────────────────────┘
```

Period-over-period delta when previous-period data exists.

## UI — `PayoutVelocityChart.tsx`

Bar chart (or horizontal bar) showing the distribution. X-axis = days
band, Y-axis = count.

## UI — `CampaignROITable.tsx`

| Campaign | Conversions | Gross | Commission | Platform retained | ROI |
|---|---|---|---|---|---|
| Mercury Retro | 47 | $7,520 | $1,504 | $-376 | -25% |
| Spring Healing | 23 | $3,910 | $586 | $0 | 0% |
| New Year's | 18 | $2,250 | $338 | $0 | 0% |

Color: ROI < 0 red, ROI > 0 green. Sort by `commission_paid_cents` DESC
by default; clicking column header re-sorts.

## Edit 5 — Cron health endpoint + widget

Operational visibility — answers "is the payout cron actually running?"

**File:** `src/app/api/admin/reports/affiliate-analytics/cron-health/route.ts`

Sources:
- `affiliate_payouts.created_at` MAX → last cron tick that produced
  any payout row (incl. dry-run)
- A simple "is the no-show-refunds cron running" check via the most
  recent `bookings.no_show_processed_at` value

```ts
export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Last payout-pass run (any tick that produced a row)
  const { data: lastPayout } = await admin
    .from("affiliate_payouts")
    .select("created_at, status")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Last no-show pass run (any booking processed as no-show)
  const { data: lastNoShow } = await admin
    .from("bookings")
    .select("no_show_processed_at")
    .not("no_show_processed_at", "is", null)
    .order("no_show_processed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Consecutive failures: count of trailing 'failed' payouts since
  // the last 'completed' or 'dry_run'.
  const { data: recentRuns } = await admin
    .from("affiliate_payouts")
    .select("status")
    .order("created_at", { ascending: false })
    .limit(20);
  let consecutiveFailures = 0;
  for (const r of recentRuns ?? []) {
    if (r.status === "failed") consecutiveFailures += 1;
    else break;
  }

  const lastTickAt = lastPayout?.created_at ?? null;
  const lastNoShowAt = lastNoShow?.no_show_processed_at ?? null;
  const minutesSinceLastTick = lastTickAt
    ? (Date.now() - new Date(lastTickAt).getTime()) / 60_000
    : null;

  // Cron is expected every 10 min. Healthy if last tick < 30 min ago.
  const status =
    minutesSinceLastTick === null ? "no_data"
    : minutesSinceLastTick > 60 ? "stale"
    : minutesSinceLastTick > 30 ? "warning"
    : "healthy";

  return NextResponse.json({
    status,
    lastTickAt,
    lastNoShowAt,
    minutesSinceLastTick,
    consecutiveFailures,
  });
}
```

UI: small status pill at the top of the analytics page —

```
🟢 Cron healthy — last tick 4 min ago    (consecutive failures: 0)
🟡 Cron warning — last tick 47 min ago   (consecutive failures: 0)
🔴 Cron stale — last tick 2.3 hr ago     (consecutive failures: 3)
```

Click → drill-down to `/admin/cron` (existing cron health page).

## Edit 6 — International-demand widget

Surfaces the country pre-check rejection log written by Phase 2 Task 10.
Tells the team "Y users from country X tried to onboard this month —
worth international expansion?"

**File:** `src/app/api/admin/reports/affiliate-analytics/intl-demand/route.ts`

```ts
export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const period = (url.searchParams.get("period") ?? "365d");
  const cutoff = period === "all" ? null
    : new Date(Date.now() - parseInt(period) * 86400000).toISOString();

  const admin = createAdminClient();

  let q = admin
    .from("affiliate_onboarding_rejections")
    .select("detected_country_code");
  if (cutoff) q = q.gte("created_at", cutoff);
  const { data } = await q;

  const byCountry = new Map<string, number>();
  for (const r of data ?? []) {
    const cc = (r.detected_country_code as string | null) ?? "unknown";
    byCountry.set(cc, (byCountry.get(cc) ?? 0) + 1);
  }

  const top = Array.from(byCountry.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return NextResponse.json({ items: top, totalAttempts: (data ?? []).length });
}
```

UI: small card under the metrics grid —

```
International Demand (last 365 days)
─────────────────────────────────────
47 onboarding attempts blocked (US-only)
  🇬🇧 GB — 18    🇨🇦 CA — 12
  🇦🇺 AU — 9     🇩🇪 DE — 5
  🇮🇳 IN — 3
[View full list →]
```

If the count is significant (say >50 in a year, threshold tunable),
it's a real signal that international expansion has demand.

## UI — `RiskSignalsPanel.tsx`

Compact list:

```
Risk signals (last 30 days)
─────────────────────────────────────────
⚠️ Sarah K. — reversal rate 32% (8/25 conversions)
⚠️ Mike R. — refund-after-payout rate 18% (3/17)
⚠️ Jenna T. — conversion spike 4.2× last 7 days
─────────────────────────────────────────
```

Click a row → drilldown to that affiliate's account in admin.

## Acceptance for this task

- [ ] Page accessible at `/admin/reports/affiliate-analytics` from
      admin nav
- [ ] All 8 metrics render with the correct number for the period
- [ ] Velocity histogram has 6 bands (<1d, 1-2d, 2-3d, 3-7d, 7-14d, 14d+)
- [ ] Campaign ROI table shows top-20 by commission, sortable
- [ ] Risk signals panel surfaces affiliates above thresholds
- [ ] Period selector switches the URL `?period=` and refreshes server-side
- [ ] All Postgres helper functions exist + return correct results on
      a fixture set
- [ ] Page LCP < 2.5s
- [ ] No regression in other admin reports

## Verification

```bash
psql "$SUPABASE_URL" -c "\df affiliate_median_time_to_payout_days"
psql "$SUPABASE_URL" -c "\df affiliate_payout_velocity_histogram"
psql "$SUPABASE_URL" -c "\df affiliate_campaign_roi"

# Hand-check medianTimeToPayout against a known fixture
```

## Out of scope

- Period-over-period delta (the "↓ 12%" arrow) — nice to have but
  needs a previous-period query; ship without it if tight
- Sankey diagram of money flow — Phase 4 visualization
- Per-diviner breakdown of platform metrics — affiliates dominate
  the analysis here, not diviners
