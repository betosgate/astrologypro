# Task 10 — Phase 3 Instrumentation Prep

- Status: Not Started
- Priority: P1
- Depends on: 01, 02, 04
- Blocks: 08 (sign-off acknowledges instrumentation is in place)

## Goal

Plant the data-collection seeds Phase 3 will need. Without these
landing in Phase 2, Phase 3 ships with no historical data — analytics
dashboards will be blank for the first ~30 days.

This task does **NOT** build dashboards. It only adds:

1. `affiliate_accounts.first_conversion_at` (TIMESTAMPTZ, nullable)
2. `affiliate_accounts.first_payout_at` (TIMESTAMPTZ, nullable)
3. Stamp logic in `creditAffiliateConversion` and
   `executeAffiliatePayouts` to populate them once (idempotent)
4. A small `affiliate_onboarding_rejections` table for the country
   pre-check rejection log (international-demand signal)

That's it. Click tracking already exists at
[supabase/migrations/20260417000010_campaign_destinations_and_clicks.sql:48](supabase/migrations/20260417000010_campaign_destinations_and_clicks.sql#L48)
with full UTM + geo + device fields, plus a
`campaign_clicks.conversion_id` FK linking clicks to conversions. **No
new click instrumentation needed.**

## Why this is in Phase 2 not Phase 3

The data has to be collected starting day 1 of Phase 2 deploy:

- **First-conversion / first-payout timestamps** are only knowable at
  the moment they happen. If Phase 3 ships these without prior
  instrumentation, every existing affiliate's funnel timestamps are
  NULL or fudged. The columns can be backfilled crudely from
  `MIN(converted_at)` / `MIN(paid_at)` aggregates, but Phase 2
  stamping keeps it accurate going forward.
- **Country rejections** can't be reconstructed after the fact —
  logging starts when the user clicks Connect. Without Phase 2's
  rejection log, Phase 3 has no signal of international demand.

## Files to modify

| # | File | Action |
|---|---|---|
| 1 | `supabase/migrations/20260505000003_affiliate_payouts_phase_2.sql` (Task 01) | **Extend** — add 2 columns + 1 new table |
| 2 | `src/data/migrations/20260505000003_affiliate_payouts_phase_2.ts` | **Extend** — mirror the new SQL |
| 3 | `src/lib/affiliate-attribution.ts` | **Extend** — stamp `first_conversion_at` once when null |
| 4 | `src/lib/affiliate-payout-execution.ts` | **Extend** — stamp `first_payout_at` once when null |
| 5 | `src/app/api/affiliate/stripe-connect/start/route.ts` | **Extend** — log country rejections |

## Edit 1 — Schema additions to Task 01 migration

Append to the existing `20260505000003_affiliate_payouts_phase_2.sql`
file (after the kill-switch ALTER, before the RLS block):

```sql
-- ─── 9. Phase 3 instrumentation prep ──────────────────────────────────────
-- These columns + table are populated by Phase 2 code so Phase 3
-- analytics dashboards have meaningful data when they ship.

ALTER TABLE affiliate_accounts
  ADD COLUMN IF NOT EXISTS first_conversion_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_payout_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_affiliate_accounts_first_conversion
  ON affiliate_accounts (first_conversion_at)
  WHERE first_conversion_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_affiliate_accounts_first_payout
  ON affiliate_accounts (first_payout_at)
  WHERE first_payout_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS affiliate_onboarding_rejections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_account_id UUID REFERENCES affiliate_accounts(id) ON DELETE CASCADE,
  email CITEXT NOT NULL,
  detected_country_code VARCHAR(2),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aff_rejections_country
  ON affiliate_onboarding_rejections (detected_country_code, created_at DESC);

ALTER TABLE affiliate_onboarding_rejections ENABLE ROW LEVEL SECURITY;

DO $rls$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='affiliate_onboarding_rejections'
      AND policyname='svc_affiliate_onboarding_rejections') THEN
    EXECUTE 'CREATE POLICY svc_affiliate_onboarding_rejections
             ON affiliate_onboarding_rejections
             FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END
$rls$;
```

Add the corresponding mirror lines to `20260505000003_affiliate_payouts_phase_2.ts`.

## Edit 2 — Stamp `first_conversion_at`

**File:** `src/lib/affiliate-attribution.ts`

Inside `creditAffiliateConversion`, AFTER the successful insert at
line ~388 (the `inserted` row exists), conditionally stamp the
affiliate's first_conversion_at:

```ts
// Phase 3 prep: if this is the affiliate's first conversion ever,
// stamp the milestone for funnel analytics. Idempotent — only writes
// when first_conversion_at is still NULL.
try {
  await admin
    .from("affiliate_accounts")
    .update({ first_conversion_at: new Date().toISOString() })
    .eq("id", resolvedAccountId)
    .is("first_conversion_at", null);
} catch (err) {
  console.error("[creditAffiliateConversion] first_conversion_at stamp failed", err);
}
```

The `.is("first_conversion_at", null)` filter ensures only the FIRST
write wins — subsequent calls are no-ops at the DB level.

## Edit 3 — Stamp `first_payout_at`

**File:** `src/lib/affiliate-payout-execution.ts`

Inside `executeAffiliatePayouts`, after the success path that updates
`affiliate_payouts.status = 'completed'` (real-transfer success or
offset-fully-consumed), conditionally stamp:

```ts
// Phase 3 prep: stamp first_payout_at on first successful transfer.
try {
  await admin
    .from("affiliate_accounts")
    .update({ first_payout_at: new Date().toISOString() })
    .eq("id", g.affiliateAccountId)
    .is("first_payout_at", null);
} catch (err) {
  console.error("[executeAffiliatePayouts] first_payout_at stamp failed", err);
}
```

Place it inside both success branches (real transfer + offset-fully-
consumed). Skip on dry-run / failed paths.

## Edit 4 — Log country rejections

**File:** `src/app/api/affiliate/stripe-connect/start/route.ts`

Inside the country pre-check rejection branch (added in Task 02 Edit
4b), insert a log row before returning the 422:

```ts
if (!eligibility.eligible) {
  // Phase 3 prep: log the rejection for international-demand analytics
  try {
    await admin.from("affiliate_onboarding_rejections").insert({
      affiliate_account_id: affiliate.id,
      email: affiliate.email,
      detected_country_code: eligibility.detectedCountryCode,
      reason: eligibility.message,
    });
  } catch (err) {
    console.error("[stripe-connect/start] rejection log failed", err);
  }

  return NextResponse.json(
    {
      error: eligibility.message,
      countryCode: eligibility.detectedCountryCode ?? null,
      supportedCountries: ["US"],
    },
    { status: 422 },
  );
}
```

## Edit 5 — Optional crude backfill (one-time)

For the 14 existing affiliates with conversion history, a one-time
backfill of `first_conversion_at` from existing data is safe:

```sql
UPDATE affiliate_accounts a
   SET first_conversion_at = sub.min_at
  FROM (
    SELECT da.affiliate_account_id, MIN(c.converted_at) AS min_at
      FROM campaign_conversions c
      JOIN diviner_affiliates da ON da.id = c.affiliate_id
     WHERE c.reversed_at IS NULL
     GROUP BY da.affiliate_account_id
  ) sub
 WHERE a.id = sub.affiliate_account_id
   AND a.first_conversion_at IS NULL;
```

This is OPTIONAL — Phase 3 dashboards can either run the backfill
once via a manual admin SQL, or accept that historical affiliates
have NULL first_conversion_at and surface them as "Pre-Phase-2"
in funnel visualizations. **Recommend running the backfill** so the
funnel chart isn't half-empty on day 1 of Phase 3.

`first_payout_at` cannot be backfilled — no payouts have happened
yet (Phase 2 introduces the concept). It populates organically.

## Acceptance for this task

- [ ] `affiliate_accounts.first_conversion_at` and
      `first_payout_at` columns exist (nullable TIMESTAMPTZ)
- [ ] `affiliate_onboarding_rejections` table exists with RLS
- [ ] `creditAffiliateConversion` stamps `first_conversion_at` on
      first conversion only (idempotent — second conversion does NOT
      overwrite)
- [ ] `executeAffiliatePayouts` stamps `first_payout_at` on first
      successful payout only
- [ ] Country precheck rejection in `stripe-connect/start` writes
      a row to `affiliate_onboarding_rejections`
- [ ] One-time backfill SQL was run (or explicitly skipped with a
      note in the deploy log)

## Verification

```bash
# Schema landed
psql "$SUPABASE_URL" -c "\d affiliate_accounts" | grep "first_"
# Expected: 2 rows
psql "$SUPABASE_URL" -c "\dt affiliate_onboarding_rejections"
# Expected: 1 row

# Stamping wired
grep -n "first_conversion_at" src/lib/affiliate-attribution.ts
grep -n "first_payout_at" src/lib/affiliate-payout-execution.ts
grep -n "affiliate_onboarding_rejections" src/app/api/affiliate/stripe-connect/start/route.ts
```

## What this UNLOCKS for Phase 3

| Phase 3 metric | Source after Task 10 |
|---|---|
| Funnel: invited → accepted → connected → first conversion → first payout | `diviner_affiliates.invited_at, accepted_at` + `affiliate_accounts.stripe_account_id, first_conversion_at, first_payout_at` |
| Time-to-first-conversion median | `MEDIAN(first_conversion_at - accepted_at)` |
| Time-to-first-payout median | `MEDIAN(first_payout_at - first_conversion_at)` |
| International demand signal | `COUNT(*) GROUP BY detected_country_code FROM affiliate_onboarding_rejections` |
| All click-through metrics | `campaign_clicks` (already exists, no Phase 2 prep needed) |

## Out of scope

- Building the actual dashboards (Phase 3 owns those)
- Backfilling `first_payout_at` (impossible — no payouts pre-deploy)
- Per-affiliate ROI metric (Phase 3 query, no schema needed)
- Click → conversion attribution stitching (already in
  `campaign_clicks.conversion_id`)
