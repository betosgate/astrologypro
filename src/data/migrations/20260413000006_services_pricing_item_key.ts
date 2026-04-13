// AUTO-GENERATED bundled mirror of supabase/migrations/20260413000006_services_pricing_item_key.sql
// Used by /api/admin/db/migrate so the deployed function does not need fs.

export const MIGRATION_SQL = `-- ============================================================================
-- Add pricing_item_key to services
--
-- Stores the global_pricing item_key selected when creating/editing a service
-- so the admin UI can re-populate the Pricing Item dropdown on edit.
--
-- Idempotent / additive only.
-- ============================================================================

ALTER TABLE services ADD COLUMN IF NOT EXISTS pricing_item_key TEXT;

CREATE INDEX IF NOT EXISTS idx_services_pricing_item_key
  ON services (pricing_item_key)
  WHERE pricing_item_key IS NOT NULL;
`;
