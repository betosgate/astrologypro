-- ============================================================================
-- Affiliate RLS — break the policy cycle with a SECURITY DEFINER helper
-- Sprint: docs/tasks/2026-04-24/affiliate-commission-v2/08-tests-rls-signoff.md
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
-- Fix:
--   Introduce a SECURITY DEFINER function `current_affiliate_junction_ids()`
--   that returns the set of `diviner_affiliates.id` rows where the
--   joined `affiliate_accounts.user_id = auth.uid()`. Inside its body
--   RLS is bypassed (SECURITY DEFINER runs as the function owner, not
--   the caller), so the join doesn't re-trigger any policy.
--
--   Then rewrite every affiliate-side policy from 20260427000002 +
--   20260427000003 to call the function, removing the inner subqueries
--   that referenced the RLS-protected tables.
--
-- Idempotent. Safe to re-run.
-- ============================================================================

BEGIN;

-- ─── 1. SECURITY DEFINER helper ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.current_affiliate_junction_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT da.id
  FROM diviner_affiliates da
  JOIN affiliate_accounts aa ON aa.id = da.affiliate_account_id
  WHERE aa.user_id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.current_affiliate_junction_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_affiliate_junction_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_affiliate_junction_ids() TO service_role;

-- ─── 2. Rewrite diviner_service_affiliates affiliate SELECT ────────────────
DROP POLICY IF EXISTS diviner_service_affiliates_select_affiliate
  ON diviner_service_affiliates;

CREATE POLICY diviner_service_affiliates_select_affiliate
  ON diviner_service_affiliates FOR SELECT
  USING (
    affiliate_type = 'diviner_affiliate'
    AND affiliate_id IN (SELECT public.current_affiliate_junction_ids())
  );

-- ─── 3. Rewrite affiliate_campaigns SELECT + INSERT + UPDATE ───────────────
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

-- ─── 4. Rewrite campaign_clicks SELECT ─────────────────────────────────────
DROP POLICY IF EXISTS affiliate_sees_own_clicks ON campaign_clicks;
CREATE POLICY affiliate_sees_own_clicks
  ON campaign_clicks FOR SELECT
  USING (
    affiliate_type = 'diviner_affiliate'
    AND affiliate_id IN (SELECT public.current_affiliate_junction_ids())
  );

-- ─── 5. Rewrite campaign_conversions SELECT ────────────────────────────────
DROP POLICY IF EXISTS affiliate_sees_own_conversions ON campaign_conversions;
CREATE POLICY affiliate_sees_own_conversions
  ON campaign_conversions FOR SELECT
  USING (
    affiliate_type = 'diviner_affiliate'
    AND affiliate_id IN (SELECT public.current_affiliate_junction_ids())
  );

-- ─── 6. Rewrite diviner_affiliates affiliate SELECT (the cycle starter) ───
-- This one is the most important — even the helper-function-based form
-- here would re-cycle through itself. But we DON'T need a SELECT policy
-- on diviner_affiliates that calls the helper, because the helper
-- already encapsulates the auth.uid() resolution. We just need the
-- authed affiliate to see their junction row when they hit the table
-- directly. Resolve via affiliate_accounts.user_id WITHOUT going
-- through any RLS-trigger.
--
-- Trick: affiliate_accounts.id values that the function caller could
-- own are not RLS-gated when read INSIDE the SECURITY DEFINER function.
-- For a direct SELECT on diviner_affiliates we still need a non-cyclic
-- expression. The simplest is to compare affiliate_account_id to a
-- second SECURITY DEFINER function returning the user's account id.

CREATE OR REPLACE FUNCTION public.current_affiliate_account_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM affiliate_accounts WHERE user_id = auth.uid() LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.current_affiliate_account_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_affiliate_account_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_affiliate_account_id() TO service_role;

DROP POLICY IF EXISTS "affiliate_sees_own_junctions" ON diviner_affiliates;
CREATE POLICY "affiliate_sees_own_junctions" ON diviner_affiliates
  FOR SELECT
  USING (
    affiliate_account_id = public.current_affiliate_account_id()
  );

-- ─── 7. Sanity check ───────────────────────────────────────────────────────
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
