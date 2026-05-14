// AUTO-GENERATED bundled mirror of supabase/migrations/20260513000003_ingress_charts_legacy_mongo_import.sql
// Used by /api/admin/db/migrate so the deployed function does not need fs.

export const MIGRATION_SQL = `-- Ingress Charts: legacy MongoDB import support.
-- Additive only. Keeps the Mongo _id for idempotent imports and stores the
-- original source document so fields that do not have first-class Postgres
-- columns are still retained exactly for audit/backfill work.

ALTER TABLE ingress_charts
  ADD COLUMN IF NOT EXISTS mongo_id TEXT,
  ADD COLUMN IF NOT EXISTS legacy_user_id TEXT,
  ADD COLUMN IF NOT EXISTS legacy_year INTEGER,
  ADD COLUMN IF NOT EXISTS legacy_mongo_document JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS ingress_charts_mongo_id_uidx
  ON ingress_charts (mongo_id);

CREATE INDEX IF NOT EXISTS ingress_charts_legacy_user_id_idx
  ON ingress_charts (legacy_user_id);

CREATE INDEX IF NOT EXISTS ingress_charts_legacy_year_idx
  ON ingress_charts (legacy_year);

COMMENT ON COLUMN ingress_charts.mongo_id IS
  'Legacy MongoDB _id from the source ingress chart collection. Used as the idempotency key for imports.';

COMMENT ON COLUMN ingress_charts.legacy_user_id IS
  'Legacy MongoDB userId value from the source ingress chart document.';

COMMENT ON COLUMN ingress_charts.legacy_year IS
  'Legacy year value from the source ingress chart document.';

COMMENT ON COLUMN ingress_charts.legacy_mongo_document IS
  'Full legacy MongoDB ingress chart document serialized as relaxed Extended JSON.';
`;
