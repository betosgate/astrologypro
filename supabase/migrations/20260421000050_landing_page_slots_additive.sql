-- 20260421000050_landing_page_slots_additive.sql
--
-- Additive schema migration for the landing-page simplification (Deploy 1).
-- Safe to re-run. No DROPs. No data migrations on other tables.
--
-- What it does:
--   1. Adds a nullable `slot` column to service_landing_page_sections with a
--      CHECK constraint ('about_diviner' | 'extra' | NULL). NULL is reserved
--      for legacy system sections (hero / pricing / booking_cta) so the V2
--      view filters them out without a destructive delete.
--   2. Backfills slot values on existing rows.
--   3. Adds an index aligned with the new read pattern.
--   4. Creates a read-only VIEW `diviner_service_blocks` that presents only
--      the columns V2 code will use. Deploy 2 will rename the physical table
--      to this name.
--   5. Tags every deprecated column with a COMMENT that will surface in \d
--      output and Supabase Studio.
--
-- See docs/tasks/2026-04-21/landing-page-simplification/01-schema-additive.md.

-- ── 1. Add slot column + CHECK ────────────────────────────────────────────────

ALTER TABLE service_landing_page_sections
  ADD COLUMN IF NOT EXISTS slot TEXT;

ALTER TABLE service_landing_page_sections
  DROP CONSTRAINT IF EXISTS service_landing_page_sections_slot_check;

ALTER TABLE service_landing_page_sections
  ADD CONSTRAINT service_landing_page_sections_slot_check
  CHECK (slot IS NULL OR slot IN ('about_diviner', 'extra'));

-- ── 2. Backfill slot values ───────────────────────────────────────────────────
-- Rules:
--   hero / pricing / booking_cta  → leave slot = NULL (legacy system sections;
--                                     V2 view filters these out)
--   bio / about / testimonials    → 'about_diviner'
--   everything else               → 'extra'

UPDATE service_landing_page_sections
SET slot = CASE
  WHEN section_type IN ('hero', 'pricing', 'booking_cta') THEN NULL
  WHEN section_type IN ('bio', 'about', 'testimonials')   THEN 'about_diviner'
  ELSE 'extra'
END
WHERE slot IS NULL;

-- ── 3. Index aligned with new read pattern ───────────────────────────────────
--
-- "Give me all enabled blocks for (diviner, template) grouped by slot, ordered
--  by display_order." Deploy 2 will rebuild this with service_template_id once
--  the column is promoted onto the sections table.

CREATE INDEX IF NOT EXISTS idx_slps_diviner_template_slot_order
  ON service_landing_page_sections (diviner_id, landing_page_id, slot, display_order)
  WHERE is_enabled = true AND slot IS NOT NULL;

-- ── 4. Read-only V2 view ──────────────────────────────────────────────────────
--
-- Presents only the columns the simplified code uses, under the target name.
-- Deploy 2 drops this view and renames the physical sections table to
-- diviner_service_blocks.

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
  'V2 read surface for diviner landing-page blocks. Hides deprecated columns and legacy system sections (slot IS NULL). Replaced by a real table in Deploy 2 of landing-page-simplification.';

-- ── 5. Deprecation comments ──────────────────────────────────────────────────
--
-- Every deprecated column gets a COMMENT ending with "Scheduled for DROP in
-- Deploy 2" so the intent is visible in \d output and Supabase Studio.

COMMENT ON COLUMN diviner_services.publish_status IS
  'DEPRECATED as of 2026-04-21. Redundant with is_published. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_pages.status IS
  'DEPRECATED as of 2026-04-21. No more page-level publish lifecycle under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_pages.slug IS
  'DEPRECATED as of 2026-04-21. URL comes from services.slug under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_pages.custom_page_title IS
  'DEPRECATED as of 2026-04-21. SEO derived from service data under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_pages.custom_seo_title IS
  'DEPRECATED as of 2026-04-21. SEO derived from service data under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_pages.custom_seo_description IS
  'DEPRECATED as of 2026-04-21. SEO derived from service data under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_pages.custom_og_image_url IS
  'DEPRECATED as of 2026-04-21. SEO derived from service data under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_pages.accent_color IS
  'DEPRECATED as of 2026-04-21. No per-page theme under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_pages.font_style IS
  'DEPRECATED as of 2026-04-21. No per-page theme under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_pages.published_at IS
  'DEPRECATED as of 2026-04-21. Publish state lives on diviner_services.is_published under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_pages.unpublished_at IS
  'DEPRECATED as of 2026-04-21. Publish state lives on diviner_services.is_published under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_pages.draft_version IS
  'DEPRECATED as of 2026-04-21. No draft versioning under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_pages.published_version IS
  'DEPRECATED as of 2026-04-21. No publish versioning under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_pages.moderation_status IS
  'DEPRECATED as of 2026-04-21. Moderation lives at the block level under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_pages.moderation_note IS
  'DEPRECATED as of 2026-04-21. Moderation lives at the block level under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_pages.moderated_by IS
  'DEPRECATED as of 2026-04-21. Moderation lives at the block level under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_pages.moderated_at IS
  'DEPRECATED as of 2026-04-21. Moderation lives at the block level under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_page_sections.is_system IS
  'DEPRECATED as of 2026-04-21. No system sections under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_page_sections.is_draft IS
  'DEPRECATED as of 2026-04-21. No draft/published split under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_page_sections.draft_content_json IS
  'DEPRECATED as of 2026-04-21. Single content_json under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_page_sections.draft_body_html IS
  'DEPRECATED as of 2026-04-21. Single body_html under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_page_sections.published_content_json IS
  'DEPRECATED as of 2026-04-21. Single content_json under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_page_sections.published_body_html IS
  'DEPRECATED as of 2026-04-21. Single body_html under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_page_sections.instance_key IS
  'DEPRECATED as of 2026-04-21. Not used by V2 block model. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_page_sections.subtitle IS
  'DEPRECATED as of 2026-04-21. Title-only under V2. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_page_sections.images IS
  'DEPRECATED as of 2026-04-21. V2 image block uses primary_image_url only. Scheduled for DROP in Deploy 2 of landing-page-simplification.';
