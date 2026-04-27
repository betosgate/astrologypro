export const MIGRATION_SQL = `
-- ============================================================================
-- Task 01a — Affiliate Commission v2 (Additive)
-- Sprint: docs/tasks/2026-04-24/affiliate-commission-v2/01-schema-migrations.md
-- Spec:   docs/specs/affiliate-commission-system.md (v1.2)
--
-- Strictly additive. Destructive changes (drop snapshot cols, drop System A
-- tables, trim status enums) ship in a separate final migration after
-- tasks 02 and 04 have removed all writers.
--
-- Idempotent: safe to re-run. Uses IF NOT EXISTS / IF EXISTS guards + DO
-- blocks with pg_constraint / pg_policies existence checks.
-- ============================================================================

-- ─── 1. diviner_service_affiliate_rate_history ─────────────────────────────
-- Spec §3.3. Captures every rate edit on an assignment so affiliates can
-- audit their history and notifications can quote old → new values.

CREATE TABLE IF NOT EXISTS diviner_service_affiliate_rate_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES diviner_service_affiliates(id) ON DELETE CASCADE,
  old_commission_type TEXT NOT NULL CHECK (old_commission_type IN ('percent', 'flat')),
  old_commission_value NUMERIC(10,4) NOT NULL CHECK (old_commission_value >= 0),
  new_commission_type TEXT NOT NULL CHECK (new_commission_type IN ('percent', 'flat')),
  new_commission_value NUMERIC(10,4) NOT NULL CHECK (new_commission_value >= 0),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id),
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_dsa_rate_history_assignment
  ON diviner_service_affiliate_rate_history (assignment_id, changed_at DESC);

-- ─── 2. bookings — booking rate stamp columns ──────────────────────────────
-- Spec §3.8. The rate that pays out on a conversion is captured here at
-- booking creation time, not resolved live at webhook time.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS commission_source_assignment_id UUID
    REFERENCES diviner_service_affiliates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS commission_rate_type_stamp TEXT
    CHECK (commission_rate_type_stamp IN ('percent', 'flat')),
  ADD COLUMN IF NOT EXISTS commission_rate_value_stamp NUMERIC(10,4)
    CHECK (commission_rate_value_stamp IS NULL OR commission_rate_value_stamp >= 0);

CREATE INDEX IF NOT EXISTS idx_bookings_commission_source_assignment
  ON bookings (commission_source_assignment_id)
  WHERE commission_source_assignment_id IS NOT NULL;

-- ─── 3. campaign_conversions — audit columns used by Task 04 ───────────────
-- rate_type_used / rate_value_used record the rate that actually paid
-- (copy of the booking's stamp at webhook time, for permanent audit even
-- if the stamp is later modified). Reversal columns already exist per
-- migration 20260421000001 (reversed_at / reversed_by / reversal_reason).

ALTER TABLE campaign_conversions
  ADD COLUMN IF NOT EXISTS rate_type_used TEXT
    CHECK (rate_type_used IN ('percent', 'flat')),
  ADD COLUMN IF NOT EXISTS rate_value_used NUMERIC(10,4)
    CHECK (rate_value_used IS NULL OR rate_value_used >= 0);

-- ─── 4. campaign_conversions.campaign_id FK hardening ──────────────────────
-- Swap from ON DELETE CASCADE to ON DELETE RESTRICT. Prevents a campaign
-- delete (or archive mishap with admin permissions) from cascade-wiping
-- conversion history. Campaigns are archived (soft-delete), never
-- hard-deleted when history exists.

DO $fk$
DECLARE
  fk_name TEXT;
BEGIN
  SELECT conname INTO fk_name
  FROM pg_constraint
  WHERE conrelid = 'campaign_conversions'::regclass
    AND contype = 'f'
    AND array_length(conkey, 1) = 1
    AND conkey[1] = (
      SELECT attnum FROM pg_attribute
      WHERE attrelid = 'campaign_conversions'::regclass
        AND attname = 'campaign_id'
    );

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE campaign_conversions DROP CONSTRAINT %I', fk_name);
  END IF;

  -- Recreate with RESTRICT (only if not already added with this name)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'campaign_conversions'::regclass
      AND conname = 'campaign_conversions_campaign_id_fkey_restrict'
  ) THEN
    ALTER TABLE campaign_conversions
      ADD CONSTRAINT campaign_conversions_campaign_id_fkey_restrict
      FOREIGN KEY (campaign_id) REFERENCES affiliate_campaigns(id) ON DELETE RESTRICT;
  END IF;
END
$fk$;

-- ─── 5. affiliate_campaigns.status — extend CHECK to allow 'archived' ──────
-- Spec §3.4. Task 01b (destructive) will later trim the enum to
-- ('active','paused','archived','expired'); for now we just ADD 'archived'
-- so soft-delete paths (Task 06) can land without breaking existing values.

ALTER TABLE affiliate_campaigns
  DROP CONSTRAINT IF EXISTS affiliate_campaigns_status_check;

ALTER TABLE affiliate_campaigns
  ADD CONSTRAINT affiliate_campaigns_status_check
  CHECK (status IN ('draft', 'active', 'paused', 'archived', 'completed', 'expired'));

-- ─── 6. admin_action_log ────────────────────────────────────────────────────
-- Spec §5 Flow K. Records every admin override (force-revoke assignment,
-- force-archive campaign, reverse conversion) with the required reason.
-- Read-only for admins; no user-facing surface.

CREATE TABLE IF NOT EXISTS admin_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action_kind TEXT NOT NULL CHECK (action_kind IN (
    'affiliate_assignment_revoked',
    'affiliate_campaign_archived',
    'affiliate_conversion_reversed'
  )),
  target_resource_type TEXT NOT NULL,
  target_resource_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (length(reason) >= 5 AND length(reason) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_action_log_admin
  ON admin_action_log (admin_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_action_log_target
  ON admin_action_log (target_resource_type, target_resource_id);

-- ─── 7. RLS — new tables ────────────────────────────────────────────────────
-- Spec §8. Matches the pattern established in 20260423000001 (affiliate
-- identity refactor): service_role ALL + owner-scoped SELECT.

ALTER TABLE diviner_service_affiliate_rate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_action_log                        ENABLE ROW LEVEL SECURITY;

DO $plpol$
BEGIN
  -- rate history: service_role ALL
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='diviner_service_affiliate_rate_history'
      AND policyname='svc_dsa_rate_history') THEN
    EXECUTE $p$ CREATE POLICY "svc_dsa_rate_history" ON diviner_service_affiliate_rate_history
      FOR ALL TO service_role USING (true) WITH CHECK (true) $p$;
  END IF;

  -- rate history: diviner sees their own assignment history
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='diviner_service_affiliate_rate_history'
      AND policyname='diviner_sees_own_rate_history') THEN
    EXECUTE $p$
      CREATE POLICY "diviner_sees_own_rate_history" ON diviner_service_affiliate_rate_history
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM diviner_service_affiliates dsa
          JOIN diviners d ON d.id = dsa.diviner_id
          WHERE dsa.id = diviner_service_affiliate_rate_history.assignment_id
            AND d.user_id = auth.uid()
        )
      )
    $p$;
  END IF;

  -- rate history: affiliate sees rate history for assignments given to them
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='diviner_service_affiliate_rate_history'
      AND policyname='affiliate_sees_own_rate_history') THEN
    EXECUTE $p$
      CREATE POLICY "affiliate_sees_own_rate_history" ON diviner_service_affiliate_rate_history
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM diviner_service_affiliates dsa
          JOIN diviner_affiliates da ON da.id = dsa.affiliate_id
          JOIN affiliate_accounts aa ON aa.id = da.affiliate_account_id
          WHERE dsa.id = diviner_service_affiliate_rate_history.assignment_id
            AND dsa.affiliate_type = 'diviner_affiliate'
            AND aa.user_id = auth.uid()
        )
      )
    $p$;
  END IF;

  -- admin_action_log: service_role ALL
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_action_log'
      AND policyname='svc_admin_action_log') THEN
    EXECUTE $p$ CREATE POLICY "svc_admin_action_log" ON admin_action_log
      FOR ALL TO service_role USING (true) WITH CHECK (true) $p$;
  END IF;

  -- admin_action_log: authenticated admins can SELECT their org's log
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_action_log'
      AND policyname='admin_sees_action_log') THEN
    EXECUTE $p$
      CREATE POLICY "admin_sees_action_log" ON admin_action_log
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
      )
    $p$;
  END IF;
END
$plpol$;

-- ─── 8. End-of-migration sanity check ──────────────────────────────────────
DO $check$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='diviner_service_affiliate_rate_history') THEN
    RAISE EXCEPTION 'diviner_service_affiliate_rate_history was not created';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='admin_action_log') THEN
    RAISE EXCEPTION 'admin_action_log was not created';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='bookings'
      AND column_name='commission_source_assignment_id') THEN
    RAISE EXCEPTION 'bookings.commission_source_assignment_id was not added';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='campaign_conversions'
      AND column_name='rate_type_used') THEN
    RAISE EXCEPTION 'campaign_conversions.rate_type_used was not added';
  END IF;
END
$check$;
`;
