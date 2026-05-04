// Bundled mirror of supabase/migrations/20260430000002_affiliate_phase_1_5_general.sql
// Keep byte-aligned with the canonical .sql file.

export const MIGRATION_SQL = `
-- ============================================================================
-- Affiliate Phase 1.5 — General-product affiliate commissions schema
--
-- Single additive migration covering every column, constraint, and RLS
-- extension Phase 1.5 needs:
--   1. service_templates: is_general flag (backfilled from slug pattern),
--      affiliate_program_enabled toggle, commission_type + commission_value.
--   2. affiliate_campaigns: owner_affiliate_account_id (account-direct
--      ownership for general campaigns), 'general' added to
--      owner_affiliate_type CHECK, owner_consistency CHECK tightened.
--   3. bookings: commission_source_template_id (parallel stamp source).
--   4. campaign_conversions: affiliate_account_id (always populated; backfill
--      existing per-diviner rows by resolving junction → account).
--   5. RLS on affiliate_campaigns: SELECT/INSERT/UPDATE policies extended
--      to recognize 'general' campaigns owned via owner_affiliate_account_id.
--   6. RLS on campaign_conversions: parallel SELECT policy for general credits.
--
-- Idempotent. Sanity-checked at end. Run via /admin/db/migrations.
--
-- ── Spec deviation, recorded for the §12 changelog ─────────────────────────
-- Spec §10 Phase 1.5 (and Task 01 plan) wrote the commission_type CHECK as
--   ('percentage','flat')
-- but the v2 stamp pipeline only accepts ('percent','flat') — see
--   20260424000010_affiliate_commission_v2_additive.sql:41 for the
--   bookings.commission_rate_type_stamp CHECK, and
--   20260421000001_affiliate_service_assignments.sql:30 for the
--   per-diviner assignment CHECK.
-- 'percentage' is a System A leftover; v2 standardized on 'percent'. Keeping
-- the spec wording would have broken every general-product booking at insert
-- time. Deviation approved 2026-04-30. Spec §10 wording will be aligned in
-- the Task 08 sign-off commit.
-- ============================================================================

BEGIN;

-- ─── 1a. service_templates: introduce is_general flag ─────────────────────
-- Migration 20260421000002_add_general_service_templates.sql cloned the 19
-- base templates with \`general-\` slug prefix only — no flag column. Add the
-- flag here and backfill from the slug pattern; keep slug as the secondary
-- signal but make is_general the authoritative discriminator.

ALTER TABLE service_templates
  ADD COLUMN IF NOT EXISTS is_general BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE service_templates
   SET is_general = TRUE
 WHERE slug LIKE 'general-%'
   AND is_general = FALSE;

CREATE INDEX IF NOT EXISTS idx_service_templates_is_general
  ON service_templates (is_general)
  WHERE is_general = TRUE;

-- ─── 1b. service_templates: per-template commission config ─────────────────
-- 'percent'/'flat' to match the v2 stamp enum; see deviation note above.
ALTER TABLE service_templates
  ADD COLUMN IF NOT EXISTS commission_type TEXT
    CHECK (commission_type IS NULL OR commission_type IN ('percent','flat')),
  ADD COLUMN IF NOT EXISTS commission_value NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS affiliate_program_enabled BOOLEAN NOT NULL DEFAULT FALSE;
-- Only meaningful when is_general = true. Diviner-specific rows leave
-- these NULL/FALSE.

-- ─── 2. affiliate_campaigns: account-direct ownership for non-junction ─────
ALTER TABLE affiliate_campaigns
  ADD COLUMN IF NOT EXISTS owner_affiliate_account_id UUID
    REFERENCES affiliate_accounts(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_affiliate_campaigns_owner_account
  ON affiliate_campaigns (owner_affiliate_account_id)
  WHERE owner_affiliate_account_id IS NOT NULL;

-- Allow 'general' as a third value of owner_affiliate_type
ALTER TABLE affiliate_campaigns
  DROP CONSTRAINT IF EXISTS affiliate_campaigns_owner_affiliate_type_check;
ALTER TABLE affiliate_campaigns
  ADD CONSTRAINT affiliate_campaigns_owner_affiliate_type_check
  CHECK (owner_affiliate_type IS NULL
      OR owner_affiliate_type IN ('diviner_affiliate','social_advocate','general'));

-- Tighten owner_consistency to require account_id when type='general'
ALTER TABLE affiliate_campaigns
  DROP CONSTRAINT IF EXISTS affiliate_campaigns_owner_consistency;
ALTER TABLE affiliate_campaigns
  ADD CONSTRAINT affiliate_campaigns_owner_consistency CHECK (
    (owner_type = 'diviner'
      AND owner_affiliate_id IS NULL
      AND owner_affiliate_account_id IS NULL
      AND owner_affiliate_type IS NULL)
    OR (owner_type = 'affiliate'
      AND owner_affiliate_type IN ('diviner_affiliate','social_advocate')
      AND owner_affiliate_id IS NOT NULL
      AND owner_affiliate_account_id IS NULL
      AND source_assignment_id IS NOT NULL)
    OR (owner_type = 'affiliate'
      AND owner_affiliate_type = 'general'
      AND owner_affiliate_id IS NULL
      AND owner_affiliate_account_id IS NOT NULL
      AND source_assignment_id IS NULL
      AND destination_service_template_id IS NOT NULL)
  );

-- ─── 2b. tracking_links: relax diviner_id NOT NULL ────────────────────────
-- General-program campaigns have no specific diviner (the matcher picks
-- one at booking time). The original tracking_links table from
-- 20260331000001_initial_schema.sql declared diviner_id NOT NULL — that
-- predated Phase 1.5. Drop the constraint so general campaigns can insert
-- their tracking_links row. FK to diviners(id) ON DELETE CASCADE is kept;
-- NULL passes FK checks since they only enforce on non-null values.
-- Per-diviner campaigns continue to populate diviner_id as before.
ALTER TABLE tracking_links
  ALTER COLUMN diviner_id DROP NOT NULL;

-- ─── 3. bookings: parallel stamp source for general program ────────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS commission_source_template_id UUID
    REFERENCES service_templates(id) ON DELETE SET NULL;
-- Parallel to commission_source_assignment_id; populated by the general-
-- path branch of resolveStampForBooking. Mutually exclusive with
-- commission_source_assignment_id in practice (one set, the other NULL),
-- though the schema doesn't enforce it; the credit code disambiguates by
-- checking commission_source_assignment_id IS NULL first.

-- ─── 4. campaign_conversions: account-direct attribution ───────────────────
ALTER TABLE campaign_conversions
  ADD COLUMN IF NOT EXISTS affiliate_account_id UUID
    REFERENCES affiliate_accounts(id);

-- Time column is \`converted_at\` (per 20260413000005_affiliate_campaigns.sql:44),
-- NOT \`created_at\`. Task plan inherited the wrong name; corrected here to
-- match live schema. Caught by 2026-04-30 runner failure (PG 42703).
CREATE INDEX IF NOT EXISTS idx_campaign_conversions_affiliate_account
  ON campaign_conversions (affiliate_account_id, converted_at DESC)
  WHERE affiliate_account_id IS NOT NULL;

-- Backfill: resolve junction → account for per-diviner credits so
-- account-level rollups can skip the junction join.
UPDATE campaign_conversions c
   SET affiliate_account_id = da.affiliate_account_id
  FROM diviner_affiliates da
 WHERE c.affiliate_account_id IS NULL
   AND c.affiliate_id = da.id
   AND c.affiliate_type = 'diviner_affiliate';

-- ─── 5. RLS on affiliate_campaigns: extend SELECT/INSERT/UPDATE to account ─
DROP POLICY IF EXISTS affiliate_sees_own_campaigns ON affiliate_campaigns;
CREATE POLICY affiliate_sees_own_campaigns
  ON affiliate_campaigns FOR SELECT
  USING (
    (owner_type = 'affiliate'
      AND owner_affiliate_type = 'diviner_affiliate'
      AND owner_affiliate_id IN (SELECT public.current_affiliate_junction_ids()))
    OR
    (owner_type = 'affiliate'
      AND owner_affiliate_type = 'general'
      AND owner_affiliate_account_id = public.current_affiliate_account_id())
  );

DROP POLICY IF EXISTS affiliate_inserts_own_campaigns ON affiliate_campaigns;
CREATE POLICY affiliate_inserts_own_campaigns
  ON affiliate_campaigns FOR INSERT
  WITH CHECK (
    (owner_affiliate_type = 'diviner_affiliate'
      AND owner_affiliate_id IN (SELECT public.current_affiliate_junction_ids()))
    OR
    (owner_affiliate_type = 'general'
      AND owner_affiliate_account_id = public.current_affiliate_account_id())
  );

DROP POLICY IF EXISTS affiliate_updates_own_campaigns ON affiliate_campaigns;
CREATE POLICY affiliate_updates_own_campaigns
  ON affiliate_campaigns FOR UPDATE
  USING (
    (owner_affiliate_type = 'diviner_affiliate'
      AND owner_affiliate_id IN (SELECT public.current_affiliate_junction_ids()))
    OR
    (owner_affiliate_type = 'general'
      AND owner_affiliate_account_id = public.current_affiliate_account_id())
  )
  WITH CHECK (
    (owner_affiliate_type = 'diviner_affiliate'
      AND owner_affiliate_id IN (SELECT public.current_affiliate_junction_ids()))
    OR
    (owner_affiliate_type = 'general'
      AND owner_affiliate_account_id = public.current_affiliate_account_id())
  );

-- ─── 5b. admin_action_log: extensions for bulk template-rate updates ─────
-- Phase 1.5 introduces a bulk endpoint at /api/admin/service-templates/
-- bulk-set-commission that updates many rows in one shot. Three small
-- changes to admin_action_log so the bulk action can be audited:
--   (a) action_kind enum gains 'service_templates_bulk_commission_update'
--   (b) target_resource_id loses NOT NULL (bulk actions hit many rows)
--   (c) new payload JSONB column carries structured action params
-- All idempotent; existing rows pass the new CHECK unchanged.

ALTER TABLE admin_action_log
  ALTER COLUMN target_resource_id DROP NOT NULL;

ALTER TABLE admin_action_log
  ADD COLUMN IF NOT EXISTS payload JSONB;

ALTER TABLE admin_action_log
  DROP CONSTRAINT IF EXISTS admin_action_log_action_kind_check;
ALTER TABLE admin_action_log
  ADD CONSTRAINT admin_action_log_action_kind_check
  CHECK (action_kind IN (
    'affiliate_assignment_revoked',
    'affiliate_campaign_archived',
    'affiliate_conversion_reversed',
    'service_templates_bulk_commission_update'
  ));

-- ─── 6. RLS on campaign_conversions: add general-account SELECT ────────────
-- The existing affiliate_sees_own_conversions policy from 20260427000004
-- covers per-diviner credits via the junction. Add a parallel policy for
-- general credits so an authed affiliate sees their own general-program
-- conversions. Both policies OR together at evaluation time — no need to
-- drop the existing one.

DROP POLICY IF EXISTS affiliate_sees_own_conversions_general ON campaign_conversions;
CREATE POLICY affiliate_sees_own_conversions_general
  ON campaign_conversions FOR SELECT
  USING (
    affiliate_type = 'general'
    AND affiliate_account_id = public.current_affiliate_account_id()
  );

-- ─── 7. End-of-migration sanity check ──────────────────────────────────────
DO $check$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='service_templates'
      AND column_name='is_general'
  ) THEN
    RAISE EXCEPTION 'service_templates.is_general not added';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='service_templates'
      AND column_name='affiliate_program_enabled'
  ) THEN
    RAISE EXCEPTION 'service_templates.affiliate_program_enabled not added';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='affiliate_campaigns'
      AND column_name='owner_affiliate_account_id'
  ) THEN
    RAISE EXCEPTION 'affiliate_campaigns.owner_affiliate_account_id not added';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='bookings'
      AND column_name='commission_source_template_id'
  ) THEN
    RAISE EXCEPTION 'bookings.commission_source_template_id not added';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='campaign_conversions'
      AND column_name='affiliate_account_id'
  ) THEN
    RAISE EXCEPTION 'campaign_conversions.affiliate_account_id not added';
  END IF;
  -- Backfill sanity: if seed migration 20260421000002 ran (cloning the
  -- 19 base templates with general- slug), is_general must have flipped
  -- to TRUE on at least one row.
  IF EXISTS (SELECT 1 FROM service_templates WHERE slug LIKE 'general-%')
     AND NOT EXISTS (SELECT 1 FROM service_templates WHERE is_general = TRUE) THEN
    RAISE EXCEPTION 'is_general backfill from slug pattern produced 0 rows';
  END IF;
  -- tracking_links.diviner_id should now be nullable (general campaigns).
  IF (SELECT is_nullable FROM information_schema.columns
       WHERE table_schema='public' AND table_name='tracking_links'
         AND column_name='diviner_id') <> 'YES' THEN
    RAISE EXCEPTION 'tracking_links.diviner_id NOT NULL was not dropped';
  END IF;
  -- admin_action_log.payload column added.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='admin_action_log'
      AND column_name='payload'
  ) THEN
    RAISE EXCEPTION 'admin_action_log.payload not added';
  END IF;
  -- admin_action_log.target_resource_id should now be nullable.
  IF (SELECT is_nullable FROM information_schema.columns
       WHERE table_schema='public' AND table_name='admin_action_log'
         AND column_name='target_resource_id') <> 'YES' THEN
    RAISE EXCEPTION 'admin_action_log.target_resource_id NOT NULL was not dropped';
  END IF;
END
$check$;

COMMIT;
`;
