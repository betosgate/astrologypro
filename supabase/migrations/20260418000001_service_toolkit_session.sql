-- ============================================================================
-- Migration: service_toolkit_session
-- Date:      2026-04-18
-- Purpose:   Support the "Open Service" feature that routes a diviner from
--            a booking directly into the matching admin toolkit (Horoscope
--            tab or Tarot spread) with client birth data pre-populated.
--
-- This migration is strictly ADDITIVE per CLAUDE.md §5 and §7:
--   - New nullable column `partner_birth_data` on `bookings` for the 3
--     two-person astrology services (romantic / friendship / business).
--     Nothing reads it until the booking-wizard change lands, nothing breaks
--     if it stays NULL forever.
--   - New nullable column `toolkit_session_opened_at` on `bookings` for
--     optional telemetry so we can later measure "how often did diviners
--     actually use the Open Service link". NULL default, no backfill.
--
-- NO destructive operations. NO data backfill. NO RLS changes.
-- Rolling back == dropping these two columns (safe — no code hard-depends
-- on either being present once feature flag is off).
-- ============================================================================

BEGIN;

-- ── 1. Partner birth data (JSONB) for 2-person astrology services ──────────
-- Shape when populated (all fields optional except partner_full_name
-- + partner_birth_date; the horoscope toolkit rejects submissions that
-- are incomplete, so NULL-to-empty is treated as "not yet captured"):
-- {
--   "partner_full_name": "Jane Doe",
--   "partner_birth_date": "1990-04-12",          -- YYYY-MM-DD
--   "partner_birth_time": "14:30",               -- HH:MM (optional)
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

-- ── 3. Lightweight index for partner_birth_data presence (not the payload) ─
-- Only useful when operators report on "how many 2-person bookings have
-- partner data filled in?" — a single nullable check, cheap B-tree.

CREATE INDEX IF NOT EXISTS bookings_partner_birth_data_present_idx
  ON bookings ((partner_birth_data IS NOT NULL))
  WHERE partner_birth_data IS NOT NULL;

COMMIT;

-- ── Rollback (manual, not run automatically) ───────────────────────────────
-- BEGIN;
--   DROP INDEX IF EXISTS bookings_partner_birth_data_present_idx;
--   ALTER TABLE bookings DROP COLUMN IF EXISTS toolkit_session_opened_at;
--   ALTER TABLE bookings DROP COLUMN IF EXISTS partner_birth_data;
-- COMMIT;
