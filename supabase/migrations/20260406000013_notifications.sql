-- In-app notification system
-- Stores per-user notifications with type, optional deep-link, and read state.
-- RLS: users can read/mutate only their own rows; service_role has full access.

CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT,
  type         TEXT NOT NULL DEFAULT 'info'
                 CHECK (type IN ('info','success','warning','error','training','ritual','billing','system')),
  action_url   TEXT,
  is_read      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimised index for unread-first query (the most common read pattern)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);

-- General per-user timeline index
CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Authenticated users may read/write/delete their own notifications only
CREATE POLICY "own_notifications"
  ON notifications FOR ALL
  TO authenticated
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role has unrestricted access (used by server-side helpers to insert on behalf of any user)
CREATE POLICY "service_notifications_all"
  ON notifications FOR ALL
  TO service_role
  USING      (true)
  WITH CHECK (true);
