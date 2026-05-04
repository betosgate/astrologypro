// Bundled mirror of supabase/migrations/20260504000001_training_lessons_audio_url.sql
// Used by /api/admin/db/migrate so the deployed Vercel function does not need fs access.
// Keep this file in sync if the canonical .sql file changes.

export const MIGRATION_SQL = `-- Mystery School / Admin Training unification — Phase 2
-- Spec: docs/tasks/2026-04-30/mystery-school-admin-training-unification.md
--
-- Adds first-class audio support to training lessons so admins can attach
-- a dedicated audio asset (meditation, weekly intro, guided practice) to a
-- training lesson without overloading \`video_url\` or pasting an external URL
-- into the freeform \`content\` field.
--
-- This migration is intentionally additive only:
--   - new column is nullable
--   - no existing rows are touched
--   - no constraints, indexes, or RLS changes
-- It is therefore backward-safe: every existing read/write path that does
-- not mention audio_url continues to work unchanged.

ALTER TABLE training_lessons
  ADD COLUMN IF NOT EXISTS audio_url TEXT;

COMMENT ON COLUMN training_lessons.audio_url IS
  'Optional uploaded or external URL for a single audio asset (e.g. meditation, weekly intro). '
  'Added 2026-05-04 for Mystery School Foundation training migration.';
`;
