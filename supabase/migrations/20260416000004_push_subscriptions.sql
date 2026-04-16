-- ============================================================================
-- Create push_subscriptions table
--
-- Stores Web Push subscriptions for diviners so we can send them
-- notifications (e.g. incoming call alerts) even when the browser tab
-- is closed or minimised.
--
-- Each diviner can have multiple subscriptions (phone browser + desktop
-- browser, etc.). Subscriptions are cleaned up when they expire or the
-- diviner unsubscribes.
-- ============================================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id      UUID NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint        TEXT NOT NULL,
  p256dh          TEXT NOT NULL,
  auth            TEXT NOT NULL,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at    TIMESTAMPTZ,

  -- One subscription per endpoint per diviner
  CONSTRAINT push_sub_unique_endpoint UNIQUE (diviner_id, endpoint)
);

-- Look up subscriptions by diviner (used when sending push)
CREATE INDEX IF NOT EXISTS idx_push_sub_diviner
  ON push_subscriptions (diviner_id);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Diviners can manage their own subscriptions
CREATE POLICY "push_sub_diviner_select"
  ON push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "push_sub_diviner_insert"
  ON push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_sub_diviner_delete"
  ON push_subscriptions FOR DELETE
  USING (user_id = auth.uid());

-- Service role can do everything (server-side push sending)
CREATE POLICY "push_sub_service_all"
  ON push_subscriptions FOR ALL
  USING (auth.role() = 'service_role');
