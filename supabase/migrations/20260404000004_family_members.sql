-- Family members for community (Perennial Mandalism family plan)
-- Each community member on a family plan can add up to 5 family members.

CREATE TABLE IF NOT EXISTS community_family_members (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID        NOT NULL REFERENCES community_members(id) ON DELETE CASCADE,
  full_name       TEXT        NOT NULL,
  date_of_birth   DATE        NOT NULL,
  birth_time      TIME,                    -- optional: HH:MM local time
  birth_city      TEXT,
  birth_country   TEXT,
  birth_lat       DECIMAL(9,6),
  birth_lng       DECIMAL(9,6),
  age_group       TEXT        NOT NULL DEFAULT 'adult'
                              CHECK (age_group IN ('child', 'adult')),  -- child = <14
  natal_chart     JSONB,                   -- stored chart data (populated by chart cron)
  chart_updated_at TIMESTAMPTZ,
  relationship    TEXT,                    -- e.g. "Spouse", "Child", "Parent"
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE community_family_members ENABLE ROW LEVEL SECURITY;

-- Members can only see/edit their own family records
CREATE POLICY "member_own_family" ON community_family_members
  FOR ALL TO authenticated
  USING (
    member_id IN (
      SELECT id FROM community_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    member_id IN (
      SELECT id FROM community_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_family" ON community_family_members
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS family_members_member_idx ON community_family_members (member_id);
