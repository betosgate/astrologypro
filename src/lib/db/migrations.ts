import { MIGRATION_SQL as MIG_20260408000106 } from "@/data/migrations/20260408000106_astro_decan_new_infos";

/**
 * Allowlisted migrations that the admin migration runner can execute.
 *
 * Each migration is a TypeScript module under `src/data/migrations/` that
 * exports a `MIGRATION_SQL` template literal mirroring a real
 * `supabase/migrations/*.sql` file. The runner endpoint
 * `POST /api/admin/db/migrate` only accepts `migration_id` values that
 * exist in this map — the request body cannot supply arbitrary SQL.
 *
 * To add a new migration:
 *   1. Create `supabase/migrations/<id>.sql` (the canonical source).
 *   2. Mirror it as `src/data/migrations/<id>.ts` exporting `MIGRATION_SQL`.
 *   3. Add an entry to `MIGRATIONS` below.
 *   4. Apply locally via the admin UI at `/admin/db/migrations`.
 */
export interface MigrationDescriptor {
  id: string;
  title: string;
  description: string;
  /** SHA-style sortable id from the canonical .sql filename */
  sortKey: string;
  sql: string;
}

export const MIGRATIONS: Record<string, MigrationDescriptor> = {
  "20260408000106_astro_decan_new_infos": {
    id: "20260408000106_astro_decan_new_infos",
    title: "Astro Decan New Infos",
    description:
      "Creates astro_decan_new_infos table (planet/sign/decan reference content with tarot + Greek daemon mapping) and seeds 36 records ported from the legacy MongoDB collection. Idempotent: ON CONFLICT (mongo_id) DO NOTHING on every insert.",
    sortKey: "20260408000106",
    sql: MIG_20260408000106,
  },
};

/** List the allowlist in deterministic sortKey order. */
export function listMigrations(): Array<Omit<MigrationDescriptor, "sql">> {
  return Object.values(MIGRATIONS)
    .map(({ sql, ...meta }) => ({ ...meta, sql_length: sql.length }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey)) as Array<
    Omit<MigrationDescriptor, "sql">
  >;
}
