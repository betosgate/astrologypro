-- ============================================================================
-- Voicemails table for AWS Chime SMA voicemail recordings
--
-- Additive only. Stores the S3 key of the recorded voicemail plus enough
-- metadata for the diviner dashboard to list and mark messages as listened.
-- ============================================================================

CREATE TABLE IF NOT EXISTS voicemails (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id        UUID        NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  phone_session_id  UUID        REFERENCES phone_sessions(id) ON DELETE SET NULL,
  caller_phone      VARCHAR(30) NOT NULL,
  s3_key            TEXT        NOT NULL,
  duration_seconds  INTEGER,
  listened_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for diviner dashboard listing (most recent first)
CREATE INDEX IF NOT EXISTS idx_voicemails_diviner_created
  ON voicemails(diviner_id, created_at DESC);

-- Index to look up by phone_session for linking to the originating call
CREATE INDEX IF NOT EXISTS idx_voicemails_phone_session
  ON voicemails(phone_session_id)
  WHERE phone_session_id IS NOT NULL;

-- RLS: diviners can only see their own voicemails
ALTER TABLE voicemails ENABLE ROW LEVEL SECURITY;

-- Service-role inserts bypass RLS (Next.js API uses the admin/service key)
-- Diviner select policy: match on auth.uid() → diviners.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'voicemails' AND policyname = 'voicemails_diviner_select'
  ) THEN
    CREATE POLICY voicemails_diviner_select ON voicemails
      FOR SELECT
      USING (
        diviner_id IN (
          SELECT id FROM diviners WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;
