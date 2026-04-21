// Bundled mirror of supabase/migrations/20260421000003_seed_central_chime_number.sql
//
// Keep this file in lock-step with the canonical .sql. Environment-
// specific seed migration that promotes the already-purchased Chime
// number (originally bought for test diviner 1) to status='central' in
// chime_phone_numbers, then severs its per-diviner binding.
//
// All placeholders substituted. phone_arn is deliberately NULL in the
// INSERT fallback — the Next.js app never reads phone_arn, and if
// migration 001's backfill already seeded this row with the real ARN
// from diviners.chime_sma_phone_arn, step 1's UPDATE preserves it.
//
// Idempotent: UPDATE is a no-op once status='central'; INSERT uses
// ON CONFLICT (phone_number) DO NOTHING.

export const MIGRATION_SQL = `
-- ─── 1. Promote existing pool row to 'central' ──────────────────────
UPDATE chime_phone_numbers
   SET status              = 'central',
       assigned_diviner_id = NULL,
       assigned_at         = NULL,
       notes               = COALESCE(notes || ' | ', '') ||
         'Promoted to central on 2026-04-21 for shared-number + PIN routing'
 WHERE phone_number = '+12162206209';


-- ─── 2. OR, if the number wasn't in the pool, insert it ─────────────
INSERT INTO chime_phone_numbers (phone_number, phone_arn, status, notes)
VALUES (
  '+12162206209',
  NULL,
  'central',
  'Seeded on 2026-04-21 as shared central for PIN routing'
)
ON CONFLICT (phone_number) DO NOTHING;


-- ─── 3. Preflight: refuse to sever if phone_mobile isn't set ────────
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
UPDATE diviners
   SET chime_phone_number  = NULL,
       chime_sma_phone_arn = NULL,
       chime_sip_rule_id   = NULL
 WHERE chime_phone_number  = '+12162206209';
`;
