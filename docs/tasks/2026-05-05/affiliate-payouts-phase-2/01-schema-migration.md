# Task 01 — Phase 2 Schema Migration

- Status: Not Started
- Priority: P0
- Depends on: —
- Blocks: 02, 03, 04, 05, 06, 07

## Goal

Lay down all DB structures Phase 2 needs in a single additive,
idempotent migration:

1. `affiliate_accounts.stripe_account_id` — nullable TEXT for the
   Stripe Express account ID
2. `affiliate_accounts.stripe_payouts_enabled` — denormalized cache
   of Stripe `account.payouts_enabled` (refreshed by webhook)
3. `affiliate_accounts.stripe_charges_enabled` — same for
   `charges_enabled`
4. `affiliate_accounts.stripe_details_submitted` — same for
   `details_submitted`
5. `affiliate_accounts.stripe_account_synced_at` — timestamp of
   last refresh
6. `affiliate_accounts.balance_offset_cents` — INTEGER NOT NULL
   DEFAULT 0, ≥ 0; the running offset of refund-after-payout
7. `affiliate_accounts.balance_offset_last_changed_at` — TIMESTAMPTZ,
   used by admin "stale offset" alert
8. `affiliate_accounts.prior_stripe_account_ids` — JSONB array, audit
   of past account IDs if affiliate switches
9. `campaign_conversions.payout_id` — UUID nullable FK →
   `affiliate_payouts(id)` ON DELETE SET NULL
10. `campaign_conversions.paid_at` — TIMESTAMPTZ nullable
11. `campaign_conversions.paid_amount_cents` — INTEGER nullable
    (denormalized; equals `commission_amount_cents` minus any
    proportional offset applied; guards against future audit drift
    if `commission_amount_cents` is ever recomputed)
12. `campaign_conversions.payout_status` — TEXT, one of
    `('unpaid','ripe','paying','paid','offset_applied','blocked')`
    with a defaulting + lifecycle CHECK
13. **NEW TABLE** `affiliate_payouts` — one row per cron-tick payout
    per affiliate (could include many conversions)
14. **NEW TABLE** `affiliate_payout_items` — junction
    (payout_id, conversion_id, applied_amount_cents, offset_applied_cents)
15. `platform_settings.affiliate_payouts_enabled` — BOOLEAN NOT
    NULL DEFAULT FALSE — the Phase 2 kill-switch (00-master §
    "Kill-switch")
16. **Extend** `admin_action_log.action_kind` CHECK constraint with
    4 new Phase-2 action kinds. The existing CHECK lists only:
    `'affiliate_assignment_revoked'`, `'affiliate_campaign_archived'`,
    `'affiliate_conversion_reversed'` (+ `'service_templates_bulk_commission_update'`
    added in Phase 1.5). Phase 2 adds:
    `'affiliate_offset_applied'`, `'affiliate_payouts_kill_switch_toggled'`,
    `'affiliate_payout_disputed'`, `'affiliate_offset_written_off'`.
    Without this, every Phase-2 admin_action_log INSERT fails with a
    CHECK-constraint violation.

All additive; no DROPs. Pre-existing rows tolerated — defaults
slot in cleanly.

## Files to create / modify

1. **Create:** `supabase/migrations/20260505000003_affiliate_payouts_phase_2.sql`
2. **Create:** `src/data/migrations/20260505000003_affiliate_payouts_phase_2.ts`
3. **Modify:** `src/lib/db/migrations.ts` (add import + allowlist entry)

The ordinal `20260505000003` was chosen against the carve-out
sprint's `20260505000002`. **Re-verify before writing:**

```bash
ls supabase/migrations/2026050* 2>/dev/null
# Expected at time of writing:
#   20260505000001_affiliate_campaigns_channel_marketing_kit.sql
#   20260505000002_booking_affiliate_commission_cents.sql
# Bump to 20260505000004 if anything new lands first.
```

## Canonical SQL

