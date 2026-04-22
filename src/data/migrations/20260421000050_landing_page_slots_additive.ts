// Bundled mirror of supabase/migrations/20260421000050_landing_page_slots_additive.sql
//
// Additive schema migration for landing-page simplification (Deploy 1).
// Adds slot column + CHECK, backfills, adds index, creates v2 view, annotates
// deprecated columns. Idempotent. No DROPs.
//
// See docs/tasks/2026-04-21/landing-page-simplification/01-schema-additive.md.

export const MIGRATION_SQL = `
ALTER TABLE service_landing_page_sections
  ADD COLUMN IF NOT EXISTS slot TEXT;

ALTER TABLE service_landing_page_sections
  DROP CONSTRAINT IF EXISTS service_landing_page_sections_slot_check;

ALTER TABLE service_landing_page_sections
  ADD CONSTRAINT service_landing_page_sections_slot_check
  CHECK (slot IS NULL OR slot IN ('about_diviner', 'extra'));

UPDATE service_landing_page_sections
SET slot = CASE
  WHEN section_type IN ('hero', 'pricing', 'booking_cta') THEN NULL
  WHEN section_type IN ('bio', 'about', 'testimonials')   THEN 'about_diviner'
  ELSE 'extra'
END
WHERE slot IS NULL;

CREATE INDEX IF NOT EXISTS idx_slps_diviner_template_slot_order
  ON service_landing_page_sections (diviner_id, landing_page_id, slot, display_order)
  WHERE is_enabled = true AND slot IS NOT NULL;

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
`;
