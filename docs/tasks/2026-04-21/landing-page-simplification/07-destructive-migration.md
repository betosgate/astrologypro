# Task 07 — Deploy 2: Destructive Cleanup

- Status: Not Started (blocked on Deploy 1 soak period)
- Priority: P3 — defer until Deploy 1 has been stable at 100% flag rollout for ≥ 7 days
- Depends On: Tasks 01–06 complete, `LANDING_PAGE_V2` at 100%, zero regressions reported for ≥ 7 days
- Blocks: none

## Goal

Remove the deprecated columns, drop the `service_landing_pages` container table, rename `service_landing_page_sections` to `diviner_service_blocks`, and tighten the `section_type` CHECK constraint. This is the destructive half of the migration pair that started in Task 01.

## Pre-Flight Checklist — ALL must be true before this runs

- [ ] Deploy 1 (Tasks 01–05) shipped to production.
- [ ] `LANDING_PAGE_V2` flag has been at 100% for ≥ 7 days.
- [ ] Zero P0 or P1 incidents related to landing pages in that window.
- [ ] No code anywhere in `src/` reads or writes any column on the drop list — verified by `grep`.
- [ ] Full production DB backup taken within the last 24 hours and verified restorable in staging.
- [ ] Staging restore verified against a copy of prod data within the last 24 hours.
- [ ] PR has explicit sign-off from eng lead **and** product owner recorded in the description.
- [ ] Deploy window chosen during low-traffic hours with on-call coverage.
- [ ] Rollback procedure rehearsed: restore from backup into a staging DB and re-apply any writes between snapshot and revert (manual diff).

## Destructive Migration SQL

Packaged as a single migration following the three-file pattern. Ordering is **critical** — the view from Deploy 1 is named `diviner_service_blocks` and would collide with the rename; the backfill must join on `landing_page_id` while that column still exists.

```sql
-- 20260428000001_landing_page_cleanup_destructive.sql
-- DESTRUCTIVE. Runs only after 7+ days of stable Deploy 1.
-- Wrapped in a single transaction so any failure rolls back cleanly.

BEGIN;

-- STEP 1 — Drop the Deploy-1 view BEFORE doing anything to its
-- underlying tables. The view is named diviner_service_blocks and
-- will collide with the sections-table rename below.
DROP VIEW IF EXISTS diviner_service_blocks;

-- STEP 2 — Add service_template_id to the sections table and
-- backfill from the still-present landing_page_id FK.
ALTER TABLE service_landing_page_sections
  ADD COLUMN IF NOT EXISTS service_template_id UUID;

UPDATE service_landing_page_sections s
SET service_template_id = lp.service_template_id
FROM service_landing_pages lp
WHERE s.landing_page_id = lp.id
  AND s.service_template_id IS NULL;

ALTER TABLE service_landing_page_sections
  ALTER COLUMN service_template_id SET NOT NULL;

ALTER TABLE service_landing_page_sections
  ADD CONSTRAINT service_landing_page_sections_template_fkey
  FOREIGN KEY (service_template_id)
  REFERENCES service_templates(id)
  ON DELETE CASCADE;

-- STEP 3 — Now that every section row carries service_template_id,
-- the landing_page_id FK is redundant. Drop it, then drop the column.
ALTER TABLE service_landing_page_sections
  DROP CONSTRAINT IF EXISTS service_landing_page_sections_landing_page_id_fkey;

ALTER TABLE service_landing_page_sections
  DROP COLUMN IF EXISTS landing_page_id;

-- STEP 4 — Drop the container table. CASCADE is safe now because
-- nothing remaining references it.
DROP TABLE service_landing_pages CASCADE;

-- STEP 5 — Drop the redundant publish_status on diviner_services.
ALTER TABLE diviner_services
  DROP COLUMN publish_status;

-- STEP 6 — Purge rows that would violate the new section_type CHECK.
-- Must run BEFORE the CHECK is added, or ALTER fails.
DELETE FROM service_landing_page_sections
WHERE section_type NOT IN ('text', 'image', 'html');

-- Also purge any rows where slot is still NULL (system sections
-- left behind by the Task 01 backfill).
DELETE FROM service_landing_page_sections
WHERE slot IS NULL;

-- STEP 7 — Rename the sections table to its final name.
ALTER TABLE service_landing_page_sections
  RENAME TO diviner_service_blocks;

-- STEP 8 — Drop the deprecated columns.
ALTER TABLE diviner_service_blocks
  DROP COLUMN IF EXISTS is_system,
  DROP COLUMN IF EXISTS is_draft,
  DROP COLUMN IF EXISTS draft_content_json,
  DROP COLUMN IF EXISTS draft_body_html,
  DROP COLUMN IF EXISTS published_content_json,
  DROP COLUMN IF EXISTS published_body_html,
  DROP COLUMN IF EXISTS instance_key,
  DROP COLUMN IF EXISTS subtitle,
  DROP COLUMN IF EXISTS images;

-- STEP 9 — Tighten the section_type CHECK to the three allowed values.
ALTER TABLE diviner_service_blocks
  DROP CONSTRAINT IF EXISTS service_landing_page_sections_section_type_check;

ALTER TABLE diviner_service_blocks
  ADD CONSTRAINT diviner_service_blocks_section_type_check
  CHECK (section_type IN ('text', 'image', 'html'));

-- STEP 10 — Tighten the slot CHECK and promote to NOT NULL.
ALTER TABLE diviner_service_blocks
  DROP CONSTRAINT IF EXISTS service_landing_page_sections_slot_check;

ALTER TABLE diviner_service_blocks
  ADD CONSTRAINT diviner_service_blocks_slot_check
  CHECK (slot IN ('about_diviner', 'extra'));

ALTER TABLE diviner_service_blocks
  ALTER COLUMN slot SET NOT NULL;

-- STEP 11 — Refresh indexes to the final names and shape.
DROP INDEX IF EXISTS idx_slps_diviner_template_slot_order;

CREATE INDEX IF NOT EXISTS idx_dsb_diviner_template_slot_order
  ON diviner_service_blocks (diviner_id, service_template_id, slot, display_order)
  WHERE is_enabled = true;

-- STEP 12 — Final COMMENT.
COMMENT ON TABLE diviner_service_blocks IS
  'V2 diviner landing-page blocks, scoped by (diviner_id, service_template_id, slot). Replaces service_landing_page_sections. See docs/tasks/2026-04-21/landing-page-simplification/00-master-task.md.';

COMMIT;
```

