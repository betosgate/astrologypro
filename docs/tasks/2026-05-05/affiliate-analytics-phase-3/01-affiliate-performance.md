# Task 01 — Affiliate Performance Dashboard

- Status: Not Started
- Priority: P1
- Depends on: —
- Blocks: 04 (cohort + funnel)

## Goal

A "Performance" tab in the affiliate portal showing the metrics
affiliates actually use to make decisions: clicks, conversion rate,
average order value, top-performing campaigns, and earnings trend.

All numbers are filterable to 30/90/365 days or "All time."

## Files to create

| # | File | Action |
|---|---|---|
| 1 | `src/app/api/affiliate/performance/route.ts` | **Create** — GET single endpoint returning all 6 metrics |
| 2 | `src/app/affiliate/(portal)/performance/page.tsx` | **Create** — server component, renders the tab |
| 3 | `src/app/affiliate/(portal)/performance/_components/MetricCards.tsx` | **Create** — six summary cards |
| 4 | `src/app/affiliate/(portal)/performance/_components/EarningsTrendChart.tsx` | **Create** — line chart |
| 5 | `src/app/affiliate/(portal)/performance/_components/TopCampaignsTable.tsx` | **Create** — sortable table |
| 6 | `src/app/affiliate/(portal)/performance/_components/PeriodSelector.tsx` | **Create** — 30d/90d/365d/all toggle |
| 7 | `src/app/affiliate/(portal)/_components/PortalNav.tsx` (verify path) | **Modify** — add "Performance" link |
| 8 | `src/app/api/affiliate/performance/geo/route.ts` | **Create** — top-10 countries by click count |
| 9 | `src/app/api/affiliate/performance/cohort/route.ts` | **Create** — own-affiliate cohort retention |
| 10 | `src/app/affiliate/(portal)/performance/_components/GeoBreakdown.tsx` | **Create** — top-10 countries list |
| 11 | `src/app/affiliate/(portal)/performance/_components/CohortRetentionCard.tsx` | **Create** — 30d/90d repeat-booking %ages |

## The 9 metrics

