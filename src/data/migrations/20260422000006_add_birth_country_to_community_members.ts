// Bundled mirror of
// supabase/migrations/20260422000006_add_birth_country_to_community_members.sql
//
// Keep this file in lock-step with the canonical .sql. Both are executed
// (canonical .sql via `node scripts/run-migration.js`, this mirror via the
// admin UI at /admin/db/migrations which imports MIGRATIONS from
// src/lib/db/migrations.ts).
//
// Purpose: adds the `birth_country` column to `community_members` so that
// `/community/profile` can persist Birth Country and `resolveUserBirthData`
// can return it to the shared HoroscopeToolkitPage (`/community/horoscope`).
// Without this column the Horoscope page is permanently stuck on the
// "missing Birth country" card even after the member completes the profile
// form. Companion migration `20260421000010_repair_family_birth_country.sql`
// already back-fills the sibling `community_family_members.birth_country`
// column from city-label tails.
//
// Strictly NON-destructive + idempotent: `ADD COLUMN IF NOT EXISTS` — safe
// to re-run on DBs that already have the column (no error, no-op). Can be
// run from /admin/db/migrations.

export const MIGRATION_SQL = `
ALTER TABLE community_members
  ADD COLUMN IF NOT EXISTS birth_country VARCHAR(100);
`;
