# Align Training Category Fetch Model And Submit Semantics - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: add/edit prefill behavior, payload normalization, status/priority/value-shape alignment
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-category/03-align-training-category-fetch-model-and-submit-semantics.md`

## Goal

Audit and align the Training Category Next implementation so list, add, and edit operations use stable prefill behavior and backend-compatible payload shapes without hidden mismatches.

## Verified Current Code Truth

- Angular edit prepopulation uses route resolver endpoint `admin/training-edit`.
- Angular add flow does not need any category record fetch before rendering.
- Angular submit normalizes:
  - `status` boolean to numeric `1` or `0`
  - `priority` to integer
  - edit payload includes `_id`
- Angular add/edit submit endpoints are:
  - `admin/training-category-add`
  - `admin/training-category-update`
- Next edit page already uses `fetchEndpoint: 'admin/training-edit'`.
- Next add page still declares `fetchEndpoint: 'admin/training-fetch'`, which is not needed for add mode and can mislead future maintenance.
- Next generic form page uses:
  - `id` for edit body identity, not `_id`
  - string-based default values for most fields
  - generic number parsing and switch conversion
- Next generic form system needs explicit confirmation that it serializes category data into the backend-expected shape, especially once multi-select and image fields are added.

## User-Visible Problem

Even where the visible UI looks correct, small payload-shape mismatches can cause fragile edit behavior, broken prepopulation, or silent backend incompatibility.

## Required Behavior

1. Add route should not pretend to fetch an existing category record.
2. Edit route should prepopulate from the actual category record shape needed by the form.
3. Submit payload must match backend expectations for identifier key, status, priority, role shape, description content, and image data.
4. Field prepopulation must map backend response shape into form state accurately.
5. The module should not rely on accidental generic behavior for critical data transformations.

## Tasks

1. Remove or correct unnecessary add-page fetch configuration.
2. Verify backend expectation for edit identifier key and align `_id` vs `id` semantics.
3. Normalize category submit payload shape explicitly where generic form behavior is insufficient.
4. Add category-specific transformation logic if shared generic form logic cannot safely express the required model.
5. Validate that edit-mode data rehydrates correctly for all in-scope fields.

## Acceptance Criteria

- add route does not perform misleading or unused entity fetch behavior
- edit route fetches and prepopulates correctly
- submit payload shape is explicit and backend-compatible
- numeric, boolean, array, HTML, and image fields serialize correctly
- no hidden data-shape regression remains in the category module

## Verification Test Plan

1. Open add page and confirm no unnecessary entity fetch is attempted for a nonexistent record.
2. Open edit page and confirm existing category data loads correctly.
3. Submit add flow and verify payload keys and value types match backend expectations.
4. Submit edit flow and verify identifier handling works correctly.
5. Validate status and priority type conversion on both add and edit.
6. Validate role, description, and image payload shape after the form-parity task is implemented.
7. Reopen the edited record and confirm persisted values rehydrate correctly.

## Implementation Notes (2026-04-02)

Already correct before this session. Full audit confirmed in `category-form.tsx`:
- Add route: `useParams()` returns no `id`; no entity fetch is performed. Clean defaults.
- Edit fetch: `admin/training-edit` POST `{ _id: id }`. Response shape: `data.results?.res ?? data.results ?? data`.
- Hydration: `useEffect` on `record` calls `reset()` with `category_name`, `priority` (as string), `role` (array), `description` (HTML string), `image` (string), `status: r.status === 1 || r.status === true`.
- Submit: explicit payload `{ category_name, priority: parseFloat(), role, description, image, status: 0|1 }` plus `_id` on edit. Endpoints: `admin/training-category-add` / `admin/training-category-update`.
- The stale `fetchEndpoint: 'admin/training-fetch'` concern from the task doc was pre-implementation; the bespoke `CategoryForm` never used `GenericFormPage`, so no stray fetch was present.
- No code changes required.

## Notion Summary

P1 integration gap: the Training Category module in Next needs an explicit model/payload audit so add/edit behavior is stable and backend-compatible. Align prefill semantics and submit payload shape before considering the module fully migrated.
