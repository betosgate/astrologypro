# Master Task - Admin Blog Management Parity Migration - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Module: Blog Nav -> Blog Management
- PMS Type: Master Task
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/blog-management`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/blog-management`
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/blog-management/00-master-task.md`

## Goal

Bring the Blog Management module in `Divine-infinite-ui-next` to parity with the Angular implementation used by `blog-manegement`, while preserving the existing Next list and add/edit routes.

## Current Product Truth

The Next.js blog module already exposes the expected list, add, and edit routes, but several blog-specific admin behaviors are still simplified. The remaining gaps are concentrated around preview/search parity, rich content and media authoring, and exact fetch/submit contract alignment for edit behavior.

## Folder Path For Execution

Use this folder as the canonical implementation/task source for this module:

`Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/blog-management`

GitHub folder URL:

`https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/blog-management`

## Child Tasks In Scope

1. `01-close-blog-list-preview-and-search-parity.md`
2. `02-close-blog-form-rich-content-and-media-parity.md`
3. `03-align-blog-fetch-model-and-submit-semantics.md`

## Delivery Expectations

1. Keep `/admin/blog` list working.
2. Keep `/admin/blog/add` and `/admin/blog/edit/[id]` working.
3. Add only the missing parity behaviors defined by Angular and backend contracts.
4. Reuse shared admin components where practical, but do not force blog-specific behavior into misleading generic shortcuts.
5. Implement and verify child tasks in sequence unless a dependency requires reordering.

## Done Definition

- blog list supports the required admin actions and search behavior
- preview behavior is available from the list
- blog add/edit supports the correct content and media authoring surface
- edit fetch and submit semantics are aligned with Angular/backend expectations
- all child tasks in this folder are complete or explicitly re-scoped

## Verification Gate

1. Review the child task files in this folder before implementation.
2. Execute implementation in the order listed above.
3. Verify each child task against its own verification plan.
4. Run a final end-to-end admin walkthrough for blog list, preview, add, and edit.
5. Confirm no regression in the existing CRUD flow.

## Notion Summary

Master task for Admin Blog Management migration. Source of truth folder: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/blog-management`. GitHub folder: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/blog-management`. Complete the child tasks in this folder to close the remaining Angular parity gaps without breaking the existing Next blog routes.
