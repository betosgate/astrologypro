// Bundled mirror of supabase/migrations/20260421000002_booking_call_pin.sql
//
// Keep this file in lock-step with the canonical .sql. Both are executed
// (canonical .sql via `node scripts/run-migration.js`, this mirror via
// the admin UI at /admin/db/migrations which imports MIGRATIONS from
// src/lib/db/migrations.ts).
//
// Purpose: Add per-booking 6-digit call PIN + chime_central_numbers
// config table so that the app can advertise a single shared Chime
// number and route inbound calls to the correct diviner by PIN.
//
// Strictly ADDITIVE (CLAUDE.md §5 + §7): new columns, new table, new
// indexes, new policies. Existing per-diviner Chime flow continues to
// work in parallel — feature flag controls which number is advertised.

export const MIGRATION_SQL = `
-- ─── 1. bookings: add call_pin columns ───────────────────────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS call_pin              CHAR(6),
  ADD COLUMN IF NOT EXISTS call_pin_generated_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS ux_bookings_active_call_pin
  ON bookings (call_pin)
  WHERE call_pin IS NOT NULL
    AND status IN ('pending', 'confirmed', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_bookings_call_pin_lookup
  ON bookings (call_pin)
  WHERE call_pin IS NOT NULL;


-- ─── 2. chime_central_numbers (config) ───────────────────────────────
CREATE TABLE IF NOT EXISTS chime_central_numbers (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number  VARCHAR(20) NOT NULL UNIQUE,
  phone_arn     TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'retired')),
  region        VARCHAR(10),
  label         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chime_central_numbers_status
  ON chime_central_numbers (status);


-- ─── 3. updated_at trigger ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chime_central_numbers_updated_at ON chime_central_numbers;
CREATE TRIGGER trg_chime_central_numbers_updated_at
  BEFORE UPDATE ON chime_central_numbers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();


-- ─── 4. RLS ──────────────────────────────────────────────────────────
ALTER TABLE chime_central_numbers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chime_central_numbers_admin_all ON chime_central_numbers;
CREATE POLICY chime_central_numbers_admin_all ON chime_central_numbers
  FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS chime_central_numbers_read_active ON chime_central_numbers;
CREATE POLICY chime_central_numbers_read_active ON chime_central_numbers
  FOR SELECT
  USING (status = 'active');


-- ─── 5. Backfill ─────────────────────────────────────────────────────
DO $$
DECLARE
  rec            RECORD;
  candidate_pin  CHAR(6);
  attempts       INT;
BEGIN
  FOR rec IN
    SELECT id FROM bookings
    WHERE call_pin IS NULL
      AND status IN ('pending', 'confirmed', 'in_progress')
  LOOP
    attempts := 0;
    LOOP
      attempts := attempts + 1;
      EXIT WHEN attempts > 10;

      candidate_pin := lpad(floor(random() * 1000000)::int::text, 6, '0');

      BEGIN
        UPDATE bookings
           SET call_pin = candidate_pin,
               call_pin_generated_at = now()
         WHERE id = rec.id
           AND call_pin IS NULL;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        NULL;
      END;
    END LOOP;
  END LOOP;
END$$;


-- ─── 6. Comments ─────────────────────────────────────────────────────
COMMENT ON COLUMN bookings.call_pin              IS '6-digit PIN used by the client when calling the central Chime number to route to this booking. NULL for legacy bookings.';
COMMENT ON COLUMN bookings.call_pin_generated_at IS 'When the PIN was first generated (audit trail).';
COMMENT ON TABLE  chime_central_numbers          IS 'Shared central PSTN numbers that accept PIN-based routing. Added alongside per-diviner chime numbers. Rollout gate is data-driven: the presence of an active (status=''active'') row enables the shared-number + PIN path in booking confirmations; leave the table empty (or retire all rows) to keep the legacy per-diviner flow.';
`;
