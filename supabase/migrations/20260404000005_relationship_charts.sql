-- Stores pairwise synastry / relationship charts between community family members.
-- person_a_id and person_b_id can be community_family_member IDs.
-- The primary member themselves is stored as a family member record too
-- (or we reference community_members.id directly for the primary).

CREATE TABLE IF NOT EXISTS relationship_charts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID        NOT NULL REFERENCES community_members(id) ON DELETE CASCADE,
  person_a_id     UUID        NOT NULL REFERENCES community_family_members(id) ON DELETE CASCADE,
  person_b_id     UUID        NOT NULL REFERENCES community_family_members(id) ON DELETE CASCADE,
  chart_data      JSONB,               -- synastry aspects + planet crossings
  generated_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(person_a_id, person_b_id)
);

ALTER TABLE relationship_charts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_own_relationship_charts" ON relationship_charts
  FOR ALL TO authenticated
  USING (
    member_id IN (SELECT id FROM community_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    member_id IN (SELECT id FROM community_members WHERE user_id = auth.uid())
  );

CREATE POLICY "service_role_relationship_charts" ON relationship_charts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS relationship_charts_member_idx ON relationship_charts (member_id);
CREATE INDEX IF NOT EXISTS relationship_charts_a_idx ON relationship_charts (person_a_id);
CREATE INDEX IF NOT EXISTS relationship_charts_b_idx ON relationship_charts (person_b_id);
