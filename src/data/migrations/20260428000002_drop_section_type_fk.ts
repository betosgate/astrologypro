/**
 * TypeScript mirror of
 * supabase/migrations/20260428000002_drop_section_type_fk.sql.
 *
 * Follow-up to 20260428000001_landing_page_cleanup_destructive — drops the
 * legacy section_type FK (to the V1 section_type_config registry) that was
 * left behind by the rename, and removes the now-orphan registry table.
 * Idempotent.
 */

export const MIGRATION_SQL = `
BEGIN;

ALTER TABLE diviner_service_blocks
  DROP CONSTRAINT IF EXISTS service_landing_page_sections_section_type_fkey;

DROP TABLE IF EXISTS section_type_config CASCADE;

COMMIT;
`;
