// Bundled mirror of supabase/migrations/20260427000002_affiliate_rls_v2_alignment.sql
// Keep byte-aligned with the canonical .sql file.

export const MIGRATION_SQL = `
-- ============================================================================
-- Affiliate Commission v2 — RLS alignment with the v2 identity model
-- Sprint: docs/tasks/2026-04-24/affiliate-commission-v2/08-tests-rls-signoff.md
-- Spec:   docs/specs/affiliate-commission-system.md (v1.2 §8)
--
-- Background:
--   Pre-v2 the convention was \`*.affiliate_id = auth.users.id\` directly.
--   v2 introduced \`affiliate_accounts\` (canonical identity) +
--   \`diviner_affiliates\` (one row per diviner-account partnership). All
--   the affiliate FKs (\`*.affiliate_id\`, \`affiliate_campaigns.owner_affiliate_id\`)
--   now point at \`diviner_affiliates.id\` (the junction), NOT \`auth.users.id\`.
--
--   Several SELECT policies were never updated for the new model and
--   either return zero rows for affiliates (broken policy) or are
--   missing entirely. The Task 08 RLS test suite caught this.
--
--   The API is unaffected because every server route uses \`service_role\`
--   which bypasses RLS. But spec §8 promises affiliates can SELECT their
--   own rows via the auth client too — that promise was unfulfilled
--   until this migration.
--
-- Tables fixed (SELECT FOR affiliates):
--   - diviner_service_affiliates       (replaces broken policy)
--   - affiliate_campaigns              (adds policy + affiliate INSERT/UPDATE)
--   - campaign_clicks                  (adds policy)
--   - campaign_conversions             (adds policy)
--
-- Idempotent. Safe to re-run.
-- ============================================================================

BEGIN;

-- ─── 1. diviner_service_affiliates: replace broken affiliate SELECT ────────
DROP POLICY IF EXISTS diviner_service_affiliates_select_affiliate
  ON diviner_service_affiliates;

CREATE POLICY diviner_service_affiliates_select_affiliate
  ON diviner_service_affiliates FOR SELECT
  USING (
    affiliate_type = 'diviner_affiliate'
    AND affiliate_id IN (
      SELECT da.id
      FROM diviner_affiliates da
      JOIN affiliate_accounts aa ON aa.id = da.affiliate_account_id
      WHERE aa.user_id = auth.uid()
    )
  );

-- ─── 2. affiliate_campaigns: add affiliate SELECT + write policies ─────────
-- (diviner-side policies remain unchanged; this is purely additive for
-- affiliates.)

DROP POLICY IF EXISTS affiliate_sees_own_campaigns ON affiliate_campaigns;
CREATE POLICY affiliate_sees_own_campaigns
  ON affiliate_campaigns FOR SELECT
  USING (
    owner_type = 'affiliate'
    AND owner_affiliate_type = 'diviner_affiliate'
    AND owner_affiliate_id IN (
      SELECT da.id
      FROM diviner_affiliates da
      JOIN affiliate_accounts aa ON aa.id = da.affiliate_account_id
      WHERE aa.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS affiliate_inserts_own_campaigns ON affiliate_campaigns;
CREATE POLICY affiliate_inserts_own_campaigns
  ON affiliate_campaigns FOR INSERT
  WITH CHECK (
    owner_type = 'affiliate'
    AND owner_affiliate_type = 'diviner_affiliate'
    AND owner_affiliate_id IN (
      SELECT da.id
      FROM diviner_affiliates da
      JOIN affiliate_accounts aa ON aa.id = da.affiliate_account_id
      WHERE aa.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS affiliate_updates_own_campaigns ON affiliate_campaigns;
CREATE POLICY affiliate_updates_own_campaigns
  ON affiliate_campaigns FOR UPDATE
  USING (
    owner_type = 'affiliate'
    AND owner_affiliate_type = 'diviner_affiliate'
    AND owner_affiliate_id IN (
      SELECT da.id
      FROM diviner_affiliates da
      JOIN affiliate_accounts aa ON aa.id = da.affiliate_account_id
      WHERE aa.user_id = auth.uid()
    )
  )
  WITH CHECK (
    owner_type = 'affiliate'
    AND owner_affiliate_type = 'diviner_affiliate'
    AND owner_affiliate_id IN (
      SELECT da.id
      FROM diviner_affiliates da
      JOIN affiliate_accounts aa ON aa.id = da.affiliate_account_id
      WHERE aa.user_id = auth.uid()
    )
  );

-- ─── 3. campaign_clicks: add affiliate SELECT ──────────────────────────────
DROP POLICY IF EXISTS affiliate_sees_own_clicks ON campaign_clicks;
CREATE POLICY affiliate_sees_own_clicks
  ON campaign_clicks FOR SELECT
  USING (
    affiliate_type = 'diviner_affiliate'
    AND affiliate_id IN (
      SELECT da.id
      FROM diviner_affiliates da
      JOIN affiliate_accounts aa ON aa.id = da.affiliate_account_id
      WHERE aa.user_id = auth.uid()
    )
  );

-- ─── 4. campaign_conversions: add affiliate SELECT ─────────────────────────
DROP POLICY IF EXISTS affiliate_sees_own_conversions ON campaign_conversions;
CREATE POLICY affiliate_sees_own_conversions
  ON campaign_conversions FOR SELECT
  USING (
    affiliate_type = 'diviner_affiliate'
    AND affiliate_id IN (
      SELECT da.id
      FROM diviner_affiliates da
      JOIN affiliate_accounts aa ON aa.id = da.affiliate_account_id
      WHERE aa.user_id = auth.uid()
    )
  );

-- ─── 5. End-of-migration sanity check ──────────────────────────────────────
DO $check$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'campaign_conversions'
      AND policyname = 'affiliate_sees_own_conversions'
  ) THEN
    RAISE EXCEPTION 'affiliate_sees_own_conversions policy not created';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'affiliate_campaigns'
      AND policyname = 'affiliate_sees_own_campaigns'
  ) THEN
    RAISE EXCEPTION 'affiliate_sees_own_campaigns policy not created';
  END IF;
END
$check$;

COMMIT;
`;
