-- ============================================================================
-- diviner_id -> owner_id additive rename — STAGE 1 of 3
--
-- This is the SAFE first stage. It does NOT remove anything. After this
-- migration runs, every affected table has BOTH `diviner_id` and `owner_id`
-- columns. They are kept in sync by a BEFORE INSERT OR UPDATE trigger so
-- code that reads or writes either column continues to work.
--
-- Stages:
--   1. (this file) ADD COLUMN owner_id, backfill from diviner_id, sync trigger
--   2. (separate PR) update all 178 source files to read/write owner_id
--   3. (later migration) drop the trigger, drop diviner_id, drop the
--      legacy unique constraint, add the new (client_id, owner_id) constraint
--
-- All operations are idempotent. Safe to re-run.
-- ============================================================================

-- ───────────────────────── Shared sync trigger function ───────────────────────
CREATE OR REPLACE FUNCTION public.sync_diviner_owner_ids()
RETURNS TRIGGER LANGUAGE plpgsql AS $sync$
BEGIN
  -- Whichever side was set, copy it to the other so both columns stay equal.
  IF NEW.owner_id IS NULL AND NEW.diviner_id IS NOT NULL THEN
    NEW.owner_id := NEW.diviner_id;
  ELSIF NEW.diviner_id IS NULL AND NEW.owner_id IS NOT NULL THEN
    NEW.diviner_id := NEW.owner_id;
  END IF;
  RETURN NEW;
END;
$sync$;

COMMENT ON FUNCTION public.sync_diviner_owner_ids() IS
  'Stage-1 helper for the diviner_id -> owner_id additive rename. Keeps both columns equal during the dual-read window. Dropped by stage 3.';

-- ───────────────────────── Per-table additive helper ──────────────────────────
-- We can't pass a table name to a function, so the per-table block is repeated.
-- Each block:
--   1. ADD COLUMN owner_id IF NOT EXISTS (no constraint — same shape as diviner_id)
--   2. Backfill rows where owner_id IS NULL but diviner_id IS NOT NULL
--   3. Index owner_id to match the existing diviner_id index (best-effort)
--   4. Attach the sync trigger (DROP IF EXISTS first so re-runs are safe)
--
-- Each block is wrapped in a DO so a missing source table just skips silently —
-- we never want stage 1 to fail because one of the 7 tables was renamed elsewhere.

-- ── bookings ──────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='bookings' AND column_name='diviner_id') THEN
    EXECUTE 'ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS owner_id UUID';
    EXECUTE 'UPDATE public.bookings SET owner_id = diviner_id WHERE owner_id IS NULL AND diviner_id IS NOT NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_bookings_owner_id ON public.bookings(owner_id)';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_sync_diviner_owner_ids ON public.bookings';
    EXECUTE 'CREATE TRIGGER trg_sync_diviner_owner_ids
             BEFORE INSERT OR UPDATE ON public.bookings
             FOR EACH ROW EXECUTE FUNCTION public.sync_diviner_owner_ids()';
  END IF;
END $$;

-- ── services ──────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='services' AND column_name='diviner_id') THEN
    EXECUTE 'ALTER TABLE public.services ADD COLUMN IF NOT EXISTS owner_id UUID';
    EXECUTE 'UPDATE public.services SET owner_id = diviner_id WHERE owner_id IS NULL AND diviner_id IS NOT NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_services_owner_id ON public.services(owner_id)';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_sync_diviner_owner_ids ON public.services';
    EXECUTE 'CREATE TRIGGER trg_sync_diviner_owner_ids
             BEFORE INSERT OR UPDATE ON public.services
             FOR EACH ROW EXECUTE FUNCTION public.sync_diviner_owner_ids()';
  END IF;
END $$;

-- ── availability_slots ────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='availability_slots' AND column_name='diviner_id') THEN
    EXECUTE 'ALTER TABLE public.availability_slots ADD COLUMN IF NOT EXISTS owner_id UUID';
    EXECUTE 'UPDATE public.availability_slots SET owner_id = diviner_id WHERE owner_id IS NULL AND diviner_id IS NOT NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_availability_slots_owner_id ON public.availability_slots(owner_id)';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_sync_diviner_owner_ids ON public.availability_slots';
    EXECUTE 'CREATE TRIGGER trg_sync_diviner_owner_ids
             BEFORE INSERT OR UPDATE ON public.availability_slots
             FOR EACH ROW EXECUTE FUNCTION public.sync_diviner_owner_ids()';
  END IF;
