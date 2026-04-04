-- Track who joined each session for no-show / refund processing
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS diviner_joined_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_joined_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS no_show_processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS no_show_type        TEXT
    CHECK (no_show_type IN ('diviner', 'client'));

-- Fast lookup for the cron job: unprocessed confirmed sessions past their end time
CREATE INDEX IF NOT EXISTS bookings_no_show_cron_idx
  ON bookings (scheduled_at, status)
  WHERE no_show_processed_at IS NULL AND status = 'confirmed';
