# Task 06 — Deploy 0 Data Repair

- Status: Not Started
- Priority: P0 — runs BEFORE any code or schema changes
- Depends On: nothing (pure data write)
- Blocks: Task 02 (rewrite assumes a coherent data state)

## Goal

Resync `diviner_services.is_published` with `service_landing_pages.status` for every row currently drifted due to the 2026-04-21 CHECK-constraint bug. This is a one-shot SQL fix to restore production service pages that are 404ing despite the dashboard showing them as "Published".

## Known Drifted Row (2026-04-21)

- Diviner: `test-diviner-1` (id `50559eec-600b-4547-92a8-d9c1b0d98888`)
- Service: Nativity Birth Chart (slug `nativity-birth-chart`)
- Template: `33a43256-7dc2-4ad4-88aa-3def8740ac56`
- `diviner_services` row id: `f67a4e4a-bd5c-40a4-b4f7-523b014c2bcf`
- State: `is_published=false`, `publish_status='draft'`, despite `service_landing_pages.status='published'` and the dashboard badge showing "Published"

## Audit Query — Find All Drifted Rows

Run this first. Every row returned is a row to repair.

```sql
SELECT
  ds.id                    AS diviner_services_id,
  ds.diviner_id,
  ds.template_id,
  d.username,
  st.slug                  AS template_slug,
  ds.is_enabled,
  ds.is_published,
  ds.publish_status,
  lp.status                AS landing_page_status,
  lp.published_at          AS page_published_at,
  ds.updated_at            AS ds_updated_at
FROM diviner_services ds
JOIN diviners d                 ON d.id = ds.diviner_id
JOIN service_templates st       ON st.id = ds.template_id
LEFT JOIN service_landing_pages lp
  ON lp.diviner_id = ds.diviner_id
 AND lp.service_template_id = ds.template_id
WHERE
  -- Drift condition: builder says published, gate says not
  lp.status = 'published'
  AND ds.is_enabled = true
  AND (
    ds.is_published = false
    OR ds.publish_status != 'published'
  )
ORDER BY d.username, st.slug;
```

Save the output. It becomes the pre-repair snapshot for rollback.

## Repair SQL

Targeted at the specific rows returned by the audit query, using their `diviner_services_id` values:

```sql
-- Explicit row IDs from audit query output (edit before running):
WITH to_repair AS (
  SELECT id FROM diviner_services
  WHERE id IN (
    'f67a4e4a-bd5c-40a4-b4f7-523b014c2bcf'
    -- add any other IDs from the audit query
  )
)
UPDATE diviner_services
SET
  is_published = true,
  publish_status = 'published'
WHERE id IN (SELECT id FROM to_repair)
RETURNING id, diviner_id, template_id, is_published, publish_status, updated_at;
```

The `RETURNING` clause produces a post-repair record for audit.

## Execution

### Option A — Supabase Studio SQL Editor

1. Log in to Supabase dashboard for project `wyluvclvtvwptsvvtgkv`.
2. Open SQL editor.
3. Run the audit query first. Capture output.
4. Edit the repair SQL with the IDs from the audit output.
5. Run the repair SQL. Capture `RETURNING` output.
6. Verify: open `https://astrologypro.com/<username>/services/<slug>` for each affected row. Page should render (200).

### Option B — `/admin/db/migrations` runner

Package as a one-off migration `20260421000005_repair_landing_page_publish_drift.sql`. Note that this is a one-time hotfix, not a long-term migration:

- Include both the audit (as a `SELECT` committed in the PR description) and the repair `UPDATE`.
- Idempotent guard: the `WHERE` clause already excludes rows that are already in the correct state, so re-running is a no-op.
- Register in `src/lib/db/migrations.ts`.

**Preferred path for the Nativity row right now: Option A.** It's one UPDATE, one row, with direct visual verification. Option B is overkill.

## Rollback

Before running the UPDATE, save the `is_published` and `publish_status` values from the audit query output. Manual `UPDATE ... SET is_published = <prior>, publish_status = <prior> WHERE id = <...>` restores the prior state row-by-row.

## Acceptance Criteria

- [ ] Audit query executed, output saved to the task doc / PR as a table.
- [ ] Every row in the audit output has been UPDATE'd.
- [ ] `RETURNING` output confirms `is_published=true` and `publish_status='published'` for every repaired row.
- [ ] Manual browser verification on each affected public URL: returns 200, renders the legacy template (since no published builder page exists, or only sparse sections exist and render unchanged).
- [ ] No diviner dashboard shows "Published" state that doesn't match the public URL behavior.

## Out of Scope

- Preventing future drift (Tasks 01-05 address this by fixing the code).
- Any code changes.
- Migrating data between columns or tables.
- Populating the new `slot` column (Task 01).

## Runbook for Incident Response

If a similar drift appears post-deploy before the refactor is complete:

1. Run the audit query.
2. If drift is detected, run a targeted UPDATE for the specific row.
3. File a follow-up engineering ticket if the row count grows — the pattern indicates the bug fix didn't stick or a new code path is writing incorrectly.
