-- 20260428000002_drop_section_type_fk.sql
--
-- Follow-up cleanup for the V2 landing-page simplification.
--
-- The V2 destructive migration (20260428000001) renamed
-- service_landing_page_sections → diviner_service_blocks and tightened
-- the section_type CHECK to ('text','image','html'). However it left
-- intact the legacy FK that joined section_type to section_type_config,
-- a V1 registry table still seeded with the old 15 section types
-- (hero, bio, pricing, …). Inserts of 'text'/'image'/'html' therefore
-- fail with FK violation.
--
-- section_type_config is no longer referenced by live code (verified via
-- grep) — the V2 catalog lives in src/lib/landing-page-section-types.ts.
-- Drop both the FK and the now-orphan table.
--
-- Idempotent. No data loss beyond the V1 registry rows.

BEGIN;

-- Drop the legacy FK on diviner_service_blocks.section_type.
ALTER TABLE diviner_service_blocks
  DROP CONSTRAINT IF EXISTS service_landing_page_sections_section_type_fkey;

-- The registry table is unreachable from V2 code. Remove it entirely.
DROP TABLE IF EXISTS section_type_config CASCADE;

COMMIT;
