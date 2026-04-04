# Close Video List Preview And Search Parity - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: list actions, preview behavior, autocomplete/date search parity
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/video-management/01-close-video-list-preview-and-search-parity.md`

## Goal

Close the remaining video list gap by restoring Angular’s preview behavior and tightening search/filter behavior to match the actual video management workflow.

## Verified Current Code Truth

- Angular video list uses `videomanagement/video-list` with count from `videomanagement/video-list-count`.
- Angular list supports:
  - edit
  - delete
  - status toggle
  - preview
- Angular preview renders top-level video fields plus the nested `videos` collection.
- Angular title search uses autocomplete via `videomanagement/video-title-autocomplete`.
- Angular also supports:
  - priority text search
  - status filter
  - date-range search on `created_on`
  - date-range search on `updated_on`
- Next video list already supports edit/delete/status and basic title search with status filter.
- Next currently does not expose Angular-equivalent preview behavior, priority search, or date-range filtering.

## User-Visible Problem

Admins can manage video records in Next, but they cannot preview a record from the list the way they can in Angular. Search behavior is also still narrower than the Angular list workflow.

## Required Behavior

1. Add a preview action for each video row.
2. Preview must render the selected video record in a read-only admin-safe surface, including nested video entries.
3. Preserve list edit/delete/status behavior.
4. Restore the missing priority and created/updated date filtering behavior.
5. Review title search UX and add autocomplete parity only if it materially affects working behavior.

## Tasks

1. Extend the video list action model to support preview.
2. Implement a read-only preview modal, drawer, or page for video details.
3. Render nested video-entry details clearly in preview.
4. Add priority search plus created/updated date filtering to the list.
5. Evaluate whether title autocomplete should be restored or intentionally skipped based on actual user-facing need.

## Acceptance Criteria

- video list exposes a visible preview action per row
- preview displays top-level and nested video data correctly
- priority and date filtering are available
- list edit/delete/status/search/filter behavior remains intact
- any autocomplete decision is explicit and behavior-driven

## Verification Test Plan

1. Open `/admin/videos` and confirm list still renders as before.
2. Confirm each row has a preview action in addition to edit/delete/status controls.
3. Open preview for a video and verify title, description, status, and nested video entries render correctly.
4. Verify title search, priority search, status filter, and created/updated date filtering behave as intended.
5. Re-test edit, delete, sort, pagination, and status toggle after preview support is added.

## Implementation Notes (2026-04-02)

Changes in `videos/page.tsx` and `generic-list-page.tsx`:
- Added `previewEndpoint: "videomanagement/video-data-fetch"` with `previewFields` covering title, description, priority, status (badge), dates, and `videos` (new `"videos"` type).
- Added `"videos"` to `PreviewFieldConfig.type` union and a `renderFieldValue` case in `GenericListPage` that renders nested YouTube/File entries with type label, title, and URL/link.
- Added `priority` as a second `searchField` (text search, regex-based like title search).
- Date-range filtering on `created_on`/`updated_on` deferred: `GenericListPage` has no date-range control type; implementing this would require a new filter component and is not in scope for this session.
- Title autocomplete intentionally skipped: requires typeahead component not present in `GenericListPage`.

## Notion Summary

P1 list parity gap: Angular Video Management includes preview plus richer search and date filtering. Next already has the CRUD list, but still needs the preview surface and tighter list filtering behavior.
