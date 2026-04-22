-- 20260428000001_landing_page_cleanup_destructive.sql
--
-- DESTRUCTIVE. Deploy 2 of the 2026-04-21 landing-page simplification.
--
-- ⚠️  DO NOT RUN until the pre-flight checklist in
--     docs/tasks/2026-04-21/landing-page-simplification/07-destructive-migration.md
--     is fully satisfied. This migration is INTENTIONALLY NOT registered in
--     src/lib/db/migrations.ts so the on-demand runner at /admin/db/migrations
--     cannot invoke it. It must be applied through a controlled deploy process
--     with a fresh DB backup, rollback rehearsal, and eng+product sign-off.
--
-- What it does:
--   1. Drop the Deploy-1 view `diviner_service_blocks` to free up the name.
--   2. Backfill service_template_id onto service_landing_page_sections from
--      the still-present landing_page_id FK.
--   3. Drop landing_page_id (and its FK) now that service_template_id covers it.
--   4. Drop the service_landing_pages container table (CASCADE).
--   5. Drop diviner_services.publish_status (is_published is the source of truth).
--   6. Purge rows that would violate the new section_type and slot CHECK
--      constraints BEFORE those constraints are added (Postgres will reject
--      ADD CONSTRAINT on a table with violating rows).
--   7. Rename service_landing_page_sections → diviner_service_blocks.
--   8. Drop deprecated columns: is_system, is_draft, draft_*, published_*,
--      instance_key, subtitle, images.
--   9. Tighten section_type CHECK to ('text', 'image', 'html').
--  10. Tighten slot CHECK to ('about_diviner', 'extra') and promote NOT NULL.
--  11. Rebuild the slot+order index under the new table name.
--  12. Final COMMENT.
--
-- Ordering notes:
--   - View drop must precede anything that would collide with the rename.
--   - Backfill must precede the drop of landing_page_id.
--   - Purges must precede the tighter CHECK constraints.
--   - Rename splits the migration: everything before uses the old name,
--     everything after uses the new name.
--
-- The whole thing runs in one BEGIN/COMMIT so any failure rolls back.

BEGIN;

-- STEP 1 — Drop the Deploy-1 view to free up the `diviner_service_blocks` name.
DROP VIEW IF EXISTS diviner_service_blocks;

-- STEP 2 — Add service_template_id and backfill from landing_page_id FK.
ALTER TABLE service_landing_page_sections
  ADD COLUMN IF NOT EXISTS service_template_id UUID;

UPDATE service_landing_page_sections s
SET service_template_id = lp.service_template_id
FROM service_landing_pages lp
WHERE s.landing_page_id = lp.id
  AND s.service_template_id IS NULL;

ALTER TABLE service_landing_page_sections
  ALTER COLUMN service_template_id SET NOT NULL;

ALTER TABLE service_landing_page_sections
  ADD CONSTRAINT service_landing_page_sections_template_fkey
  FOREIGN KEY (service_template_id)
  REFERENCES service_templates(id)
  ON DELETE CASCADE;

-- STEP 3 — Drop landing_page_id FK + column now that service_template_id
-- carries the parent reference.
ALTER TABLE service_landing_page_sections
  DROP CONSTRAINT IF EXISTS service_landing_page_sections_landing_page_id_fkey;

ALTER TABLE service_landing_page_sections
  DROP COLUMN IF EXISTS landing_page_id;

-- STEP 4 — Drop the container table. Nothing references it any more.
DROP TABLE IF EXISTS service_landing_pages CASCADE;

-- STEP 5 — Drop diviner_services.publish_status. is_published is the SoT.
ALTER TABLE diviner_services
  DROP COLUMN IF EXISTS publish_status;

-- STEP 6 — Purge rows that would violate the tighter CHECKs.
DELETE FROM service_landing_page_sections
WHERE section_type NOT IN ('text', 'image', 'html');

DELETE FROM service_landing_page_sections
WHERE slot IS NULL;

-- STEP 7 — Rename to the final table name.
ALTER TABLE service_landing_page_sections
  RENAME TO diviner_service_blocks;

-- STEP 8 — Drop deprecated columns.
ALTER TABLE diviner_service_blocks
  DROP COLUMN IF EXISTS is_system,
  DROP COLUMN IF EXISTS is_draft,
  DROP COLUMN IF EXISTS draft_content_json,
  DROP COLUMN IF EXISTS draft_body_html,
  DROP COLUMN IF EXISTS published_content_json,
  DROP COLUMN IF EXISTS published_body_html,
  DROP COLUMN IF EXISTS instance_key,
  DROP COLUMN IF EXISTS subtitle,
  DROP COLUMN IF EXISTS images;

-- STEP 9 — Tighten section_type CHECK.
ALTER TABLE diviner_service_blocks
  DROP CONSTRAINT IF EXISTS service_landing_page_sections_section_type_check;

ALTER TABLE diviner_service_blocks
  ADD CONSTRAINT diviner_service_blocks_section_type_check
  CHECK (section_type IN ('text', 'image', 'html'));

-- STEP 10 — Tighten slot CHECK and promote NOT NULL.
ALTER TABLE diviner_service_blocks
  DROP CONSTRAINT IF EXISTS service_landing_page_sections_slot_check;

ALTER TABLE diviner_service_blocks
  ADD CONSTRAINT diviner_service_blocks_slot_check
  CHECK (slot IN ('about_diviner', 'extra'));

ALTER TABLE diviner_service_blocks
  ALTER COLUMN slot SET NOT NULL;

-- STEP 11 — Final index.
DROP INDEX IF EXISTS idx_slps_diviner_template_slot_order;

CREATE INDEX IF NOT EXISTS idx_dsb_diviner_template_slot_order
  ON diviner_service_blocks (diviner_id, service_template_id, slot, display_order)
  WHERE is_enabled = true;

-- STEP 12 — Final COMMENT.
COMMENT ON TABLE diviner_service_blocks IS
  'V2 diviner landing-page blocks, scoped by (diviner_id, service_template_id, slot). Replaces service_landing_page_sections. See docs/tasks/2026-04-21/landing-page-simplification/00-master-task.md.';

COMMIT;