| # | Metric | Source SQL (skeleton) |
|---|---|---|
| 1 | **Total clicks** | `SELECT count(*) FROM campaign_clicks JOIN tracking_links ON tracking_links.id = campaign_clicks.tracking_link_id JOIN diviner_affiliates da ON da.affiliate_account_id = $1 WHERE campaign_clicks.is_bot=FALSE AND clicked_at >= $period_start` |
| 2 | **Unique clicks** | same as above + `WHERE is_unique_click=TRUE` |
| 3 | **Conversion rate (clicks → conversions)** | `conversions / unique_clicks`. (True CTR = clicks/impressions is impossible; we don't track impressions. Document this in the UI tooltip.) |
| 4 | **Total conversions** | `count(*) FROM campaign_conversions WHERE affiliate_account_id IN (...) AND reversed_at IS NULL AND converted_at >= $period_start` |
| 5 | **Average order value (AOV)** | `AVG(order_amount_cents) / 100` over the same set |
| 6 | **Average commission per conversion** | `AVG(commission_amount_cents) / 100` |
| 7 | **Effective commission rate** | `SUM(commission_amount_cents) / SUM(order_amount_cents)` aggregate. Tells the affiliate the % rate effectively earned across the period (smooths over campaigns with different rates). Tooltip: "Your commission as a percentage of the gross orders you drove." |
| 8 | **Reversal rate** | `reversed_count / total_conversions` over the period. Shows what fraction of credit was clawed back via reversal. Healthy below 5%. |
| 9 | **Average days to payout** | `AVG(EXTRACT(EPOCH FROM (paid_at - converted_at)) / 86400)` filtered to `payout_status='paid'`. Sets affiliate expectation for cash-flow planning. |

## Edit 1 — Create `src/app/api/affiliate/performance/route.ts`

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Period = "30d" | "90d" | "365d" | "all";

function periodCutoff(period: Period): string | null {
  const days: Record<Period, number | null> = {
    "30d": 30, "90d": 90, "365d": 365, "all": null,
  };
  const d = days[period];
  if (d === null) return null;
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const period = (url.searchParams.get("period") ?? "30d") as Period;
  const cutoff = periodCutoff(period);

  const admin = createAdminClient();

  const { data: affiliate } = await admin
    .from("affiliate_accounts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!affiliate) return NextResponse.json({ error: "Not an affiliate" }, { status: 404 });

  // Resolve all junction IDs (this affiliate may be linked to multiple diviners)
  const { data: junctions } = await admin
    .from("diviner_affiliates")
    .select("id")
    .eq("affiliate_account_id", affiliate.id);
  const junctionIds = (junctions ?? []).map((j) => j.id as string);

  // Resolve tracking_link IDs for those junctions
  const { data: links } = await admin
    .from("tracking_links")
    .select("id")
    // tracking_links.affiliate_id likely refers to diviner_affiliates.id
    // (verify against the existing schema; adjust if it's affiliate_account_id)
    .in("affiliate_id", junctionIds.length ? junctionIds : ["00000000-0000-0000-0000-000000000000"]);
  const linkIds = (links ?? []).map((l) => l.id as string);

  // ─── Clicks ─────────────────────────────────────────────────────────
  let clicksQ = admin
    .from("campaign_clicks")
    .select("id, is_unique_click", { count: "exact", head: false })
    .in("tracking_link_id", linkIds.length ? linkIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("is_bot", false);
  if (cutoff) clicksQ = clicksQ.gte("clicked_at", cutoff);

  const { count: totalClicks, data: clickRows } = await clicksQ;
  const uniqueClicks = (clickRows ?? []).filter((r) => r.is_unique_click).length;

  // ─── Conversions ────────────────────────────────────────────────────
  let convQ = admin
    .from("campaign_conversions")
    .select("commission_amount_cents, order_amount_cents, payout_status, paid_amount_cents", { count: "exact" })
    .eq("affiliate_account_id", affiliate.id)
    .is("reversed_at", null);
  if (cutoff) convQ = convQ.gte("converted_at", cutoff);

  const { count: conversionCount, data: conversions } = await convQ;
  const totalCommissionCents = (conversions ?? []).reduce(
    (s, c) => s + Number(c.commission_amount_cents ?? 0), 0);
  const totalOrderCents = (conversions ?? []).reduce(
    (s, c) => s + Number(c.order_amount_cents ?? 0), 0);
  const aovCents = conversionCount ? Math.round(totalOrderCents / conversionCount) : 0;
  const avgCommCents = conversionCount ? Math.round(totalCommissionCents / conversionCount) : 0;
  const conversionRate = uniqueClicks ? (conversionCount ?? 0) / uniqueClicks : 0;

  // Effective commission rate = total commission / total order amount
  const effectiveRate = totalOrderCents > 0
    ? totalCommissionCents / totalOrderCents
    : 0;

  // Reversal rate (within the period — needs a separate query without the
  // `is reversed_at null` filter that conv query above had)
  let reversedCountQ = admin
    .from("campaign_conversions")
    .select("id", { count: "exact", head: true })
    .eq("affiliate_account_id", affiliate.id)
    .not("reversed_at", "is", null);
  if (cutoff) reversedCountQ = reversedCountQ.gte("converted_at", cutoff);
  const { count: reversedCount } = await reversedCountQ;

  const totalConvIncReversed = (conversionCount ?? 0) + (reversedCount ?? 0);
  const reversalRate = totalConvIncReversed > 0
    ? (reversedCount ?? 0) / totalConvIncReversed
    : 0;

  // Average days to payout — joining paid conversions in the period
  const { data: paidConvs } = await admin
    .from("campaign_conversions")
    .select("converted_at, paid_at")
    .eq("affiliate_account_id", affiliate.id)
    .eq("payout_status", "paid")
    .gte("converted_at", cutoff ?? "1970-01-01");
  let avgDaysToPayout = 0;
  if (paidConvs && paidConvs.length > 0) {
    const totalMs = paidConvs.reduce((s, c) => {
      const conv = c.converted_at ? new Date(c.converted_at).getTime() : 0;
      const paid = c.paid_at ? new Date(c.paid_at).getTime() : 0;
      return s + Math.max(0, paid - conv);
    }, 0);
    avgDaysToPayout = totalMs / paidConvs.length / 86_400_000;
  }

  return NextResponse.json({
    period,
    cutoff,
    metrics: {
      totalClicks: totalClicks ?? 0,
      uniqueClicks,
      conversionCount: conversionCount ?? 0,
      conversionRate, // 0.0 - 1.0
      totalCommissionCents,
      aovCents,
      avgCommCents,
      effectiveRate, // 0.0 - 1.0 (e.g., 0.20 = 20% effective rate)
      reversalRate, // 0.0 - 1.0
      avgDaysToPayout, // floating point days
    },
  });
}
```

> **Verify** the FK on `tracking_links.affiliate_id` — the schema audit
> will tell you if it points at `diviner_affiliates.id` (likely) or
> `affiliate_accounts.id`. Adapt the `IN(...)` filter if needed.

## Edit 2 — Trend chart data endpoint

**File:** `src/app/api/affiliate/performance/trend/route.ts`

Returns a per-day rollup for the chart. Same period filter.

```ts
export async function GET(request: Request) {
  // ... auth + affiliate resolution as above ...

  // Day-bucketed conversions
  const { data: rows } = await admin.rpc("affiliate_daily_earnings", {
    p_affiliate_account_id: affiliate.id,
    p_cutoff: cutoff,
  });

  return NextResponse.json({ buckets: rows ?? [] });
}
```

Add a Postgres function (in a new migration; ordinal
`20260505000004_affiliate_phase_3_analytics.sql` or whatever's next):

```sql
CREATE OR REPLACE FUNCTION affiliate_daily_earnings(
  p_affiliate_account_id UUID,
  p_cutoff TIMESTAMPTZ
)
RETURNS TABLE (day DATE, conversions BIGINT, commission_cents BIGINT, paid_cents BIGINT)
LANGUAGE SQL STABLE AS $$
  SELECT
    date_trunc('day', converted_at)::DATE AS day,
    COUNT(*)::BIGINT AS conversions,
    SUM(commission_amount_cents)::BIGINT AS commission_cents,
    SUM(CASE WHEN payout_status = 'paid' THEN paid_amount_cents ELSE 0 END)::BIGINT AS paid_cents
  FROM campaign_conversions
  WHERE affiliate_account_id = p_affiliate_account_id
    AND reversed_at IS NULL
    AND (p_cutoff IS NULL OR converted_at >= p_cutoff)
  GROUP BY 1
  ORDER BY 1 ASC;
$$;
```

## Edit 3 — Top campaigns endpoint

**File:** `src/app/api/affiliate/performance/top-campaigns/route.ts`

```ts
export async function GET(request: Request) {
  // ... auth + affiliate resolution ...

  // Group conversions by campaign_id, sum commission
  const { data } = await admin
    .from("campaign_conversions")
    .select(
      `campaign_id, commission_amount_cents, order_amount_cents,
       campaign:affiliate_campaigns(id, name, share_code)`,
    )
    .eq("affiliate_account_id", affiliate.id)
    .is("reversed_at", null)
    .gte("converted_at", cutoff ?? "1970-01-01");

  const byCampaign = new Map<string, { campaignId: string; name: string; shareCode: string; commissionCents: number; orderCents: number; count: number }>();
  for (const row of data ?? []) {
    const id = row.campaign_id as string;
    const c = (row.campaign as any) ?? {};
    const ex = byCampaign.get(id) ?? {
      campaignId: id,
      name: c.name ?? "—",
      shareCode: c.share_code ?? "—",
      commissionCents: 0,
      orderCents: 0,
      count: 0,
    };
    ex.commissionCents += Number(row.commission_amount_cents ?? 0);
    ex.orderCents += Number(row.order_amount_cents ?? 0);
    ex.count += 1;
    byCampaign.set(id, ex);
  }

  const sorted = Array.from(byCampaign.values())
    .sort((a, b) => b.commissionCents - a.commissionCents)
    .slice(0, 10);

  return NextResponse.json({ items: sorted });
}
```

## UI — `_components/MetricCards.tsx`

Nine cards in a 3×3 responsive grid:

```
┌────────────┬────────────┬────────────┐
│ Total      │ Unique     │ Conversion │
│ Clicks     │ Clicks     │ Rate       │
│ 1,247      │ 932        │ 4.2%       │
├────────────┼────────────┼────────────┤
│ Total      │ Avg Order  │ Avg        │
│ Conversions│ Value      │ Commission │
│ 39         │ $87.50     │ $17.50     │
├────────────┼────────────┼────────────┤
│ Effective  │ Reversal   │ Avg Days   │
│ Rate       │ Rate       │ to Payout  │
│ 20.0%      │ 2.1%       │ 1.3 days   │
└────────────┴────────────┴────────────┘
```

Format cents → dollars in the UI. Show period label ("Last 30 days")
under the heading.

Tooltips:
- **Effective Rate**: "Your commission as a percentage of the gross orders you drove. If your campaigns have different rates, this is the blended average weighted by order size."
- **Reversal Rate**: "What share of your earned commissions were clawed back via reversal. Healthy is below 5%."
- **Avg Days to Payout**: "Average time between a conversion happening and the money landing in your Stripe account."

## UI — `EarningsTrendChart.tsx`

Line chart, x-axis = day, y-axis = $ commission. Use the same chart
library identified in master pre-flight. Two series:

- **Earned** (line, primary color) — from `commission_cents`
- **Paid** (line, success color, dashed when not yet paid) — from `paid_cents`

Show tooltip with conversion count on hover.

## UI — `TopCampaignsTable.tsx`

| Campaign | Conversions | Total Order | Commission | $/Conv |
|---|---|---|---|---|
| Mercury Retrograde Sale | 12 | $1,830.00 | $366.00 | $30.50 |
| Spring Healing | 8 | $1,200.00 | $240.00 | $30.00 |
| ... | ... | ... | ... | ... |

Top 10. Sort by commission desc by default. Optional column sort (click
header).

## Acceptance for this task

- [ ] `/api/affiliate/performance` returns the 6 metrics for any
      authenticated affiliate
- [ ] `/api/affiliate/performance/trend` returns daily buckets
- [ ] `/api/affiliate/performance/top-campaigns` returns top-10
- [ ] Performance page accessible at `/affiliate/performance` from
      portal nav
- [ ] Period selector works (30d / 90d / 365d / All time)
- [ ] All numbers cross-check against hand-computed SQL within 1¢ on a
      known fixture set
- [ ] Bot clicks excluded everywhere
- [ ] Reversed conversions excluded everywhere
- [ ] LCP < 2.5s on Performance tab
- [ ] No regression in existing affiliate portal pages

## Verification

```bash
# Endpoints
ls src/app/api/affiliate/performance/route.ts \
   src/app/api/affiliate/performance/trend/route.ts \
   src/app/api/affiliate/performance/top-campaigns/route.ts

# Function
psql "$SUPABASE_URL" -c "\df affiliate_daily_earnings"

# Hand-check: pick an affiliate, period 30d, compute by hand, compare.
```

## Edit 4 — Geographic breakdown endpoint

**File:** `src/app/api/affiliate/performance/geo/route.ts`

`campaign_clicks.country_code` is reliably populated from Vercel
geo headers (verified at
[supabase/migrations/20260417000010_campaign_destinations_and_clicks.sql:74](supabase/migrations/20260417000010_campaign_destinations_and_clicks.sql#L74)).
We can give the affiliate a "where do my clicks come from" view.

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ... resolve affiliate.id + linkIds (same pattern as /performance/route.ts) ...

  const { data: rows } = await admin
    .from("campaign_clicks")
    .select("country_code")
    .in("tracking_link_id", linkIds.length ? linkIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("is_bot", false);

  const byCountry = new Map<string, number>();
  for (const r of rows ?? []) {
    const cc = (r.country_code as string | null) ?? "unknown";
    byCountry.set(cc, (byCountry.get(cc) ?? 0) + 1);
  }

  const top = Array.from(byCountry.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return NextResponse.json({ items: top });
}
```

UI: small horizontal bar list under the trend chart, top-10 countries
+ "Other" bucket. Country flag emoji optional. Useful when affiliates
post on regional platforms and want to see where engagement lands.

## Edit 5 — Own-cohort retention endpoint

**File:** `src/app/api/affiliate/performance/cohort/route.ts`

Mirrors the admin cohort RPC (Phase 3 Task 04) but filters to a
single affiliate's referrals.

Add a Postgres function (in same migration as Task 03's helpers):

```sql
CREATE OR REPLACE FUNCTION affiliate_own_cohort_retention(
  p_affiliate_account_id UUID
)
RETURNS TABLE (
  cohort_month DATE,
  cohort_size BIGINT,
  retained_30d BIGINT,
  retained_90d BIGINT
)
LANGUAGE SQL STABLE AS $$
  WITH first_bookings AS (
    SELECT b.client_id, MIN(b.scheduled_at) AS first_at
      FROM bookings b
      JOIN campaign_conversions c ON c.booking_id = b.id
      JOIN diviner_affiliates da ON da.id = c.affiliate_id
     WHERE da.affiliate_account_id = p_affiliate_account_id
       AND c.reversed_at IS NULL
       AND b.client_id IS NOT NULL
     GROUP BY b.client_id
  ),
  retention AS (
    SELECT
      date_trunc('month', fb.first_at)::DATE AS cohort_month,
      EXISTS (
        SELECT 1 FROM bookings b2
         WHERE b2.client_id = fb.client_id
           AND b2.scheduled_at > fb.first_at
           AND b2.scheduled_at <= fb.first_at + interval '30 days'
      ) AS d30,
      EXISTS (
        SELECT 1 FROM bookings b2
         WHERE b2.client_id = fb.client_id
           AND b2.scheduled_at > fb.first_at
           AND b2.scheduled_at <= fb.first_at + interval '90 days'
      ) AS d90
    FROM first_bookings fb
  )
  SELECT
    cohort_month,
    COUNT(*)::BIGINT AS cohort_size,
    COUNT(*) FILTER (WHERE d30)::BIGINT AS retained_30d,
    COUNT(*) FILTER (WHERE d90)::BIGINT AS retained_90d
  FROM retention
  GROUP BY cohort_month
  ORDER BY cohort_month;
$$;
```

The endpoint just calls the RPC scoped to the requesting affiliate.

UI: a small "Repeat-booking rate" card showing 30d and 90d %ages
across the affiliate's lifetime, plus a tooltip explaining the
cohort framing. Nuanced metric — affiliates who care about long-term
client value will value this; those who don't can ignore.

## Out of scope

- Multi-touch attribution
- Campaign A/B test routing
- Per-day click chart (just aggregate; conversions chart is enough)
- Map-based geographic heatmap (just a top-10 list; full heatmap
  rendering is Phase 4)