**Ordering notes:**

- The view drop (step 1) must precede anything that would fail due to its dependency — and precedes the rename (step 7) to avoid a name collision.
- The backfill (step 2) must precede the drop of `landing_page_id` (step 3), otherwise the JOIN has no source.
- The DELETEs (step 6) must precede the CHECK constraint tightening (step 9) — Postgres rejects `ADD CONSTRAINT` if existing rows violate it.
- The rename (step 7) must happen after all DROPs that reference the old name and before all DROPs/ALTERs that reference the new name. Keeping all pre-rename operations under the old name and all post-rename operations under the new name avoids confusion.

## Application Code Changes (paired with the migration)

- Remove the feature flag switch in [src/app/[username]/services/[slug]/page.tsx](../../../../src/app/%5Busername%5D/services/%5Bslug%5D/page.tsx) and all V1 legacy code. Only the V2 path survives.
- Remove the `LANDING_PAGE_V2` export from `src/lib/config/flags.ts`.
- Update `src/lib/diviner-service-blocks.ts` queries to use the physical table name `diviner_service_blocks` (removing the view indirection). Queries stay the same shape.
- Update any TS types that reference `service_landing_page_sections` to `diviner_service_blocks`.
- Admin moderation routes under `src/app/api/admin/landing-pages/**` — re-point from `landing_page_id` keys to `(diviner_id, template_id)` since the container is gone.

## Rollback

Restore the DB from backup (taken in the pre-flight checklist). Re-apply any writes made between snapshot and rollback manually by:
1. Diffing row counts on `diviner_service_blocks` (post-rename) between snapshot and current.
2. Re-inserting or updating rows as needed.

**This is expensive and error-prone.** The 7-day cooling period and the pre-flight checks exist to make rollback unlikely. If a P0 regression hits in the first hour post-deploy, rollback is the right call; beyond that window, fix-forward is usually cheaper.

## Acceptance Criteria

- [ ] Migration runs cleanly on staging against a prod-copy DB in under 30 seconds.
- [ ] Post-migration, `\d diviner_service_blocks` shows exactly the expected column set (no deprecated columns).
- [ ] `SELECT COUNT(*) FROM diviner_service_blocks WHERE section_type NOT IN ('text', 'image', 'html')` returns 0.
- [ ] `SELECT COUNT(*) FROM diviner_service_blocks WHERE slot IS NULL` returns 0.
- [ ] `SELECT COUNT(*) FROM pg_tables WHERE tablename = 'service_landing_pages'` returns 0.
- [ ] `grep -r "service_landing_pages" src/` returns 0 references to the table (only historical comments in migrations are allowed).
- [ ] `grep -r "publish_status" src/` returns 0 references (the column is gone).
- [ ] Public URLs still render correctly for all live services.
- [ ] Dashboard loads without console errors.
- [ ] Full regression test suite passes.

## Out of Scope

- Further simplifications (per-block preview, richer block types) — separate future tasks.
- Historical audit log of pre-migration state — covered by the backup, not by a separate table.
- Backfilling any blocks that were lost during the Task 01 backfill (system sections were intentionally marked as `slot IS NULL` and filtered out; they don't come back).
