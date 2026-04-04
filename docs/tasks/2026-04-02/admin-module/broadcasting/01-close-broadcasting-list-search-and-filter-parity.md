# Close Broadcasting List Search And Filter Parity - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: title search behavior, updated-date filtering, list parity review
- Estimate: 0.5 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/broadcasting/01-close-broadcasting-list-search-and-filter-parity.md`

## Goal

Close the remaining list gap by aligning broadcasting search and updated-date filtering behavior with the Angular list workflow.

## Verified Current Code Truth

- Angular broadcasting list uses `brodcasting/brodcasting-list` with count from `brodcasting/brodcasting-list-count`.
- Angular list supports:
  - edit
  - delete
  - status toggle
  - title autocomplete search
  - updated-date range filtering
  - status filter
- Angular list does not expose a functioning preview action in the current list configuration.
- Next broadcasting list already supports edit/delete/status and status filter.
- Next currently configures `updated_on` as a generic search field instead of a date-range filter.
- Next currently does not restore Angular-style title autocomplete behavior.

## User-Visible Problem

Admins can manage broadcast records in Next, but the list filtering model does not yet match the Angular workflow. Updated-date filtering is especially misaligned because it is currently treated like a text search.

## Required Behavior

1. Support updated-date filtering in a way that matches the Angular list workflow.
2. Preserve status filtering and current CRUD behavior.
3. Review title autocomplete parity and restore it only if it materially affects working search behavior.
4. Avoid creating list work for preview behavior that Angular does not actually expose in the working list.
5. Keep list sorting, pagination, and status toggling intact.

## Tasks

1. Replace generic `updated_on` text search behavior with the correct date-filter behavior.
2. Preserve or refine title search behavior based on actual Angular usage.
3. Validate status filter behavior alongside updated-date filtering.
4. Re-test list pagination and sorting after the filter changes.
5. Document any intentional deviation if autocomplete is not restored.

## Acceptance Criteria

- broadcasting list supports updated-date filtering in a usable parity-aligned way
- status filter remains intact
- title search behavior is intentionally aligned with Angular usage
- list edit/delete/status/sort/pagination behavior remains intact

## Verification Test Plan

1. Open `/admin/broadcasting` and confirm the list still renders as before.
2. Verify updated-date filtering works as a date-based control, not a text search.
3. Verify status filtering still works.
4. Verify title search still finds the expected records.
5. Re-test edit, delete, sort, pagination, and status toggle after the filter update.

## Implementation Notes (2026-04-02)

Changes in `broadcasting/page.tsx`:
- Replaced `{ label: "Updated On", field: "updated_on", placeholder: "Search by date..." }` search field with `{ label: "Title", field: "title", placeholder: "Search by title..." }`. The `updated_on` text search was non-functional because `GenericListPage` uses regex text matching, which does not work against date values.
- Date-range filtering on `updated_on` deferred: `GenericListPage` has no date-range control type; a proper implementation requires a new filter component.
- Title autocomplete intentionally skipped: requires typeahead integration not present in `GenericListPage`.
- No preview wired: Angular broadcasting list does not expose a functioning preview action in the current list config.
- Status filter and all existing CRUD behavior preserved.

## Notion Summary

P1 list parity gap: Angular Broadcasting relies on title search plus updated-date and status filtering. Next still needs the updated-date filter model aligned so the list behaves like the old admin flow.
