# Task 01 — Schema Migration: `bookings.affiliate_commission_amount_cents`

- Status: Not Started
- Priority: P0
- Depends on: —
- Blocks: 02, 03

## Goal

Add a single nullable column to `bookings` so the affiliate commission
cents computed at booking creation can be persisted and read back at
credit time without recomputation.

## Why this column

- The booking-payment route will compute commission cents from the
  rate stamp at creation time.
- The PaymentIntent's `application_fee_amount` will be sized using
  this exact cents value.
- `creditAffiliateConversion` (called from three independent code
  paths — see spec §5 Flow F) will read this exact value when
  inserting the `campaign_conversions` row, so the conversion's
  `commission_amount_cents` matches the carved-out amount byte-for-
  byte.

## Files to create / modify

1. **Create:** `supabase/migrations/20260505000002_booking_affiliate_commission_cents.sql`
2. **Create:** `src/data/migrations/20260505000002_booking_affiliate_commission_cents.ts`
3. **Modify:** `src/lib/db/migrations.ts` (add import + allowlist entry)

The ordinal `20260505000002` was reserved on 2026-05-05 against the
existing `20260505000001_affiliate_campaigns_channel_marketing_kit.sql`.
**Re-verify before writing:**

```bash
ls supabase/migrations/20260505* 2>/dev/null
# Expected:
#   20260505000001_affiliate_campaigns_channel_marketing_kit.sql
# Bump to 20260505000003 if any new entries landed.
```

## Canonical SQL

Write this verbatim into
`supabase/migrations/20260505000002_booking_affiliate_commission_cents.sql`:

```sql
-- ============================================================================
-- Booking affiliate commission cents — carve-out persistence
--
-- The booking-payment route computes affiliate commission cents from the
-- stamp at PaymentIntent creation time and increases application_fee_amount
-- to retain the affiliate's share on platform balance. This column persists
-- the exact cents value so:
--   1. The webhook + confirm-payment + sync-booking credit paths all read
--      the same source of truth (no off-by-one rounding mismatches against
--      what was actually carved out at PaymentIntent time).
--   2. Refund flow can subtract the exact carved-out amount.
--   3. revenue_ledger_entries.affiliate_commission_cents matches the
--      actual money flow.
--
-- Sprint plan:
--   docs/tasks/2026-05-05/affiliate-carve-out-at-booking-creation/
-- ============================================================================

BEGIN;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS affiliate_commission_amount_cents INTEGER
    CHECK (affiliate_commission_amount_cents IS NULL
           OR affiliate_commission_amount_cents >= 0);

-- No backfill: pre-existing bookings keep NULL. Code branches on the
-- column being non-null to distinguish post-deploy bookings from
-- pre-deploy ones. Refund flow for pre-deploy bookings continues to
-- use the legacy path (no carve-out to undo because there wasn't one).

DO $check$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'affiliate_commission_amount_cents'
  ) THEN
    RAISE EXCEPTION 'bookings.affiliate_commission_amount_cents not added';
  END IF;
  -- Verify the CHECK constraint went down too.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints cc
    WHERE cc.constraint_schema = 'public'
      AND cc.check_clause LIKE '%affiliate_commission_amount_cents%'
  ) THEN
    RAISE EXCEPTION 'CHECK constraint on affiliate_commission_amount_cents not added';
  END IF;
END
$check$;

COMMIT;
```

## TS mirror

Write to `src/data/migrations/20260505000002_booking_affiliate_commission_cents.ts`,
matching the established pattern (compare to
`src/data/migrations/20260427000004_affiliate_rls_security_definer.ts`
for the header + template-literal envelope):

```ts
// Bundled mirror of supabase/migrations/20260505000002_booking_affiliate_commission_cents.sql
// Keep byte-aligned with the canonical .sql file.

export const MIGRATION_SQL = `
-- ============================================================================
-- ... (paste the full SQL body verbatim)
-- ============================================================================

BEGIN;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS affiliate_commission_amount_cents INTEGER
    CHECK (affiliate_commission_amount_cents IS NULL
           OR affiliate_commission_amount_cents >= 0);

-- ... (rest of SQL)

DO $check$
BEGIN
  -- ... (sanity check body — note: $check$ delimiters work in
  --      template literals because there are no backticks)
END
$check$;

COMMIT;
`;
```

No backticks inside the SQL body, so no escaping needed. (Compare to
the Phase 1.5 migration which had `\`general-\`` escapes.)

