// AUTO-GENERATED bundled mirror of supabase/migrations/20260408000110_backfill_calendar_connections.sql
// Used by /api/admin/db/migrate so the deployed function does not need filesystem access.
// To regenerate: copy the .sql file contents into the template literal below.

export const MIGRATION_SQL = `-- ============================================================================
-- Backfill calendar_connections from diviners.{google,outlook}_calendar_token
--
-- One-shot data migration. Copies every existing OAuth token from the
-- per-provider JSONB columns on \`diviners\` into the normalized
-- \`calendar_connections\` table created in 20260408000109.
--
-- Schema notes:
--   - diviners.id              ← becomes calendar_connections.owner_id
--                                (matches bookings.diviner_id semantics)
--   - diviners.user_id         ← becomes calendar_connections.user_id
--                                (auth.users FK)
--   - google_calendar_token    JSONB scalar string holding the refresh_token
--                                (extracted via "#>> '{}'")
--   - outlook_calendar_token   JSONB object with
--                                { access_token, refresh_token, expires_at }
--
-- Idempotent: ON CONFLICT (user_id, provider) DO NOTHING. Re-runnable.
-- Safe: source columns are NOT touched. Existing read paths keep working.
--
-- Wrapped in DO blocks so the migration is portable to projects that don't
-- have diviners or the JSONB columns yet.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'calendar_connections'
  ) THEN
    RAISE NOTICE 'calendar_connections table missing — run 20260408000109 first. Skipping backfill.';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'diviners'
  ) THEN
    RAISE NOTICE 'diviners table missing — nothing to backfill.';
    RETURN;
  END IF;

  -- ── Google ────────────────────────────────────────────────────────────────
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='diviners' AND column_name='google_calendar_token'
  ) THEN
    INSERT INTO public.calendar_connections (user_id, owner_id, provider, refresh_token)
    SELECT
      d.user_id,
      d.id,
      'google',
      -- google_calendar_token is JSONB. The value is either a quoted JSON
      -- string (e.g. "1//abc") or — historically — a raw text token. Use
      -- "#>> '{}'" to extract the underlying scalar string from a JSONB
      -- primitive without the surrounding quotes.
      (d.google_calendar_token #>> '{}')
    FROM public.diviners d
    WHERE d.user_id IS NOT NULL
      AND d.google_calendar_token IS NOT NULL
      AND (d.google_calendar_token #>> '{}') IS NOT NULL
      AND length((d.google_calendar_token #>> '{}')) > 0
    ON CONFLICT (user_id, provider) DO NOTHING;
  END IF;

  -- ── Microsoft / Outlook ───────────────────────────────────────────────────
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='diviners' AND column_name='outlook_calendar_token'
  ) THEN
    INSERT INTO public.calendar_connections
      (user_id, owner_id, provider, access_token, refresh_token, expires_at)
    SELECT
      d.user_id,
      d.id,
      'microsoft',
      d.outlook_calendar_token ->> 'access_token',
      d.outlook_calendar_token ->> 'refresh_token',
      CASE
        WHEN (d.outlook_calendar_token ->> 'expires_at') ~ '^\\d+$'
          THEN to_timestamp((d.outlook_calendar_token ->> 'expires_at')::bigint)
        ELSE NULL
      END
    FROM public.diviners d
    WHERE d.user_id IS NOT NULL
      AND d.outlook_calendar_token IS NOT NULL
      AND (d.outlook_calendar_token ->> 'refresh_token') IS NOT NULL
      AND length(d.outlook_calendar_token ->> 'refresh_token') > 0
    ON CONFLICT (user_id, provider) DO NOTHING;
  END IF;
END $$;
`;
