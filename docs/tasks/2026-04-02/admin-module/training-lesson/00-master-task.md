# Master Task - Admin Training Lesson Parity Migration - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Module: Admin Training Nav -> Training Lesson
- PMS Type: Master Task
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-lesson`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/training-lesson`
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-lesson/00-master-task.md`

## Goal

Bring the Admin Training Lesson module in `Divine-infinite-ui-next` to parity with the Angular implementation used by `admin-dashboard/training/training-lesson`, while preserving the existing Next list and add/edit routes.

## Current Product Truth

The Next.js lesson module already exposes list, add, and edit routes, but it still simplifies important lesson-authoring and preview behaviors. The remaining work is concentrated around preview parity, category-dependent prerequisite lesson selection, rich content/media upload support, and backend model alignment for lesson fields.

## Folder Path For Execution

Use this folder as the canonical implementation/task source for this module:

`Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-lesson`

GitHub folder URL:

`https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/training-lesson`

## Child Tasks In Scope

1. `01-close-training-lesson-list-parity-and-preview-flow.md`
2. `02-close-training-lesson-form-parity-and-dependent-fields.md`
3. `03-align-training-lesson-fetch-model-submit-and-media-semantics.md`

## Delivery Expectations

1. Keep `/admin/training/lessons` list working.
2. Keep `/admin/training/lessons/add` and `/admin/training/lessons/edit/[id]` working.
3. Add only the missing parity behaviors defined by Angular and current backend contracts.
4. Reuse shared admin components where possible, but do not force generic abstractions to hide lesson-specific data rules.
5. Implement and verify child tasks in sequence unless a dependency requires reordering.

## Done Definition

- lesson list supports the required admin actions
- preview behavior is available from the list
- lesson form supports category-dependent prerequisite logic
- lesson form supports the required description/media authoring behavior
- backend field names and payload shapes are aligned
- add/edit routes prepopulate and submit correctly
- all child tasks in this folder are complete or explicitly re-scoped

## Verification Gate

1. Review the child task files in this folder before implementation.
2. Execute implementation in the order listed above.
3. Verify each child task against its own verification plan.
4. Run a final end-to-end admin walkthrough for lesson list, add, edit, preview, and media handling.
5. Confirm no regression in the existing CRUD flow.

## Notion Summary

Master task for Admin Training Lesson migration. Source of truth folder: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-lesson`. GitHub folder: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/training-lesson`. Complete the child tasks in this folder to close the remaining Angular parity gaps without breaking the existing Next lesson routes.
