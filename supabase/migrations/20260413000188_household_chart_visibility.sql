-- ============================================================
-- Task 11: Household Chart Visibility and Shared Access Rules
-- Allows all users linked to the same Perennial Mandalism
-- household to read each other's natal charts, relationship
-- charts, and monthly transit reports.
--
-- Household boundary: community_family_members.member_id
-- A "household user" is a family member row that has user_id
-- set (they accepted the invite and have an auth account).
--
-- Rules:
--   READ  : any auth user whose user_id matches either the
--           primary community_members row OR a family member
--           row linked to the same member_id
--   WRITE : only the primary member (community_members.user_id)
--           may insert / update / delete records
--   No cross-household access under any circumstance.
-- ============================================================

-- ─── Helper function ──────────────────────────────────────────────────────────
-- Returns the community_members.id that the current auth user belongs to,
-- checking both the primary owner path and the household-user path.
CREATE OR REPLACE FUNCTION get_household_member_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Primary path: user is the account owner
  SELECT id
  FROM community_members
  WHERE user_id = auth.uid()

  UNION ALL

  -- Household path: user accepted a family invite
  SELECT member_id
  FROM community_family_members
  WHERE user_id = auth.uid()
    AND invite_status = 'accepted'

  LIMIT 1;
$$;

-- ─── community_family_members ─────────────────────────────────────────────────
-- Replace the single "FOR ALL" policy with separate read / write policies
-- so household users get read access without gaining write access.

DROP POLICY IF EXISTS "member_own_family"     ON community_family_members;

-- Household read: primary owner and all accepted household users can read
CREATE POLICY "household_read_family_members"
  ON community_family_members FOR SELECT TO authenticated
  USING (member_id = get_household_member_id());

-- Write-only for primary owner
CREATE POLICY "primary_insert_family_members"
  ON community_family_members FOR INSERT TO authenticated
  WITH CHECK (
    member_id IN (SELECT id FROM community_members WHERE user_id = auth.uid())
  );

CREATE POLICY "primary_update_family_members"
  ON community_family_members FOR UPDATE TO authenticated
  USING (
    member_id IN (SELECT id FROM community_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    member_id IN (SELECT id FROM community_members WHERE user_id = auth.uid())
  );

CREATE POLICY "primary_delete_family_members"
  ON community_family_members FOR DELETE TO authenticated
  USING (
    member_id IN (SELECT id FROM community_members WHERE user_id = auth.uid())
  );

-- Service role retains full access
-- (policy "service_role_family" from the original migration is unchanged)

-- ─── relationship_charts ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "member_own_relationship_charts" ON relationship_charts;

-- Household read: primary owner and accepted household users can read
CREATE POLICY "household_read_relationship_charts"
  ON relationship_charts FOR SELECT TO authenticated
  USING (member_id = get_household_member_id());

-- Write-only for primary owner
CREATE POLICY "primary_insert_relationship_charts"
  ON relationship_charts FOR INSERT TO authenticated
  WITH CHECK (
    member_id IN (SELECT id FROM community_members WHERE user_id = auth.uid())
  );

CREATE POLICY "primary_update_relationship_charts"
  ON relationship_charts FOR UPDATE TO authenticated
  USING (
    member_id IN (SELECT id FROM community_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    member_id IN (SELECT id FROM community_members WHERE user_id = auth.uid())
  );

CREATE POLICY "primary_delete_relationship_charts"
  ON relationship_charts FOR DELETE TO authenticated
  USING (
    member_id IN (SELECT id FROM community_members WHERE user_id = auth.uid())
  );

-- ─── monthly_transits ─────────────────────────────────────────────────────────
-- monthly_transits has no direct member_id; access is via family_member_id.
-- Replace the original "member_own_transits" SELECT policy with a household-aware one.

DROP POLICY IF EXISTS "member_own_transits" ON monthly_transits;

-- Household read: any user in the same household can read all household transits
CREATE POLICY "household_read_monthly_transits"
  ON monthly_transits FOR SELECT TO authenticated
  USING (
    family_member_id IN (
      SELECT id
      FROM community_family_members
      WHERE member_id = get_household_member_id()
    )
  );

-- ─── Index to support get_household_member_id() efficiently ──────────────────
-- idx_cfm_user_id already exists from migration 20260406000021; no duplicate needed.
