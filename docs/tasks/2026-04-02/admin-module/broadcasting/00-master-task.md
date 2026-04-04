# Master Task - Admin Broadcasting Parity Migration - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Module: Brod Casting Nav -> Broadcasting
- PMS Type: Master Task
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/broadcasting`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/broadcasting`
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/broadcasting/00-master-task.md`

## Goal

Bring the Broadcasting module in `Divine-infinite-ui-next` to parity with the Angular implementation used by `brod-casting`, while preserving the existing Next list and add/edit routes.

## Current Product Truth

All parity gaps have been closed. The Next.js broadcasting module exposes list, add, and edit routes with full Angular parity: title search replaces the non-functional `updated_on` text search, both `shortDescription` and `description` use `RichHtmlEditor`, and the bespoke `BroadcastingForm` handles prefill/submit correctly.

## Implementation Notes (2026-04-02)

- **Task 01**: Replaced `updated_on` text search with `title` text search in `broadcasting/page.tsx`. `updated_on` was misconfigured as a text search field — `GenericListPage` does not support date-range controls and the text search produced no useful results. Title autocomplete intentionally deferred (requires typeahead). No preview wired — Angular does not expose a functioning preview in the working broadcast list config.
- **Task 02**: Replaced `GenericFormPage` (plain textareas) with bespoke `BroadcastingForm` in `_components/broadcasting-form.tsx`. Both `shortDescription` and `description` now use `RichHtmlEditor`. Status uses inline custom switch (same pattern as `AssignmentForm`). Add/edit pages updated to import `BroadcastingForm`.
- **Task 03**: Edit fetch uses `brodcasting/brodcast-data-fetch` + `{ _id }`; response shape covers `data.results?.res ?? data.results ?? data`. Hydration via `useEffect` on `record` resets all 4 fields including HTML strings. Submit builds explicit payload with `_id` on edit, `status: 0|1`. No additional changes required beyond Task 02.

## Folder Path For Execution

Use this folder as the canonical implementation/task source for this module:

`Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/broadcasting`

GitHub folder URL:

`https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/broadcasting`

## Child Tasks In Scope

1. `01-close-broadcasting-list-search-and-filter-parity.md`
2. `02-close-broadcasting-rich-text-form-parity.md`
3. `03-align-broadcasting-prefill-and-submit-semantics.md`

## Delivery Expectations

1. Keep `/admin/broadcasting` list working.
2. Keep `/admin/broadcasting/add` and `/admin/broadcasting/edit/[id]` working.
3. Add only the missing parity behaviors defined by Angular and backend contracts.
4. Reuse shared admin components where practical, but do not force broadcasting-specific rich-text behavior into misleading generic shortcuts.
5. Implement and verify child tasks in sequence unless a dependency requires reordering.

## Done Definition

- [x] broadcasting list supports the required search and filter behavior
- [x] broadcasting add/edit supports the correct rich-text authoring surface
- [x] edit prefill and save behavior remain stable for rich-text fields
- [x] all child tasks in this folder are complete or explicitly re-scoped

## Verification Gate

1. [x] Review the child task files in this folder before implementation.
2. [x] Execute implementation in the order listed above.
3. [x] Verify each child task against its own verification plan.
4. [ ] Run a final end-to-end admin walkthrough for broadcasting list, add, edit, and filtering behavior.
5. [ ] Confirm no regression in the existing CRUD flow.

## Notion Summary

Master task for Admin Broadcasting migration. Source of truth folder: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/broadcasting`. GitHub folder: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/broadcasting`. Complete the child tasks in this folder to close the remaining Angular parity gaps without breaking the existing Next broadcasting routes.
