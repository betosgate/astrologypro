-- ============================================================
-- Task 05: Natal Regeneration Audit Table
-- Records every user-initiated chart regeneration event for
-- accountability, support review, and admin override capability.
-- build: 2026-04-13
-- ============================================================

CREATE TABLE IF NOT EXISTS natal_regeneration_audit (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id      UUID        NOT NULL REFERENCES community_family_members(id) ON DELETE CASCADE,

  -- The auth.users row who clicked regenerate (primary member or admin)
  initiated_by_user_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Which correction attempt this was (1 = first retry, 2 = second, 3 = final)
  retry_number          INTEGER     NOT NULL DEFAULT 1,

  -- Which birth fields were changed before this regeneration was triggered
  fields_changed        TEXT[]      DEFAULT '{}',

  -- Snapshot of birth data before and after (for support investigation)
  old_date_of_birth     DATE,
  new_date_of_birth     DATE,
  old_birth_time        TIME,
  new_birth_time        TIME,
  old_birth_city        TEXT,
  new_birth_city        TEXT,

  -- Generation outcome
  succeeded             BOOLEAN     NOT NULL DEFAULT false,
  failure_reason        TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE natal_regeneration_audit ENABLE ROW LEVEL SECURITY;

-- Members can view their own family's regeneration history (shows remaining retries)
CREATE POLICY "member_view_own_regen_audit"
  ON natal_regeneration_audit FOR SELECT TO authenticated
  USING (
    family_member_id IN (
      SELECT cfm.id
      FROM community_family_members cfm
      JOIN community_members cm ON cm.id = cfm.member_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- Service role has full access (admin dashboard, cron operations)
CREATE POLICY "service_role_regen_audit"
  ON natal_regeneration_audit FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_nra_family_member
  ON natal_regeneration_audit(family_member_id);

CREATE INDEX IF NOT EXISTS idx_nra_initiated_by
  ON natal_regeneration_audit(initiated_by_user_id);

CREATE INDEX IF NOT EXISTS idx_nra_created_at
  ON natal_regeneration_audit(created_at DESC);
