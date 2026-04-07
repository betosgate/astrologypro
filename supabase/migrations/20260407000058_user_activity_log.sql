-- User Activity Log
-- Append-only audit trail for all significant user events across the platform.
-- RLS: users may read their own rows; service_role has full access.

CREATE TABLE IF NOT EXISTS user_activity_log (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id       uuid        REFERENCES auth.users(id) ON DELETE SET NULL, -- null = self, uuid = admin
  event_category text        NOT NULL CHECK (event_category IN (
    'auth','booking','payment','reading','profile','subscription','admin','system'
  )),
  event_type     text        NOT NULL,  -- e.g. 'booking.created', 'payment.succeeded'
  metadata       jsonb       NOT NULL DEFAULT '{}',
  ip_address     text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ual_user_idx     ON user_activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ual_category_idx ON user_activity_log(event_category, created_at DESC);
CREATE INDEX IF NOT EXISTS ual_created_idx  ON user_activity_log(created_at DESC);

-- RLS
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_activity_log' AND policyname = 'users_read_own_activity'
  ) THEN
    CREATE POLICY users_read_own_activity ON user_activity_log
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_activity_log' AND policyname = 'service_role_all_activity'
  ) THEN
    CREATE POLICY service_role_all_activity ON user_activity_log
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
