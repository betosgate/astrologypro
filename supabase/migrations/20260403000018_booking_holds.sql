-- Temporary slot holds — prevents double-booking during the checkout window.
-- Holds expire after 10 minutes if payment is not completed.

CREATE TABLE IF NOT EXISTS booking_holds (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id     UUID        NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  scheduled_at   TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER   NOT NULL DEFAULT 60,
  session_token  TEXT        NOT NULL UNIQUE, -- anonymous browser session ID
  expires_at     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast conflict queries: look up holds by diviner + time window
-- Note: partial index on expires_at cannot use NOW() (not IMMUTABLE), so use a plain index
CREATE INDEX IF NOT EXISTS booking_holds_diviner_time_idx
  ON booking_holds (diviner_id, scheduled_at, expires_at);

ALTER TABLE booking_holds ENABLE ROW LEVEL SECURITY;

-- Only the service_role (API routes) can read/write holds
CREATE POLICY "service_role_all_holds" ON booking_holds
  FOR ALL TO service_role USING (true) WITH CHECK (true);
