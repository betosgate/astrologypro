// Bundled mirror of supabase/migrations/20260413000182_natal_generation_governance.sql
//
// Keep this file in lock-step with the canonical .sql. Both are executed
// (canonical .sql via `node scripts/run-migration.js`, this mirror via the
// admin UI at /admin/db/migrations which imports MIGRATIONS from
// src/lib/db/migrations.ts).
//
// Purpose: Adds natal chart generation lifecycle state, retry counters,
// and audit fields to community_family_members so natal generation is
// governed, not purely on-demand. These columns are read by
// POST /api/community/generate-natal — without this migration the route
// fails with a misleading "Family member not found" 404 because its
// .select() references columns that do not exist in the live DB.
//
// Strictly ADDITIVE: all columns use ADD COLUMN IF NOT EXISTS; backfill
// only updates rows with natal_chart IS NOT NULL and natal_status still
// at its default; all indexes use IF NOT EXISTS.

export const MIGRATION_SQL = `
-- ─── Lifecycle state ─────────────────────────────────────────────────────────
--   not_started     : profile exists but generation has never been triggered
--   queued          : generation is waiting to run (birth data is complete)
--   generated       : at least one successful chart exists
--   failed          : last generation attempt failed
--   locked_for_review: self-service retries exhausted — requires support ticket
ALTER TABLE community_family_members
  ADD COLUMN IF NOT EXISTS natal_status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (natal_status IN ('not_started', 'queued', 'generated', 'failed', 'locked_for_review')),

  -- How many user-initiated correction regenerations have been used.
  -- The initial automatic generation does NOT consume a retry.
  ADD COLUMN IF NOT EXISTS natal_retry_count INTEGER NOT NULL DEFAULT 0,

  -- Maximum correction retries allowed (default 3 per product spec).
  -- Stored per-profile so admin can grant exceptions without a migration.
  ADD COLUMN IF NOT EXISTS natal_max_retries INTEGER NOT NULL DEFAULT 3,

  -- Timestamps for observability and admin review
  ADD COLUMN IF NOT EXISTS natal_first_generated_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS natal_last_generated_at   TIMESTAMPTZ,

  -- Failure / lock reason stored for admin dashboard and support escalation
  ADD COLUMN IF NOT EXISTS natal_failure_reason      TEXT,
  ADD COLUMN IF NOT EXISTS natal_lock_reason         TEXT;

-- ─── Backfill existing rows ───────────────────────────────────────────────────
-- Profiles that already have natal_chart data are considered 'generated'.
UPDATE community_family_members
SET
  natal_status              = 'generated',
  natal_first_generated_at  = COALESCE(chart_updated_at, NOW()),
  natal_last_generated_at   = COALESCE(chart_updated_at, NOW())
WHERE natal_chart IS NOT NULL
  AND natal_status = 'not_started';

-- ─── Indexes ──────────────────────────────────────────────────────────────────
-- Admin monitoring: find all failed / locked profiles quickly
CREATE INDEX IF NOT EXISTS idx_cfm_natal_status
  ON community_family_members(natal_status);

-- Admin monitoring: find profiles that have used any correction retries
CREATE INDEX IF NOT EXISTS idx_cfm_natal_retry_count
  ON community_family_members(natal_retry_count)
  WHERE natal_retry_count > 0;

-- Admin monitoring: find profiles waiting to be generated
CREATE INDEX IF NOT EXISTS idx_cfm_natal_queued
  ON community_family_members(natal_status)
  WHERE natal_status = 'queued';
`;
