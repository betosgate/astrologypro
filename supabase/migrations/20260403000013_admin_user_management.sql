-- Admin user notes (admin-only; service_role access)
CREATE TABLE IF NOT EXISTS admin_user_notes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL,
  note        TEXT        NOT NULL,
  role        TEXT,
  created_by  TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Login history captured on every auth callback hit
CREATE TABLE IF NOT EXISTS user_login_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL,
  ip          TEXT,
  user_agent  TEXT,
  city        TEXT,
  country     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Block records (active block = most recent row has unblocked_at IS NULL)
CREATE TABLE IF NOT EXISTS user_blocks (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL,
  reason        TEXT,
  blocked_by    TEXT        NOT NULL,
  blocked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unblocked_at  TIMESTAMPTZ,
  unblocked_by  TEXT
);

CREATE INDEX IF NOT EXISTS admin_user_notes_user_id_idx ON admin_user_notes(user_id);
CREATE INDEX IF NOT EXISTS admin_user_notes_created_at_idx ON admin_user_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS user_login_logs_user_id_idx ON user_login_logs(user_id);
CREATE INDEX IF NOT EXISTS user_login_logs_created_at_idx ON user_login_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS user_blocks_user_id_idx ON user_blocks(user_id);

ALTER TABLE admin_user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_login_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks       ENABLE ROW LEVEL SECURITY;

-- Only service_role (admin client) can read/write these tables
CREATE POLICY "service_role_only" ON admin_user_notes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_only" ON user_login_logs  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_only" ON user_blocks       FOR ALL TO service_role USING (true) WITH CHECK (true);
