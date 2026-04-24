// Bundled mirror of supabase/migrations/20260424000001_phone_sessions_outbound_diviner_call.sql
// Keep this file byte-for-byte in sync with the canonical .sql.

export const MIGRATION_SQL = `
-- ============================================================================
-- Diviner-initiated outbound call support (Apr 24, 2026)
--
-- Adds the ability to distinguish phone_sessions that were *initiated by the
-- diviner calling the client from their dashboard* from the existing
-- inbound-PSTN-from-client sessions. Required by the new
-- POST /api/chime/voice/call-client endpoint and the "Call client" row
-- action on /dashboard/bookings.
--
-- Strictly additive. Safe to re-run.
--   1. Add a \`direction\` column (default 'inbound' so every existing row
--      keeps its current semantics).
--   2. Extend \`session_type\` CHECK so the value 'outbound_diviner_call'
--      is allowed alongside the pre-existing 'scheduled_dialin' /
--      'standalone'.
--   3. Add an index on (diviner_id, direction, status) to keep the
--      diviner's "active call" lookups cheap even as the table grows.
--
-- Rollback:
--   ALTER TABLE phone_sessions DROP COLUMN IF EXISTS direction;
--   (leave the CHECK relaxed — dropping allowed enum values is destructive
--    and unnecessary for rollback.)
-- ============================================================================

-- 1. Direction column — which side of the PSTN leg started the session.
ALTER TABLE public.phone_sessions
  ADD COLUMN IF NOT EXISTS direction VARCHAR(12) NOT NULL DEFAULT 'inbound';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'phone_sessions_direction_check'
  ) THEN
    ALTER TABLE public.phone_sessions
      ADD CONSTRAINT phone_sessions_direction_check
      CHECK (direction IN ('inbound', 'outbound'));
  END IF;
END $$;

-- 2. Relax session_type CHECK to allow 'outbound_diviner_call'.
DO $$
DECLARE
  existing_conname TEXT;
BEGIN
  SELECT conname INTO existing_conname
  FROM pg_constraint
  WHERE conrelid = 'public.phone_sessions'::regclass
    AND contype  = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%session_type%'
  LIMIT 1;

  IF existing_conname IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.phone_sessions DROP CONSTRAINT %I',
      existing_conname
    );
  END IF;

  ALTER TABLE public.phone_sessions
    ADD CONSTRAINT phone_sessions_session_type_check
    CHECK (
      session_type IN (
        'scheduled_dialin',
        'standalone',
        'outbound_diviner_call'
      )
    );
END $$;

-- 3. Index for "what call is this diviner currently on?" lookups.
CREATE INDEX IF NOT EXISTS ix_phone_sessions_diviner_direction_status
  ON public.phone_sessions (diviner_id, direction, status);
`;
