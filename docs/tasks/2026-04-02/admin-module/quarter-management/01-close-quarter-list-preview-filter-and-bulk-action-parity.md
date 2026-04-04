# Close Quarter List Preview Filter And Bulk Action Parity - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: list actions, filtering, row selection
- Estimate: 1-1.5 days
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/quarter-management/01-close-quarter-list-preview-filter-and-bulk-action-parity.md`

## Goal

Bring the Next quarter list to Angular parity for preview, updated-date filtering, and bulk operations.

## Verified Current Code Truth

- Angular quarter list includes:
  - text search by `quarter_name`
  - status filtering
  - updated-date range search on `updated_at`
  - preview action from the list
  - bulk status update
  - bulk delete
- Angular’s created-date filter is not active in the live quarter list configuration.
- Next quarter list currently includes:
  - text search by `quarter_name`
  - status filtering
  - row-level delete
  - row-level status toggle
  - edit navigation
- Next quarter list currently does not expose preview, updated-date range search, or multi-select bulk actions.

## User-Visible Problem

Admins in Next cannot inspect quarter details quickly in-place, cannot narrow the list by updated date, and cannot process multiple quarters in one operation.

## Required Behavior

1. `/admin/quarters` must expose a preview action.
2. `/admin/quarters` must expose updated-date range filtering.
3. `/admin/quarters` must allow multi-row selection.
4. `/admin/quarters` must support bulk status update.
5. `/admin/quarters` must support bulk delete.
6. Existing search, status filter, pagination, sorting, and row-level actions must continue to work.

## Tasks

1. Add a preview action to the quarter list using the active quarter fetch flow.
2. Add updated-date range filtering for `updated_at`.
3. Add multi-row selection support to the list.
4. Add bulk status updates for selected quarters.
5. Add bulk delete for selected quarters.
6. Verify the list refreshes correctly and clears stale selection state after bulk actions.

## Acceptance Criteria

- preview is available from the quarter list
- updated-date range filtering works correctly
- selected rows can be updated in bulk for status
- selected rows can be deleted in bulk
- row-level edit, delete, and status toggle still work
- quarter name search and status filtering still compose correctly with the new controls

## Verification Test Plan

1. Open `/admin/quarters` and verify preview is available for a row.
2. Trigger preview and confirm quarter details are readable without leaving the list.
3. Apply an updated-date range and verify the result set narrows correctly.
4. Select multiple quarters and execute a bulk status update.
5. Select multiple quarters and execute bulk delete.
6. Re-run quarter name search and status filtering after these changes and confirm no regression.

## Notion Summary

P1 list parity gap: the Next Quarter list needs preview, updated-date filtering, and bulk actions so admins can inspect and maintain quarter records with the same efficiency they have in Angular.
