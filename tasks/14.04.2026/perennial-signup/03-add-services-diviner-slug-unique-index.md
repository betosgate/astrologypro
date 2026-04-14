# 03 Add Services Diviner Slug Unique Index - 2026-04-14

- Status: Planned
- Priority: P1
- Owner: Backend
- Parent: `00-master-task.md`
- Task File: `tasks/14.04.2026/perennial-signup/03-add-services-diviner-slug-unique-index.md`

## Goal

Make the existing diviner onboarding services upsert valid at the database level.

## Context

The diviner onboarding page upserts into `services` with:

```ts
.upsert(serviceRows, { onConflict: "diviner_id,slug", ignoreDuplicates: false })
```

Postgres requires a matching unique or exclusion constraint for `ON CONFLICT (diviner_id, slug)`.

The current schema has a normal index on `services(diviner_id)`, which is not enough.

## Files To Change

| File | Change |
|---|---|
| `supabase/migrations/<new migration>.sql` | Add unique index for `services(diviner_id, slug)` |

## Required Migration

Create a new migration:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS services_diviner_id_slug_key
  ON public.services (diviner_id, slug);
```

## Preflight Duplicate Check

Before applying this in any shared or live database, inspect duplicates:

```sql
SELECT diviner_id, slug, COUNT(*)
FROM public.services
GROUP BY diviner_id, slug
HAVING COUNT(*) > 1;
```

If duplicates exist, review them manually before cleanup. Do not auto-delete in this migration without checking whether bookings or other tables reference the duplicate service rows.

## Guardrails

- Do not change `src/app/onboarding/page.tsx` just to avoid the schema issue.
- Do not auto-delete service rows in the migration.
- Do not use a partial unique index unless the upsert conflict target is also changed to match it.

## Acceptance Criteria

- [ ] Migration adds a unique index on `public.services(diviner_id, slug)`.
- [ ] Diviner services upsert no longer throws Postgres error `42P10`.
- [ ] Duplicate service rows are handled explicitly if found before migration application.
