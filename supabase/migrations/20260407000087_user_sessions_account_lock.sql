-- ─── User sessions tracking ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_sessions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_ref   TEXT,                          -- supabase session id or opaque ref
  device_type   TEXT,                          -- 'mobile' | 'desktop' | 'tablet'
  browser       TEXT,
  os            TEXT,
  ip_address    INET,
  country_code  TEXT,
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at    TIMESTAMPTZ,
  is_current    BOOLEAN     DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_us_user
  ON user_sessions(user_id, last_seen_at DESC);

-- ─── Failed login attempt tracking ───────────────────────────────────────────
-- Kept in its own table to avoid touching auth.users schema
CREATE TABLE IF NOT EXISTS user_login_attempts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT        NOT NULL,
  ip_address   INET,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success      BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ula_email
  ON user_login_attempts(email, attempted_at DESC);

-- ─── Account lock table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_account_locks (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  locked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_reason  TEXT,
  locked_by      UUID,        -- admin who locked; NULL = auto-locked
  unlocked_at    TIMESTAMPTZ,
  unlocked_by    UUID,
  UNIQUE(user_id)
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_sessions' AND policyname = 'us_own'
  ) THEN
    CREATE POLICY "us_own" ON user_sessions
      FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

ALTER TABLE user_login_attempts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_login_attempts' AND policyname = 'ula_admin'
  ) THEN
    CREATE POLICY "ula_admin" ON user_login_attempts
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

ALTER TABLE user_account_locks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_account_locks' AND policyname = 'ual_admin'
  ) THEN
    CREATE POLICY "ual_admin" ON user_account_locks
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;
