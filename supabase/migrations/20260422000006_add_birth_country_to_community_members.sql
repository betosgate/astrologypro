-- ============================================================
-- Add birth_country to community_members for full natal chart readiness
--
-- Context: required by the shared HoroscopeToolkitPage
-- (`/community/horoscope`) and by `resolveUserBirthData()`. Without
-- this column, the profile form cannot persist Birth Country and the
-- Horoscope page is stuck on the "missing Birth country" card even
-- after the user completes the profile form.
--
-- Idempotent: `ADD COLUMN IF NOT EXISTS` — safe to re-apply on DBs
-- that already have the column (no error, no-op). Companion migration
-- `20260421000010_repair_family_birth_country.sql` handles backfilling
-- the sibling `community_family_members.birth_country` column from
-- city-label tails.
--
-- Re-timestamped from an earlier 20260413 slot so it is guaranteed to
-- be picked up on the next `supabase db push` / `run-migration.js`
-- pass, regardless of migration-history state.
-- ============================================================

ALTER TABLE community_members
  ADD COLUMN IF NOT EXISTS birth_country VARCHAR(100);
