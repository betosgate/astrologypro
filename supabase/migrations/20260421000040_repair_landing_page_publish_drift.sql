-- 20260421000040_repair_landing_page_publish_drift.sql
--
-- Deploy 0 hotfix for the 2026-04-21 landing-page publish drift.
--
-- Context: the builder code path wrote `service_landing_pages.status = 'published'`
-- but failed to mirror that through to `diviner_services.is_published`. Dashboard
-- badges therefore showed "Published" while the public URL 404'd because the
-- route reads `diviner_services.is_published`.
--
-- This migration is a one-time repair. It is idempotent: the WHERE clause in the
-- UPDATE self-excludes rows that are already in the correct state, so re-running
-- is a no-op. No schema changes. No deletes.
--
-- See docs/tasks/2026-04-21/landing-page-simplification/06-data-repair.md.

-- ── Audit (reference only; included so the migration runner's log captures the
-- pre-repair shape in case we ever need to diff it against the snapshot).
--
-- Every row returned by this SELECT is a candidate for repair.
--
-- SELECT
--   ds.id                    AS diviner_services_id,
--   ds.diviner_id,
--   ds.template_id,
--   d.username,
--   st.slug                  AS template_slug,
--   ds.is_enabled,
--   ds.is_published,
--   ds.publish_status,
--   lp.status                AS landing_page_status,
--   lp.published_at          AS page_published_at,
--   ds.updated_at            AS ds_updated_at
-- FROM diviner_services ds
-- JOIN diviners d                 ON d.id = ds.diviner_id
-- JOIN service_templates st       ON st.id = ds.template_id
-- LEFT JOIN service_landing_pages lp
--   ON lp.diviner_id = ds.diviner_id
--  AND lp.service_template_id = ds.template_id
-- WHERE
--   lp.status = 'published'
--   AND ds.is_enabled = true
--   AND (ds.is_published = false OR ds.publish_status != 'published')
-- ORDER BY d.username, st.slug;

-- ── Repair: resync is_published + publish_status with the builder's own state.
--
-- Scoped to the specific row id captured in 06-data-repair.md so the migration
-- is explicit about what it touches. Additional drifted rows (if any were found
-- by the audit SELECT above) should be added by hand to the IN-list before
-- running in prod; the repair is intentionally conservative.

WITH to_repair AS (
  SELECT id
  FROM diviner_services
  WHERE id IN (
    'f67a4e4a-bd5c-40a4-b4f7-523b014c2bcf' -- test-diviner-1 / nativity-birth-chart
  )
  AND (is_published = false OR publish_status IS DISTINCT FROM 'published')
)
UPDATE diviner_services
SET
  is_published = true,
  publish_status = 'published',
  updated_at = NOW()
WHERE id IN (SELECT id FROM to_repair);
