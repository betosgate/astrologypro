// Bundled mirror of supabase/migrations/20260421000002_booking_call_pin.sql
//
// Keep this file in lock-step with the canonical .sql. Both are executed
// (canonical .sql via `node scripts/run-migration.js`, this mirror via
// the admin UI at /admin/db/migrations which imports MIGRATIONS from
// src/lib/db/migrations.ts).
//
// Purpose: Add per-booking 6-digit call PIN and extend the existing
// chime_phone_numbers table (created in 20260421000001) with a 'central'
// status so one row can act as the shared number that accepts PIN-based
// routing.
//
// Strictly ADDITIVE (CLAUDE.md §5 + §7). The existing per-diviner Chime
// flow (diviners.chime_phone_number + status='assigned' pool rows)
// continues to work unchanged. Rollout is data-driven: presence of a
// status='central' row in chime_phone_numbers turns the shared-number +
// PIN path on.

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


-- ─── 2. chime_phone_numbers: extend status to include 'central' ──────
ALTER TABLE chime_phone_numbers
  DROP CONSTRAINT IF EXISTS chime_phone_numbers_status_check;

ALTER TABLE chime_phone_numbers
  ADD CONSTRAINT chime_phone_numbers_status_check
  CHECK (status IN ('available', 'assigned', 'central'));

ALTER TABLE chime_phone_numbers
  DROP CONSTRAINT IF EXISTS chk_chime_phone_numbers_assignment_consistent;

ALTER TABLE chime_phone_numbers
  ADD CONSTRAINT chk_chime_phone_numbers_assignment_consistent
  CHECK (
    (status = 'assigned'
       AND assigned_diviner_id IS NOT NULL
       AND assigned_at         IS NOT NULL)
    OR
    (status = 'available'
       AND assigned_diviner_id IS NULL
       AND assigned_at         IS NULL)
    OR
    (status = 'central'
       AND assigned_diviner_id IS NULL
       AND assigned_at         IS NULL)
  );


-- ─── 3. RLS: authenticated read on central rows ──────────────────────
DROP POLICY IF EXISTS chime_phone_numbers_read_central ON chime_phone_numbers;
CREATE POLICY chime_phone_numbers_read_central ON chime_phone_numbers
  FOR SELECT
  USING (status = 'central');


-- ─── 4. Backfill ─────────────────────────────────────────────────────
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
           SET call_pin              = candidate_pin,
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


-- ─── 5. Comments ─────────────────────────────────────────────────────
COMMENT ON COLUMN bookings.call_pin              IS '6-digit PIN used by the client when calling the central Chime number to route to this booking. NULL for legacy bookings.';
COMMENT ON COLUMN bookings.call_pin_generated_at IS 'When the PIN was first generated (audit trail).';
COMMENT ON COLUMN chime_phone_numbers.status     IS 'available = free pool row, admin may assign; assigned = dedicated to a specific diviner; central = shared PSTN number that accepts PIN-based routing to any booking.';
`;
