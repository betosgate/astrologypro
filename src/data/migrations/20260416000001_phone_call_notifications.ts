// Bundled mirror of supabase/migrations/20260416000001_phone_call_notifications.sql

export const MIGRATION_SQL = `
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

CREATE INDEX IF NOT EXISTS idx_phone_call_notif_diviner_status
  ON phone_call_notifications (diviner_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_phone_call_notif_session
  ON phone_call_notifications (phone_session_id);

ALTER TABLE phone_call_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "phone_call_notif_diviner_select"
  ON phone_call_notifications FOR SELECT
  USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()));

CREATE POLICY "phone_call_notif_diviner_update"
  ON phone_call_notifications FOR UPDATE
  USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()));

CREATE POLICY "phone_call_notif_service_all"
  ON phone_call_notifications FOR ALL
  USING (auth.role() = 'service_role');
`;
