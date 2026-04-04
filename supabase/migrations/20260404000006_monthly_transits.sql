-- Monthly transit reports for community family members.
-- Generated once per month by cron, stored per person.

CREATE TABLE IF NOT EXISTS monthly_transits (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID       NOT NULL REFERENCES community_family_members(id) ON DELETE CASCADE,
  month           TEXT        NOT NULL,  -- YYYY-MM
  transit_data    JSONB       NOT NULL,  -- array of {planet, sign, aspects to natal}
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(family_member_id, month)
);

ALTER TABLE monthly_transits ENABLE ROW LEVEL SECURITY;

-- Members can read their own family's transits
CREATE POLICY "member_own_transits" ON monthly_transits
  FOR SELECT TO authenticated
  USING (
    family_member_id IN (
      SELECT cfm.id FROM community_family_members cfm
      JOIN community_members cm ON cm.id = cfm.member_id
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_transits" ON monthly_transits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS monthly_transits_member_month_idx ON monthly_transits (family_member_id, month);
