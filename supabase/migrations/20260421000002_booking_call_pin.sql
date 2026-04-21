-- ═══════════════════════════════════════════════════════════════════
-- Migration: 20260421000002_booking_call_pin
-- Purpose:  Add per-booking 6-digit call PIN + a small config table for
--           shared/central Chime numbers. Supports the "shared number +
--           PIN" routing architecture described in
--           docs/shared-chime-number-pin-spec.md.
--
-- Additive only (CLAUDE.md §5, §7). No columns dropped or renamed.
-- Existing per-diviner Chime number flow (diviners.chime_phone_number
-- + src/app/api/chime/voice/lookup) continues to work in parallel.
-- ═══════════════════════════════════════════════════════════════════


-- ─── 1. bookings: add call_pin columns ───────────────────────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS call_pin              CHAR(6),
  ADD COLUMN IF NOT EXISTS call_pin_generated_at TIMESTAMPTZ;

-- Partial unique index: no two concurrently-usable PINs.
-- Scoped to not-yet-terminal booking states. Rows that move to
-- 'completed', 'canceled', or 'no_show' release their PIN back to the
-- namespace (the PIN stays on the row for audit, but may be reused by
-- a new active booking).
CREATE UNIQUE INDEX IF NOT EXISTS ux_bookings_active_call_pin
  ON bookings (call_pin)
  WHERE call_pin IS NOT NULL
    AND status IN ('pending', 'confirmed', 'in_progress');

-- Lookup helper: fast PIN → booking lookup for the Chime Lambda path.
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
-- set_updated_at_timestamp() is created in 20260421000001 and may
-- already exist; CREATE OR REPLACE keeps the migration idempotent.
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

-- Admin full access.
DROP POLICY IF EXISTS chime_central_numbers_admin_all ON chime_central_numbers;
CREATE POLICY chime_central_numbers_admin_all ON chime_central_numbers
  FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Authenticated users (clients, diviners) can read the active central
-- number(s) — the booking confirmation UI shows the number so the
-- client knows where to call.
DROP POLICY IF EXISTS chime_central_numbers_read_active ON chime_central_numbers;
CREATE POLICY chime_central_numbers_read_active ON chime_central_numbers
  FOR SELECT
  USING (status = 'active');


-- ─── 5. Backfill: seed PINs for future/active bookings ───────────────
-- Strictly additive: only touches rows with call_pin IS NULL and a
-- non-terminal status. Uses the unique index as the collision guard
-- (retries on unique_violation). Safe to re-run — second run is a no-op.
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
        EXIT;               -- success
      EXCEPTION WHEN unique_violation THEN
        -- collision with another active PIN; retry with a fresh value
        NULL;
      END;
    END LOOP;
  END LOOP;
END$$;


-- ─── 6. Comments for future maintainers ──────────────────────────────
COMMENT ON COLUMN bookings.call_pin              IS '6-digit PIN used by the client when calling the central Chime number to route to this booking. NULL for legacy bookings.';
COMMENT ON COLUMN bookings.call_pin_generated_at IS 'When the PIN was first generated (audit trail).';
COMMENT ON TABLE  chime_central_numbers          IS 'Shared central PSTN numbers that accept PIN-based routing. Added alongside per-diviner chime numbers. Rollout gate is data-driven: the presence of an active (status=''active'') row enables the shared-number + PIN path in booking confirmations; leave the table empty (or retire all rows) to keep the legacy per-diviner flow.';
