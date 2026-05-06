# Task 04 — Funnel + Cohort Retention

- Status: Not Started
- Priority: P1
- Depends on: 01, 02, 03 (chart components)
- Blocks: 06

## Goal

Four cross-cutting analytical views that don't fit on any single
single-role dashboard:

1. **Affiliate-onboarding funnel** — invited → accepted → connected
   Stripe → first conversion → first payout. Surfaces drop-off at
   each step.
2. **Referred-client retention cohort** — for clients who first
   booked through an affiliate, what % book again at 30/60/90/180
   days?
3. **Click-through funnel** — clicks → conversions → paid. Surfaces
   leakage between traffic and revenue.
4. **UTM source attribution** — top-20 UTM sources by commission,
   showing which channels affiliates are most effective on.

Both visualizations live on `/admin/reports/affiliate-analytics`
(Task 03). This task adds two sections + their endpoints.

## Why these matter

- **Funnel** — answers "why are affiliates not generating revenue?"
  Drop-off at "accepted → Stripe connected" means onboarding friction;
  drop-off at "connected → first conversion" means inadequate
  marketing materials; drop-off at "first conversion → first payout"
  means hold-period or technical issues.
- **Cohort** — affiliates' real value is recurring revenue, not the
  one-time commission. If affiliate-referred clients book again, the
  program is healthy. If they don't, the program is a one-time
  customer-acquisition cost masquerading as a partnership.

## Files to create / modify

| # | File | Action |
|---|---|---|
| 1 | `src/app/api/admin/reports/affiliate-analytics/funnel/route.ts` | **Create** — GET funnel counts |
| 2 | `src/app/api/admin/reports/affiliate-analytics/cohort/route.ts` | **Create** — GET cohort retention matrix |
| 3 | `src/app/admin/reports/affiliate-analytics/_components/OnboardingFunnel.tsx` | **Create** — funnel chart |
| 4 | `src/app/admin/reports/affiliate-analytics/_components/CohortRetention.tsx` | **Create** — cohort chart |
| 5 | `src/app/admin/reports/affiliate-analytics/page.tsx` | **Modify** — mount the four new sections beneath Task 03's grid |
| 6 | `supabase/migrations/20260505000004_affiliate_phase_3_analytics.sql` | **Extend** — add cohort RPC |
| 7 | `src/app/api/admin/reports/affiliate-analytics/click-funnel/route.ts` | **Create** — click → conversion → paid funnel |
| 8 | `src/app/api/admin/reports/affiliate-analytics/utm-attribution/route.ts` | **Create** — UTM source breakdown |
| 9 | `src/app/admin/reports/affiliate-analytics/_components/ClickFunnel.tsx` | **Create** — 3-step horizontal funnel |
| 10 | `src/app/admin/reports/affiliate-analytics/_components/UtmAttributionTable.tsx` | **Create** — top-20 UTM sources |

## Edit 1 — Funnel endpoint

