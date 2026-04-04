-- Tracks when both parties joined and session was confirmed,
-- and billing attempts from the card-on-file cron.

-- confirmed_at: stamped when both diviner and client have joined
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billed_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billing_status TEXT CHECK (billing_status IN ('pending', 'billed', 'failed', 'skipped'));

-- Billing event log for auditing
CREATE TABLE IF NOT EXISTS billing_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID        NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  client_id       UUID        REFERENCES clients(id) ON DELETE SET NULL,
  amount          DECIMAL(10,2) NOT NULL,
  stripe_pi_id    TEXT,
  stripe_pm_id    TEXT,
  status          TEXT        NOT NULL CHECK (status IN ('succeeded', 'failed', 'skipped')),
  failure_message TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_billing_events" ON billing_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS billing_events_booking_idx ON billing_events (booking_id);

-- Index to quickly find sessions ready for billing
CREATE INDEX IF NOT EXISTS bookings_confirmed_billing_idx
  ON bookings (confirmed_at, billing_status)
  WHERE confirmed_at IS NOT NULL AND billed_at IS NULL AND billing_status IS DISTINCT FROM 'skipped';
