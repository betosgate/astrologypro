// Bundled mirror of supabase/migrations/20260418000001_service_toolkit_session.sql
//
// Keep this file in lock-step with the canonical .sql. Both are executed
// (canonical .sql via `node scripts/run-migration.js`, this mirror via the
// admin UI at /admin/db/migrations which imports MIGRATIONS from
// src/lib/db/migrations.ts).
//
// Purpose: Support the "Open Service" feature so a diviner can jump from a
// booking straight into the matching admin toolkit (Horoscope tab or Tarot
// spread) with client birth data pre-populated.
//
// Strictly ADDITIVE (CLAUDE.md §5 + §7): two new nullable columns on
// bookings and one partial index. No backfill, no RLS changes, no drops.

export const MIGRATION_SQL = `
-- ── 1. Partner birth data (JSONB) for 2-person astrology services ──────────
-- Shape when populated (example):
-- {
--   "partner_full_name": "Jane Doe",
--   "partner_birth_date": "1990-04-12",
--   "partner_birth_time": "14:30",
--   "partner_birth_city":  "San Francisco, USA",
--   "partner_birth_lat":   37.7749,
--   "partner_birth_lng":  -122.4194,
--   "partner_birth_timezone": "America/Los_Angeles"
-- }
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS partner_birth_data JSONB;

COMMENT ON COLUMN bookings.partner_birth_data IS
  'Optional partner birth data for 2-person astrology services '
  '(romantic-relationships, friendship-relationships, business-relationship). '
  'NULL for single-person and tarot bookings. See service-toolkit-mapping.ts '
  'TWO_PERSON_ASTROLOGY_SLUGS.';

-- ── 2. Telemetry: when did the diviner first open the toolkit session? ─────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS toolkit_session_opened_at TIMESTAMPTZ;

COMMENT ON COLUMN bookings.toolkit_session_opened_at IS
  'First time the assigned diviner (or admin) opened /admin/session/<id>. '
  'Used for measuring toolkit session adoption. NULL = never opened.';

-- ── 3. Lightweight partial index for "how many bookings have partner data?" ─
CREATE INDEX IF NOT EXISTS bookings_partner_birth_data_present_idx
  ON bookings ((partner_birth_data IS NOT NULL))
  WHERE partner_birth_data IS NOT NULL;
`;