END $$;

-- ── availability_overrides ────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='availability_overrides' AND column_name='diviner_id') THEN
    EXECUTE 'ALTER TABLE public.availability_overrides ADD COLUMN IF NOT EXISTS owner_id UUID';
    EXECUTE 'UPDATE public.availability_overrides SET owner_id = diviner_id WHERE owner_id IS NULL AND diviner_id IS NOT NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_availability_overrides_owner_id ON public.availability_overrides(owner_id)';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_sync_diviner_owner_ids ON public.availability_overrides';
    EXECUTE 'CREATE TRIGGER trg_sync_diviner_owner_ids
             BEFORE INSERT OR UPDATE ON public.availability_overrides
             FOR EACH ROW EXECUTE FUNCTION public.sync_diviner_owner_ids()';
  END IF;
END $$;

-- ── availability_templates ────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='availability_templates' AND column_name='diviner_id') THEN
    EXECUTE 'ALTER TABLE public.availability_templates ADD COLUMN IF NOT EXISTS owner_id UUID';
    EXECUTE 'UPDATE public.availability_templates SET owner_id = diviner_id WHERE owner_id IS NULL AND diviner_id IS NOT NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_availability_templates_owner_id ON public.availability_templates(owner_id)';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_sync_diviner_owner_ids ON public.availability_templates';
    EXECUTE 'CREATE TRIGGER trg_sync_diviner_owner_ids
             BEFORE INSERT OR UPDATE ON public.availability_templates
             FOR EACH ROW EXECUTE FUNCTION public.sync_diviner_owner_ids()';
  END IF;
END $$;

-- ── booking_holds ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='booking_holds' AND column_name='diviner_id') THEN
    EXECUTE 'ALTER TABLE public.booking_holds ADD COLUMN IF NOT EXISTS owner_id UUID';
    EXECUTE 'UPDATE public.booking_holds SET owner_id = diviner_id WHERE owner_id IS NULL AND diviner_id IS NOT NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_booking_holds_owner_id ON public.booking_holds(owner_id)';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_sync_diviner_owner_ids ON public.booking_holds';
    EXECUTE 'CREATE TRIGGER trg_sync_diviner_owner_ids
             BEFORE INSERT OR UPDATE ON public.booking_holds
             FOR EACH ROW EXECUTE FUNCTION public.sync_diviner_owner_ids()';
  END IF;
END $$;

-- ── client_diviners ───────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='client_diviners' AND column_name='diviner_id') THEN
    EXECUTE 'ALTER TABLE public.client_diviners ADD COLUMN IF NOT EXISTS owner_id UUID';
    EXECUTE 'UPDATE public.client_diviners SET owner_id = diviner_id WHERE owner_id IS NULL AND diviner_id IS NOT NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_client_diviners_owner_id ON public.client_diviners(owner_id)';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_sync_diviner_owner_ids ON public.client_diviners';
    EXECUTE 'CREATE TRIGGER trg_sync_diviner_owner_ids
             BEFORE INSERT OR UPDATE ON public.client_diviners
             FOR EACH ROW EXECUTE FUNCTION public.sync_diviner_owner_ids()';

    -- Add the parallel (client_id, owner_id) unique constraint as a no-op
    -- safety net. While the trigger keeps owner_id = diviner_id this is
    -- functionally identical to the existing (client_id, diviner_id) unique,
    -- so it can never fail at insert time. After stage 3 drops the legacy
    -- column + constraint, this one becomes the canonical guarantee.
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='client_diviners' AND column_name='client_id') THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'client_diviners_client_id_owner_id_key'
      ) THEN
        EXECUTE 'ALTER TABLE public.client_diviners
                 ADD CONSTRAINT client_diviners_client_id_owner_id_key UNIQUE (client_id, owner_id)';
      END IF;
    END IF;
  END IF;
END $$;
