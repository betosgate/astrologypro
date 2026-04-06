-- Ensure pgcrypto is available for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Bookings: add metadata capture, secure booking token, Outlook event ID, client notes
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS booking_token TEXT UNIQUE DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  ADD COLUMN IF NOT EXISTS outlook_calendar_event_id TEXT,
  ADD COLUMN IF NOT EXISTS booking_notes TEXT;

-- Backfill booking_token for existing rows that have null
UPDATE bookings SET booking_token = encode(extensions.gen_random_bytes(16), 'hex') WHERE booking_token IS NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_booking_token ON bookings(booking_token);

-- 2. Diviners: add Outlook calendar columns
ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS outlook_calendar_token JSONB,
  ADD COLUMN IF NOT EXISTS outlook_calendar_connected BOOLEAN GENERATED ALWAYS AS (outlook_calendar_token IS NOT NULL) STORED;

-- 3. availability_templates: date-ranged recurring availability blocks
CREATE TABLE IF NOT EXISTS availability_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL DEFAULT 'Available',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  weekdays INTEGER[] NOT NULL DEFAULT '{}',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_availability_templates_diviner ON availability_templates(diviner_id, is_active);

ALTER TABLE availability_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diviner_own_templates" ON availability_templates FOR ALL TO authenticated
  USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()))
  WITH CHECK (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()));
CREATE POLICY "service_role_templates" ON availability_templates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "public_read_templates" ON availability_templates FOR SELECT TO authenticated USING (is_active = true);
