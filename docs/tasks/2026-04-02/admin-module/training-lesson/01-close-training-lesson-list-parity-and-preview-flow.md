# Close Training Lesson List Parity And Preview Flow - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: list actions, API-backed preview behavior, read-only lesson inspection
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-lesson/01-close-training-lesson-list-parity-and-preview-flow.md`

## Goal

Close the remaining lesson list gap by adding the missing Preview action and a proper read-only lesson inspection flow.

## Verified Current Code Truth

- Angular lesson list uses `admin/lesson-list` with count from `admin/lesson-list-count`.
- Angular list supports:
  - edit
  - delete
  - status toggle
  - preview
- Angular preview is configured as an API action against `admin/lesson-fetch` using `_id`.
- Angular preview exposes lesson fields including:
  - lesson name
  - category name
  - prerequisite lesson name
  - accuracy
  - status
  - description
- Next lesson list already supports edit/delete/status/search/filter, but there is no preview action yet.
- Next generic list infrastructure supports built-in edit/view/delete only; there is no explicit custom preview action model in use here yet.

## User-Visible Problem

Admins can manage lesson records in Next, but they cannot preview lesson content from the list the way they can in Angular.

## Required Behavior

1. Add a preview action for each lesson row.
2. Preview must fetch the selected lesson detail using `admin/lesson-fetch`.
3. Preview must present lesson information in a read-only admin-safe surface.
4. Preview should include the fields Angular exposes where available.
5. Existing list CRUD behavior must remain intact.

## Tasks

1. Extend the lesson list action model to support preview.
2. Implement a read-only preview modal/drawer/page for lesson data.
3. Fetch preview data from `admin/lesson-fetch` using the selected lesson id.
4. Render safe empty states if optional fields or media are absent.
5. Reuse shared detail UI patterns where practical without over-generalizing prematurely.

## Acceptance Criteria

- lesson list exposes a visible preview action per row
- preview fetches and displays the selected lesson correctly
- preview is read-only
- list edit/delete/status/search/filter behavior remains intact
- preview handles missing optional media/content safely

## Verification Test Plan

1. Open `/admin/training/lessons` and confirm list still renders as before.
2. Confirm each row has a preview action in addition to edit/delete/status controls.
3. Open preview for a lesson with description/media data and verify it renders correctly.
4. Open preview for a lesson with sparse data and verify the UI remains stable.
5. Re-test edit, delete, search, filter, and status toggle after preview support is added.

## Implementation Notes (2026-04-02)

Already implemented before this session. Full audit confirmed in `training/lessons/page.tsx`:
- `previewEndpoint: "admin/lesson-fetch"` wired; `previewFields` covers `lesson_name`, `cat_name`, `prerequisite_lesson_name`, `accuracy`, `description` (html), `status` (badge), `createdon_datetime` (date).
- `GenericListPage` renders a preview dialog per row using these fields — read-only by construction.
- Lesson name search and status filter preserved.
- No code changes required.

## Notion Summary

P1 list parity gap: Angular Training Lesson includes an API-backed Preview action from the list. Next already has the CRUD list, but still needs the preview entrypoint and read-only preview surface.
