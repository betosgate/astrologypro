-- ============================================================================
-- Affiliate-side SELECT on diviner_affiliates (junction visibility)
-- Sprint: docs/tasks/2026-04-24/affiliate-commission-v2/08-tests-rls-signoff.md
--
-- Why this exists:
--   The 20260427000002 migration aligned RLS on the CHILD tables
--   (diviner_service_affiliates, affiliate_campaigns, campaign_clicks,
--   campaign_conversions). Those policies all resolve auth.uid()
--   through `diviner_affiliates → affiliate_accounts → user_id`.
--
--   Problem: `diviner_affiliates` itself has RLS enabled and only the
--   DIVINER-side select policy exists (`diviner_own_affiliates`). The
--   AFFILIATE side has no policy, so when an authed affiliate session
--   does `SELECT FROM diviner_affiliates WHERE …`, RLS returns zero
--   rows. That makes every IN-subquery in the child policies empty, so
--   the affiliate can't see anything anywhere.
--
--   The Task 08 RLS test suite caught this — child policies appeared
--   correct but still returned 0 rows.
--
-- Fix:
--   Add an affiliate-side SELECT policy on diviner_affiliates that
--   resolves `affiliate_account_id → user_id`. `affiliate_accounts`
--   already has the matching `account_self_select` policy (from
--   20260423000001), so the chain is unbroken.
--
-- Idempotent. Safe to re-run.
-- ============================================================================

BEGIN;

DROP POLICY IF EXISTS "affiliate_sees_own_junctions" ON diviner_affiliates;

CREATE POLICY "affiliate_sees_own_junctions" ON diviner_affiliates
  FOR SELECT
  USING (
    affiliate_account_id IN (
      SELECT id FROM affiliate_accounts WHERE user_id = auth.uid()
    )
  );

-- ─── Sanity ────────────────────────────────────────────────────────────────
DO $check$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'diviner_affiliates'
      AND policyname = 'affiliate_sees_own_junctions'
  ) THEN
    RAISE EXCEPTION 'affiliate_sees_own_junctions policy not created';
  END IF;
END
$check$;

COMMIT;