```ts
// src/app/api/admin/reports/affiliate-analytics/funnel/route.ts
import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const period = (url.searchParams.get("period") ?? "365d");
  const cutoff = period === "all" ? null
    : new Date(Date.now() - parseInt(period) * 86400000).toISOString();

  const admin = createAdminClient();

  // Step 1: Invited (have a row in diviner_affiliates with invited_at not null)
  let invitedQ = admin
    .from("diviner_affiliates")
    .select("id", { count: "exact", head: true })
    .not("invited_at", "is", null);
  if (cutoff) invitedQ = invitedQ.gte("invited_at", cutoff);
  const { count: invited } = await invitedQ;

  // Step 2: Accepted (accepted_at not null)
  let acceptedQ = admin
    .from("diviner_affiliates")
    .select("id", { count: "exact", head: true })
    .not("accepted_at", "is", null);
  if (cutoff) acceptedQ = acceptedQ.gte("invited_at", cutoff);
  const { count: accepted } = await acceptedQ;

  // Step 3: Stripe connected (affiliate_accounts.stripe_payouts_enabled=TRUE)
  let connectedQ = admin
    .from("affiliate_accounts")
    .select("id", { count: "exact", head: true })
    .eq("stripe_payouts_enabled", true);
  if (cutoff) connectedQ = connectedQ.gte("created_at", cutoff);
  const { count: connected } = await connectedQ;

  // Step 4: First conversion (first_conversion_at not null)
  let firstConvQ = admin
    .from("affiliate_accounts")
    .select("id", { count: "exact", head: true })
    .not("first_conversion_at", "is", null);
  if (cutoff) firstConvQ = firstConvQ.gte("first_conversion_at", cutoff);
  const { count: firstConv } = await firstConvQ;

  // Step 5: First payout (first_payout_at not null)
  let firstPayoutQ = admin
    .from("affiliate_accounts")
    .select("id", { count: "exact", head: true })
    .not("first_payout_at", "is", null);
  if (cutoff) firstPayoutQ = firstPayoutQ.gte("first_payout_at", cutoff);
  const { count: firstPayout } = await firstPayoutQ;

  return NextResponse.json({
    period,
    steps: [
      { name: "Invited", count: invited ?? 0 },
      { name: "Accepted", count: accepted ?? 0 },
      { name: "Stripe Connected", count: connected ?? 0 },
      { name: "First Conversion", count: firstConv ?? 0 },
      { name: "First Payout", count: firstPayout ?? 0 },
    ],
  });
}
```

## Edit 2 — Cohort RPC

Append to `supabase/migrations/20260505000004_affiliate_phase_3_analytics.sql`:

```sql
-- ─── Referred-client retention cohort ──────────────────────────────────────
-- For each cohort (month of first affiliate-attributed booking), what
-- percentage of those clients had ANY booking in the 30/60/90/180-day window
-- after their first?
CREATE OR REPLACE FUNCTION affiliate_referred_client_retention()
RETURNS TABLE (
  cohort_month DATE,
  cohort_size BIGINT,
  retained_30d BIGINT,
  retained_60d BIGINT,
  retained_90d BIGINT,
  retained_180d BIGINT
)
LANGUAGE SQL STABLE AS $$
  WITH first_affiliate_bookings AS (
    -- For each client, find their FIRST affiliate-attributed booking date
    SELECT
      b.client_id,
      MIN(b.scheduled_at) AS first_booking_at
    FROM bookings b
    JOIN campaign_conversions c ON c.booking_id = b.id
    WHERE c.reversed_at IS NULL
      AND b.client_id IS NOT NULL
    GROUP BY b.client_id
  ),
  cohorts AS (
    SELECT
      date_trunc('month', first_booking_at)::DATE AS cohort_month,
      client_id,
      first_booking_at
    FROM first_affiliate_bookings
  ),
  retention AS (
    SELECT
      ch.cohort_month,
      ch.client_id,
      EXISTS (
        SELECT 1 FROM bookings b2
         WHERE b2.client_id = ch.client_id
           AND b2.scheduled_at > ch.first_booking_at
           AND b2.scheduled_at <= ch.first_booking_at + interval '30 days'
      ) AS d30,
      EXISTS (
        SELECT 1 FROM bookings b2
         WHERE b2.client_id = ch.client_id
           AND b2.scheduled_at > ch.first_booking_at
           AND b2.scheduled_at <= ch.first_booking_at + interval '60 days'
      ) AS d60,
      EXISTS (
        SELECT 1 FROM bookings b2
         WHERE b2.client_id = ch.client_id
           AND b2.scheduled_at > ch.first_booking_at
           AND b2.scheduled_at <= ch.first_booking_at + interval '90 days'
      ) AS d90,
      EXISTS (
        SELECT 1 FROM bookings b2
         WHERE b2.client_id = ch.client_id
           AND b2.scheduled_at > ch.first_booking_at
           AND b2.scheduled_at <= ch.first_booking_at + interval '180 days'
      ) AS d180
    FROM cohorts ch
  )
  SELECT
    cohort_month,
    COUNT(*)::BIGINT AS cohort_size,
    COUNT(*) FILTER (WHERE d30)::BIGINT  AS retained_30d,
    COUNT(*) FILTER (WHERE d60)::BIGINT  AS retained_60d,
    COUNT(*) FILTER (WHERE d90)::BIGINT  AS retained_90d,
    COUNT(*) FILTER (WHERE d180)::BIGINT AS retained_180d
  FROM retention
  GROUP BY cohort_month
  ORDER BY cohort_month;
$$;
```

