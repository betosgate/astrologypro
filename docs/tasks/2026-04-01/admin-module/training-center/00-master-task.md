# Master Task - Admin Training Center Parity Migration - 2026-04-01

- Status: Done
- Priority: P1
- Owner: Frontend
- Module: Admin Training Nav -> Training Center
- PMS Type: Master Task
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-01/admin-module/training-center`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-01/admin-module/training-center`
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-01/admin-module/training-center/00-master-task.md`

## Goal

Migrate the Admin Training Center module in `Divine-infinite-ui-next` to functional parity with the Angular implementation used by `admin-dashboard/training/training-center`, while preserving the already-built CRUD list/add/edit surfaces.

## Current Product Truth

The Next.js route `/admin/training/center` currently supports admin CRUD operations only. The Angular implementation already includes the actual interactive training-consumption flow used inside the module, including player shell, progress, lesson gating, quiz flow, assignment flow, and next-lesson progression.

## Folder Path For Execution

Use this folder as the canonical implementation/task source for this module:

`Divine-infinite-ui-next/docs/tasks/2026-04-01/admin-module/training-center`

GitHub folder URL:

`https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-01/admin-module/training-center`

## Child Tasks In Scope

1. `01-build-training-center-player-shell-and-routing.md`
2. `02-build-progress-sidebar-and-selection-state.md`
3. `03-build-sequential-guards-mark-done-and-next-navigation.md`
4. `04-build-quiz-attempt-view-and-remediation-flow.md`
5. `05-build-assignment-submission-and-review-flow.md`

## Delivery Expectations

1. Keep `/admin/training/center` CRUD list/add/edit working.
2. Add the missing interactive player flow in Next.
3. Preserve Angular behavioral parity where it materially affects admin workflow.
4. Avoid inventing new business rules when Angular behavior already defines them.
5. Implement and verify child tasks in sequence unless a dependency requires reordering.

## Done Definition

- admins can launch and use the Training Center player in Next
- training/category selection works with correct route state
- progress refreshes correctly
- sequential locks behave correctly when enabled
- lesson completion and next-lesson transitions work
- quiz-enabled lessons work end-to-end
- assignment-enabled lessons work end-to-end
- CRUD management route continues to function
- all child tasks in this folder are complete or explicitly re-scoped

## Verification Gate

1. Review the child task files in this folder before implementation.
2. Execute implementation in the order listed above.
3. Verify each child task against its own verification plan.
4. Run a final end-to-end admin walkthrough for the full Training Center module.
5. Confirm no regression on the existing CRUD route.

## Notion Summary

Master task for Admin Training Center migration. Source of truth folder: `Divine-infinite-ui-next/docs/tasks/2026-04-01/admin-module/training-center`. GitHub folder: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-01/admin-module/training-center`. Complete the child tasks in this folder to bring the Next.js Training Center module to Angular parity without breaking existing CRUD flows.
