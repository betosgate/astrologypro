-- =============================================================================
-- Task 01 — Landing Page Simplification — additive schema migration
-- Sprint: 2026-04-21 (landing-page-simplification)
-- =============================================================================
-- Prepares the data layer for the V2 flow WITHOUT dropping anything:
--   1. service_landing_page_sections.slot column (TEXT, nullable, CHECK)
--   2. Backfill slot for existing rows (system → NULL, bio/about/testimonials
--      → 'about_diviner', everything else → 'extra')
--   3. CREATE OR REPLACE VIEW diviner_service_blocks — V2 read surface
--   4. Deprecation COMMENTs on columns scheduled for DROP in Deploy 2
--   5. Index aligned with the V2 read pattern
--
-- Strictly ADDITIVE + IDEMPOTENT — safe to re-run via /admin/db/migrations.
-- No DROPs, no destructive ALTERs. Deploy 2 (07-destructive-migration.md)
-- runs after a 1-week cooling period with the LANDING_PAGE_V2 flag at 100%.
-- =============================================================================

-- ── 1. slot column ───────────────────────────────────────────────────────────
ALTER TABLE service_landing_page_sections
  ADD COLUMN IF NOT EXISTS slot TEXT;

-- CHECK guarded via DROP/ADD so re-runs pick up an updated allowlist cleanly.
ALTER TABLE service_landing_page_sections
  DROP CONSTRAINT IF EXISTS service_landing_page_sections_slot_check;

ALTER TABLE service_landing_page_sections
  ADD CONSTRAINT service_landing_page_sections_slot_check
  CHECK (slot IS NULL OR slot IN ('about_diviner', 'extra'));

-- ── 2. Backfill ──────────────────────────────────────────────────────────────
-- Rules:
--   hero / pricing / booking_cta  → leave slot = NULL (legacy template
--       already renders these; marked for is_enabled=false in Deploy 2)
--   bio / about / testimonials    → 'about_diviner'
--   everything else               → 'extra'
-- Guarded by WHERE slot IS NULL so re-runs are no-ops.
UPDATE service_landing_page_sections
SET slot = CASE
  WHEN section_type IN ('hero', 'pricing', 'booking_cta') THEN NULL
  WHEN section_type IN ('bio', 'about', 'testimonials')   THEN 'about_diviner'
  ELSE 'extra'
END
WHERE slot IS NULL;

-- ── 3. Index for the V2 read pattern ────────────────────────────────────────
-- "Give me all enabled blocks for (diviner, landing_page) grouped by slot,
--  ordered by display_order"
CREATE INDEX IF NOT EXISTS idx_slps_diviner_template_slot_order
  ON service_landing_page_sections (diviner_id, landing_page_id, slot, display_order)
  WHERE is_enabled = true AND slot IS NOT NULL;

-- ── 4. V2 read-surface view ─────────────────────────────────────────────────
-- Only the columns V2 code reads. Skips system sections (slot IS NULL).
-- Deploy 2 renames the physical table to diviner_service_blocks and drops
-- the view.
CREATE OR REPLACE VIEW diviner_service_blocks AS
SELECT
  s.id,
  s.diviner_id,
  s.landing_page_id,
  lp.service_template_id,
  s.section_type,
  s.slot,
  s.title,
  s.content_json,
  s.body_html,
  s.primary_image_url,
  s.display_order,
  s.is_enabled,
  s.moderation_status,
  s.moderation_note,
  s.created_at,
  s.updated_at,
  s.created_by,
  s.updated_by
FROM service_landing_page_sections s
JOIN service_landing_pages lp ON lp.id = s.landing_page_id
WHERE s.slot IS NOT NULL;

COMMENT ON VIEW diviner_service_blocks IS
  'V2 read surface for diviner landing-page blocks. Hides deprecated columns and system sections (slot IS NULL). Replaced by a real table in Deploy 2.';

