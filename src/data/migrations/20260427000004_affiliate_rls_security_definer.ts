// Bundled mirror of supabase/migrations/20260427000004_affiliate_rls_security_definer.sql
// Keep byte-aligned with the canonical .sql file.

export const MIGRATION_SQL = `
-- ============================================================================
-- Affiliate RLS — break the policy cycle with a SECURITY DEFINER helper
--
-- Problem caught after 20260427000002 + 20260427000003 landed:
--   Postgres raises "infinite recursion detected in policy for relation
--   diviner_affiliates" whenever ANY authed session queries the
--   affiliate child tables.
--
-- Cycle:
--   affiliate_accounts.diviner_sees_linked_accounts → queries diviner_affiliates
--   diviner_affiliates.affiliate_sees_own_junctions → queries affiliate_accounts
--   ↻ recursion
--
-- Fix: SECURITY DEFINER helpers that bypass inner RLS, then rewrite
-- every affiliate-side policy to call them.
--
-- Idempotent. Safe to re-run.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.current_affiliate_junction_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $fn$
  SELECT da.id
  FROM diviner_affiliates da
  JOIN affiliate_accounts aa ON aa.id = da.affiliate_account_id
  WHERE aa.user_id = auth.uid()
$fn$;

REVOKE ALL ON FUNCTION public.current_affiliate_junction_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_affiliate_junction_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_affiliate_junction_ids() TO service_role;

DROP POLICY IF EXISTS diviner_service_affiliates_select_affiliate
  ON diviner_service_affiliates;

CREATE POLICY diviner_service_affiliates_select_affiliate
  ON diviner_service_affiliates FOR SELECT
  USING (
    affiliate_type = 'diviner_affiliate'
    AND affiliate_id IN (SELECT public.current_affiliate_junction_ids())
  );

DROP POLICY IF EXISTS affiliate_sees_own_campaigns ON affiliate_campaigns;
CREATE POLICY affiliate_sees_own_campaigns
  ON affiliate_campaigns FOR SELECT
  USING (
    owner_type = 'affiliate'
    AND owner_affiliate_type = 'diviner_affiliate'
    AND owner_affiliate_id IN (SELECT public.current_affiliate_junction_ids())
  );

DROP POLICY IF EXISTS affiliate_inserts_own_campaigns ON affiliate_campaigns;
CREATE POLICY affiliate_inserts_own_campaigns
  ON affiliate_campaigns FOR INSERT
  WITH CHECK (
    owner_type = 'affiliate'
    AND owner_affiliate_type = 'diviner_affiliate'
    AND owner_affiliate_id IN (SELECT public.current_affiliate_junction_ids())
  );

DROP POLICY IF EXISTS affiliate_updates_own_campaigns ON affiliate_campaigns;
CREATE POLICY affiliate_updates_own_campaigns
  ON affiliate_campaigns FOR UPDATE
  USING (
    owner_type = 'affiliate'
    AND owner_affiliate_type = 'diviner_affiliate'
    AND owner_affiliate_id IN (SELECT public.current_affiliate_junction_ids())
  )
  WITH CHECK (
    owner_type = 'affiliate'
    AND owner_affiliate_type = 'diviner_affiliate'
    AND owner_affiliate_id IN (SELECT public.current_affiliate_junction_ids())
  );

DROP POLICY IF EXISTS affiliate_sees_own_clicks ON campaign_clicks;
CREATE POLICY affiliate_sees_own_clicks
  ON campaign_clicks FOR SELECT
  USING (
    affiliate_type = 'diviner_affiliate'
    AND affiliate_id IN (SELECT public.current_affiliate_junction_ids())
  );

DROP POLICY IF EXISTS affiliate_sees_own_conversions ON campaign_conversions;
CREATE POLICY affiliate_sees_own_conversions
  ON campaign_conversions FOR SELECT
  USING (
    affiliate_type = 'diviner_affiliate'
    AND affiliate_id IN (SELECT public.current_affiliate_junction_ids())
  );

CREATE OR REPLACE FUNCTION public.current_affiliate_account_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $fn$
  SELECT id FROM affiliate_accounts WHERE user_id = auth.uid() LIMIT 1
$fn$;

REVOKE ALL ON FUNCTION public.current_affiliate_account_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_affiliate_account_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_affiliate_account_id() TO service_role;

DROP POLICY IF EXISTS "affiliate_sees_own_junctions" ON diviner_affiliates;
CREATE POLICY "affiliate_sees_own_junctions" ON diviner_affiliates
  FOR SELECT
  USING (
    affiliate_account_id = public.current_affiliate_account_id()
  );

DO $check$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'current_affiliate_junction_ids'
  ) THEN
    RAISE EXCEPTION 'current_affiliate_junction_ids function not created';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'current_affiliate_account_id'
  ) THEN
    RAISE EXCEPTION 'current_affiliate_account_id function not created';
  END IF;
END
$check$;

COMMIT;
`;
