# Task 05 — 1099-NEC Threshold Tracker

- Status: Not Started
- Priority: P0 (compliance)
- Depends on: —

## Goal

Surface to admin the affiliates approaching or exceeding the IRS
**$600/year 1099-NEC reporting threshold**. Stripe Express handles
the actual 1099 filing, but admin needs visibility BEFORE year-end
for:

- **Tax-form chase-ups** — affiliates with incomplete tax info on
  Stripe will not get their 1099 issued; admin should nudge them
- **Compliance audit** — confirm all $600+ affiliates have valid
  W-9 / W-8BEN on file in Stripe
- **Year-end accruals** — finance needs the total in the books

## What this is NOT

- An attempt to issue 1099-NECs ourselves (Stripe handles that)
- A withholding mechanism (we never withhold; affiliates are
  independent contractors paid gross)
- A non-US tax tool — US-only, USD-only (matches Phase 2 scope)

## Files to create / modify

| # | File | Action |
|---|---|---|
| 1 | `src/app/api/admin/reports/1099-tracker/route.ts` | **Create** — GET threshold list |
| 2 | `src/app/admin/reports/finance-ops/_components/Form1099TrackerWidget.tsx` | **Create** — surfaces on existing finance-ops dashboard |
| 3 | `src/app/admin/reports/finance-ops/page.tsx` | **Modify** — mount the widget |
| 4 | `supabase/migrations/20260505000004_affiliate_phase_3_analytics.sql` | **Extend** — RPC for the YTD total |

## The 3 buckets

| Bucket | Definition | Action signal |
|---|---|---|
| **Issued** | YTD paid >= $600 | Confirm Stripe Express has tax info on file |
| **Approaching** | YTD paid >= $540 (90% of threshold) | Watch — likely to cross before year-end |
| **At risk** | YTD paid >= $600 AND `requirements.currently_due` includes `tax_id_provided` or similar | Chase: affiliate needs to complete tax info or won't get 1099 |

## Edit 1 — RPC for YTD totals

Append to `20260505000004_affiliate_phase_3_analytics.sql`:

```sql
-- ─── YTD payout totals per affiliate (for 1099 threshold tracking) ─────────
-- "Year" = calendar year of paid_at (the date money actually moved,
-- which is what 1099-NEC tracks — not converted_at).
CREATE OR REPLACE FUNCTION affiliate_1099_ytd_totals(
  p_year INTEGER
)
RETURNS TABLE (
  affiliate_account_id UUID,
  affiliate_name TEXT,
  affiliate_email CITEXT,
  stripe_account_id TEXT,
  ytd_paid_cents BIGINT,
  conversion_count BIGINT,
  first_payout_at TIMESTAMPTZ,
  last_payout_at TIMESTAMPTZ
)
LANGUAGE SQL STABLE AS $$
  SELECT
    a.id,
    a.name,
    a.email,
    a.stripe_account_id,
    COALESCE(SUM(c.paid_amount_cents), 0)::BIGINT AS ytd_paid_cents,
    COUNT(c.id)::BIGINT AS conversion_count,
    MIN(c.paid_at) AS first_payout_at,
    MAX(c.paid_at) AS last_payout_at
  FROM affiliate_accounts a
  LEFT JOIN diviner_affiliates da ON da.affiliate_account_id = a.id
  LEFT JOIN campaign_conversions c
         ON c.affiliate_id = da.id
        AND c.payout_status = 'paid'
        AND c.paid_at IS NOT NULL
        AND EXTRACT(YEAR FROM c.paid_at AT TIME ZONE 'America/New_York') = p_year
  GROUP BY a.id, a.name, a.email, a.stripe_account_id
  HAVING COALESCE(SUM(c.paid_amount_cents), 0) > 0;
$$;
```

> **Verify** the timezone choice. IRS 1099-NEC uses calendar-year
> "as the payer reports it." Most US platforms use Eastern Time as
> the canonical timezone for tax reporting; if your platform has a
> different convention, change the timezone in the function.

## Edit 2 — Endpoint

