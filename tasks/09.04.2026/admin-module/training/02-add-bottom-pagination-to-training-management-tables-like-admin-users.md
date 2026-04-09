# Add Bottom Pagination To Training Management Tables Like Admin Users

- Status: In Progress

## Objective
Add bottom-of-table pagination controls to each `Training Management` table so Programs, Categories, Lessons, and Quizzes paginate in the same admin-friendly pattern used by the `admin/users` data table.

## Why This Task Exists
The Training Management tables currently render all matching rows at once. That creates three problems:
- long tables become harder to scan
- bulk actions and row actions become visually noisy on large datasets
- the page lacks the standard admin list ergonomics already present in `admin/users`

## Current Repo State
- `src/app/admin/training/page.tsx` renders four `TrainingEntityTable` instances.
- `src/components/admin/training-entity-table.tsx` currently supports:
  - sorting
  - row selection
  - bulk actions
  - export
  - notes counts
  - detail sheet
  - row actions
  - per-table refresh overlays
- It does not currently paginate rows.
- The `admin/users` table provides the pagination reference pattern for bottom controls and interaction quality.

## Exact Gap
- Training Management lists have no pagination controls.
- Every filtered row is rendered in one table body.
- There is no per-table page state or bottom pager.

## Fixed Behavior Decisions
- Each Training Management table should paginate independently.
- Pagination controls should appear at the bottom of each table card.
- Pagination should apply after filtering and sorting.
- Page changes should not disturb the other three tables.
- Selection should operate on the current visible page, consistent with the existing table behavior.
- Reasonable default page size:
  - use one standard size across all four tables unless a clear entity-specific reason appears

## Required Implementation
- Add independent page state to each `TrainingEntityTable`.
- Page rows after sorting/filtering, before rendering the table body.
- Add bottom pagination controls aligned with the `admin/users` table pattern.
- Reset or clamp page state sensibly when filters, sorts, or refreshes change the available row count.
- Ensure select-all continues to apply only to the current page rows.
- Keep pagination compatible with:
  - row selection
  - bulk actions
  - export selected
  - per-table refresh
  - loading overlay

## Files To Read First
- `src/components/admin/training-entity-table.tsx`
- `src/app/admin/training/page.tsx`
- `src/components/admin/user-management-client.tsx`

## Likely Files To Change
- `src/components/admin/training-entity-table.tsx`
- optionally `src/app/admin/training/page.tsx` if table-level config needs page-size control

## API and Schema Constraints
- No backend pagination endpoint is required for this task.
- Keep this as a client-side pagination enhancement on top of the existing table data loads.

## Dependencies
- Compatible with the independent refresh/loading overlay task.

## Acceptance Criteria
- Programs, Categories, Lessons, and Quizzes each show bottom pagination controls.
- Each table paginates independently.
- Sorting and filtering work correctly with pagination.
- Selection and bulk actions continue to work on the current page.
- Page state remains stable and sensible after refreshes and mutations.

## Verification Test Plan
- [ ] Confirm each table shows pagination controls when row count exceeds one page.
- [ ] Confirm page changes affect only the relevant table.
- [ ] Confirm sorting and filtering still work with pagination.
- [ ] Confirm select-all applies only to the current page rows.
- [ ] Confirm bulk actions still behave correctly after paging.
- [ ] Confirm page state clamps correctly if the current page becomes invalid after a filter or delete.

## Out Of Scope
- server-side pagination
- changing export semantics beyond compatibility with paged display
