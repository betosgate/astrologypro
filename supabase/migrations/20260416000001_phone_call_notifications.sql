-- ============================================================================
-- Create phone_call_notifications table
--
-- Stores inbound call notifications created by the SMA Lambda (via /api/chime/voice/notify).
-- The diviner's browser widget polls /api/chime/voice/pending-calls which reads
-- from this table. Rows transition: ringing → accepted | declined | expired.
-- ============================================================================

CREATE TABLE IF NOT EXISTS phone_call_notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id      UUID NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  phone_session_id UUID REFERENCES phone_sessions(id) ON DELETE SET NULL,
  caller_phone    VARCHAR(20),
  call_id         VARCHAR(255),
  status          VARCHAR(20) NOT NULL DEFAULT 'ringing'
                    CHECK (status IN ('ringing', 'accepted', 'declined', 'expired')),
  provider        VARCHAR(20) DEFAULT 'chime'
                    CHECK (provider IN ('chime', 'twilio')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Widget polls by diviner_id + status = 'ringing', ordered by created_at
CREATE INDEX IF NOT EXISTS idx_phone_call_notif_diviner_status
  ON phone_call_notifications (diviner_id, status, created_at);

-- Lookup by phone_session_id (accept/decline routes)
CREATE INDEX IF NOT EXISTS idx_phone_call_notif_session
  ON phone_call_notifications (phone_session_id);

-- RLS
ALTER TABLE phone_call_notifications ENABLE ROW LEVEL SECURITY;

-- Diviners can read/update their own notifications
CREATE POLICY "phone_call_notif_diviner_select"
  ON phone_call_notifications FOR SELECT
  USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()));

CREATE POLICY "phone_call_notif_diviner_update"
  ON phone_call_notifications FOR UPDATE
  USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()));

-- Service role can do everything (SMA Lambda calls via admin client)
CREATE POLICY "phone_call_notif_service_all"
  ON phone_call_notifications FOR ALL
  USING (auth.role() = 'service_role');
