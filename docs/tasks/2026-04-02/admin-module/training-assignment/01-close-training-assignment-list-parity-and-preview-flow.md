# Close Training Assignment List Parity And Preview Flow - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: list actions, assignment preview fetch/render behavior, search parity review
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-assignment/01-close-training-assignment-list-parity-and-preview-flow.md`

## Goal

Close the remaining assignment list gap by adding the missing preview flow and reviewing whether lesson-name search parity should also be restored.

## Verified Current Code Truth

- Angular assignment list uses `training-centre/assignment-list` with count from `training-centre/assignment-list-count`.
- Angular list supports:
  - edit
  - delete
  - status toggle
  - preview
- Angular preview is configured as an API action against `training-centre/assignment-preview` using `_id`.
- Angular list also includes lesson-name autocomplete search using `admin/lesson-name-autocomplete-with-assignment`.
- Next assignment list already supports edit/delete/status/search/filter, but there is no preview action yet.
- Next currently supports title text search and status filter only.

## User-Visible Problem

Admins can manage assignment records in Next, but they cannot preview assignment details from the list the way they can in Angular.

## Required Behavior

1. Add a preview action for each assignment row.
2. Preview must fetch selected assignment data using `training-centre/assignment-preview`.
3. Preview must present assignment information in a read-only admin-safe surface.
4. Existing list CRUD behavior must remain intact.
5. Review whether lesson-name search is still required for parity and include it if the endpoint remains valid and useful.

## Tasks

1. Extend the assignment list action model to support preview.
2. Implement a read-only preview modal/drawer/page for assignment data.
3. Fetch preview data from `training-centre/assignment-preview` using the selected assignment id.
4. Render safe empty states if optional fields are absent.
5. Evaluate and, if appropriate, add lesson-name search parity using the Angular autocomplete endpoint.

## Acceptance Criteria

- assignment list exposes a visible preview action per row
- preview fetches and displays the selected assignment correctly
- preview is read-only
- list edit/delete/status/search/filter behavior remains intact
- lesson-name search parity is either implemented or explicitly ruled out with rationale

## Verification Test Plan

1. Open `/admin/training/assignments` and confirm list still renders as before.
2. Confirm each row has a preview action in addition to edit/delete/status controls.
3. Open preview for an assignment and verify title, lesson, status, and description render correctly.
4. Re-test edit, delete, search, filter, and status toggle after preview support is added.
5. If lesson-name search is added, verify autocomplete and filter behavior works correctly.

## Implementation Notes (2026-04-02)

Already implemented before this task was executed. Verification confirmed in `assignments/page.tsx`:
- `previewEndpoint: "training-centre/assignment-preview"` is set.
- `previewFields` includes `assignment_title`, `lesson_name`, `priority`, `assignment_description` (`type: "html"`), `status` (`type: "badge"`), `createdon_datetime` (`type: "date"`).
- `GenericListPage` renders the eye-icon action per row and opens `PreviewDialog` fetching `{ _id }`. HTML description is rendered safely through the `html` type renderer.
- Lesson-name autocomplete search (`admin/lesson-name-autocomplete-with-assignment`) explicitly ruled out: requires typeahead integration pattern not currently supported by `GenericListPage`; title search + status filter provides sufficient list navigation.
- No code changes required.

## Notion Summary

P1 list parity gap: Angular Training Assignment includes an API-backed Preview action from the list. Next already has the CRUD list, but still needs the preview entrypoint and read-only assignment preview surface.
