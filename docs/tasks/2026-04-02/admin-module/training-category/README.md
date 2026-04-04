# Training Category Parity Task Index - 2026-04-02

- Module: Admin -> Training -> Training Category
- Angular Source Route: `admin-dashboard/training/training-category`
- Next Route: `/admin/training/categories`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-category`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/training-category`

## Scope Of This Review

This folder contains the validated parity tasks for the Admin Training module review of **Training Category**.

Unlike Training Center, this module is already substantially present in Next. The work here is about closing behavior gaps rather than building a new feature system from scratch.

## Verified Current Comparison Summary

### Already Implemented In Next

- category list route at `/admin/training/categories`
- category add route at `/admin/training/categories/add`
- category edit route at `/admin/training/categories/edit/[id]`
- list uses `admin/training-list` and `admin/training-list-count`
- list supports status toggle and delete actions
- list includes category name, package, priority, status, created date, updated date
- list includes category-name search and status filter
- add/edit form already includes category name, priority, role, description, and active status
- role options already load dynamically from `admin/fetch-role-list`

### Implemented In Angular But Not Yet Fully Closed In Next

- explicit Preview action from the category list that opens a training preview experience
- category preview uses the shared training lesson preview flow with mark-as-done disabled
- role selection is multi-select in Angular, but Next shared select infrastructure is single-select only
- description uses a rich editor in Angular, while Next currently uses a plain textarea
- thumbnail upload field exists in Angular using bucket upload/delete semantics, but Next category form does not currently expose an image field
- add/edit form behavior still needs endpoint/model audit so fetch and submit semantics are fully aligned with Angular/backend expectations

## Recommended Execution Order

1. `01-close-training-category-list-parity-and-preview-flow.md`
2. `02-close-training-category-form-parity.md`
3. `03-align-training-category-fetch-model-and-submit-semantics.md`

## Source Files Reviewed

### Angular

- `src/app/admin-dashboard/training/training-category/training-category.component.ts`
- `src/app/admin-dashboard/training/training-category/training-category.component.html`
- `src/app/admin-dashboard/training/add-edit-training-category/add-edit-training-category.component.ts`
- `src/app/admin-dashboard/training/add-edit-training-category/add-edit-training-category.component.html`
- `src/app/common-components/dialog-inner-html/dialog-training-preview.component.ts`
- `src/app/common-components/dialog-inner-html/dialog-training-preview.component.html`

### Next

- `src/app/(admin)/admin/training/categories/page.tsx`
- `src/app/(admin)/admin/training/categories/add/page.tsx`
- `src/app/(admin)/admin/training/categories/edit/[id]/page.tsx`
- `src/app/(admin)/_components/generic-list-page.tsx`
- `src/app/(admin)/_components/generic-form-page.tsx`
- `src/app/(admin)/_components/form-fields/select-field.tsx`
- `src/app/(admin)/_components/form-fields/dynamic-select-field.tsx`
- `src/app/(admin)/_components/form-fields/file-upload-field.tsx`
- `src/app/(admin)/_components/form-fields/textarea-field.tsx`

## Notes

- This folder is the canonical task set for this module.
- This module appears smaller than Training Center, but form-field semantics matter because they affect backend compatibility and content-authoring behavior.
