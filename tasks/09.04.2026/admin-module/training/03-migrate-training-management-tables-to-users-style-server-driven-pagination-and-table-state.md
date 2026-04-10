# Migrate Training Management Tables To Users-Style Server-Driven Pagination And Table State

- Status: Planned

## Objective
Refactor the `Training Management` tables so they no longer load all rows at once. Instead, each table should follow the `admin/users` pattern with initial data limits, page/page-size driven data loading, and table-state-aware API requests for pagination and related list behavior.

## Why This Task Exists
The current Training Management implementation still has a major scalability gap:
- all rows are fetched up front for each table
- pagination is only a display-layer convenience
- the first load is heavier than necessary
- refreshes and filters still operate on fully loaded in-memory datasets

The `admin/users` table already demonstrates the correct direction:
- page and page size are part of the table state
- the first load is limited
- server/data loading aligns with current table state
- the UI reflects the current page of results, not the entire dataset

## Current Repo State
- `src/app/admin/training/page.tsx` currently fetches:
  - `/api/admin/training/programs`
  - `/api/admin/training/categories`
  - `/api/admin/training/lessons`
  - `/api/admin/training/quizzes`
- Those training list endpoints currently return full lists, not page-scoped results.
- `src/components/admin/training-entity-table.tsx` now has client-side pagination controls, but the underlying row arrays are still fully loaded into the browser.
- The `admin/users` reference pattern includes:
  - page/pageSize in the table state contract
  - bounded initial load
  - page-based slice before render
  - page-aware UI state and navigation
- Relevant reference files:
  - `src/app/admin/users/page.tsx`
  - `src/components/admin/user-management-client.tsx`

## Exact Gap
- Training Management pagination is currently cosmetic rather than data-driven.
- Initial table loads still fetch the full dataset.
- Table state such as page/pageSize is not yet part of the training list API contract.
- This prevents the Training Management tables from scaling and from truly matching the `admin/users` behavior model.

## Fixed Behavior Decisions
- Training Management tables should no longer load every row on first fetch.
- Each table should support a bounded initial page size.
- Page changes should trigger data loading for only the requested page.
- Page size changes should reload the relevant table with the new limit.
- Prefer one standard pagination contract across Programs, Categories, Lessons, and Quizzes:
  - `page`
  - `pageSize` or `limit`
  - total row count in the response
- Search/filter/sort behavior should be aligned with the current table state so the server returns the correct page of matching results.
- The end result should behave more like `admin/users` than the current fully client-loaded training tables.

## Required Implementation
- Analyze and extract the relevant `admin/users` table-state/data-loading model.
- Extend the training list endpoints to support page-scoped loading, including:
  - page/page size or limit/offset inputs
  - total count output
  - stable ordering compatible with pagination
- Update the Training Management page and shared table components so:
  - initial loads request only the first page
  - pagination controls request the next page from the API
  - page-size changes refetch from the API
  - refresh requests preserve current page/table state
- Ensure search, filters, and sort state remain compatible with this server-driven model.
- Reconcile the existing client-side pagination implementation so it becomes a UI for server-driven paging rather than a second independent paging layer.

## Files To Read First
- `src/app/admin/users/page.tsx`
- `src/components/admin/user-management-client.tsx`
- `src/app/admin/training/page.tsx`
- `src/components/admin/training-entity-table.tsx`
- `src/app/api/admin/training/programs/route.ts`
- `src/app/api/admin/training/categories/route.ts`
- `src/app/api/admin/training/lessons/route.ts`
- `src/app/api/admin/training/quizzes/route.ts`

## Likely Files To Change
- `src/app/admin/training/page.tsx`
- `src/components/admin/training-entity-table.tsx`
- `src/app/api/admin/training/programs/route.ts`
- `src/app/api/admin/training/categories/route.ts`
- `src/app/api/admin/training/lessons/route.ts`
- `src/app/api/admin/training/quizzes/route.ts`
- optionally shared admin table helpers if extracted cleanly

## API and Schema Constraints
- Do not add new redundant endpoints if the current list routes can be extended cleanly.
- Preserve existing CRUD semantics while extending list routes with pagination metadata.
- Return enough metadata for the UI to render the pager correctly, for example:
  - rows
  - total
  - page
  - pageSize
- Ensure ordering is stable enough that paging does not shuffle unpredictably.

## Dependencies
- Builds on the existing independent refresh and bottom pagination work, but replaces the fully client-loaded data model under those controls.

## Acceptance Criteria
- Training Programs, Categories, Lessons, and Quizzes each load only an initial bounded page of rows.
- Pagination controls trigger page-aware API requests rather than paginating a fully loaded dataset.
- Page-size changes trigger API reloads and reset to a sensible first page.
- Refresh preserves the current table page/pageSize state.
- The overall behavior is aligned with the `admin/users` table model rather than the previous load-everything pattern.

## Verification Test Plan
- [ ] Confirm the initial load for each training table requests only the first page rather than the full dataset.
- [ ] Confirm changing pages reloads only that table with the requested page from the API.
- [ ] Confirm changing page size reloads the relevant table with the correct limit and resets/clamps page state sensibly.
- [ ] Confirm total counts and pager state remain accurate.
- [ ] Confirm refresh keeps the current page/page-size context.
- [ ] Confirm sorting and filtering remain compatible with server-driven paging.
- [ ] Confirm the browser is no longer holding the full entity list just to render one page.

## Out Of Scope
- redesigning the visual table layout
- changing row actions, notes, or export semantics beyond what is required for paging compatibility
- learner-facing training functionality
