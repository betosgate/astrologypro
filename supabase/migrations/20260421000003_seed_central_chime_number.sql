-- ═══════════════════════════════════════════════════════════════════
-- Migration: 20260421000003_seed_central_chime_number
-- Purpose:  Promote the already-purchased Chime number (originally bought
--           for test diviner 1) to status='central' in chime_phone_numbers
--           so it becomes the shared entry point for PIN-based routing.
--
-- Operational: all placeholders are substituted. The number
-- +12162206209 is the shared central. phone_arn is deliberately NULL
-- in the INSERT fallback — the Next.js app never reads phone_arn, and
-- if migration 001's backfill already seeded this row with the real
-- ARN from diviners.chime_sma_phone_arn, step 1's UPDATE preserves
-- it (UPDATE does not touch phone_arn). If the row isn't in the pool
-- yet, step 2 inserts a clean NULL instead of a dummy value.
--
-- Also verify that diviners.phone_mobile is populated for test diviner 1
-- — the SMA Lambda will bridge PIN-matched calls to that mobile number.
--
-- Idempotent:
--   • UPDATE uses WHERE phone_number = ... ; re-running is a no-op once
--     status is already 'central'.
--   • INSERT ... ON CONFLICT (phone_number) DO NOTHING.
--   • UPDATE diviners ... WHERE chime_phone_number = ... ; no-op on re-run.
--
-- Rollback:
--   UPDATE chime_phone_numbers
--      SET status = 'retired'
--    WHERE phone_number = '+12162206209';
--   -- (or restore the assigned_diviner_id/assigned_at + status='assigned'
--   --  and re-set diviners.chime_phone_number if you want to fully
--   --  revert the ownership flip).
-- ═══════════════════════════════════════════════════════════════════


-- ─── 1. Promote existing pool row to 'central' ──────────────────────
-- If 001's backfill already inserted this number as 'assigned' (because
-- diviners.chime_phone_number was set), flip it. No-op if the number
-- isn't in the pool yet — step 2 handles that case.
UPDATE chime_phone_numbers
   SET status              = 'central',
       assigned_diviner_id = NULL,
       assigned_at         = NULL,
       notes               = COALESCE(notes || ' | ', '') ||
         'Promoted to central on 2026-04-21 for shared-number + PIN routing'
 WHERE phone_number = '+12162206209';


-- ─── 2. OR, if the number wasn't in the pool, insert it ─────────────
-- Safe with ON CONFLICT (phone_number) DO NOTHING because of the UNIQUE
-- index on phone_number.
INSERT INTO chime_phone_numbers (phone_number, phone_arn, status, notes)
VALUES (
  '+12162206209',
  NULL,
  'central',
  'Seeded on 2026-04-21 as shared central for PIN routing'
)
ON CONFLICT (phone_number) DO NOTHING;


-- ─── 3. Preflight: refuse to sever if phone_mobile isn't set ────────
-- The SMA Lambda bridges PIN-matched calls to diviners.phone_mobile.
-- If we clear chime_phone_number on a diviner whose phone_mobile is
-- empty, PIN-matched calls would have nowhere to go. Fail the migration
-- here (inside the same transaction as the UPDATE that follows) rather
-- than discovering it at call time.
DO $$
DECLARE
  severing_diviner RECORD;
BEGIN
  FOR severing_diviner IN
    SELECT id, display_name, phone_mobile
      FROM diviners
     WHERE chime_phone_number = '+12162206209'
  LOOP
    IF severing_diviner.phone_mobile IS NULL
       OR btrim(severing_diviner.phone_mobile) = '' THEN
      RAISE EXCEPTION
        'Cannot sever central number: diviner % (%) has no phone_mobile set. '
        'Populate diviners.phone_mobile (E.164) before running this migration — '
        'the SMA Lambda bridges PIN-matched calls to phone_mobile.',
        severing_diviner.id, severing_diviner.display_name;
    END IF;
  END LOOP;
END$$;


-- ─── 4. Sever test diviner 1's per-diviner binding ──────────────────
-- The number is now central, not owned by one diviner. Clear the chime
-- columns on whatever diviner row still points to it. phone_provider is
-- intentionally left alone: its CHECK constraint only allows
-- ('twilio','chime'), so we can't set it to 'none' without widening
-- the constraint — a separate refactor story. With chime_phone_number
-- cleared, the per-diviner lookup route no longer resolves to this
-- diviner, so provider selection becomes moot in practice.
UPDATE diviners
   SET chime_phone_number  = NULL,
       chime_sma_phone_arn = NULL,
       chime_sip_rule_id   = NULL
 WHERE chime_phone_number  = '+12162206209';
