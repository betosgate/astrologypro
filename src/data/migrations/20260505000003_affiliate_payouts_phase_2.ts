// Bundled mirror of supabase/migrations/20260505000003_affiliate_payouts_phase_2.sql
// Keep byte-aligned with the canonical .sql file.

export const MIGRATION_SQL = `
-- ============================================================================
-- Affiliate Payouts Phase 2 — schema
--
-- Adds Stripe Express identity columns + balance_offset_cents to
-- affiliate_accounts. Adds payout_id / paid_at / paid_amount_cents /
-- payout_status to campaign_conversions. Creates affiliate_payouts
-- and affiliate_payout_items tables. Adds the affiliate_payouts_enabled
-- kill-switch to platform_settings.
--
-- Bundles Task 10 (Phase 3 instrumentation prep): first_conversion_at,
-- first_payout_at on affiliate_accounts + affiliate_onboarding_rejections
-- table.
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
DO $legacy_check$
DECLARE
  legacy_payouts_rows BIGINT;
  legacy_items_rows BIGINT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='affiliate_payouts'
  ) THEN
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
  ripe_total_cents            INTEGER NOT NULL CHECK (ripe_total_cents >= 0),
  offset_applied_cents        INTEGER NOT NULL DEFAULT 0 CHECK (offset_applied_cents >= 0),
  net_transferred_cents       INTEGER NOT NULL CHECK (net_transferred_cents >= 0),
  stripe_transfer_id          TEXT,
  stripe_idempotency_key      TEXT NOT NULL UNIQUE,
  status                      TEXT NOT NULL DEFAULT 'dry_run'
                              CHECK (status IN
                                ('dry_run','pending','completed','failed','blocked','disputed')),
  failure_reason              TEXT,
  blocked_reason              TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transferred_at              TIMESTAMPTZ,
  trigger_source              TEXT NOT NULL DEFAULT 'cron'
                              CHECK (trigger_source IN ('cron','admin_manual','admin_retry')),
  triggered_by                UUID,
  notes                       TEXT
);

CREATE INDEX IF NOT EXISTS idx_payouts_affiliate_account
  ON affiliate_payouts (affiliate_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_status
  ON affiliate_payouts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_stripe_transfer_id
  ON affiliate_payouts (stripe_transfer_id)
  WHERE stripe_transfer_id IS NOT NULL;

DO $arith$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_payout_net_arithmetic'
      AND conrelid = 'public.affiliate_payouts'::regclass
  ) THEN
    ALTER TABLE affiliate_payouts
      ADD CONSTRAINT chk_payout_net_arithmetic
      CHECK (net_transferred_cents = ripe_total_cents - offset_applied_cents);
  END IF;
END
$arith$;

COMMENT ON TABLE affiliate_payouts IS
  'One row per cron-tick payout to an affiliate. Stores Stripe transfer id, idempotency key, and lifecycle. status=dry_run is written when the kill-switch is OFF (no Stripe call).';

-- ─── 4. affiliate_payout_items ─ junction ───────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_payout_items (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id                UUID NOT NULL REFERENCES affiliate_payouts(id) ON DELETE CASCADE,
  conversion_id            UUID NOT NULL REFERENCES campaign_conversions(id) ON DELETE RESTRICT,
  applied_amount_cents     INTEGER NOT NULL CHECK (applied_amount_cents >= 0),
  offset_applied_cents     INTEGER NOT NULL DEFAULT 0 CHECK (offset_applied_cents >= 0),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_payout_items_conversion
  ON affiliate_payout_items (conversion_id);
CREATE INDEX IF NOT EXISTS idx_payout_items_payout
  ON affiliate_payout_items (payout_id);

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

-- ─── 7. Reuse existing aff_updated_at trigger if present (no-op) ──────────
DO $trig$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='aff_updated_at') THEN
    NULL;
  END IF;
END
$trig$;

-- ─── 9. Phase 3 instrumentation prep (Task 10 bundle) ─────────────────────
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

DO $rls_rej$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='affiliate_onboarding_rejections'
      AND policyname='svc_affiliate_onboarding_rejections') THEN
    EXECUTE 'CREATE POLICY svc_affiliate_onboarding_rejections
             ON affiliate_onboarding_rejections
             FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END
$rls_rej$;

-- ─── 8. Sanity checks ──────────────────────────────────────────────────────
DO $check$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='bookings'
      AND column_name='affiliate_commission_amount_cents'
  ) THEN
    RAISE EXCEPTION
      'Phase 2 prerequisite missing: bookings.affiliate_commission_amount_cents (Phase 1.5 carve-out). Apply 20260505000002 first.';
  END IF;

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
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='affiliate_onboarding_rejections') THEN
    RAISE EXCEPTION 'affiliate_onboarding_rejections table missing (Task 10)';
  END IF;

  -- Smoke test the admin_action_log CHECK directly
  BEGIN
    EXECUTE 'INSERT INTO admin_action_log (admin_user_id, action_kind, target_resource_type, target_resource_id, reason) VALUES (''00000000-0000-0000-0000-000000000000'', ''affiliate_offset_applied'', ''probe'', NULL, ''phase-2 migration smoke test placeholder'')';
    EXECUTE 'DELETE FROM admin_action_log WHERE target_resource_type=''probe'' AND admin_user_id=''00000000-0000-0000-0000-000000000000''';
  EXCEPTION WHEN check_violation THEN
    RAISE EXCEPTION 'admin_action_log.action_kind CHECK did not accept ''affiliate_offset_applied''. Phase 2 migration is broken.';
  END;
END
$check$;

COMMIT;
`;
