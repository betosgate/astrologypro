# Close Calendar Events List Search Filter And Preview Parity - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: list search UX, list filters, preview dialog
- Estimate: 1-1.5 days
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/calendar-events/01-close-calendar-events-list-search-filter-and-preview-parity.md`

## Goal

Bring the Next calendar events list to Angular parity for preview and list narrowing behavior.

## Verified Current Code Truth

- Angular list supports:
  - preview from the list
  - title autocomplete-backed search
  - category autocomplete-backed search
  - start-date range filtering on `start_date`
  - filtering by `displayed_event_for`
  - status filtering
- Next list currently supports:
  - title text search
  - status filtering
  - row-level edit/delete/status actions
- Next list currently does not expose preview, start-date filtering, category search, or displayed-event-for filtering.

## User-Visible Problem

Admins in Next have a weaker event-management workflow when they need to inspect a record quickly or narrow the list by event date, category, or audience.

## Required Behavior

1. `/admin/calendar-events` must expose preview from the list.
2. `/admin/calendar-events` must expose start-date range filtering on `start_date`.
3. `/admin/calendar-events` must support category search.
4. `/admin/calendar-events` must support filtering by `displayed_event_for`.
5. Title search must remain operationally effective for larger lists.
6. Search and filters must compose safely with status filtering, sorting, and pagination.

## Tasks

1. Add preview support using the active event fetch or row-data path.
2. Add start-date range filtering for `start_date`.
3. Add category search and evaluate whether autocomplete-backed UX is needed to match Angular’s practical workflow.
4. Add `displayed_event_for` filtering.
5. Verify title, category, displayed-event-for, status, and date filters merge correctly in list requests.

## Acceptance Criteria

- preview is available from the event list
- start-date range filtering works correctly
- category search works correctly
- displayed-event-for filtering works correctly
- title/category/status/date/audience filters can be combined safely
- row-level edit, delete, and status toggle still work

## Verification Test Plan

1. Open `/admin/calendar-events` and trigger preview for a row.
2. Verify preview shows the key event details Angular admins inspect.
3. Apply a start-date range and confirm the result set narrows correctly.
4. Search by category and confirm the result set narrows correctly.
5. Filter by `displayed_event_for` and status and confirm the combined result set is correct.
6. Re-test edit, delete, and status toggle after the list changes and confirm no regression.

## Notion Summary

P1 list parity gap: the Next Calendar Events list needs preview and stronger search/filter controls so admins can narrow and inspect event records with the same efficiency as Angular.
