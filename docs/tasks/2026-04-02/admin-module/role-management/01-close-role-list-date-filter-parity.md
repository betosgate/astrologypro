# Close Role List Date Filter Parity - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: role list filtering, list query payloads, date-range UX
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/role-management/01-close-role-list-date-filter-parity.md`

## Goal

Bring the Next role list to Angular parity for created-date and updated-date range filtering.

## Verified Current Code Truth

- Angular role list exposes two date-range searches:
  - `createdon_datetime`
  - `updatedon_datetime`
- Angular role list also supports text search by `role_name` and select filtering by `status`.
- Next role list already supports:
  - text search by `role_name`
  - status filtering
  - sorting
  - preview
  - edit
  - row-level status toggle
  - row-level delete
- The current shared Next generic list configuration does not expose any date-range filter contract for the role list.

## User-Visible Problem

Admins migrating from Angular cannot narrow the role list by created or updated time windows in Next, which makes auditing and operational lookup slower.

## Required Behavior

1. `/admin/roles` must expose a created-date range filter.
2. `/admin/roles` must expose an updated-date range filter.
3. Submitted filter payloads must map cleanly to backend-compatible search conditions.
4. Date filters must compose safely with existing text search, status filter, sorting, and pagination.
5. Clearing filters must restore the unfiltered list state without stale results.

## Tasks

1. Extend the shared list layer or the role list wrapper so the module can render date-range filters.
2. Add created-date range filtering for `createdon_datetime`.
3. Add updated-date range filtering for `updatedon_datetime`.
4. Ensure the outgoing list request merges date filters with existing search and status conditions safely.
5. Reset pagination correctly when date filters change.

## Acceptance Criteria

- role list exposes created-date and updated-date range filters
- filters produce correct backend-compatible search conditions
- date filtering works together with role name search and status filtering
- changing filters resets pagination safely
- clearing filters restores the base list

## Verification Test Plan

1. Open `/admin/roles` and verify both created-date and updated-date range controls are visible.
2. Apply a created-date range and verify returned rows match the expected time window.
3. Apply an updated-date range and verify returned rows match the expected time window.
4. Combine a date range with `role_name` search and confirm the result set is correctly intersected.
5. Combine a date range with status filtering and confirm active/inactive results remain correct.
6. Clear the filters and verify the base role list returns.

## Notion Summary

P1 list parity gap: the Next Role module needs created and updated date-range filters so admins can audit and narrow role records the same way they can in Angular.
