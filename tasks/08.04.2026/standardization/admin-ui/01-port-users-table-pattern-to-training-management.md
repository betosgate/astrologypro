# Training Management Admin Table Standardization Task

- Status: Planned

## Objective
Upgrade the admin `Training Management` tables so they support the same operational pattern currently used by the admin `Users` table:
- refresh
- export
- search
- filter persistence
- checkbox selection
- bulk actions
- sortable headers
- notes column
- three-dot row action menu
- right-side detail/action panel
- inline note management inside that panel

## Why This Task Exists
The current `Users` page is a full admin-management surface. It is not only a list:
- it has URL-driven search/filter/sort/pagination
- it persists filter state
- it supports row selection and bulk actions
- it exposes a row action menu
- it opens a side panel with further actions and notes

By contrast, the current `Training Management` page is a lighter local-state page with basic search, basic date filters for some sections, and preview modals. It does not yet support the same operational workflow quality.

This task isolates the Training Management table upgrade into its own folder so it does not alter the learner-focused Training School execution pack.

## Current Repo State
- `src/app/admin/users/page.tsx` and `src/components/admin/user-management-client.tsx` implement the current reference pattern.
- The `Users` page currently supports:
  - debounced autocomplete search
  - role/status/date filters
  - refresh button
  - reset filters
  - CSV export
  - checkbox selection
  - bulk action bar
  - sortable columns
  - notes count column
  - three-dot row action menu
  - side detail sheet with overview, notes, and logins
  - add/edit/delete notes inside the sheet
- `src/app/admin/training/page.tsx` currently supports:
  - local search term
  - a simple status dropdown
  - date filters only for categories and lessons
  - add buttons
  - inline edit buttons
  - preview modals
- Training notes storage and APIs already exist:
  - `/api/admin/training/notes`
  - `/api/admin/training/notes/[id]`
  - `src/components/admin/training-notes.tsx`
- The current training page does not expose those notes in the list view or in a reusable detail/action panel.

## Exact Gap
- Training Management tables are missing nearly all of the mature admin-table ergonomics already present on `Users`.
- Current Training Management behavior is fragmented by table section and largely client-local.
- There is no unified row-selection model, no bulk action model, no notes count column, no row action dropdown, and no side-panel management flow.
- Existing training note support is trapped in edit pages instead of being part of the main management surface.

## Fixed Behavior Decisions
- `Users` is the reference pattern for admin table behavior, not necessarily a literal UI clone.
- Training Management should support the same class of functionality across:
  - training programs
  - training categories
  - training lessons
  - training quizzes
- Prefer a consistent admin-table architecture rather than four isolated one-off implementations.
- Use a right-side sheet/panel pattern for row detail + actions + notes rather than preview modal overlays.
- Keep entity-specific actions meaningful to training records rather than copying user-specific verbs verbatim.
- Minimum expected bulk actions for training entities:
  - activate
  - deactivate
  - delete or archive where safe and already supported by business rules
  - export selected rows
- Row action menus should include only actions that are valid for that entity type.
- Notes should be first-class in the management tables:
  - notes count visible in table
  - note tab or section in detail sheet
  - add/edit/delete behavior reusing existing training note APIs

## Required Implementation
- Analyze the current `Users` admin-management pattern and extract the reusable interaction model.
- Redesign `Training Management` around server-driven or URL-driven table state where needed so it can support:
  - refresh
  - stable search/filter/sort state
  - export
  - pagination if row counts justify it
  - row selection
  - bulk operations
- Replace basic preview modals with a proper training entity detail sheet/panel.
- Add a notes count column for each table section where notes apply.
- Add three-dot action menus per row.
- Add entity-specific detail sheet actions, for example:
  - view details
  - edit
  - activate / deactivate
  - delete where allowed
  - open notes
  - context-specific operations such as managing related records if appropriate
- Surface notes inside the detail panel using the existing training notes backend.
- Add export capability:
  - export all matching current filters
  - export selected rows when rows are selected
- Add bulk action handling for selected rows per entity type.
- Ensure action flows refresh list state correctly after success.

## Files To Read First
- `src/app/admin/users/page.tsx`
- `src/components/admin/user-management-client.tsx`
- `src/components/admin/user-detail-sheet.tsx`
- `src/components/admin/admin-notes-section.tsx`
- `src/app/api/admin/users/bulk/route.ts`
- `src/app/api/admin/users/export/route.ts`
- `src/app/api/admin/users/[id]/notes/route.ts`
- `src/app/admin/training/page.tsx`
- `src/components/admin/training-notes.tsx`
- `src/app/api/admin/training/programs/route.ts`
- `src/app/api/admin/training/programs/[id]/route.ts`
- `src/app/api/admin/training/categories/route.ts`
- `src/app/api/admin/training/categories/[id]/route.ts`
- `src/app/api/admin/training/lessons/route.ts`
- `src/app/api/admin/training/lessons/[id]/route.ts`
- `src/app/api/admin/training/quizzes/route.ts`
- `src/app/api/admin/training/quizzes/[id]/route.ts`
- `src/app/api/admin/training/notes/route.ts`
- `src/app/api/admin/training/notes/[id]/route.ts`

## Likely Files To Change
- `src/app/admin/training/page.tsx`
- one or more new reusable admin training table components
- one or more new reusable admin training detail-sheet components
- one or more new bulk-action components for training entities
- training export endpoints if they do not yet exist
- training list endpoints if they need richer filtering/sorting/export support
- optional shared admin-table helpers if reuse with the users pattern is practical

## API and Schema Constraints
- Reuse the existing training entity routes and `training_notes` table where possible.
- Do not replace existing training CRUD endpoints outright if additive query/filter support is enough.
- Do not create a second note system for training entities.
- If export endpoints are added, keep them entity-specific or cleanly shared, but do not overload unrelated routes.
- Respect current business constraints such as program/category delete safeguards already present in training APIs.

## Dependencies
- Independent of the learner-facing Training School task packs.
- Can be implemented in parallel with learner-facing work if file ownership is kept separate.

## Acceptance Criteria
- Training Programs, Categories, Lessons, and Quizzes each support a table-management pattern aligned with `Users`.
- The page includes refresh, export, search, sortable headers, row selection, and bulk actions where appropriate.
- Each row has a three-dot action menu with valid entity-specific actions.
- Each entity can open a side detail/action panel from the main list.
- Notes count is visible in the table and notes can be added/edited/deleted from the detail panel using the existing training notes backend.
- Successful row and bulk actions update the management surface without leaving stale UI state behind.

## Verification Test Plan
- [ ] Confirm Training Programs, Categories, Lessons, and Quizzes each expose row selection and a row action menu.
- [ ] Confirm refresh reloads current filtered state instead of resetting the whole page unexpectedly.
- [ ] Confirm search, sort, and filters behave deterministically and are compatible with export.
- [ ] Confirm export-all respects current filter state.
- [ ] Confirm export-selected only exports the selected rows.
- [ ] Confirm bulk activate/deactivate works for each entity type where supported.
- [ ] Confirm deleting or archiving rows respects the entity’s existing guardrails.
- [ ] Confirm opening a row detail sheet exposes notes and entity actions.
- [ ] Confirm notes count updates after adding or deleting a note.
- [ ] Confirm an admin can edit only their own note if ownership rules remain enforced.

## Out Of Scope
- learner-facing Training Center UX
- lesson quiz remediation runtime
- redesign of user management itself
