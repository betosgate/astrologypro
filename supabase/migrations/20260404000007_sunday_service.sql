-- Sunday Service sessions table
CREATE TABLE IF NOT EXISTS sunday_service_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  video_url   TEXT NOT NULL,
  thumbnail_url TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_live     BOOLEAN NOT NULL DEFAULT false,
  live_starts_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admins can manage, active community members can read
ALTER TABLE sunday_service_sessions ENABLE ROW LEVEL SECURITY;

-- Read: active community members
CREATE POLICY "community members can view sunday service"
  ON sunday_service_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.user_id = auth.uid()
        AND community_members.membership_status = 'active'
    )
  );

-- Full access for service role (admin operations via admin client)
CREATE POLICY "service role full access to sunday service"
  ON sunday_service_sessions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_sunday_service_recorded_at ON sunday_service_sessions (recorded_at DESC);
CREATE INDEX idx_sunday_service_is_live ON sunday_service_sessions (is_live) WHERE is_live = true;