## Allowlist registration in `src/lib/db/migrations.ts`

### Find the import block

The existing migration imports cluster around lines 76–84. Add this
import line in the affiliate cluster (post-2026-04-30):

```ts
import { MIGRATION_SQL as MIG_20260505000002_BACC }
  from "@/data/migrations/20260505000002_booking_affiliate_commission_cents";
```

`BACC` = "Booking Affiliate Commission Cents" — short variable
suffix matches the convention (`AP15G`, `ACV2A`, `ARSD`, etc.).

### Find the allowlist entries section

Near the bottom of the file, after the `20260504000002_*` entry (the
most recent at time of writing), insert this new descriptor:

```ts
"20260505000002_booking_affiliate_commission_cents": {
  id: "20260505000002_booking_affiliate_commission_cents",
  title: "Booking affiliate commission cents — carve-out persistence",
  description:
    "Adds bookings.affiliate_commission_amount_cents (nullable INTEGER, CHECK ≥ 0). Persists the cents value carved out from the diviner's destination transfer at Stripe PaymentIntent creation, so the three credit paths (confirm-payment, webhook, sync-booking) and the revenue_ledger_entries write all read the same source of truth — no off-by-one rounding against what was actually retained on platform balance. Pre-existing bookings stay NULL; credit code falls back to recomputing via computeCommissionCents for them. Idempotent + sanity-checked. Sprint plan: docs/tasks/2026-05-05/affiliate-carve-out-at-booking-creation/.",
  sortKey: "20260505000002",
  sql: MIG_20260505000002_BACC,
},
```

### Verification commands (post-edit)

```bash
# Import landed
grep -n "MIG_20260505000002_BACC" src/lib/db/migrations.ts
# Expected: at least 2 hits — one in the imports cluster, one in the
# allowlist value (sql: MIG_20260505000002_BACC).

# Allowlist key landed
grep -n "20260505000002_booking_affiliate_commission_cents" \
  src/lib/db/migrations.ts
# Expected: 3 hits — id field, sortKey field, and the literal key.
```

## Acceptance for this task

- [ ] `supabase/migrations/20260505000002_booking_affiliate_commission_cents.sql`
      exists with the SQL above
- [ ] `src/data/migrations/20260505000002_booking_affiliate_commission_cents.ts`
      exists with byte-aligned content
- [ ] `src/lib/db/migrations.ts` has the import and the allowlist entry
- [ ] TypeScript compiles (`tsc --noEmit` clean for the migrations
      file)
- [ ] Migration runs cleanly on dev Supabase via the admin runner UI;
      DO block raises no exceptions
- [ ] Re-running the migration is a no-op (`ADD COLUMN IF NOT EXISTS`
      + the CHECK constraint stays — note: re-adding the same CHECK
      isn't blocked by IF NOT EXISTS on the column; if needed, wrap
      the constraint in a defensive `DROP CONSTRAINT IF EXISTS …`
      first, but for a fresh column this is safe)

## Verification commands (post-apply)

Run inside the Supabase SQL editor or via the diagnostic script:

```sql
-- Column exists with the right type and nullability
SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name = 'bookings'
   AND column_name = 'affiliate_commission_amount_cents';
-- Expected: integer | YES (nullable)

-- All existing rows are NULL (no backfill ran)
SELECT count(*) AS total,
       count(affiliate_commission_amount_cents) AS with_value
  FROM bookings;
-- Expected: with_value = 0 immediately post-migration

-- CHECK constraint is enforced
INSERT INTO bookings (
  id, diviner_id, client_id, service_id, base_price,
  affiliate_commission_amount_cents
) VALUES (
  gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
  gen_random_uuid(), 0, -100
);
-- Expected: ERROR — new row violates check constraint
-- (Then ROLLBACK if you actually ran it interactively.)
```

## Pre-flight: confirm the column doesn't already exist

```bash
node /tmp/check-bookings-col.mjs   # one-off probe; or use Supabase Studio
```

Or quick inline:

```sql
SELECT column_name FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name = 'bookings'
   AND column_name = 'affiliate_commission_amount_cents';
-- Expected: zero rows BEFORE migration applies.
```

## Out of scope for this task

- Backfilling pre-existing bookings (Task 03 falls back to recompute)
- Indexes on the new column (no query expects to filter on it; revenue
  ledger and credit reads are by booking id which is already indexed)
- RLS changes (existing booking RLS posture covers the new column —
  it's just data on rows callers can already see)
