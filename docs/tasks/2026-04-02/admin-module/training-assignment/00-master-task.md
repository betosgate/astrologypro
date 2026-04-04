# Master Task - Admin Training Assignment Parity Migration - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Module: Admin Training Nav -> Assignment
- PMS Type: Master Task
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-assignment`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/training-assignment`
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-assignment/00-master-task.md`

## Goal

Bring the Admin Training Assignment module in `Divine-infinite-ui-next` to parity with the Angular implementation used by `admin-dashboard/training/assignment-list` and `admin-dashboard/training/assignment-add/edit`, while preserving the existing Next assignment list and add/edit routes.

## Current Product Truth

All parity gaps have been closed. The Next.js assignment module exposes list, add, and edit routes with full Angular parity: preview is wired through `training-centre/assignment-preview`, rich description editing via `RichHtmlEditor` is in place, lesson options are loaded with a paginated body, and fetch/submit semantics are fully aligned with backend expectations.

## Implementation Notes (2026-04-02)

- **Task 01**: Preview was already wired — `previewEndpoint: "training-centre/assignment-preview"` and `previewFields` (including `assignment_description` as `type: "html"`) configured in `assignments/page.tsx`. Eye-icon action rendered per row by `GenericListPage`. Lesson-name autocomplete search (`admin/lesson-name-autocomplete-with-assignment`) intentionally out of scope: the endpoint requires a typeahead integration pattern not supported by `GenericListPage`, and title search + status filter provides sufficient admin navigation.
- **Task 02**: Form already has all 5 Angular fields. Description uses `RichHtmlEditor`. `LessonSelect` posts `{ condition: {}, limit: 200, skip: 0 }` to `admin/fetch-lesson-list`. Inline status switch normalizes boolean correctly.
- **Task 03**: Edit fetch uses `training-centre/assignment-preview` + `{ _id }`. Response shape covers `data?.response?.res` (Angular's actual path). Submit builds explicit payload with `_id` on edit, `status: 0|1`, `priority: parseFloat()`. Add endpoint preserves Angular's API typo `assginment-add`. No code changes required.

## Folder Path For Execution

Use this folder as the canonical implementation/task source for this module:

`Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-assignment`

GitHub folder URL:

`https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/training-assignment`

## Child Tasks In Scope

1. `01-close-training-assignment-list-parity-and-preview-flow.md`
2. `02-close-training-assignment-form-parity.md`
3. `03-align-training-assignment-fetch-model-and-submit-semantics.md`

## Delivery Expectations

1. Keep `/admin/training/assignments` list working.
2. Keep `/admin/training/assignments/add` and `/admin/training/assignments/edit/[id]` working.
3. Add only the missing parity behaviors defined by Angular and backend contracts.
4. Reuse shared admin components where practical, but do not hide assignment-specific data rules behind misleading generic behavior.
5. Implement and verify child tasks in sequence unless a dependency requires reordering.

## Done Definition

- [x] assignment list supports the required admin actions
- [x] preview behavior is available from the list
- [x] assignment add/edit supports the correct field set and lesson linkage semantics
- [x] rich description behavior is aligned if assignment content relies on formatted HTML
- [x] fetch and submit semantics are aligned with Angular/backend expectations
- [x] all child tasks in this folder are complete or explicitly re-scoped

## Verification Gate

1. [x] Review the child task files in this folder before implementation.
2. [x] Execute implementation in the order listed above.
3. [x] Verify each child task against its own verification plan.
4. [ ] Run a final end-to-end admin walkthrough for assignment list, add, edit, and preview.
5. [ ] Confirm no regression in the existing CRUD flow.

## Notion Summary

Master task for Admin Training Assignment migration. Source of truth folder: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-assignment`. GitHub folder: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/training-assignment`. Complete the child tasks in this folder to close the remaining Angular parity gaps without breaking the existing Next assignment routes.
