-- ============================================================
-- Task 01: Perennial Mandalism Entitlement Scope Rules
-- Makes entitlement explicit via a governance table instead of
-- leaving it implied in page/component logic.
-- build: 2026-04-13
-- ============================================================

-- Entitlement configuration table — admin-configurable per membership type.
-- Defines which chart types and how many profiles each membership tier covers.
CREATE TABLE IF NOT EXISTS pm_entitlement_rules (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_type             TEXT        NOT NULL UNIQUE,
  natal_chart_enabled         BOOLEAN     NOT NULL DEFAULT true,
  relationship_chart_enabled  BOOLEAN     NOT NULL DEFAULT true,
  monthly_transit_enabled     BOOLEAN     NOT NULL DEFAULT true,
  family_dynamic_enabled      BOOLEAN     NOT NULL DEFAULT true,
  -- max family profiles covered under this entitlement (matches plan tier)
  max_family_profiles         INTEGER     NOT NULL DEFAULT 5,
  -- which membership_status values qualify for chart generation
  eligible_statuses           TEXT[]      NOT NULL DEFAULT ARRAY['active'],
  description                 TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed: Perennial Mandalism full entitlement bundle
INSERT INTO pm_entitlement_rules (
  membership_type,
  natal_chart_enabled,
  relationship_chart_enabled,
  monthly_transit_enabled,
  family_dynamic_enabled,
  max_family_profiles,
  eligible_statuses,
  description
)
VALUES (
  'perennial_mandalism',
  true,
  true,
  true,
  true,
  5,
  ARRAY['active'],
  'Full Perennial Mandalism chart entitlement bundle — natal, relationship, family dynamics, and monthly transits for all eligible profiles'
)
ON CONFLICT (membership_type) DO NOTHING;

-- RLS: any authenticated user can read entitlement rules (used in UI to show eligibility).
-- Only service_role can write (admin config changes).
ALTER TABLE pm_entitlement_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_pm_entitlement_rules"
  ON pm_entitlement_rules FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_role_pm_entitlement_rules"
  ON pm_entitlement_rules FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── Helper function ──────────────────────────────────────────────────────────
-- Returns TRUE if the given community_members row is entitled to automated
-- chart generation based on the pm_entitlement_rules table.
-- Used by generation APIs and cron to gate execution.
CREATE OR REPLACE FUNCTION is_pm_chart_entitled(p_member_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM community_members cm
    JOIN pm_entitlement_rules er
      ON er.membership_type = cm.membership_type::TEXT
    WHERE cm.id = p_member_id
      AND cm.membership_status = ANY(er.eligible_statuses)
  );
$$;

-- Returns the entitlement rule row for a given member (or NULL if not entitled).
CREATE OR REPLACE FUNCTION get_pm_entitlement(p_member_id UUID)
RETURNS pm_entitlement_rules
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT er.*
  FROM community_members cm
  JOIN pm_entitlement_rules er
    ON er.membership_type = cm.membership_type::TEXT
  WHERE cm.id = p_member_id
    AND cm.membership_status = ANY(er.eligible_statuses)
  LIMIT 1;
$$;

-- Index for fast entitlement lookup
CREATE INDEX IF NOT EXISTS idx_pm_entitlement_rules_type
  ON pm_entitlement_rules(membership_type);
