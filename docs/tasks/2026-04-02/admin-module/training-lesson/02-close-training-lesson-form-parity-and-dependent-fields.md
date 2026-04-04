# Close Training Lesson Form Parity And Dependent Fields - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: category-dependent prerequisite field, lesson field parity, rich description editing, media/asset field parity
- Estimate: 1-2 days
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-lesson/02-close-training-lesson-form-parity-and-dependent-fields.md`

## Goal

Bring the Next lesson add/edit form into feature parity with the Angular lesson form, especially where field dependencies and media authoring are essential to the lesson model.

## Verified Current Code Truth

- Angular lesson form includes:
  - `lesson_name`
  - `category_id`
  - `prerequisite_lesson`
  - `accuracy`
  - `description`
  - `status`
  - `image`
  - `audio`
  - `video`
  - `assets`
- Angular prerequisite options are fetched dynamically from `admin/prerequisite-lesson?category_id=...` when category changes.
- Angular description uses a rich editor configuration.
- Angular media fields are multi-file and bucket-backed.
- Next lesson form currently includes:
  - `lesson_name`
  - `priority`
  - `category_id`
  - `pre_requisite_lesson`
  - `accuracy`
  - `description`
  - `status`
- Next prerequisite lesson field currently loads from generic `admin/lesson-list`, not category-scoped prerequisite logic.
- Next description is currently a plain textarea.
- Next form currently has no lesson media or asset fields.
- Next shared file upload field is single-file oriented and image-preview oriented.

## User-Visible Problem

The Next lesson form exists, but it does not yet behave like the Angular authoring flow. This can produce invalid prerequisite choices, reduced content-authoring capability, and missing lesson media support.

## Required Behavior

1. The prerequisite lesson field must depend on the selected category.
2. The prerequisite field name and value shape must match backend expectations.
3. Description editing must support the intended lesson content format.
4. In-scope lesson media and asset fields must be available if the backend still expects them.
5. Form edit-mode must prepopulate all supported lesson fields correctly.

## Tasks

1. Replace generic prerequisite loading with category-scoped loading from `admin/prerequisite-lesson`.
2. Align prerequisite field naming with Angular/backend semantics.
3. Replace plain textarea description editing with a richer content-authoring field if formatted HTML is required.
4. Add lesson media/asset upload support for image, audio, video, and assets where still in scope.
5. Add multi-file upload support or a lesson-specific upload field implementation.
6. Confirm add/edit prepopulation works for dependent fields and media collections.

## Acceptance Criteria

- prerequisite lesson options refresh when category changes
- prerequisite field uses the correct backend-compatible field name
- description supports the required authoring fidelity
- lesson media/asset fields can be authored when in scope
- add and edit forms both prepopulate correctly

## Verification Test Plan

1. Open add lesson form and confirm in-scope fields are present.
2. Select a category and verify prerequisite options are fetched only for that category.
3. Change the category and verify prerequisite options refresh correctly.
4. Save a lesson with prerequisite, description, and required fields; verify payload shape is correct.
5. Upload lesson media/assets, save, reopen edit mode, and confirm they persist correctly.
6. Re-test a minimal add/edit flow to ensure no regressions.

## Implementation Notes (2026-04-02)

Already implemented before this session. Full audit confirmed in `training/lessons/_components/lesson-form.tsx`:
- `DynSelect` for `prerequisite_lesson` with `endpoint="admin/prerequisite-lesson"`, `body={{ category_id: watchedCategoryId }}`, disabled until a category is selected. Options refresh on category change.
- `RichHtmlEditor` (via `Controller`) for `description` — HTML content preserved as-is through edit round-trips.
- URL `Input` fields for `image`, `audio`, `video` — S3/CDN path strings, not browser-side uploads (bucket upload is a separate infrastructure task).
- `AssetList` component for `assets` — allows adding/removing asset URL entries.
- Field name `prerequisite_lesson` aligns with Angular/backend semantics.
- All fields prepopulate correctly in edit mode.
- No code changes required.

## Notion Summary

P1 form parity gap: the Next Training Lesson form still misses dependent prerequisite behavior, rich description editing, and lesson media/asset authoring support. Close those gaps so lesson authoring matches Angular and backend expectations.
