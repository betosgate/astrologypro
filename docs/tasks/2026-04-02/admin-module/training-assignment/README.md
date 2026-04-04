# Training Assignment Parity Task Index - 2026-04-02

- Module: Admin -> Training -> Assignment
- Angular Source Routes:
  - `admin-dashboard/training/assignment-list`
  - `admin-dashboard/training/assignment-add`
  - `admin-dashboard/training/assignment-edit/:_id`
- Next Route: `/admin/training/assignments`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-assignment`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/training-assignment`

## Scope Of This Review

This folder contains the validated parity tasks for the Admin Training module review of **Assignment**.

The Next assignment module already has list and add/edit scaffolding, but several assignment-specific behaviors are still simplified or only partially aligned.

## Verified Current Comparison Summary

### Already Implemented In Next

- assignment list route at `/admin/training/assignments`
- assignment add route at `/admin/training/assignments/add`
- assignment edit route at `/admin/training/assignments/edit/[id]`
- list uses `training-centre/assignment-list` and `training-centre/assignment-list-count`
- list supports status toggle and delete actions
- list includes assignment title, lesson, priority, status, and created date
- form already includes assignment title, lesson, priority, description, and active status
- edit route already uses `training-centre/assignment-preview` for prepopulation

### Implemented In Angular But Not Yet Fully Closed In Next

- explicit Preview action on the assignment list using `training-centre/assignment-preview`
- Angular list supports lesson-name autocomplete search via `admin/lesson-name-autocomplete-with-assignment`
- Angular add/edit loads lesson options from `admin/fetch-lesson-list` with an explicit POST body
- Angular description uses a rich editor, while Next currently uses plain textarea
- Angular edit form reads data from `response.response.res`, so Next fetch/prepopulation behavior needs explicit model audit
- Angular submit normalizes `status`, includes `_id` on edit, and relies on assignment-specific add/edit payload handling
- Angular cancel route appears inconsistent in code, so Next should follow actual working route structure rather than mirror that typo blindly

## Recommended Execution Order

1. `01-close-training-assignment-list-parity-and-preview-flow.md`
2. `02-close-training-assignment-form-parity.md`
3. `03-align-training-assignment-fetch-model-and-submit-semantics.md`

## Source Files Reviewed

### Angular

- `src/app/admin-dashboard/training/assignment/assignment-list/assignment-list.component.ts`
- `src/app/admin-dashboard/training/assignment/assignment-list/assignment-list.component.html`
- `src/app/admin-dashboard/training/assignment/add-edit-assignment/add-edit-assignment.component.ts`
- `src/app/admin-dashboard/training/assignment/add-edit-assignment/add-edit-assignment.component.html`

### Next

- `src/app/(admin)/admin/training/assignments/page.tsx`
- `src/app/(admin)/admin/training/assignments/add/page.tsx`
- `src/app/(admin)/admin/training/assignments/edit/[id]/page.tsx`
- `src/app/(admin)/_components/generic-list-page.tsx`
- `src/app/(admin)/_components/generic-form-page.tsx`
- `src/app/(admin)/_components/form-fields/dynamic-select-field.tsx`
- `src/app/(admin)/_components/form-fields/textarea-field.tsx`

## Notes

- This folder is the canonical task set for this module.
- Assignment authoring is simpler than lesson or quiz authoring, but preview and submit-model fidelity still matter for backend compatibility.
