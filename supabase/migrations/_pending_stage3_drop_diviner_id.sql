-- ============================================================================
-- ⚠️  STAGE 3 OF THE diviner_id → owner_id ADDITIVE RENAME
--     DO NOT RUN UNTIL STAGE 2 (SOURCE RENAME) HAS BEEN LIVE IN PRODUCTION
--     FOR AT LEAST ONE FULL RELEASE CYCLE.
--
-- This file is INTENTIONALLY named with a leading underscore so the
-- Supabase migration runner will NOT pick it up automatically. Rename
-- to a real timestamped filename only when you are ready to run it.
--
-- It is NOT registered in src/lib/db/migrations.ts on purpose.
-- ============================================================================
--
-- Drops the legacy diviner_id columns + sync trigger after every consumer
-- has been switched to read/write owner_id.
--
-- Pre-flight checklist:
--
--   1. Confirm 20260408000108_owner_id_additive has been applied (every
--      affected table has both diviner_id AND owner_id, with the trigger
--      keeping them in sync).
--
--   2. Confirm the source rename PR (stage 2) has been live in production
--      for at least one release cycle. Grep the deployed bundle:
--      every reference to diviner_id in DB query strings should be gone.
--
--   3. Run a sanity query to confirm no row has owner_id IS NULL where
--      diviner_id IS NOT NULL across any of the affected tables. Example:
--        SELECT 'bookings' AS t, count(*) FROM bookings
--          WHERE owner_id IS NULL AND diviner_id IS NOT NULL
--        UNION ALL SELECT 'services',  count(*) FROM services
--          WHERE owner_id IS NULL AND diviner_id IS NOT NULL
--        ...
--      Every count should be 0. If any are non-zero the trigger has been
--      bypassed somewhere — STOP and investigate before proceeding.
--
--   4. Take a fresh database backup. Destructive — cannot be undone.
--
-- ============================================================================

BEGIN;

-- 1. Drop the sync trigger from every affected table (it stops being needed
--    once diviner_id is gone).
DROP TRIGGER IF EXISTS trg_sync_diviner_owner_ids ON public.bookings;
DROP TRIGGER IF EXISTS trg_sync_diviner_owner_ids ON public.services;
DROP TRIGGER IF EXISTS trg_sync_diviner_owner_ids ON public.availability_slots;
DROP TRIGGER IF EXISTS trg_sync_diviner_owner_ids ON public.availability_overrides;
DROP TRIGGER IF EXISTS trg_sync_diviner_owner_ids ON public.availability_templates;
DROP TRIGGER IF EXISTS trg_sync_diviner_owner_ids ON public.booking_holds;
DROP TRIGGER IF EXISTS trg_sync_diviner_owner_ids ON public.client_diviners;

-- 2. Drop the trigger function itself (no other dependencies).
DROP FUNCTION IF EXISTS public.sync_diviner_owner_ids();

-- 3. Drop the legacy diviner_id columns. This is the destructive step.
--    NB: each ALTER will also drop any index on diviner_id automatically.
ALTER TABLE public.bookings              DROP COLUMN IF EXISTS diviner_id;
ALTER TABLE public.services              DROP COLUMN IF EXISTS diviner_id;
ALTER TABLE public.availability_slots    DROP COLUMN IF EXISTS diviner_id;
ALTER TABLE public.availability_overrides DROP COLUMN IF EXISTS diviner_id;
ALTER TABLE public.availability_templates DROP COLUMN IF EXISTS diviner_id;
ALTER TABLE public.booking_holds         DROP COLUMN IF EXISTS diviner_id;

-- client_diviners is special — its (client_id, diviner_id) unique constraint
-- has to be dropped before the column. The parallel (client_id, owner_id)
-- constraint added in stage 1 takes over as the canonical guarantee.
ALTER TABLE public.client_diviners
  DROP CONSTRAINT IF EXISTS client_diviners_client_id_diviner_id_key;
ALTER TABLE public.client_diviners DROP COLUMN IF EXISTS diviner_id;

-- 4. Add NOT NULL on owner_id everywhere (was nullable in stage 1 because
--    backfill happened post-create). Sanity-check that no rows are NULL
--    before adding the constraint, otherwise the ALTER will fail loudly.
ALTER TABLE public.bookings              ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE public.services              ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE public.availability_slots    ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE public.availability_overrides ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE public.availability_templates ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE public.booking_holds         ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE public.client_diviners       ALTER COLUMN owner_id SET NOT NULL;

COMMIT;
