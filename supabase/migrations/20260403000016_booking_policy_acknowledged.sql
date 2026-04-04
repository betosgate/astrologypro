-- Track when the client acknowledged the no-show / refund policy at checkout
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS policy_acknowledged_at TIMESTAMPTZ;
