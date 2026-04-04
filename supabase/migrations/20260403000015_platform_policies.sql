-- Platform-wide policy text (booking, no-show, refund)
-- Displayed on every diviner profile page for Stripe/PayPal compliance

CREATE TABLE IF NOT EXISTS platform_policies (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT        NOT NULL UNIQUE,  -- 'booking' | 'no_show' | 'refund'
  title       TEXT        NOT NULL,
  content     TEXT        NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  TEXT
);

ALTER TABLE platform_policies ENABLE ROW LEVEL SECURITY;

-- Public read (needed for SSR on public profile pages)
CREATE POLICY "public_read_policies" ON platform_policies
  FOR SELECT TO anon, authenticated USING (true);

-- Only service_role (admin) can write
CREATE POLICY "service_role_write_policies" ON platform_policies
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed default policy text
INSERT INTO platform_policies (type, title, content) VALUES
(
  'booking',
  'Booking Policy',
  'Sessions are booked on a first-come, first-served basis. Once a session is confirmed and payment is received, your slot is reserved. Rescheduling requests must be made at least 24 hours before the session start time.'
),
(
  'no_show',
  'No-Show Policy',
  'If you do not attend your scheduled session without prior notice, 50% of the session fee will be retained as a no-show fee. The remaining 50% will be refunded to your original payment method within 5–10 business days. If your practitioner does not attend, you will receive a full 100% refund automatically.'
),
(
  'refund',
  'Refund Policy',
  'Cancellations made more than 24 hours before the session start time are eligible for a full refund. Cancellations made within 24 hours of the session are non-refundable. Refunds for no-shows are processed according to our No-Show Policy above. All refunds are returned to the original payment method.'
)
ON CONFLICT (type) DO NOTHING;