-- ── 5. Deprecation comments ─────────────────────────────────────────────────
COMMENT ON COLUMN diviner_services.publish_status IS
  'DEPRECATED as of 2026-04-21. Redundant with is_published. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_pages.status IS
  'DEPRECATED as of 2026-04-21. No more page-level publish lifecycle under V2. Scheduled for DROP with the whole table in Deploy 2.';

COMMENT ON COLUMN service_landing_pages.slug IS
  'DEPRECATED as of 2026-04-21. URL comes from services.slug under V2. Scheduled for DROP with the whole table in Deploy 2.';

COMMENT ON COLUMN service_landing_pages.custom_page_title IS
  'DEPRECATED as of 2026-04-21. SEO derived from service data under V2. Scheduled for DROP with the whole table in Deploy 2.';

COMMENT ON COLUMN service_landing_pages.custom_seo_title IS
  'DEPRECATED as of 2026-04-21. Scheduled for DROP with the whole table in Deploy 2.';

COMMENT ON COLUMN service_landing_pages.custom_seo_description IS
  'DEPRECATED as of 2026-04-21. Scheduled for DROP with the whole table in Deploy 2.';

COMMENT ON COLUMN service_landing_pages.custom_og_image_url IS
  'DEPRECATED as of 2026-04-21. Scheduled for DROP with the whole table in Deploy 2.';

COMMENT ON COLUMN service_landing_pages.accent_color IS
  'DEPRECATED as of 2026-04-21. Legacy template uses fixed styling under V2. Scheduled for DROP with the whole table in Deploy 2.';

COMMENT ON COLUMN service_landing_pages.font_style IS
  'DEPRECATED as of 2026-04-21. Legacy template uses fixed typography under V2. Scheduled for DROP with the whole table in Deploy 2.';

COMMENT ON COLUMN service_landing_pages.published_at IS
  'DEPRECATED as of 2026-04-21. No page-level lifecycle under V2. Scheduled for DROP with the whole table in Deploy 2.';

COMMENT ON COLUMN service_landing_pages.unpublished_at IS
  'DEPRECATED as of 2026-04-21. No page-level lifecycle under V2. Scheduled for DROP with the whole table in Deploy 2.';

COMMENT ON COLUMN service_landing_page_sections.is_system IS
  'DEPRECATED as of 2026-04-21. No system sections under V2. Scheduled for DROP in Deploy 2.';

COMMENT ON COLUMN service_landing_page_sections.is_draft IS
  'DEPRECATED as of 2026-04-21. No draft/published split under V2. Scheduled for DROP in Deploy 2.';

COMMENT ON COLUMN service_landing_page_sections.draft_content_json IS
  'DEPRECATED as of 2026-04-21. Single content_json under V2. Scheduled for DROP in Deploy 2.';

COMMENT ON COLUMN service_landing_page_sections.draft_body_html IS
  'DEPRECATED as of 2026-04-21. Single body_html under V2. Scheduled for DROP in Deploy 2.';

COMMENT ON COLUMN service_landing_page_sections.published_content_json IS
  'DEPRECATED as of 2026-04-21. Single content_json under V2. Scheduled for DROP in Deploy 2.';

COMMENT ON COLUMN service_landing_page_sections.published_body_html IS
  'DEPRECATED as of 2026-04-21. Single body_html under V2. Scheduled for DROP in Deploy 2.';

COMMENT ON COLUMN service_landing_page_sections.instance_key IS
  'DEPRECATED as of 2026-04-21. Unused under V2. Scheduled for DROP in Deploy 2.';

COMMENT ON COLUMN service_landing_page_sections.subtitle IS
  'DEPRECATED as of 2026-04-21. Unused under V2. Scheduled for DROP in Deploy 2.';

COMMENT ON COLUMN service_landing_page_sections.images IS
  'DEPRECATED as of 2026-04-21. primary_image_url carries the single supported image under V2. Scheduled for DROP in Deploy 2.';
