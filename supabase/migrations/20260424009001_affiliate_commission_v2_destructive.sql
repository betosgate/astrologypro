-- ============================================================================
-- Task 01b — Affiliate Commission v2 (Destructive)
-- Sprint: docs/tasks/2026-04-24/affiliate-commission-v2/01-schema-migrations.md
-- Spec:   docs/specs/affiliate-commission-system.md (v1.2 §9)
--
-- Drops System A tables and trims status enums to match the v1.2 model.
-- Does NOT drop affiliate_campaigns.commission_*_snapshot columns — they
-- still have writers in the advocate service (out of scope for this
-- sprint). The CHECK that REQUIRED them on affiliate-owned rows is
-- relaxed here so System B campaigns no longer need to populate them.
--
-- Run AFTER all of these have shipped:
--   - 01a additive migration (20260424000010) ← prerequisite
--   - Task 02 (System A writers retired)
--   - Task 04 (booking stamp + creditAffiliateConversion live-rate model)
--   - Task 07 Phase A (last 5 admin endpoints rewired off System A)
--
-- Idempotent. Safe to re-run. Each step has a guard so it skips work
-- already done.
-- ============================================================================

BEGIN;

-- ─── 1. Defensive data backfill: collapse 'suspended' into 'blocked' ───────
-- Should be a no-op on dev (project not live yet) but cheap insurance.
UPDATE affiliate_accounts
   SET status = 'blocked',
       updated_at = NOW()
 WHERE status = 'suspended';

-- ─── 2. Trim affiliate_accounts.status enum to (unclaimed | active | blocked)
-- The 2026-04-23 migration declared it as 'unclaimed,active,suspended,blocked'
-- so we DROP IF EXISTS to be name-agnostic + readd the trimmed version.
ALTER TABLE affiliate_accounts
  DROP CONSTRAINT IF EXISTS affiliate_accounts_status_check;

ALTER TABLE affiliate_accounts
  ADD CONSTRAINT affiliate_accounts_status_check
  CHECK (status IN ('unclaimed', 'active', 'blocked'));

-- ─── 3. Defensive data backfill: trim affiliate_campaigns.status values ────
-- Pre-existing draft → active (drafts shouldn't be auto-archived; if a
-- diviner had a draft they wanted to keep editing, status='active' is
-- the closest non-destructive landing).
-- Pre-existing completed → archived (matches the new soft-delete semantics).
UPDATE affiliate_campaigns
   SET status = 'active',
       updated_at = NOW()
 WHERE status = 'draft';

UPDATE affiliate_campaigns
   SET status = 'archived',
       updated_at = NOW()
 WHERE status = 'completed';

-- ─── 4. Trim affiliate_campaigns.status enum ───────────────────────────────
-- 01a extended it to include 'archived'; 01b removes the dead values.
ALTER TABLE affiliate_campaigns
  DROP CONSTRAINT IF EXISTS affiliate_campaigns_status_check;

ALTER TABLE affiliate_campaigns
  ADD CONSTRAINT affiliate_campaigns_status_check
  CHECK (status IN ('active', 'paused', 'archived', 'expired'));

-- ─── 5. Relax owner_consistency CHECK (drop snapshot requirement) ──────────
-- Per spec v1.2, the booking stamp is the authoritative rate source.
-- The campaign snapshot is no longer required to be non-NULL on
-- affiliate-owned rows. We keep the column for advocate-service
-- backward-compat — drop will land in a future cross-service cleanup.
ALTER TABLE affiliate_campaigns
  DROP CONSTRAINT IF EXISTS affiliate_campaigns_owner_consistency;

ALTER TABLE affiliate_campaigns
  ADD CONSTRAINT affiliate_campaigns_owner_consistency CHECK (
    (owner_type = 'diviner'
      AND owner_affiliate_id IS NULL
      AND owner_affiliate_type IS NULL)
    OR (owner_type = 'affiliate'
      AND owner_affiliate_id IS NOT NULL
      AND owner_affiliate_type IS NOT NULL
      AND source_assignment_id IS NOT NULL)
  );

-- ─── 6. Drop System A tables ───────────────────────────────────────────────
-- Order: child references first. CASCADE handles any FK we missed.
-- All references in src/ have been removed by Task 02 + Task 07 Phase A;
-- a `git grep` after this commit returns only doc-comments.

DROP TABLE IF EXISTS affiliate_commission_history CASCADE;
DROP TABLE IF EXISTS affiliate_commissions       CASCADE;
DROP TABLE IF EXISTS affiliate_payouts           CASCADE;
DROP TABLE IF EXISTS affiliate_payout_items      CASCADE;
DROP TABLE IF EXISTS affiliate_clicks            CASCADE;
DROP TABLE IF EXISTS affiliate_referral_links    CASCADE;

-- ─── 7. End-of-migration sanity check ──────────────────────────────────────
DO $check$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='affiliate_commissions') THEN
    RAISE EXCEPTION 'affiliate_commissions still exists after destructive migration';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='affiliate_referral_links') THEN
    RAISE EXCEPTION 'affiliate_referral_links still exists after destructive migration';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='affiliate_payouts') THEN
    RAISE EXCEPTION 'affiliate_payouts still exists after destructive migration';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='affiliate_clicks') THEN
    RAISE EXCEPTION 'affiliate_clicks still exists after destructive migration';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='affiliate_commission_history') THEN
    RAISE EXCEPTION 'affiliate_commission_history still exists after destructive migration';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM affiliate_accounts
    WHERE status NOT IN ('unclaimed','active','blocked')
  ) THEN
    RAISE EXCEPTION 'affiliate_accounts.status enum trim left invalid rows';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM affiliate_campaigns
    WHERE status NOT IN ('active','paused','archived','expired')
  ) THEN
    RAISE EXCEPTION 'affiliate_campaigns.status enum trim left invalid rows';
  END IF;
END
$check$;

COMMIT;
