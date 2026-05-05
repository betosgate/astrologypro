# Task 02 — Diviner Affiliate-Mix Breakdown

- Status: Not Started
- Priority: P1
- Depends on: —

## Goal

Surface to each diviner: how much of their revenue comes through
affiliates vs direct, and which affiliates drive the most volume to
them. Decision-grade visibility for the diviner deciding whether to
recruit more affiliates or build their direct channel.

## Files to create / modify

| # | File | Action |
|---|---|---|
| 1 | `src/app/api/dashboard/finance/affiliate-mix/route.ts` | **Create** — GET aggregated metrics |
| 2 | `src/app/dashboard/finance/page.tsx` | **Modify** — add the new section |
| 3 | `src/app/dashboard/finance/_components/AffiliateMixCard.tsx` | **Create** — summary card |
| 4 | `src/app/dashboard/finance/_components/AffiliateMixDonut.tsx` | **Create** — affiliate vs direct donut |
| 5 | `src/app/dashboard/finance/_components/TopAffiliatesTable.tsx` | **Create** — top-5 affiliates for this diviner |

## Metrics

| Metric | Source |
|---|---|
| **Affiliate-driven gross** | `SUM bookings.base_price WHERE diviner_id=$me AND affiliate_commission_amount_cents > 0 AND scheduled_at >= $period` |
| **Direct gross** | `SUM bookings.base_price WHERE diviner_id=$me AND (affiliate_commission_amount_cents IS NULL OR =0)` |
| **% via affiliates** | `affiliate_gross / (affiliate_gross + direct_gross)` |
| **Affiliate commission outflow** (carved out) | `SUM bookings.affiliate_commission_amount_cents` |
| **Top-5 affiliates** for this diviner | `GROUP BY affiliate_account_id ORDER BY commission_amount_cents DESC LIMIT 5` |
| **Bookings count** affiliate vs direct | `COUNT` per branch |

## Edit 1 — Endpoint

**File:** `src/app/api/dashboard/finance/affiliate-mix/route.ts`

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Period = "30d" | "90d" | "365d" | "all";

function periodCutoff(p: Period): string | null {
  const days: Record<Period, number | null> = { "30d": 30, "90d": 90, "365d": 365, all: null };
  const d = days[p];
  return d === null ? null : new Date(Date.now() - d * 86400000).toISOString();
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const period = (url.searchParams.get("period") ?? "90d") as Period;
  const cutoff = periodCutoff(period);

  const admin = createAdminClient();

  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!diviner) return NextResponse.json({ error: "Not a diviner" }, { status: 404 });

  let bookingsQ = admin
    .from("bookings")
    .select(
      "id, base_price, affiliate_commission_amount_cents, refunded_at, scheduled_at",
    )
    .eq("diviner_id", diviner.id)
    .neq("status", "cancelled"); // exclude pure cancels with no payment
  if (cutoff) bookingsQ = bookingsQ.gte("scheduled_at", cutoff);

  const { data: bookings, error } = await bookingsQ;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let affiliateGrossCents = 0, directGrossCents = 0;
  let affiliateCount = 0, directCount = 0;
  let totalCommissionOutflowCents = 0;

  for (const b of bookings ?? []) {
    const grossCents = Math.round(Number(b.base_price ?? 0) * 100);
    const commCents = Number(b.affiliate_commission_amount_cents ?? 0);
    if (commCents > 0) {
      affiliateGrossCents += grossCents;
      affiliateCount += 1;
      totalCommissionOutflowCents += commCents;
    } else {
      directGrossCents += grossCents;
      directCount += 1;
    }
  }

  const totalGross = affiliateGrossCents + directGrossCents;
  const pctViaAffiliate = totalGross > 0 ? affiliateGrossCents / totalGross : 0;

  // Top-5 affiliates driving bookings to me
  let topQ = admin
    .from("campaign_conversions")
    .select(
      `affiliate_account_id, commission_amount_cents, order_amount_cents,
       bookings!inner(diviner_id, refunded_at, scheduled_at),
       affiliate:affiliate_accounts(name, email)`,
    )
    .eq("bookings.diviner_id", diviner.id)
    .is("reversed_at", null);
  if (cutoff) topQ = topQ.gte("converted_at", cutoff);

  const { data: convs } = await topQ;
  const byAffiliate = new Map<string, { id: string; name: string; commCents: number; bookings: number }>();
  for (const c of (convs ?? []) as any[]) {
    const id = c.affiliate_account_id as string;
    const ex = byAffiliate.get(id) ?? {
      id,
      name: c.affiliate?.name ?? "—",
      commCents: 0,
      bookings: 0,
    };
    ex.commCents += Number(c.commission_amount_cents ?? 0);
    ex.bookings += 1;
    byAffiliate.set(id, ex);
  }

  const topAffiliates = Array.from(byAffiliate.values())
    .sort((a, b) => b.commCents - a.commCents)
    .slice(0, 5);

  return NextResponse.json({
    period,
    metrics: {
      affiliateGrossCents,
      directGrossCents,
      totalGrossCents: totalGross,
      pctViaAffiliate,
      affiliateBookingCount: affiliateCount,
      directBookingCount: directCount,
      totalCommissionOutflowCents,
      avgCommissionPerAffiliateBookingCents:
        affiliateCount > 0 ? Math.round(totalCommissionOutflowCents / affiliateCount) : 0,
    },
    topAffiliates,
  });
}
```

## UI — `AffiliateMixCard.tsx`

Headline cards on the diviner finance page:

```
Affiliate-driven revenue
$2,847.50 (38.2%)
  ↳ 18 bookings • $158/booking avg
  ↳ Commission paid: $569.50

Direct revenue
$4,602.00 (61.8%)
  ↳ 27 bookings • $170/booking avg
```

## UI — `AffiliateMixDonut.tsx`

Two-segment donut: affiliate (primary tint) vs direct (neutral).
Percentage label in center.

## UI — `TopAffiliatesTable.tsx`

| # | Affiliate | Bookings | Commission paid |
|---|---|---|---|
| 1 | Sarah K. | 7 | $245.00 |
| 2 | Mike R. | 4 | $140.00 |
| 3 | Jenna T. | 3 | $108.00 |
| 4 | Alex W. | 2 | $52.00 |
| 5 | Pat C. | 2 | $38.50 |

## Acceptance for this task

- [ ] `/api/dashboard/finance/affiliate-mix` returns valid metrics for
      the authenticated diviner
- [ ] Diviner finance page shows the new section above the existing
      transaction log
- [ ] Donut chart renders with correct percentages
- [ ] Top-5 affiliates table sorted descending by commission
- [ ] Period selector reuses the existing finance-page period selector
      if present (don't add a duplicate)
- [ ] Refunded bookings are NOT excluded from the gross (they affect
      net, but the gross was real revenue at the time)
- [ ] Numbers cross-check against hand-computed SQL on a known fixture
- [ ] No regression in existing diviner finance page

## Verification

```bash
ls src/app/api/dashboard/finance/affiliate-mix/route.ts
grep -n "AffiliateMixCard\|AffiliateMixDonut\|TopAffiliatesTable" src/app/dashboard/finance/page.tsx
```

## Out of scope

- Per-affiliate trend chart (single number per affiliate is enough for
  v1)
- Click → conversion attribution from the diviner's perspective (their
  view is conversion-down; clicks-up is the affiliate's question)
- Recommendation widget ("Affiliate X drives 40% of your bookings —
  send a thank-you?") — Phase 4
