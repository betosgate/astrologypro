# Training Lesson Parity Task Index - 2026-04-02

- Module: Admin -> Training -> Training Lesson
- Angular Source Route: `admin-dashboard/training/training-lesson`
- Next Route: `/admin/training/lessons`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-lesson`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/training-lesson`

## Scope Of This Review

This folder contains the validated parity tasks for the Admin Training module review of **Training Lesson**.

The Next lesson module already exists, but several lesson-specific behaviors are still missing or only partially represented in generic form/list scaffolding.

## Verified Current Comparison Summary

### Already Implemented In Next

- lesson list route at `/admin/training/lessons`
- lesson add route at `/admin/training/lessons/add`
- lesson edit route at `/admin/training/lessons/edit/[id]`
- list uses `admin/lesson-list` and `admin/lesson-list-count`
- list supports status toggle and delete actions
- list includes lesson name, category, prerequisite lesson, accuracy, priority, status, and created date
- list includes lesson-name search and status filter
- form already includes lesson name, priority, category, prerequisite lesson, accuracy, description, and active status
- edit route already uses `admin/lesson-edit`

### Implemented In Angular But Not Yet Fully Closed In Next

- explicit Preview action on the lesson list using `admin/lesson-fetch`
- preview includes lesson details from API-backed fetch, not just route navigation
- prerequisite lesson options depend on the selected category and refresh dynamically from `admin/prerequisite-lesson?category_id=...`
- prerequisite lesson save/rehydration semantics should be validated so the current Next field wiring does not drift from backend expectations
- Angular uses rich editor description, while Next uses plain textarea
- Angular supports file-backed lesson authoring for:
  - images
  - audio
  - video
  - assets
- Angular upload behavior is bucket-based and supports multi-file fields
- Angular submit logic removes empty media arrays before submit and sends `_id` on edit
- Next shared file-upload field is currently single-file and image-preview oriented
- Next add page still declares `fetchEndpoint: admin/lesson-fetch`, which is unnecessary for add mode

## Recommended Execution Order

1. `01-close-training-lesson-list-parity-and-preview-flow.md`
2. `02-close-training-lesson-form-parity-and-dependent-fields.md`
3. `03-align-training-lesson-fetch-model-submit-and-media-semantics.md`

## Source Files Reviewed

### Angular

- `src/app/admin-dashboard/training/lesson/lesson.component.ts`
- `src/app/admin-dashboard/training/lesson/lesson.component.html`
- `src/app/admin-dashboard/training/add-edit-lesson/add-edit-lesson.component.ts`
- `src/app/admin-dashboard/training/add-edit-lesson/add-edit-lesson.component.html`

### Next

- `src/app/(admin)/admin/training/lessons/page.tsx`
- `src/app/(admin)/admin/training/lessons/add/page.tsx`
- `src/app/(admin)/admin/training/lessons/edit/[id]/page.tsx`
- `src/app/(admin)/_components/generic-list-page.tsx`
- `src/app/(admin)/_components/generic-form-page.tsx`
- `src/app/(admin)/_components/form-fields/file-upload-field.tsx`
- `src/app/(admin)/_components/form-fields/textarea-field.tsx`

## Notes

- This folder is the canonical task set for this module.
- Lesson authoring is more stateful than category authoring because field dependencies and media payload semantics are part of the feature, not cosmetic extras.