Write verbatim into
`supabase/migrations/20260505000003_affiliate_payouts_phase_2.sql`:

```sql
-- ============================================================================
-- Affiliate Payouts Phase 2 — schema
--
-- Adds Stripe Express identity columns + balance_offset_cents to
-- affiliate_accounts. Adds payout_id / paid_at / paid_amount_cents /
-- payout_status to campaign_conversions. Creates affiliate_payouts
-- and affiliate_payout_items tables. Adds the affiliate_payouts_enabled
-- kill-switch to platform_settings.
--
-- Sprint plan:
--   docs/tasks/2026-05-05/affiliate-payouts-phase-2/
--
-- Hard prerequisite check: bookings.affiliate_commission_amount_cents
-- must already exist (Phase 1.5 carve-out shipped). The DO block at
-- the bottom of this file fails loudly if not.
-- ============================================================================

BEGIN;

-- ─── 0. Defensive cleanup of legacy v2-dropped tables ──────────────────────
-- Migration `20260424009001_affiliate_commission_v2_destructive.sql` dropped
-- the legacy `affiliate_payouts` and `affiliate_payout_items` tables. We
-- reuse those names below. Defensive DROP first — but ABORT if a stale
-- environment somehow still has the legacy schema with rows in it (would
-- otherwise silently lose data).
DO $legacy_check$
DECLARE
  legacy_payouts_rows BIGINT;
  legacy_items_rows BIGINT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='affiliate_payouts'
  ) THEN
    -- Inspect the columns to detect the LEGACY shape (which had different
    -- columns than Phase 2). If it has the new column `stripe_idempotency_key`,
    -- this is a Phase 2 re-run — leave it alone (CREATE TABLE IF NOT EXISTS
    -- below is a no-op).
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='affiliate_payouts'
        AND column_name='stripe_idempotency_key'
    ) THEN
      EXECUTE 'SELECT count(*) FROM public.affiliate_payouts'
        INTO legacy_payouts_rows;
      IF legacy_payouts_rows > 0 THEN
        RAISE EXCEPTION
          'Legacy affiliate_payouts table has % rows. Phase 2 reuses this table name. Run the v2 destructive migration cleanup first or back up the rows manually before retrying.',
          legacy_payouts_rows;
      END IF;
      DROP TABLE IF EXISTS affiliate_payouts CASCADE;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='affiliate_payout_items'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='affiliate_payout_items'
        AND column_name='offset_applied_cents'
    ) THEN
      EXECUTE 'SELECT count(*) FROM public.affiliate_payout_items'
        INTO legacy_items_rows;
      IF legacy_items_rows > 0 THEN
        RAISE EXCEPTION
          'Legacy affiliate_payout_items table has % rows. Phase 2 reuses this table name. Investigate before retrying.',
          legacy_items_rows;
      END IF;
      DROP TABLE IF EXISTS affiliate_payout_items CASCADE;
    END IF;
  END IF;
END
$legacy_check$;

-- ─── 1. affiliate_accounts ─ Stripe Connect identity + offset ──────────────
ALTER TABLE affiliate_accounts
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_account_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS balance_offset_cents INTEGER NOT NULL DEFAULT 0
    CHECK (balance_offset_cents >= 0),
  ADD COLUMN IF NOT EXISTS balance_offset_last_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS prior_stripe_account_ids JSONB NOT NULL DEFAULT '[]'::jsonb;

-- One affiliate ↔ one Stripe account at a time (rotation appends prior IDs)
CREATE UNIQUE INDEX IF NOT EXISTS ux_affiliate_accounts_stripe_account_id
  ON affiliate_accounts (stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_affiliate_accounts_payouts_enabled
  ON affiliate_accounts (stripe_payouts_enabled)
  WHERE stripe_payouts_enabled = TRUE;

CREATE INDEX IF NOT EXISTS idx_affiliate_accounts_offset_outstanding
  ON affiliate_accounts (balance_offset_last_changed_at)
  WHERE balance_offset_cents > 0;

COMMENT ON COLUMN affiliate_accounts.balance_offset_cents IS
  'DB-level offset (Path 1 from Phase 2 master). When a booking is refunded after the affiliate has been paid for it, this column is incremented by the affiliate share. The next payout subtracts this from the gross payable before transferring. Only zeroed on a payout cycle that consumes >= the full offset, or via admin write-off action.';

-- ─── 2. campaign_conversions ─ payout linkage + lifecycle ──────────────────
DO $payout_status_check$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='campaign_conversions'
      AND column_name='payout_status'
  ) THEN
    ALTER TABLE campaign_conversions
      ADD COLUMN payout_status TEXT NOT NULL DEFAULT 'unpaid'
        CHECK (payout_status IN
          ('unpaid','ripe','paying','paid','offset_applied','blocked'));
  END IF;
END
$payout_status_check$;

ALTER TABLE campaign_conversions
  ADD COLUMN IF NOT EXISTS payout_id UUID,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_amount_cents INTEGER
    CHECK (paid_amount_cents IS NULL OR paid_amount_cents >= 0),
  ADD COLUMN IF NOT EXISTS ripeness_at TIMESTAMPTZ;

-- An "unpaid" / "ripe" conversion has no payout linkage; "paid" must.
-- (Soft check — we don't constrain via FK shape since affiliate_payouts
-- is created below; a dependent CHECK referencing it is added at the end.)

CREATE INDEX IF NOT EXISTS idx_conversions_payout_status_ripe
  ON campaign_conversions (payout_status, ripeness_at)
  WHERE payout_status = 'unpaid';

CREATE INDEX IF NOT EXISTS idx_conversions_payout_id
  ON campaign_conversions (payout_id)
  WHERE payout_id IS NOT NULL;

-- ─── 3. affiliate_payouts ─ one row per cron-tick payout ────────────────────
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_account_id        UUID NOT NULL REFERENCES affiliate_accounts(id) ON DELETE RESTRICT,
  stripe_account_id           TEXT NOT NULL,
  -- Money flow:
  ripe_total_cents            INTEGER NOT NULL CHECK (ripe_total_cents >= 0),
  offset_applied_cents        INTEGER NOT NULL DEFAULT 0 CHECK (offset_applied_cents >= 0),
  net_transferred_cents       INTEGER NOT NULL CHECK (net_transferred_cents >= 0),
  -- Stripe linkage:
  stripe_transfer_id          TEXT,        -- 'tr_*' on success
  stripe_idempotency_key      TEXT NOT NULL UNIQUE, -- 'affiliate-payout-{payout_id}'
  -- Lifecycle:
  status                      TEXT NOT NULL DEFAULT 'dry_run'
                              CHECK (status IN
                                ('dry_run','pending','completed','failed','blocked','disputed')),
  failure_reason              TEXT,
  blocked_reason              TEXT,
  -- Timestamps:
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transferred_at              TIMESTAMPTZ,
  -- Audit:
  trigger_source              TEXT NOT NULL DEFAULT 'cron'
                              CHECK (trigger_source IN ('cron','admin_manual','admin_retry')),
  triggered_by                UUID,        -- auth.users.id when admin-triggered
  notes                       TEXT
);

CREATE INDEX IF NOT EXISTS idx_payouts_affiliate_account
  ON affiliate_payouts (affiliate_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_status
  ON affiliate_payouts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_stripe_transfer_id
  ON affiliate_payouts (stripe_transfer_id)
  WHERE stripe_transfer_id IS NOT NULL;

-- Net = ripe_total − offset_applied — enforce arithmetic identity.
ALTER TABLE affiliate_payouts
  ADD CONSTRAINT chk_payout_net_arithmetic
  CHECK (net_transferred_cents = ripe_total_cents - offset_applied_cents);

COMMENT ON TABLE affiliate_payouts IS
  'One row per cron-tick payout to an affiliate. Stores Stripe transfer id, idempotency key, and lifecycle. status=dry_run is written when the kill-switch is OFF (no Stripe call).';

-- ─── 4. affiliate_payout_items ─ junction ───────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_payout_items (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id                UUID NOT NULL REFERENCES affiliate_payouts(id) ON DELETE CASCADE,
  conversion_id            UUID NOT NULL REFERENCES campaign_conversions(id) ON DELETE RESTRICT,
  -- The conversion's commission_amount_cents at the moment it was paid
  applied_amount_cents     INTEGER NOT NULL CHECK (applied_amount_cents >= 0),
  -- Per-conversion share of the offset_applied_cents on the parent payout,
  -- if any (proportional). 0 in the no-offset case.
  offset_applied_cents     INTEGER NOT NULL DEFAULT 0 CHECK (offset_applied_cents >= 0),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_payout_items_conversion
  ON affiliate_payout_items (conversion_id);
CREATE INDEX IF NOT EXISTS idx_payout_items_payout
  ON affiliate_payout_items (payout_id);

-- Now the campaign_conversions.payout_id can be FK'd to affiliate_payouts.
DO $fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public'
      AND table_name='campaign_conversions'
      AND constraint_name='campaign_conversions_payout_id_fkey'
  ) THEN
    ALTER TABLE campaign_conversions
      ADD CONSTRAINT campaign_conversions_payout_id_fkey
      FOREIGN KEY (payout_id)
      REFERENCES affiliate_payouts(id)
      ON DELETE SET NULL;
  END IF;
END
$fk$;

-- ─── 4b. admin_action_log ─ extend action_kind CHECK with Phase-2 kinds ───
-- Postgres can't ALTER a CHECK constraint in place; drop + recreate.
-- Verified existing values via 20260424000010_affiliate_commission_v2_additive.sql:116
-- and 20260430000002_affiliate_phase_1_5_general.sql:188.
DO $aal_check$
DECLARE
  existing_constraint TEXT;
BEGIN
  SELECT conname INTO existing_constraint
    FROM pg_constraint
   WHERE conrelid = 'public.admin_action_log'::regclass
     AND contype = 'c'
     AND pg_get_constraintdef(oid) LIKE '%action_kind%';

  IF existing_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE admin_action_log DROP CONSTRAINT %I', existing_constraint);
  END IF;

  ALTER TABLE admin_action_log
    ADD CONSTRAINT admin_action_log_action_kind_check
    CHECK (action_kind IN (
      'affiliate_assignment_revoked',
      'affiliate_campaign_archived',
      'affiliate_conversion_reversed',
      'service_templates_bulk_commission_update',
      'affiliate_offset_applied',
      'affiliate_payouts_kill_switch_toggled',
      'affiliate_payout_disputed',
      'affiliate_offset_written_off'
    ));
END
$aal_check$;

-- ─── 5. platform_settings ─ kill-switch ────────────────────────────────────
ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS affiliate_payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN platform_settings.affiliate_payouts_enabled IS
  'Phase 2 kill-switch. When FALSE, the no-show-refunds cron writes affiliate_payouts rows with status=dry_run but does NOT call stripe.transfers.create. Flip to TRUE only after dry-run output has been reviewed.';

-- ─── 6. RLS — service_role full, affiliate self-read ───────────────────────
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payout_items ENABLE ROW LEVEL SECURITY;

DO $rls$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='affiliate_payouts'
      AND policyname='svc_affiliate_payouts') THEN
    EXECUTE 'CREATE POLICY svc_affiliate_payouts ON affiliate_payouts
             FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='affiliate_payouts'
      AND policyname='self_read_affiliate_payouts') THEN
    EXECUTE $self$
      CREATE POLICY self_read_affiliate_payouts ON affiliate_payouts
      FOR SELECT TO authenticated
      USING (
        affiliate_account_id IN (
          SELECT id FROM affiliate_accounts
          WHERE user_id = auth.uid()
        )
      )
    $self$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='affiliate_payout_items'
      AND policyname='svc_affiliate_payout_items') THEN
    EXECUTE 'CREATE POLICY svc_affiliate_payout_items ON affiliate_payout_items
             FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='affiliate_payout_items'
      AND policyname='self_read_affiliate_payout_items') THEN
    EXECUTE $self$
      CREATE POLICY self_read_affiliate_payout_items ON affiliate_payout_items
      FOR SELECT TO authenticated
      USING (
        payout_id IN (
          SELECT p.id FROM affiliate_payouts p
          JOIN affiliate_accounts a ON a.id = p.affiliate_account_id
          WHERE a.user_id = auth.uid()
        )
      )
    $self$;
  END IF;
END
$rls$;

-- ─── 7. Reuse existing aff_updated_at trigger if present ───────────────────
DO $trig$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='aff_updated_at') THEN
    -- affiliate_payouts has created_at + transferred_at instead of an
    -- updated_at; no trigger needed.
    NULL;
  END IF;
END
$trig$;

-- ─── 8. Sanity checks ──────────────────────────────────────────────────────
DO $check$
BEGIN
  -- Phase 1.5 carve-out must have shipped first (column exists)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='bookings'
      AND column_name='affiliate_commission_amount_cents'
  ) THEN
    RAISE EXCEPTION
      'Phase 2 prerequisite missing: bookings.affiliate_commission_amount_cents (Phase 1.5 carve-out). Apply 20260505000002 first.';
  END IF;

  -- All Phase 2 columns landed
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='affiliate_accounts'
      AND column_name='stripe_account_id') THEN
    RAISE EXCEPTION 'affiliate_accounts.stripe_account_id missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='affiliate_accounts'
      AND column_name='balance_offset_cents') THEN
    RAISE EXCEPTION 'affiliate_accounts.balance_offset_cents missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='campaign_conversions'
      AND column_name='payout_status') THEN
    RAISE EXCEPTION 'campaign_conversions.payout_status missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='affiliate_payouts') THEN
    RAISE EXCEPTION 'affiliate_payouts table missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='affiliate_payout_items') THEN
    RAISE EXCEPTION 'affiliate_payout_items table missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='platform_settings'
      AND column_name='affiliate_payouts_enabled') THEN
    RAISE EXCEPTION 'platform_settings.affiliate_payouts_enabled missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public'
      AND table_name='campaign_conversions'
      AND constraint_name='campaign_conversions_payout_id_fkey') THEN
    RAISE EXCEPTION 'FK campaign_conversions.payout_id → affiliate_payouts not added';
  END IF;

  -- admin_action_log CHECK accepts the new Phase-2 kinds
  PERFORM 1;
  BEGIN
    PERFORM admin_user_id FROM admin_action_log WHERE FALSE;
    -- A no-op probe; the constraint is verified by the smoke test below.
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  -- Smoke test the CHECK directly: does a tentative INSERT pass?
  -- Use a dry-run with ROLLBACK so we don't pollute the table.
  BEGIN
    EXECUTE 'INSERT INTO admin_action_log (admin_user_id, action_kind, target_resource_type, target_resource_id, reason) VALUES (''00000000-0000-0000-0000-000000000000'', ''affiliate_offset_applied'', ''probe'', NULL, ''phase-2 migration smoke test placeholder'')';
    -- If we got here without exception, the CHECK accepted the new kind.
    -- Roll the row back so the table is unchanged.
    EXECUTE 'DELETE FROM admin_action_log WHERE target_resource_type=''probe'' AND admin_user_id=''00000000-0000-0000-0000-000000000000''';
  EXCEPTION WHEN check_violation THEN
    RAISE EXCEPTION 'admin_action_log.action_kind CHECK did not accept ''affiliate_offset_applied''. Phase 2 migration is broken.';
  END;
END
$check$;

COMMIT;
```

