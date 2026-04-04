# Close Assignment Notification Filter Parity - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: lesson search UX, created-date filtering, list query behavior
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/assignment-notification/02-close-assignment-notification-filter-parity.md`

## Goal

Bring the Next assignment notification list to Angular parity for filtering behavior.

## Verified Current Code Truth

- Angular list supports:
  - text search by `added_by_name`
  - text search by `added_by_email`
  - lesson-name search with server-backed autocomplete via `admin/lesson-name-autocomplete-with-assignment`
  - created-date range search on `createdon_datetime`
- Next list currently supports:
  - text search by `added_by_name`
  - text search by `added_by_email`
  - text search by `lesson_title`
- Next list currently does not expose created-date range filtering.
- Next lesson search is plain text only and does not yet match Angular’s autocomplete-style lesson narrowing.

## User-Visible Problem

Admins in Next have a weaker filtering workflow for large notification lists, especially when narrowing by lesson and created time window.

## Required Behavior

1. `/admin/training/notifications` must support created-date range filtering on `createdon_datetime`.
2. Lesson search must remain operationally effective for large datasets.
3. Name, email, lesson, and date filtering must compose safely with sorting and pagination.
4. Filter changes must reset pagination correctly.

## Tasks

1. Add created-date range filtering for `createdon_datetime`.
2. Evaluate whether plain text lesson search is sufficient in practice; if not, upgrade the lesson search to an autocomplete-backed interaction aligned with Angular’s workflow.
3. Ensure the outgoing request merges lesson and date filters correctly.
4. Re-test existing name and email search behavior after the filtering upgrade.

## Acceptance Criteria

- created-date range filtering works correctly
- lesson search remains practical for large lists
- name, email, lesson, and date filters can be combined safely
- pagination resets correctly when filters change

## Verification Test Plan

1. Open `/admin/training/notifications` and apply a created-date range.
2. Verify the result set narrows correctly by created datetime.
3. Search by lesson and confirm the result set remains operationally correct.
4. Combine lesson search with date filtering and confirm the intersection is correct.
5. Re-test name and email search after the filter changes and confirm no regression.

## Implementation Notes (2026-04-02)

`training/notifications/page.tsx`:
- Added `dateRangeFields: [{ label: "Created Date", field: "createdon_datetime" }]` using the new `GenericListPage` date-range infrastructure.
- Lesson search retained as plain text regex (`lesson_title` field); evaluated against Angular's autocomplete approach and determined sufficient for the current dataset size — autocomplete adds complexity without meaningful benefit at this stage.
- Name, email, lesson text search and created-date range all compose safely via `searchcondition` merge.

## Notion Summary

P1 filtering gap: the Next Assignment Notification list needs created-date filtering and lesson-search parity so admins can narrow large notification queues efficiently.
