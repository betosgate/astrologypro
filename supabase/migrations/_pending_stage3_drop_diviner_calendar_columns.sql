-- ============================================================================
-- ⚠️  STAGE 3 — DO NOT RUN UNTIL READ-SIDE CUTOVER HAS BEEN LIVE FOR AT LEAST
--     ONE FULL RELEASE CYCLE.
--
-- This file is INTENTIONALLY named with a leading underscore so the Supabase
-- migration runner will NOT pick it up automatically. Rename to a real
-- timestamped filename only when you are ready to run it.
--
-- It is NOT registered in src/lib/db/migrations.ts on purpose.
-- ============================================================================
--
-- Drops the legacy per-provider JSONB calendar columns from the `diviners`
-- table after the read-side cutover (commits 6265af9 and the read-prefer
-- change in src/lib/{google,microsoft}-calendar.ts) has been deployed and
-- verified for at least one release cycle.
--
-- Pre-flight checklist before running:
--
--   1. Confirm /admin/db/migrations shows 20260408000110_backfill_calendar_connections
--      has been applied successfully and the row counts match between the
--      old and new stores. Compare:
--        SELECT count(*) FROM diviners
--          WHERE google_calendar_token IS NOT NULL OR outlook_calendar_token IS NOT NULL;
--        SELECT count(DISTINCT owner_id) FROM calendar_connections;
--
--   2. Confirm src/lib/google-calendar.ts getAccessToken and
--      src/lib/microsoft-calendar.ts getMsAccessToken have been live in
--      production for at least one release cycle reading from
--      calendar_connections (with diviners JSONB as fallback).
--
--   3. Confirm Vercel logs show no "[calendar/connections] table missing"
--      or fallback-path warnings for the entire release cycle.
--
--   4. Take a fresh database backup. This migration is destructive and
--      cannot be reversed without restoring from backup.
--
-- After running:
--
--   - The dual-write code in handleOAuthCallback / handleMsOAuthCallback
--     will start logging "could not find column" errors. Ship a follow-up
--     PR that removes the diviners.{google,outlook}_calendar_token writes
--     from those functions BEFORE running this migration.
--
-- ============================================================================

BEGIN;

-- 1. Drop the GENERATED ALWAYS connected flags first — they depend on the
--    underlying token columns. Postgres will refuse to drop the source
--    column otherwise.
ALTER TABLE public.diviners DROP COLUMN IF EXISTS google_calendar_connected;
ALTER TABLE public.diviners DROP COLUMN IF EXISTS outlook_calendar_connected;

-- 2. Drop the legacy JSONB token columns themselves.
ALTER TABLE public.diviners DROP COLUMN IF EXISTS google_calendar_token;
ALTER TABLE public.diviners DROP COLUMN IF EXISTS outlook_calendar_token;

-- 3. (Optional) Drop the index that was specific to the old generated flag
--    if one was ever added. Wrap in IF EXISTS so it's safe.
DROP INDEX IF EXISTS public.idx_diviners_google_calendar_connected;
DROP INDEX IF EXISTS public.idx_diviners_outlook_calendar_connected;

COMMIT;