> **Verify** `bookings.client_id` exists. If clients are stored
> differently (e.g., `client_email` only), the function needs to
> match on email instead. Run `\d bookings | grep client_id` first.

## Edit 3 — Cohort endpoint

```ts
// src/app/api/admin/reports/affiliate-analytics/cohort/route.ts
export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("affiliate_referred_client_retention");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    cohorts: (data ?? []).map((r: any) => ({
      cohortMonth: r.cohort_month,
      cohortSize: Number(r.cohort_size),
      retained30d: Number(r.retained_30d),
      retained60d: Number(r.retained_60d),
      retained90d: Number(r.retained_90d),
      retained180d: Number(r.retained_180d),
      pct30d: r.cohort_size > 0 ? Number(r.retained_30d) / Number(r.cohort_size) : 0,
      pct60d: r.cohort_size > 0 ? Number(r.retained_60d) / Number(r.cohort_size) : 0,
      pct90d: r.cohort_size > 0 ? Number(r.retained_90d) / Number(r.cohort_size) : 0,
      pct180d: r.cohort_size > 0 ? Number(r.retained_180d) / Number(r.cohort_size) : 0,
    })),
  });
}
```

## UI — `OnboardingFunnel.tsx`

Horizontal funnel chart. Each step's width proportional to count.
Drop-off percentages between steps.

```
Invited            ████████████████████ 250 (100%)
Accepted           ███████████████      188 (75%)
                                        ↓ 25% drop
Stripe Connected   ███████████          138 (55%)
                                        ↓ 27% drop from prev step
First Conversion   ██████               72 (29%)
                                        ↓ 48% drop
First Payout       █████                58 (23%)
                                        ↓ 19% drop
```

The drop-off labels surface where the program is leaking affiliates.

## UI — `CohortRetention.tsx`

Cohort heatmap (rows = cohort month, columns = retention window):

```
Month   Cohort  +30d   +60d   +90d   +180d
Mar 26  47      19%    32%    38%    45%
Apr 26  62      24%    35%    41%    —
May 26  31      18%    28%    —      —
```

Color cell intensity based on percentage. Lighter = lower retention.
Display "—" for windows that haven't matured yet (cohort + window > today).

## Acceptance for this task

- [ ] Funnel endpoint returns 5 steps with correct counts
- [ ] Cohort endpoint returns 1 row per month with retention counts
- [ ] Both visualizations render on `/admin/reports/affiliate-analytics`
      below Task 03's metric grid
- [ ] Cohort RPC works on a fixture (1 cohort, 5 clients, 2 of whom
      booked again within 30 days)
- [ ] Drop-off percentages computed correctly
- [ ] No regression in Task 03's existing sections

## Verification

```bash
psql "$SUPABASE_URL" -c "\df affiliate_referred_client_retention"
ls src/app/api/admin/reports/affiliate-analytics/funnel/route.ts \
   src/app/api/admin/reports/affiliate-analytics/cohort/route.ts
```

## Edit 4 — Click-through funnel

**File:** `src/app/api/admin/reports/affiliate-analytics/click-funnel/route.ts`

Three-step funnel showing how clicks turn into money:

```
Total clicks (excl bots) → Conversions → Paid conversions
       12,450          →     412      →       389
                        ↓ 3.3% rate    ↓ 94.4% reach payout
```

