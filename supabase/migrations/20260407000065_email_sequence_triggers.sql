-- email_sequence_triggers
-- Records manual trigger requests for email sequences submitted by admins.
-- A cron job or background worker polls this table for pending rows and
-- dispatches the appropriate emails, then marks them processed or failed.

CREATE TABLE IF NOT EXISTS email_sequence_triggers (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id     UUID        NOT NULL REFERENCES email_sequence_controls(id) ON DELETE CASCADE,
  sequence_name   TEXT        NOT NULL,
  target_user_id  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  triggered_by    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  status          TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message   TEXT,
  triggered_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS email_sequence_triggers_status_idx
  ON email_sequence_triggers(status, triggered_at DESC);

CREATE INDEX IF NOT EXISTS email_sequence_triggers_sequence_id_idx
  ON email_sequence_triggers(sequence_id);

ALTER TABLE email_sequence_triggers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'email_sequence_triggers'
      AND policyname = 'Service role full access'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Service role full access"
        ON email_sequence_triggers
        USING (true)
        WITH CHECK (true)
    $p$;
  END IF;
END $$;

COMMENT ON TABLE email_sequence_triggers IS
  'Manual trigger requests for email sequences. Rows with status=pending are processed by the send cron.';
