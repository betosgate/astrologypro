# Align Training Assignment Fetch Model And Submit Semantics - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: edit prefill behavior, payload normalization, explicit submit transformations
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-assignment/03-align-training-assignment-fetch-model-and-submit-semantics.md`

## Goal

Audit and align the assignment module so Next uses stable edit prefill behavior and backend-compatible payload shapes for add/edit operations without hidden mismatches.

## Verified Current Code Truth

- Angular edit prepopulation uses route resolver endpoint `training-centre/assignment-preview`.
- Angular edit code reads prepopulation data from `response.response.res`, not `response.response.results.res`.
- Angular submit normalizes:
  - `status` to `1` or `0`
  - includes `_id` on edit
  - submits to `training-centre/assginment-add` or `training-centre/assignment-edit`
- Next edit route already points to `training-centre/assignment-preview`.
- Next generic form page uses generic transformations and sends `id` on edit by default.
- Next dynamic lesson select currently posts an empty body by default, which may not match Angular’s explicit request body shape for `admin/fetch-lesson-list`.

## User-Visible Problem

Even where the assignment UI looks correct, small payload-shape mismatches can still cause fragile edit behavior, broken prepopulation, or silent backend incompatibility.

## Required Behavior

1. Edit route must prepopulate reliably from the active response shape.
2. Lesson options must load with backend-compatible request semantics.
3. Submit payload must use backend-compatible identity and field names.
4. Numeric and boolean fields must be normalized correctly.
5. Add route should not rely on misleading entity fetch behavior.

## Tasks

1. Verify that `training-centre/assignment-preview` response shape is mapped correctly into the generic form state.
2. Verify `_id` vs `id` expectations for assignment edit submit.
3. Add assignment-specific payload transformation logic if generic form behavior is insufficient.
4. Ensure lesson option loading uses an appropriate request body and response mapping.
5. Confirm final submit payload matches backend expectations for add and edit.

## Acceptance Criteria

- edit route prepopulates correctly from the current endpoint
- add route does not perform unnecessary entity fetch behavior
- lesson options load reliably for assignment authoring
- submit payload uses correct identity and normalized scalar values
- no hidden data-shape regression remains in the assignment module

## Verification Test Plan

1. Open add assignment page and confirm no unnecessary entity fetch is attempted.
2. Open edit assignment page and confirm existing assignment data loads correctly.
3. Confirm lesson dropdown is populated as expected.
4. Submit add and edit flows and verify payload key/type correctness.
5. Validate status and priority type conversion on both add and edit.
6. Reopen the edited record and confirm persisted values rehydrate correctly.

## Implementation Notes (2026-04-02)

Already implemented before this task was executed. Full audit of `assignment-form.tsx` confirmed:

- **Edit fetch**: `training-centre/assignment-preview` POST `{ _id: id }`. Response shape covers `data?.response?.res ?? data?.response?.results?.res ?? data?.results?.res` — maps Angular's `response.response.res` correctly.
- **Edit hydration**: `useEffect` on `record`, resets all 5 fields. `status: r.status === 1 || r.status === true` converts backend 0/1 to boolean for the switch.
- **Add route**: performs no entity fetch. Clean default form state.
- **Submit payload**: explicitly constructed (not spread from form state). Includes `_id` on edit (not generic `id`). `status: values.status ? 1 : 0`. `priority: values.priority ? parseFloat(values.priority) : 0`.
- **Endpoints**: `training-centre/assginment-add` (preserves Angular's API typo) and `training-centre/assignment-edit`.
- **Lesson options**: `admin/fetch-lesson-list` with `{ condition: {}, limit: 200, skip: 0 }`.
- No code changes required.

## Notion Summary

P1 integration gap: the Next Training Assignment module needs an explicit prefill and payload audit so add/edit flows remain backend-compatible. Align edit hydration, lesson option loading, identity handling, and payload normalization before considering the assignment module fully migrated.