```ts
import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const period = (url.searchParams.get("period") ?? "90d");
  const cutoff = period === "all" ? null
    : new Date(Date.now() - parseInt(period) * 86400000).toISOString();

  const admin = createAdminClient();

  let clicksQ = admin
    .from("campaign_clicks")
    .select("id", { count: "exact", head: true })
    .eq("is_bot", false);
  if (cutoff) clicksQ = clicksQ.gte("clicked_at", cutoff);
  const { count: totalClicks } = await clicksQ;

  let convQ = admin
    .from("campaign_conversions")
    .select("id, payout_status", { count: "exact" })
    .is("reversed_at", null);
  if (cutoff) convQ = convQ.gte("converted_at", cutoff);
  const { data: convs, count: conversionCount } = await convQ;

  const paidCount = (convs ?? []).filter((c) => c.payout_status === "paid").length;

  return NextResponse.json({
    period,
    steps: [
      { name: "Total clicks", count: totalClicks ?? 0 },
      { name: "Conversions", count: conversionCount ?? 0 },
      { name: "Paid", count: paidCount },
    ],
    rates: {
      clickToConversion: (totalClicks ?? 0) > 0 ? (conversionCount ?? 0) / (totalClicks ?? 1) : 0,
      conversionToPaid: (conversionCount ?? 0) > 0 ? paidCount / (conversionCount ?? 1) : 0,
    },
  });
}
```

UI: same horizontal funnel chart shape as the OnboardingFunnel
component — render as a second instance of the same component with
3 steps instead of 5.

## Edit 5 — UTM source attribution

**File:** `src/app/api/admin/reports/affiliate-analytics/utm-attribution/route.ts`

`campaign_clicks` already captures `utm_source`, `utm_medium`,
`utm_campaign`, `utm_content` plus `source` and `medium`. We can
break down conversions by where they came from.

```ts
export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const period = (url.searchParams.get("period") ?? "90d");
  const cutoff = period === "all" ? null
    : new Date(Date.now() - parseInt(period) * 86400000).toISOString();

  const admin = createAdminClient();

  // Join clicks → conversions to get attribution.
  // campaign_clicks.conversion_id is set when a click drives a conversion.
  let q = admin
    .from("campaign_clicks")
    .select("utm_source, utm_medium, utm_campaign, conversion_id, conversion:campaign_conversions(commission_amount_cents, order_amount_cents)")
    .eq("is_bot", false)
    .not("conversion_id", "is", null);
  if (cutoff) q = q.gte("clicked_at", cutoff);

  const { data } = await q;

  // Group by utm_source
  const bySource = new Map<string, { source: string; conversions: number; gross: number; commission: number }>();
  for (const row of (data ?? []) as any[]) {
    const src = (row.utm_source as string | null) ?? "(none)";
    const ex = bySource.get(src) ?? { source: src, conversions: 0, gross: 0, commission: 0 };
    ex.conversions += 1;
    ex.gross += Number(row.conversion?.order_amount_cents ?? 0);
    ex.commission += Number(row.conversion?.commission_amount_cents ?? 0);
    bySource.set(src, ex);
  }

  const sources = Array.from(bySource.values())
    .sort((a, b) => b.commission - a.commission)
    .slice(0, 20);

  return NextResponse.json({ sources });
}
```

UI: simple table on the analytics page —

| UTM Source | Conversions | Gross | Commission |
|---|---|---|---|
| facebook | 84 | $13,440 | $2,688 |
| instagram | 47 | $7,520 | $1,504 |
| email | 23 | $3,910 | $782 |
| (none) | 18 | $2,250 | $450 |
| twitter | 12 | $1,680 | $336 |

Useful for affiliates who push their links through multiple channels
(or for the platform to see which channels affiliates are most
effective on).

## Out of scope

- Per-diviner cohort (the cohort question is about the affiliate
  program as a whole, not per-diviner)
- UTM `campaign` / `medium` / `content` breakdowns (just `source` for
  v1; the others can be added in Phase 4 if affiliates ask)
- Predictive churn (which affiliates will go inactive) — Phase 4
- Onboarding-friction A/B testing — Phase 4
- Multi-touch attribution (last-click only — Phase 4)