```ts
// src/app/api/admin/reports/1099-tracker/route.ts
import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

const THRESHOLD_CENTS = 60_000; // $600
const APPROACHING_CENTS = 54_000; // 90% of threshold

export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const year = parseInt(url.searchParams.get("year") ?? new Date().getFullYear().toString());

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("affiliate_1099_ytd_totals", { p_year: year });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filter to threshold bands
  const issued: any[] = [];
  const approaching: any[] = [];
  const atRisk: any[] = [];

  for (const row of data ?? []) {
    const cents = Number(row.ytd_paid_cents);
    const dollars = cents / 100;
    const item = {
      affiliateAccountId: row.affiliate_account_id,
      name: row.affiliate_name,
      email: row.affiliate_email,
      stripeAccountId: row.stripe_account_id,
      ytdPaidCents: cents,
      ytdPaidDollars: dollars,
      conversionCount: Number(row.conversion_count),
      firstPayoutAt: row.first_payout_at,
      lastPayoutAt: row.last_payout_at,
      stripeRequirementsDue: [] as string[],
    };
    if (cents >= THRESHOLD_CENTS) issued.push(item);
    else if (cents >= APPROACHING_CENTS) approaching.push(item);
  }

  // For "issued" bucket, fetch Stripe requirements to detect "at risk"
  // (incomplete tax info will block the 1099 issuance).
  const needsStripeCheck = issued.filter((i) => i.stripeAccountId);
  await Promise.all(
    needsStripeCheck.map(async (item) => {
      try {
        const account = await stripe.accounts.retrieve(item.stripeAccountId);
        const due: string[] = [
          ...(account.requirements?.currently_due ?? []),
          ...(account.requirements?.past_due ?? []),
        ];
        // Filter to tax-related requirements
        const taxRelated = due.filter((d) =>
          d.includes("tax") || d.includes("ssn") || d.includes("w8") || d.includes("w9"),
        );
        item.stripeRequirementsDue = taxRelated;
        if (taxRelated.length > 0) {
          atRisk.push(item);
        }
      } catch (err) {
        console.error("[1099-tracker] stripe retrieve failed", item.stripeAccountId, err);
      }
    }),
  );

  return NextResponse.json({
    year,
    threshold: THRESHOLD_CENTS,
    issued,
    approaching,
    atRisk,
    totals: {
      issuedCount: issued.length,
      approachingCount: approaching.length,
      atRiskCount: atRisk.length,
      totalIssuedAmountCents: issued.reduce((s, i) => s + i.ytdPaidCents, 0),
    },
  });
}
```

## UI — `Form1099TrackerWidget.tsx`

Renders on `/admin/reports/finance-ops` next to the failed-payouts
widget (Phase 2 Task 09).

```
1099-NEC Tracker (2026)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Issued ($600+):       12 affiliates ($28,450 total)
Approaching ($540+):  4 affiliates
⚠ At risk:            2 affiliates have incomplete tax info on Stripe
                     ┌─ Sarah K. — $1,820 — needs SSN
                     └─ Mike R. — $720 — needs W-9

[View full list →]
```

## Edit 3 — Mount widget

In `/admin/reports/finance-ops/page.tsx`, add:

```tsx
import { Form1099TrackerWidget } from "./_components/Form1099TrackerWidget";
// ...
<Form1099TrackerWidget />
```

Place alongside the failed-payouts widget from Phase 2 Task 09.

## Acceptance for this task

- [ ] `/api/admin/reports/1099-tracker?year=2026` returns 3 buckets
- [ ] Widget shows issued / approaching / at-risk counts
- [ ] At-risk drilldown lists each affiliate's specific Stripe requirement
- [ ] RPC handles affiliates with no payouts (returns nothing rather
      than nulls)
- [ ] Year defaults to current calendar year; query string overrides
- [ ] Stripe API failures on individual accounts don't break the page —
      that affiliate just doesn't surface in `at_risk`
- [ ] No regression in finance-ops dashboard

## Verification

```bash
# RPC works
psql "$SUPABASE_URL" -c "SELECT * FROM affiliate_1099_ytd_totals(2026);"

# Endpoint
curl "https://localhost:3000/api/admin/reports/1099-tracker?year=2026" \
  -b "admin-session=..." | jq .totals
```

## Out of scope

- Issuing 1099-NEC ourselves (Stripe handles)
- W-8BEN tracking for international — Phase 4 international launch
- Quarterly tax summaries — annual only
- Email blast to "at risk" affiliates — admin nudges manually for
  v1; templated email is polish
- Historical year selector older than 2026 (the current year) —
  Phase 2 only goes live in 2026
