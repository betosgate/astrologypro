# Master Task - Admin Training Category Parity Migration - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Module: Admin Training Nav -> Training Category
- PMS Type: Master Task
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-category`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/training-category`
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-category/00-master-task.md`

## Goal

Bring the Admin Training Category module in `Divine-infinite-ui-next` to parity with the Angular implementation used by `admin-dashboard/training/training-category`, while preserving the list and add/edit routes that already exist in Next.

## Current Product Truth

The Next.js Training Category module is partially migrated and already supports the main list, add, and edit routes. The remaining parity gaps are concentrated in list actions and in form behavior details, especially preview flow, multi-role selection, rich description editing, thumbnail handling, and payload/model alignment.

## Folder Path For Execution

Use this folder as the canonical implementation/task source for this module:

`Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-category`

GitHub folder URL:

`https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/training-category`

## Child Tasks In Scope

1. `01-close-training-category-list-parity-and-preview-flow.md`
2. `02-close-training-category-form-parity.md`
3. `03-align-training-category-fetch-model-and-submit-semantics.md`

## Delivery Expectations

1. Keep `/admin/training/categories` list working.
2. Keep `/admin/training/categories/add` and `/admin/training/categories/edit/[id]` working.
3. Add only the missing parity behaviors that are clearly defined by Angular.
4. Avoid unnecessary redesign of the category module because this feature is mostly CRUD-oriented.
5. Implement and verify child tasks in sequence unless a dependency requires reordering.

## Done Definition

- training category list supports the required admin actions
- preview behavior is available from the list in a clear Next-compatible form
- category add/edit form supports the Angular-required field semantics
- role selection behavior is correct for the backend contract
- description editing preserves required rich content behavior if needed by the module
- thumbnail/image handling is either implemented or intentionally re-scoped with explicit product confirmation
- fetch and submit flows use stable prefill behavior and backend-compatible payload shapes
- all child tasks in this folder are complete or explicitly re-scoped

## Verification Gate

1. Review the child task files in this folder before implementation.
2. Execute implementation in the order listed above.
3. Verify each child task against its own verification plan.
4. Run a final end-to-end admin walkthrough for Training Category list, add, edit, and preview.
5. Confirm no regression in the existing CRUD flow.

## Notion Summary

Master task for Admin Training Category migration. Source of truth folder: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-category`. GitHub folder: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/training-category`. Complete the child tasks in this folder to close the remaining Angular parity gaps without breaking the existing Next CRUD routes.
