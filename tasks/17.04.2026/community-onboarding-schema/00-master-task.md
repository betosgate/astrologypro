# Master Task - Community Onboarding Schema and Prefill Fixes - 2026-04-17

- Status: Planned
- Priority: P0
- Owner: Backend / Database
- Scope: Community onboarding submit flow, prefill load flow, `community_members` schema alignment, Supabase schema cache refresh, endpoint QA.
- Task File: `tasks/17.04.2026/community-onboarding-schema/00-master-task.md`

---

## Problem

The community onboarding flow has two related server-side failures on `/community/onboarding`.

Submit endpoint:

```txt
POST /api/community/onboarding/complete
```

Observed response:

```json
{
  "error": "Could not find the 'birth_country' column of 'community_members' in the schema cache"
}
```

The application includes `birth_country` in the update payload for `community_members`, but the active database schema or Supabase/PostgREST schema cache does not currently expose that column.

Prefill endpoint:

```txt
GET /api/community/onboarding/prefill
```

The prefill endpoint can also return `500 Internal Server Error` when loading existing user data. It selects `birth_country` from `community_members`, so it may fail for the same schema/cache reason as the submit endpoint. It also selects other schema-dependent columns, including `occupation`, so the exact server log must be captured before changing code or database state.

## Technical Context

The route `src/app/api/community/onboarding/complete/route.ts` updates `community_members` with:

```ts
birth_country: trimStr(birth_country)
```

The frontend `src/app/community/onboarding/page.tsx` posts:

```ts
birth_country: form.birthCountry.trim()
```

The repository already contains a local Supabase migration:

```txt
supabase/migrations/20260413000198_add_birth_country_to_community_members.sql
```

That migration adds:

```sql
ALTER TABLE community_members
  ADD COLUMN IF NOT EXISTS birth_country VARCHAR(100);
```

This means the fix may be either:

1. Apply the missing migration to the target database, or
2. Reload the Supabase/PostgREST schema cache if the column already exists.

## Goal

Make `/community/onboarding` load and submit reliably:

- `GET /api/community/onboarding/prefill` should gracefully handle incomplete or missing profile records.
- `POST /api/community/onboarding/complete` should complete successfully when the payload includes `birth_country`.
- Do not remove required onboarding fields from the application payload to hide schema errors.

## Task 2: Submit Schema Error

| # | File | What to do | Status |
|---|---|---|---|
| 02.1 | `02.1-confirm-frontend-and-api-birth-country-contract.md` | Confirm the page and endpoint both use `birth_country` consistently. | Planned |
| 02.2 | `02.2-verify-community-members-birth-country-schema.md` | Check local migrations and the active database schema for `community_members.birth_country`. | Planned |
| 02.3 | `02.3-apply-migration-or-refresh-schema-cache.md` | Apply the missing migration or refresh Supabase/PostgREST schema cache. | Planned |
| 02.4 | `02.4-test-onboarding-complete-payload.md` | Test the endpoint with a valid authenticated onboarding payload. | Planned |
| 02.5 | `02.5-regression-and-handoff-checklist.md` | Verify persistence, no regressions, and document the final state. | Planned |
| 02.6 | `02.6-end-to-end-qa-checklist.md` | Final end-to-end checklist before closing the submit schema fix. | Planned |

## Task 3: Prefill Load Server Error

| # | File | What to do | Status |
|---|---|---|---|
| 03.1 | `03.1-capture-prefill-server-error.md` | Capture the exact server-side error and response shape for `GET /api/community/onboarding/prefill`. | Planned |
| 03.2 | `03.2-audit-prefill-query-schema-dependencies.md` | Audit selected columns against migrations and active database schema. | Planned |
| 03.3 | `03.3-handle-missing-or-incomplete-member-profile.md` | Define graceful behavior for missing/incomplete `community_members` rows. | Planned |
| 03.4 | `03.4-harden-family-members-prefill-query.md` | Ensure household prefill query handles empty/missing related records safely. | Planned |
| 03.5 | `03.5-implement-prefill-error-handling-and-contract.md` | Update endpoint behavior so expected empty states return `200` safely. | Planned |
| 03.6 | `03.6-end-to-end-qa-checklist.md` | Final end-to-end checklist before closing the prefill load fix. | Planned |

## Execution Order

Task 2:

1. Complete `02.1` to confirm this is not a frontend/API field-name mismatch.
2. Complete `02.2` to identify whether the target database or schema cache is stale.
3. Complete `02.3` to apply the migration or refresh cache.
4. Complete `02.4` to prove the endpoint accepts a valid payload.
5. Complete `02.5` to verify persistence and nearby regressions.
6. Complete `02.6` as the final end-to-end closeout checklist.

Task 3:

1. Complete `03.1` first because the client currently does not expose the specific database/server error.
2. Complete `03.2` to confirm whether this is another schema-cache/column issue.
3. Complete `03.3` and `03.4` to define safe empty-state behavior for primary and household records.
4. Complete `03.5` to implement the route contract.
5. Complete `03.6` as the final end-to-end closeout checklist.

## Implementation Notes

- Do not remove `birth_country` from the onboarding frontend or API payload.
- Prefer applying the existing migration if it has not run in the target environment.
- If the column already exists, refresh Supabase/PostgREST schema cache and restart the app server.
- Keep the column nullable to avoid breaking older or partial onboarding records.
- For prefill, expected missing data should not crash the page. Reserve `500` for unexpected server failures after logging the exact error.

## Acceptance Criteria

- [ ] `community_members.birth_country` exists in the active database as `VARCHAR` / `TEXT` compatible string storage.
- [ ] Supabase/PostgREST schema cache recognizes the column.
- [ ] `POST /api/community/onboarding/complete` no longer returns the schema cache 500 error.
- [ ] Onboarding submit with `"birth_country":"Capitol Planning Region"` succeeds.
- [ ] The submitted value is persisted on the authenticated user's `community_members` row.
- [ ] `GET /api/community/onboarding/prefill` no longer returns 500 for expected empty or incomplete profile states.
- [ ] Prefill route schema dependencies are verified, including `birth_country` and `occupation`.
- [ ] `/community/onboarding` can load, prefill when data exists, and fall back to an empty form when safe.
