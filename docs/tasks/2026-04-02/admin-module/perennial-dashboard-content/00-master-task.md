# Master Task - Admin Perennial Dashboard Content Parity Migration - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Module: Perennial Mandalism Nav -> Manage Dashboard Contents
- PMS Type: Master Task
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/perennial-dashboard-content`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/perennial-dashboard-content`
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/perennial-dashboard-content/00-master-task.md`

## Goal

Bring the Perennial Mandalism “Manage Dashboard Contents” module in `Divine-infinite-ui-next` to parity with the Angular implementation used by `admin-dashboard/perrenial-mandalism/dashboard-content-list` and its add/edit content workflow, while preserving the existing Next list/add/edit route structure where practical.

## Current Product Truth

The current Next module exposes the basic CRUD shell, but Angular’s actual product behavior is much deeper: the selected content type changes the form schema, required fields, scheduling behavior, reminder behavior, access-control behavior, and media workflow. The main gap is not styling or a missing field or two; it is that the Next module currently models a complex content system as a single flat generic form.

## Folder Path For Execution

Use this folder as the canonical implementation/task source for this module:

`Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/perennial-dashboard-content`

GitHub folder URL:

`https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/perennial-dashboard-content`

## Child Tasks In Scope

1. `01-close-perennial-content-list-preview-sort-and-filter-parity.md`
2. `02-build-content-type-driven-form-shell-and-branch-state.md`
3. `03-build-live-stream-content-workflow.md`
4. `04-build-video-library-document-and-youtube-workflows.md`
5. `05-build-announcement-workflow-and-display-window-behavior.md`
6. `06-align-content-prefill-branch-hydration-and-submit-semantics.md`

## Delivery Expectations

1. Keep `/admin/perennial-content` list working.
2. Keep `/admin/perennial-content/add` and `/admin/perennial-content/edit/[id]` working.
3. Treat content type as the primary form driver, not as a passive select field.
4. Preserve the ability to implement this module incrementally without collapsing branch-specific behavior into vague generic work.
5. Implement and verify child tasks in sequence unless a dependency requires reordering.

## Done Definition

- content list supports the required preview, sort, and filter behavior
- add/edit form behaves as a content-type-driven workflow
- each in-scope content type exposes the correct branch-specific field set and conditional logic
- edit mode correctly hydrates the active content-type branch
- submit payload shape is stable for each supported branch
- all child tasks in this folder are complete or explicitly re-scoped

## Verification Gate

1. Review the child task files in this folder before implementation.
2. Execute implementation in the order listed above.
3. Verify each child task against its own verification plan.
4. Run a final end-to-end admin walkthrough for list, preview, add, edit, and content-type switching behavior.
5. Confirm no regression in the existing content list and CRUD routes.

## Notion Summary

Master task for Admin Perennial Dashboard Content migration. Source of truth folder: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/perennial-dashboard-content`. GitHub folder: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/perennial-dashboard-content`. Complete the child tasks in this folder to close the remaining Angular parity gaps for the Perennial Mandalism dashboard content system without flattening its content-type-driven behavior.
