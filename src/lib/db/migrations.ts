import { MIGRATION_SQL as MIG_20260408000106 } from "@/data/migrations/20260408000106_astro_decan_new_infos";
import { MIGRATION_SQL as MIG_20260408000107 } from "@/data/migrations/20260408000107_astro_system_settings";
import { MIGRATION_SQL as MIG_20260408000108 } from "@/data/migrations/20260408000108_owner_id_additive";
import { MIGRATION_SQL as MIG_20260408000109 } from "@/data/migrations/20260408000109_calendar_connections";
import { MIGRATION_SQL as MIG_20260408000110 } from "@/data/migrations/20260408000110_backfill_calendar_connections";

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
  "20260408000107_astro_system_settings": {
    id: "20260408000107_astro_system_settings",
    title: "Astro System Settings (centralised credentials + URLs)",
    description:
      "Creates astro_system_settings table with three types: ASTROLOGY_API (key+secret pairs), FREEASTROLOGY_API (key only), SYSTEM_CONFIG (named URLs/values like ASTRO_AI_API_URL). Backfills existing astrology_api_keys rows as ASTROLOGY_API entries. Additive — does not drop the old table. Idempotent via UNIQUE (type, key_name).",
    sortKey: "20260408000107",
    sql: MIG_20260408000107,
  },
  "20260408000108_owner_id_additive": {
    id: "20260408000108_owner_id_additive",
    title: "diviner_id → owner_id additive (STAGE 1 of 3)",
    description:
      "Stage 1 of the additive rename. Adds owner_id UUID column to bookings, services, availability_slots, availability_overrides, availability_templates, booking_holds, client_diviners (IF NOT EXISTS), backfills from diviner_id, indexes the new column, and attaches a BEFORE INSERT OR UPDATE trigger that keeps both columns in sync. Adds a parallel UNIQUE (client_id, owner_id) on client_diviners. SAFE: nothing is dropped — every existing query that reads or writes diviner_id keeps working. Stage 2 (code rename PR) and stage 3 (drop diviner_id) are separate, NOT in this migration.",
    sortKey: "20260408000108",
    sql: MIG_20260408000108,
  },
  "20260408000109_calendar_connections": {
    id: "20260408000109_calendar_connections",
    title: "calendar_connections (normalized OAuth token store)",
    description:
      "Creates calendar_connections table — normalized OAuth calendar token store keyed on (user_id, provider), with owner_id alongside for the diviner_id → owner_id rename. Replaces diviners.google_calendar_token / outlook_calendar_token JSONB columns. Hardened beyond the original spec: RLS enabled with service_role + own-row policies (no cross-user token reads possible), updated_at trigger, indexes on user_id and owner_id, CHECK constraint on provider. Additive — does not touch the existing diviners columns. Should run after 20260408000108 (owner_id additive).",
    sortKey: "20260408000109",
    sql: MIG_20260408000109,
  },
  "20260408000110_backfill_calendar_connections": {
    id: "20260408000110_backfill_calendar_connections",
    title: "Backfill calendar_connections from diviners JSONB",
    description:
      "One-shot backfill. Reads every existing diviners.google_calendar_token (extracted from JSONB scalar string) and diviners.outlook_calendar_token (parsed as JSONB object) and inserts a normalized row into calendar_connections. owner_id ← diviners.id; user_id ← diviners.user_id. Idempotent via ON CONFLICT (user_id, provider) DO NOTHING — re-running is safe. Source columns are NOT touched. Run AFTER 20260408000109.",
    sortKey: "20260408000110",
    sql: MIG_20260408000110,
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