## TS mirror

Write to
`src/data/migrations/20260505000003_affiliate_payouts_phase_2.ts`,
matching `20260505000002_booking_affiliate_commission_cents.ts`'s
template-literal envelope (no backticks inside the SQL body).

```ts
// Bundled mirror of supabase/migrations/20260505000003_affiliate_payouts_phase_2.sql
// Keep byte-aligned with the canonical .sql file.

export const MIGRATION_SQL = `
-- (paste full SQL body verbatim)
`;
```

## Allowlist registration in `src/lib/db/migrations.ts`

### Import

Add to the affiliate cluster (post-2026-05-05):

```ts
import { MIGRATION_SQL as MIG_20260505000003_AP2 }
  from "@/data/migrations/20260505000003_affiliate_payouts_phase_2";
```

`AP2` = "Affiliate Payouts Phase 2" — short suffix matches convention.

### Allowlist entry

After the `20260505000002_*` entry, insert:

```ts
"20260505000003_affiliate_payouts_phase_2": {
  id: "20260505000003_affiliate_payouts_phase_2",
  title: "Affiliate Payouts Phase 2 — Stripe Connect identity, payouts tables, kill-switch",
  description:
    "Phase 2 schema: adds Stripe Express identity columns + balance_offset_cents to affiliate_accounts; payout_id / paid_at / paid_amount_cents / payout_status to campaign_conversions; creates affiliate_payouts + affiliate_payout_items; adds platform_settings.affiliate_payouts_enabled kill-switch (defaults FALSE). Hard-fails if Phase 1.5 carve-out (bookings.affiliate_commission_amount_cents) hasn't shipped. Idempotent + RLS + sanity-checked. Sprint plan: docs/tasks/2026-05-05/affiliate-payouts-phase-2/.",
  sortKey: "20260505000003",
  sql: MIG_20260505000003_AP2,
},
```

