# Close Webinar List Preview And Date Filter Parity - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: list preview, date-range filtering, list query behavior
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/webinar-management/01-close-webinar-list-preview-and-date-filter-parity.md`

## Goal

Bring the Next webinar list to Angular parity for row preview and created-date filtering.

## Verified Current Code Truth

- Angular webinar list supports:
  - preview from the list
  - title search
  - status filtering
  - created-date range search on `createdon_datetime`
- Angular preview shows:
  - `title`
  - `description`
  - `priority`
  - `frequency`
  - `createdon_datetime`
- Next webinar list currently supports:
  - title search
  - status filtering
  - row-level edit/delete/status actions
- Next webinar list currently does not expose preview.
- Next page currently uses `createdon_datetime` inside `searchFields`, which does not establish proper date-range filtering parity.

## User-Visible Problem

Admins in Next cannot inspect webinar details directly from the list and cannot narrow webinars by created time window the way Angular allows.

## Required Behavior

1. `/admin/webinars` must expose preview from the list.
2. `/admin/webinars` must expose created-date range filtering on `createdon_datetime`.
3. Preview must show the core webinar fields Angular admins inspect.
4. Date filtering must compose safely with title search, status filtering, sorting, and pagination.

## Tasks

1. Add preview support using the active webinar preview flow.
2. Render preview fields for title, description, priority, frequency, and created datetime.
3. Replace the current created-on search placeholder behavior with real date-range filtering on `createdon_datetime`.
4. Ensure list requests merge date filters with title and status filters correctly.
5. Reset pagination safely when date filters change.

## Acceptance Criteria

- preview is available from the webinar list
- preview shows the expected webinar details
- created-date range filtering works correctly
- title, status, and created-date filtering can be combined safely
- row-level edit, delete, and status toggle still work

## Verification Test Plan

1. Open `/admin/webinars` and trigger preview for a row.
2. Verify the preview shows title, description, priority, frequency, and created datetime.
3. Apply a created-date range and confirm the result set narrows correctly.
4. Combine title search, status filter, and created-date filter and confirm the intersection is correct.
5. Re-test edit, delete, and status toggle after the list changes and confirm no regression.

## Notion Summary

P1 list parity gap: the Next Webinar module only needs list preview and proper created-date filtering to close the remaining trustworthy Angular behavior gap.
