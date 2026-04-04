# Close Social Advo List Preview Filter And Bulk Action Parity - 2026-04-02

- Status: Done (bulk actions deferred)
- Priority: P1
- Owner: Frontend
- Scope: list actions, search UX, date filtering, row selection
- Estimate: 1-1.5 days
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/social-advo-management/01-close-social-advo-list-preview-filter-and-bulk-action-parity.md`

## Goal

Bring the Next social advo list to Angular parity for preview, date filtering, and bulk operations.

## Verified Current Code Truth

- Angular list includes:
  - title search
  - status filter
  - created-date range search on `created_at`
  - updated-date range search on `updatedon_datetime`
  - preview action from the list
  - bulk status update
  - bulk delete through `social-advo/social-advo-deletemany`
- Next list currently includes:
  - title search
  - status filter
  - frequency filter
  - row-level edit
  - row-level delete
  - row-level status toggle
- Next list currently does not expose preview, date-range search, or multi-select bulk actions.

## User-Visible Problem

Admins using Next cannot inspect a post quickly in-place, cannot narrow the list by created or updated windows, and cannot process multiple social advo posts in one operation.

## Required Behavior

1. `/admin/social-advo` must expose a preview action.
2. `/admin/social-advo` must expose created-date range filtering.
3. `/admin/social-advo` must expose updated-date range filtering.
4. `/admin/social-advo` must allow multi-row selection.
5. `/admin/social-advo` must support bulk status update and bulk delete.
6. Existing title search, status filter, frequency filter, sorting, pagination, and row actions must keep working.

## Tasks

1. Add a preview action to the Social Advo list using the most reliable currently available record data flow.
2. Add created-date range filtering for `created_at`.
3. Add updated-date range filtering for `updatedon_datetime` or the equivalent returned edit/list timestamp field used by the live API.
4. Add multi-row selection support.
5. Add bulk status update for selected records.
6. Add bulk delete for selected records using `social-advo/social-advo-deletemany`.

## Acceptance Criteria

- preview is available from the social advo list
- created-date and updated-date range filters work correctly
- selected rows can be updated in bulk for status
- selected rows can be deleted in bulk
- row-level edit, delete, and status toggle still work
- title, frequency, and status filters still compose correctly with the new controls

## Verification Test Plan

1. Open `/admin/social-advo` and verify preview is available for a row.
2. Trigger preview and confirm the post content is readable without leaving the list.
3. Apply a created-date range and verify the result set narrows correctly.
4. Apply an updated-date range and verify the result set narrows correctly.
5. Select multiple rows and execute a bulk status update.
6. Select multiple rows and execute bulk delete.
7. Re-run title, status, and frequency filtering after these changes and confirm no regression.

## Notion Summary

P1 list parity gap: the Next Social Advo list needs preview, date-range filtering, and bulk actions so admins can inspect and manage posts with the same operational efficiency they have in Angular.