## Verification commands

```bash
# Files landed
grep -n "MIG_20260505000003_AP2" src/lib/db/migrations.ts
# Expected: at least 2 hits — import + sql field

grep -n "20260505000003_affiliate_payouts_phase_2" src/lib/db/migrations.ts
# Expected: 3 hits — id, sortKey, allowlist key

# After applying via /admin/db/migrations:
psql "$SUPABASE_URL" -c "\d affiliate_accounts" | grep -E "stripe_account_id|balance_offset"
# Expected: both rows visible

psql "$SUPABASE_URL" -c "\d campaign_conversions" | grep -E "payout_id|payout_status|paid_at|ripeness_at"
# Expected: 4 rows visible

psql "$SUPABASE_URL" -c "\dt affiliate_payouts affiliate_payout_items"
# Expected: both tables exist

psql "$SUPABASE_URL" -c "SELECT affiliate_payouts_enabled FROM platform_settings LIMIT 1;"
# Expected: f
```

## Acceptance for this task

- [ ] `supabase/migrations/20260505000003_affiliate_payouts_phase_2.sql` exists with the SQL above
- [ ] `src/data/migrations/20260505000003_affiliate_payouts_phase_2.ts` exists with byte-aligned content
- [ ] `src/lib/db/migrations.ts` has the import + allowlist entry
- [ ] TypeScript compiles cleanly
- [ ] Migration runs successfully on dev Supabase via the admin runner
- [ ] Re-run is a no-op (all guards trip; sanity DO blocks pass without raising)
- [ ] Pre-flight check fires correctly when run against a dev DB without
      the carve-out column (manually drop the column on a scratch DB to
      verify the EXCEPTION path; do NOT run on a real environment)

## Out of scope

- Backfilling historical conversions with `payout_status` other than
  the default `'unpaid'` (the existing rows that have happened are
  pre-Phase-1.5 and have no carve-out cents to pay anyway; admin
  write-off if needed)
- Adding indexes for admin reporting (Task 07 adds those, scoped to
  the queries it actually runs)
- Setting `stripe_payouts_enabled = TRUE` for any existing affiliate
  (defaults FALSE; populated as affiliates onboard via Task 02)
