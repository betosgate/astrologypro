# Add Independent Refresh Buttons And Users-Style Loading Overlays To Training Management Tables

- Status: Planned

## Objective
Update the `Training Management` admin page so each of the four tables has its own independent refresh button and its own loading overlay, matching the interaction quality of the `admin/users` data table.

## Why This Task Exists
The current Training Management refresh model is too coarse:
- there is one global refresh button for all four entity tables
- refreshing one table unnecessarily reloads unrelated tables
- there is no per-table loading overlay that clearly communicates which section is currently refreshing

The admin `Users` table already demonstrates the expected quality bar:
- refresh behavior is scoped to the current data surface
- the table shows an in-place loading overlay
- the user gets clear feedback without losing layout context

## Current Repo State
- `src/app/admin/training/page.tsx` currently:
  - loads programs, categories, lessons, and quizzes separately
  - exposes one top-level `Refresh` button that calls `loadAll()`
  - passes `onMutated={loadPrograms|loadCategories|loadLessons|loadQuizzes}` into each table
- `src/components/admin/training-entity-table.tsx` currently renders each table card and does not appear to own a table-scoped loading overlay state.
- The reference loading pattern exists in:
  - `src/components/admin/user-management-client.tsx`
- The `Users` table overlay pattern is:
  - card-level absolute overlay
  - translucent background
  - spinner + `Loading…` label

## Exact Gap
- Training Programs, Categories, Lessons, and Quizzes cannot be refreshed independently from the main page chrome.
- The UI does not give a per-table visual loading state equivalent to `admin/users`.
- The global refresh button encourages unnecessary full-page table churn.

## Fixed Behavior Decisions
- Each of the four Training Management tables should have its own refresh button in its own card/table header area.
- Refreshing one table should only reload that table’s data.
- Each table should display a users-style in-card loading overlay while its refresh is in progress.
- The existing global refresh button should be removed or demoted if it no longer serves a meaningful purpose.
- Preferred final behavior:
  - table-local refresh control
  - table-local loading state
  - no unnecessary reload of unrelated training entities

## Required Implementation
- Refactor the Training Management page so each entity list has its own refresh/loading state.
- Pass table-specific refreshing state into `TrainingEntityTable`.
- Add a per-table refresh button inside or adjacent to each table card header.
- Implement a table-local loading overlay modeled after the `admin/users` table behavior:
  - overlay within the card
  - spinner icon
  - `Loading…` label
  - non-destructive visual treatment
- Ensure refresh actions still preserve the current shared search/filter state on the page.
- Ensure mutations that already call `onMutated` still cooperate with the new table-local loading treatment.

## Files To Read First
- `src/app/admin/training/page.tsx`
- `src/components/admin/training-entity-table.tsx`
- `src/components/admin/user-management-client.tsx`

## Likely Files To Change
- `src/app/admin/training/page.tsx`
- `src/components/admin/training-entity-table.tsx`
- optionally a shared small admin-table loading helper if reuse is justified

## API and Schema Constraints
- No new backend endpoint is required.
- Reuse the existing per-entity list endpoints:
  - `/api/admin/training/programs`
  - `/api/admin/training/categories`
  - `/api/admin/training/lessons`
  - `/api/admin/training/quizzes`
- Do not add a second fetch orchestration layer if simple per-table state is enough.

## Dependencies
- Independent.
- Future admin-facing tasks for Training Management should continue to be added under `tasks/09.04.2026/admin-module/training/`.

## Acceptance Criteria
- Programs, Categories, Lessons, and Quizzes each have their own refresh button.
- Refreshing one table only reloads that table’s data.
- Each table shows an in-card loading overlay while refreshing, aligned with the `admin/users` pattern.
- Shared filters/search still remain intact after a table refresh.
- Mutation-triggered refreshes still work correctly and show the proper loading treatment.

## Verification Test Plan
- [ ] Click the Programs refresh button and confirm only the Programs table reloads.
- [ ] Click the Categories refresh button and confirm only the Categories table reloads.
- [ ] Click the Lessons refresh button and confirm only the Lessons table reloads.
- [ ] Click the Quizzes refresh button and confirm only the Quizzes table reloads.
- [ ] Confirm each refresh shows a users-style loading overlay inside the relevant table card.
- [ ] Confirm shared search and status filters are preserved during and after refresh.
- [ ] Confirm row mutations still refresh only the relevant table and still render a loading overlay.

## Out Of Scope
- redesigning Training Management table structure
- changing export, bulk actions, or notes behavior beyond compatibility with table-local loading state
- altering learner-facing training pages
