# Close Spiritual Wisdom Date Filter Parity - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: list filtering, date-range UX, list query behavior
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/spiritual-wisdom/01-close-spiritual-wisdom-date-filter-parity.md`

## Goal

Bring the Next Spiritual Wisdom list to Angular parity for created-date and updated-date filtering.

## Verified Current Code Truth

- Angular list supports:
  - created-date range search on `created_at`
  - updated-date range search on `updatedon_datetime`
  - title search
  - status filtering
- Next list already supports:
  - title search
  - status filtering
  - sorting
  - row-level edit/delete/status actions
- Next list currently does not expose date-range filtering.

## User-Visible Problem

Admins in Next cannot narrow spiritual wisdom content by created or updated time windows the way the Angular list allows.

## Required Behavior

1. `/admin/content/spiritual-wisdom` must expose created-date range filtering.
2. `/admin/content/spiritual-wisdom` must expose updated-date range filtering.
3. Date filters must compose safely with title search, status filter, sorting, and pagination.
4. Clearing filters must restore the base list state.

## Tasks

1. Add created-date range filtering for `created_at`.
2. Add updated-date range filtering for `updatedon_datetime` or the equivalent live returned timestamp field.
3. Ensure the outgoing request merges date filters with title and status filtering safely.
4. Reset pagination correctly when date filters change.

## Acceptance Criteria

- created-date and updated-date range filters are available
- date filtering works correctly with title search and status filter
- pagination resets correctly when filters change
- clearing filters restores the base list
- existing row-level actions remain intact

## Verification Test Plan

1. Open `/admin/content/spiritual-wisdom` and apply a created-date range.
2. Verify the result set narrows correctly.
3. Apply an updated-date range and verify the result set narrows correctly.
4. Combine date filters with title search and status filtering and confirm the intersection is correct.
5. Clear filters and confirm the base list returns.

## Implementation Notes (2026-04-02)

`GenericListPage` in `generic-list-page.tsx` extended with new optional `dateRangeFields` config:
- Added `DateRangeFieldConfig` interface and `dateRangeFields?: DateRangeFieldConfig[]` to `GenericListConfig`.
- Added `dateCondition` state merged into `searchcondition` alongside `searchCondition` and `filterCondition`.
- Added `handleDateFilter(field, start?, end?)` callback: converts date strings to timestamp range (`$gte` start-of-day, `$lte` end-of-day); removes field key when both are empty.
- Maps `dateRangeFields` to `DataTableConfig.dateFields` (existing `DateFilterConfig` type in `data-table/types.ts`).
- Passes `onDateFilter={handleDateFilter}` to `DataTable` (the prop already existed on `DataTableProps`).

`spiritual-wisdom/page.tsx`:
- Added `dateRangeFields: [{ label: "Created Date", field: "created_at" }, { label: "Updated Date", field: "updatedon_datetime" }]`.

## Notion Summary

P1 list parity gap: the Next Spiritual Wisdom module only needs created and updated date-range filtering to close the remaining trustworthy Angular list behavior gap.
