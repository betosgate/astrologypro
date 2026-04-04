# Close Training Category List Parity And Preview Flow - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: list actions, preview entrypoint, preview UX parity, safe read-only behavior
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-category/01-close-training-category-list-parity-and-preview-flow.md`

## Goal

Close the remaining list-level behavior gap by adding the missing category preview flow that exists in Angular.

## Verified Current Code Truth

- Angular category list uses `admin/training-list` with count from `admin/training-list-count`.
- Angular list exposes custom row actions:
  - `Edit`
  - `Preview`
- Angular `Preview` opens `DialogTrainingPreviewComponent` and passes `training_id`.
- Angular preview renders `app-training-lesson-show` in read-only preview mode with `hide_mark_as_done = true`.
- Next category list already supports:
  - status toggle
  - delete
  - edit route
  - search and status filter
- Next `GenericListPage` only supports built-in actions from config:
  - edit
  - view route navigation
  - delete
- Next category list currently has no preview action or preview route/modal behavior.

## User-Visible Problem

Admins can manage categories in Next, but they cannot inspect category/training content directly from the list the way they can in Angular.

## Required Behavior

1. Add a preview action for each category row.
2. The preview must open a read-only content view for the selected training/category record.
3. The preview must not allow mark-as-done or destructive lesson progression behavior.
4. The preview should reuse the eventual Training Center preview/player primitives where practical instead of creating duplicate rendering logic.
5. The list's existing edit/delete/status/search behavior must remain intact.

## Tasks

1. Decide whether preview should be implemented as:
   - a modal/drawer
   - a dedicated preview route
2. Extend list action support so category rows can launch preview.
3. Build a read-only preview surface around the selected training/category.
4. Ensure preview mode disables completion behavior and other write-side lesson actions.
5. Confirm preview gracefully handles empty categories or missing lesson data.

## Acceptance Criteria

- category list exposes a visible preview action per row
- preview opens for a valid category/training row
- preview is read-only from the admin perspective
- existing list CRUD behaviors still work
- preview handles no-lesson states safely

## Verification Test Plan

1. Open `/admin/training/categories` and confirm list still renders as before.
2. Confirm each row has a preview action in addition to edit/delete/status controls.
3. Open preview for a category with lesson data and verify lesson content appears.
4. Confirm preview mode does not expose completion or mutation actions.
5. Open preview for a category with no lesson data and verify a safe empty state is shown.
6. Re-test edit, delete, search, filter, and status toggle after preview support is added.

## Implementation Notes (2026-04-02)

Already implemented before this session. Full audit confirmed in `training/categories/page.tsx`:
- `previewEndpoint: "admin/training-edit"` wired; `previewFields` covers `category_name`, `priority`, `role`, `description` (html), `status` (badge), `createdon_datetime` (date).
- `GenericListPage` renders a preview dialog per row using these fields — read-only by construction.
- Category name search and status filter preserved.
- No code changes required.

## Notion Summary

P1 list parity gap: Angular Training Category includes a Preview action that opens read-only training content. Next already has the CRUD list, but still needs the preview entrypoint and read-only preview surface.
