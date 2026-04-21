-- ═══════════════════════════════════════════════════════════════════
-- Migration: 20260421000002_booking_call_pin
-- Purpose:  Add per-booking 6-digit call PIN + extend the existing
--           chime_phone_numbers table (created in 20260421000001) with
--           a 'central' status so one row can act as the shared number
--           that accepts PIN-based routing.
--
-- Additive only (CLAUDE.md §5, §7). No columns dropped or renamed.
-- The existing per-diviner Chime flow (diviners.chime_phone_number and
-- status='assigned' pool rows) continues to work unchanged.
-- ═══════════════════════════════════════════════════════════════════


-- ─── 1. bookings: add call_pin columns ───────────────────────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS call_pin              CHAR(6),
  ADD COLUMN IF NOT EXISTS call_pin_generated_at TIMESTAMPTZ;

-- Partial unique index: no two concurrently-usable PINs. Scoped to
-- non-terminal booking states; terminal statuses may recycle their PIN.
CREATE UNIQUE INDEX IF NOT EXISTS ux_bookings_active_call_pin
  ON bookings (call_pin)
  WHERE call_pin IS NOT NULL
    AND status IN ('pending', 'confirmed', 'in_progress');

-- Fast PIN → booking lookup for the Chime Lambda / admin view path.
CREATE INDEX IF NOT EXISTS idx_bookings_call_pin_lookup
  ON bookings (call_pin)
  WHERE call_pin IS NOT NULL;


-- ─── 2. chime_phone_numbers: extend status enum to include 'central' ─
-- The table is already created (20260421000001) with
--   status IN ('available', 'assigned')
-- plus a named CHECK constraint:
--   chk_chime_phone_numbers_assignment_consistent
-- which requires assigned_diviner_id+assigned_at when status='assigned'.
--
-- We (a) widen the status enum to also allow 'central', and
-- (b) relax the consistency check so a 'central' row has no diviner
--     assignment (it serves everyone via PIN routing, not one diviner).

-- 2a. The inline CHECK created with the column is named
--     <table>_<column>_check by Postgres. Drop it safely.
ALTER TABLE chime_phone_numbers
  DROP CONSTRAINT IF EXISTS chime_phone_numbers_status_check;

ALTER TABLE chime_phone_numbers
  ADD CONSTRAINT chime_phone_numbers_status_check
  CHECK (status IN ('available', 'assigned', 'central'));

-- 2b. Relax assignment consistency so 'central' rows carry no diviner.
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


-- ─── 3. RLS: let authenticated users read 'central' rows ─────────────
-- Booking confirmation UI (client + diviner roles) needs to display the
-- shared central number. Admin already has full access from 001.
DROP POLICY IF EXISTS chime_phone_numbers_read_central ON chime_phone_numbers;
CREATE POLICY chime_phone_numbers_read_central ON chime_phone_numbers
  FOR SELECT
  USING (status = 'central');


-- ─── 4. Backfill: seed PINs for existing non-terminal bookings ───────
-- Idempotent: only touches rows with call_pin IS NULL. Uses the unique
-- index as the collision guard and retries on unique_violation.
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
        EXIT;               -- success
      EXCEPTION WHEN unique_violation THEN
        -- collision with another active PIN; retry with a fresh value
        NULL;
      END;
    END LOOP;
  END LOOP;
END$$;


-- ─── 5. Comments for future maintainers ──────────────────────────────
COMMENT ON COLUMN bookings.call_pin              IS '6-digit PIN used by the client when calling the central Chime number to route to this booking. NULL for legacy bookings.';
COMMENT ON COLUMN bookings.call_pin_generated_at IS 'When the PIN was first generated (audit trail).';
COMMENT ON COLUMN chime_phone_numbers.status     IS 'available = free pool row, admin may assign; assigned = dedicated to a specific diviner; central = shared PSTN number that accepts PIN-based routing to any booking.';
