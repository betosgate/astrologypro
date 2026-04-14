-- ─────────────────────────────────────────────────────────────────────────────
-- user_portal_preferences
-- Stores each user's last visited portal so they are auto-redirected on login.
-- Universal — works for all roles, including multi-role users.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_portal_preferences (
  user_id     UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_portal_url TEXT    NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only the owning user can read/write their own preference row.
ALTER TABLE user_portal_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_portal_preferences_self"
  ON user_portal_preferences
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role bypasses RLS — used by the API routes.
-- (No extra policy needed; service role always bypasses RLS in Supabase.)

-- Index is implicit via PRIMARY KEY — no extra index needed.
