# Task 01 — Schema Additive Migration

- Status: Not Started
- Priority: P1
- Depends On: 00-master-task.md
- Blocks: Tasks 02, 03, 05
- Non-destructive; zero risk of data loss on its own.

## Goal

Ship one additive SQL migration that prepares the data layer for the new flow without dropping anything. After this migration runs, old code continues to work unchanged; new code behind the `LANDING_PAGE_V2` feature flag can start reading/writing the new shape.

## Scope

1. Add nullable `slot` column to `service_landing_page_sections` with CHECK constraint `slot IS NULL OR slot IN ('about_diviner', 'extra')`. Nullable is deliberate: system-section rows (hero/pricing/booking_cta) keep `slot = NULL` so the V2 view filters them out without a destructive delete.
2. Backfill `slot` values on existing rows (18 rows in prod today — fits under the 60s runner limit with margin). See the backfill CASE expression in the SQL below.
3. Add a single `CREATE OR REPLACE VIEW diviner_service_blocks` that presents the sections table with only the columns the new code will read. This gives Deploy 2 a clean rename target without breaking the old code path.
4. `COMMENT ON COLUMN` annotations for every deprecated column stating the deprecation plan — makes it obvious in `\d` output and in Supabase Studio that the column is on the chopping block.
5. Idempotent indexes matching the new query pattern: `(diviner_id, service_template_id, slot, display_order)`.
6. No DROPs. No data migrations on other tables.

## Current State (prod row counts — 2026-04-21)

| Table | Rows |
|---|---|
| `services` | 127 |
| `diviner_services` | 66 |
| `service_landing_pages` | 5 |
| `service_landing_page_sections` | 18 |

Confirmed under the runner's 60-second budget with generous margin.

## Migration Delivery Pattern

Per [docs/db-migrations.md](../../../../docs/db-migrations.md) and the walkthrough at [/admin/db/migrations](../../../../src/app/admin/db/migrations/page.tsx), this migration ships as three files:

| # | File | Purpose |
|---|---|---|
| 1 | `supabase/migrations/20260421000010_landing_page_slots_additive.sql` | Canonical SQL |
| 2 | `src/data/migrations/20260421000010_landing_page_slots_additive.ts` | Bundled TS mirror |
| 3 | Entry in [src/lib/db/migrations.ts](../../../../src/lib/db/migrations.ts) | Allowlist registration |

After deploy: open `/admin/db/migrations` → click **Run migration** on the new entry.

## Idempotency Rules (applies to every statement)

| Operation | Required form |
|---|---|
| Add column | `ADD COLUMN IF NOT EXISTS` |
| Create index | `CREATE INDEX IF NOT EXISTS` |
| Create view | `CREATE OR REPLACE VIEW` |
| Backfill | Guard with `WHERE slot IS NULL` so re-runs are no-ops |
| Comment | `COMMENT ON COLUMN … IS '…'` (unconditionally safe) |

## SQL Outline

