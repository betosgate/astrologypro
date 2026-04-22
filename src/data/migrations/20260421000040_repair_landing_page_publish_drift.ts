// Bundled mirror of supabase/migrations/20260421000040_repair_landing_page_publish_drift.sql
//
// Deploy 0 hotfix — resyncs diviner_services.is_published with the builder's
// service_landing_pages.status for rows drifted by the 2026-04-21 bug.
//
// Idempotent (WHERE clause self-excludes already-correct rows). No schema
// changes, no deletes. See
// docs/tasks/2026-04-21/landing-page-simplification/06-data-repair.md.

export const MIGRATION_SQL = `
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
`;
