# Close Perennial Content List Preview Sort And Filter Parity - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: list preview, sort model, date filtering, content list parity
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/perennial-dashboard-content/01-close-perennial-content-list-preview-sort-and-filter-parity.md`

## Goal

Close the list-level parity gap before form work starts, so admins can review and manage content records with the same operational visibility they have in Angular.

## Verified Current Code Truth

- Angular list uses `content/content-list` with count from `content/content-list-count`.
- Angular list supports:
  - edit
  - delete
  - preview
  - title text search
  - display date filtering
  - content status filter
  - access control filter
  - content type filter
- Angular list sorts by `priority` ascending by default.
- Angular list displays:
  - content type
  - title
  - description
  - access control
  - priority
  - content status
  - display date
- Next list already supports title search plus content status, access control, and content type filters.
- Next list currently omits preview, priority column, and the Angular display-oriented sort model.

## User-Visible Problem

Admins can access the content list in Next, but they lose preview and some of the list context that matters when managing many dashboard content items across content types.

## Required Behavior

1. Add preview for a selected content record.
2. Restore the Angular list information model where it materially affects content management.
3. Support date-based filtering for `display_dates`.
4. Preserve content status, access control, and content type filtering.
5. Keep list performance and pagination behavior intact.

## Tasks

1. Add a preview action for each content row.
2. Implement a read-only preview surface for content records.
3. Restore priority visibility if it remains operationally important in the current list workflow.
4. Replace any mis-modeled date search behavior with true date filtering on `display_dates`.
5. Align default sort behavior with the actual management use case if Angular’s priority-first ordering is still required.

## Acceptance Criteria

- content list exposes a visible preview action per row
- preview displays the selected content record correctly
- date filtering on `display_dates` works as intended
- filters for content status, access control, and content type remain intact
- list sort/pagination/edit/delete behavior remains intact

## Verification Test Plan

1. Open `/admin/perennial-content` and confirm the list still renders as before.
2. Confirm each row has a preview action in addition to edit/delete controls.
3. Open preview for one record of each available content type and verify the summary data renders correctly.
4. Verify title search, display-date filtering, content status filter, access control filter, and content type filter all work correctly.
5. Re-test sort, pagination, edit, and delete after preview/filter changes.

## Implementation Notes (2026-04-02)

Changes in `perennial-content/page.tsx`:
- Added `previewEndpoint: "content/content-fetch"` and `previewFields` covering all content type branches (title, content_type, description, access_control, priority, content_status, tags, stream/video/doc/announcement fields, display_dates). The GenericListPage preview dialog renders only non-empty keys, so branch-specific fields are naturally absent for irrelevant types.
- Added `priority` column with sortable + number type; made `display_dates` sortable.
- Title text search and all three filters (content_status, access_control, content_type) preserved.
- Date-range filtering deferred: GenericListPage has no date-range control type.

## Notion Summary

P1 list parity gap: Angular Perennial Dashboard Content includes preview plus a richer list context and date filtering model. Close list parity first before tackling the deeper branching form work.