```sql
-- 20260421000010_landing_page_slots_additive.sql
-- Additive: add slot column, backfill, view, index, deprecation comments.
-- Idempotent. No DROPs. Safe to re-run.

-- 1. slot enum values enforced via CHECK (no separate ENUM type to avoid
--    an extra migration for Deploy 2).
ALTER TABLE service_landing_page_sections
  ADD COLUMN IF NOT EXISTS slot TEXT;

ALTER TABLE service_landing_page_sections
  DROP CONSTRAINT IF EXISTS service_landing_page_sections_slot_check;

ALTER TABLE service_landing_page_sections
  ADD CONSTRAINT service_landing_page_sections_slot_check
  CHECK (slot IS NULL OR slot IN ('about_diviner', 'extra'));

-- 2. Backfill rules:
--    hero / pricing / booking_cta  → leave slot = NULL (legacy template
--        already renders these; these rows will be is_enabled=false in
--        Deploy 2 and dropped once no rollback need remains)
--    bio / about / testimonials    → 'about_diviner'
--    everything else               → 'extra'
UPDATE service_landing_page_sections
SET slot = CASE
  WHEN section_type IN ('hero', 'pricing', 'booking_cta') THEN NULL
  WHEN section_type IN ('bio', 'about', 'testimonials')   THEN 'about_diviner'
  ELSE 'extra'
END
WHERE slot IS NULL;

-- 3. Index aligned with the new route's read pattern:
--    "give me all enabled blocks for (diviner, template) grouped by slot,
--     ordered by display_order"
CREATE INDEX IF NOT EXISTS idx_slps_diviner_template_slot_order
  ON service_landing_page_sections (diviner_id, landing_page_id, slot, display_order)
  WHERE is_enabled = true AND slot IS NOT NULL;

-- 4. Read-only view for the new code path.
--    Presents only the columns the simplified code uses, under the
--    target name (diviner_service_blocks). Deploy 2 renames the physical
--    table to match; until then, new code reads from this view.
CREATE OR REPLACE VIEW diviner_service_blocks AS
SELECT
  s.id,
  s.diviner_id,
  s.landing_page_id,
  lp.service_template_id,
  s.section_type,
  s.slot,
  s.title,
  s.content_json,
  s.body_html,
  s.primary_image_url,
  s.display_order,
  s.is_enabled,
  s.moderation_status,
  s.moderation_note,
  s.created_at,
  s.updated_at,
  s.created_by,
  s.updated_by
FROM service_landing_page_sections s
JOIN service_landing_pages lp ON lp.id = s.landing_page_id
WHERE s.slot IS NOT NULL;

COMMENT ON VIEW diviner_service_blocks IS
  'V2 read surface for diviner landing-page blocks. Hides deprecated columns and system sections (slot IS NULL). Replaced by a real table in Deploy 2.';

-- 5. Deprecation comments — surfaces intent in \d output and Supabase Studio.
COMMENT ON COLUMN diviner_services.publish_status IS
  'DEPRECATED as of 2026-04-21. Redundant with is_published. Scheduled for DROP in Deploy 2 of landing-page-simplification.';

COMMENT ON COLUMN service_landing_pages.status IS
  'DEPRECATED as of 2026-04-21. No more page-level publish lifecycle under V2. Scheduled for DROP with the whole table in Deploy 2.';

COMMENT ON COLUMN service_landing_pages.slug IS
  'DEPRECATED as of 2026-04-21. URL comes from services.slug under V2. Scheduled for DROP with the whole table in Deploy 2.';

COMMENT ON COLUMN service_landing_pages.custom_page_title IS
  'DEPRECATED as of 2026-04-21. SEO derived from service data under V2. Scheduled for DROP with the whole table in Deploy 2.';

-- (Apply the same COMMENT pattern to custom_seo_title, custom_seo_description,
--  custom_og_image_url, accent_color, font_style, published_at, unpublished_at,
--  draft_version, published_version, moderation_status, moderation_note,
--  moderated_by, moderated_at — all on service_landing_pages.)

COMMENT ON COLUMN service_landing_page_sections.is_system IS
  'DEPRECATED as of 2026-04-21. No system sections under V2. Scheduled for DROP in Deploy 2.';

COMMENT ON COLUMN service_landing_page_sections.is_draft IS
  'DEPRECATED as of 2026-04-21. No draft/published split under V2. Scheduled for DROP in Deploy 2.';

COMMENT ON COLUMN service_landing_page_sections.draft_content_json IS
  'DEPRECATED as of 2026-04-21. Single content_json under V2. Scheduled for DROP in Deploy 2.';

-- (Same for draft_body_html, published_content_json, published_body_html,
--  instance_key, subtitle, images — all on service_landing_page_sections.)
```

## RLS

No new RLS policies needed — the view inherits from its underlying tables. Verify that the existing policies on `service_landing_page_sections` and `service_landing_pages` are sufficient for the new read pattern (they are, since the view applies only a `WHERE` clause).

## Acceptance Criteria

- [ ] Migration runs cleanly from `/admin/db/migrations`, returns 200, takes <5s on prod-sized data.
- [ ] Re-running the migration is a no-op (every statement idempotent).
- [ ] `SELECT slot, COUNT(*) FROM service_landing_page_sections GROUP BY slot` returns three buckets: `NULL` (system sections), `about_diviner`, `extra`. Total = 18.
- [ ] `SELECT * FROM diviner_service_blocks LIMIT 1` returns a row with only the 17 expected columns (no `draft_*`, `published_*`, `is_system`, `is_draft`, `instance_key`, `subtitle`, `images`).
- [ ] Every deprecated column has a `COMMENT` ending with `"Scheduled for DROP in Deploy 2"`.
- [ ] Existing public routes (legacy code path) still work — old code doesn't read `slot` and doesn't use the view.
- [ ] No existing tests fail.

## Rollback

- Revert the PR introducing the three files. The migration itself is additive; re-running the reverted state leaves the added column and index harmlessly in place. If you need to remove them for any reason, ship a follow-up additive migration that drops them — do not edit the run migration in place.

## Out of Scope

- DROP statements (those live in Task 07).
- Renaming the sections table (Deploy 2).
- Tightening the `section_type` CHECK constraint to `'text' | 'image' | 'html'` (Deploy 2).
- Code changes — this task is pure schema + backfill.
