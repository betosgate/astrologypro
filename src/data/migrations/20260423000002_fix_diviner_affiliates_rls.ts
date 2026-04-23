export const MIGRATION_SQL = `
-- ============================================================================
-- Fix the pre-existing buggy diviner_own_affiliates RLS policy
--
-- Sprint: 2026-04-23 affiliate-identity-refactor (Task 01 follow-up)
--
-- The original policy (from 20260407000063_affiliate_commission.sql:150) was:
--
--     CREATE POLICY "diviner_own_affiliates" ON diviner_affiliates
--       FOR SELECT USING (auth.uid() = diviner_id)
--
-- This is wrong — \`diviner_affiliates.diviner_id\` is a \`diviners.id\`, not an
-- \`auth.users.id\`. The comparison never matches, so authed diviner sessions
-- see 0 rows of diviner_affiliates via RLS.
--
-- Previously harmless because all server reads go through service_role.
-- Breaks now because the 2026-04-23 \`diviner_sees_linked_accounts\` policy
-- on \`affiliate_accounts\` has an EXISTS subquery through \`diviner_affiliates\`
-- that runs under caller RLS and returns empty.
--
-- Fix: resolve through the diviners table the same way the correct pattern
-- on every other table does. Additive — no schema changes, just a policy
-- rewrite. Idempotent via DROP POLICY IF EXISTS.
-- ============================================================================

DROP POLICY IF EXISTS "diviner_own_affiliates" ON diviner_affiliates;

CREATE POLICY "diviner_own_affiliates" ON diviner_affiliates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM diviners d
      WHERE d.id = diviner_affiliates.diviner_id
        AND d.user_id = auth.uid()
    )
  );
`;
