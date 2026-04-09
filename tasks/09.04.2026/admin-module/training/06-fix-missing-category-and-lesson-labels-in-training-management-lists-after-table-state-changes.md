# Fix Missing Category And Lesson Labels In Training Management Lists After Table State Changes

- Status: Planned

## Objective
Fix the Training Management lesson and quiz lists so each lesson reliably shows its assigned category label and each quiz reliably shows its assigned lesson label, even after the recent table-state and pagination-related changes.

## Why This Task Exists
After the recent Training Management table changes, relationship labels are no longer consistently rendered:
- some lessons do not show their assigned category
- some quizzes do not show their assigned lesson

This weakens admin usability because the list surfaces stop being trustworthy for quick scanning and editing.

## Actual Problem To Solve
The admin list data still loads, but some relationship-derived labels are blank, missing, or unresolved in the rendered rows.

This likely means one or more of these are now misaligned:
- API response shaping
- lookup-map construction on the client
- table-row normalization
- fallback behavior when related entities are not in the current in-memory set

## Current Repo State
- Training Management page:
  - `src/app/admin/training/page.tsx`
- Shared table component:
  - `src/components/admin/training-entity-table.tsx`
- Related admin APIs:
  - `src/app/api/admin/training/categories/route.ts`
  - `src/app/api/admin/training/lessons/route.ts`
  - `src/app/api/admin/training/quizzes/route.ts`
- The issue appeared after recent table-state/pagination-oriented changes and reversions.

## Exact Gap
- Lesson rows should show the category they belong to, but some are blank or unresolved.
- Quiz rows should show the lesson they belong to, but some are blank or unresolved.
- The display logic likely assumes data availability or lookup completeness that is no longer guaranteed by the current loading/state path.

## Fixed Behavior Decisions
- Every lesson row should display a stable category label when a valid category relationship exists.
- Every quiz row should display a stable lesson label when a valid lesson relationship exists.
- If a related entity is genuinely missing or deleted, show an explicit fallback such as `Unknown category` or `Unknown lesson` rather than an empty label.
- Fix the root cause in data shaping or lookup resolution, not just the presentation symptom.

## Required Implementation
- Trace how category labels are resolved for lesson rows and how lesson labels are resolved for quiz rows.
- Inspect whether the problem comes from:
  - incomplete list payloads
  - stale or partial lookup maps
  - row transformation logic
  - type mismatches between ids
  - client filtering/pagination side effects
- Correct the mapping so related labels resolve reliably in all visible rows.
- Add defensive fallback rendering for orphaned or unresolved relationships.
- Ensure the fix remains compatible with the current Training Management refresh and pagination behavior.

## Files To Read First
- `src/app/admin/training/page.tsx`
- `src/components/admin/training-entity-table.tsx`
- `src/app/api/admin/training/categories/route.ts`
- `src/app/api/admin/training/lessons/route.ts`
- `src/app/api/admin/training/quizzes/route.ts`

## Likely Files To Change
- `src/app/admin/training/page.tsx`
- optionally one or more admin training list API routes if relationship fields are not being returned consistently

## API and Schema Constraints
- Do not change the underlying category/lesson/quiz relationship model.
- Prefer preserving existing API contracts unless the bug is caused by missing relationship fields in list responses.
- Do not silently hide broken relationships; surface a clear fallback label where necessary.

## Dependencies
- Related to the recent Training Management table-state changes, but can be fixed independently.

## Acceptance Criteria
- Lesson rows consistently show their assigned category labels.
- Quiz rows consistently show their assigned lesson labels.
- Orphaned or unresolved relationships render a clear fallback label instead of blank space.
- The fix remains stable across refreshes and pagination changes.

## Verification Test Plan
- [ ] Open `/admin/training` and confirm lesson rows show category labels consistently.
- [ ] Confirm quiz rows show lesson labels consistently.
- [ ] Refresh the page and confirm labels remain correct.
- [ ] Paginate or filter the tables and confirm labels do not disappear.
- [ ] Confirm orphaned records, if any, show a clear fallback label instead of a blank value.

## Out Of Scope
- redesigning the Training Management table layout
- changing relationship ownership rules
- unrelated learner-facing training behavior
