# Fix Training Management Mutation Refresh Behavior And Initial Loading Skeletons

- Status: Planned

## Objective
Fix the current Training Management table behavior so data mutations do not cause the wrong page-aware refresh behavior, and add proper initial loading skeletons/placeholders for the table surfaces.

## Why This Task Exists
The recent Training Management table work still has two UX/behavior problems:
- after editing or mutating data in a specific table, the refresh behavior is not resolving the way it should
- the initial loading skeleton/placeholder state is not showing

This means the current table experience still does not meet the intended admin quality bar, even after the earlier refresh/pagination work.

## Actual Problem To Solve
This task is specifically about these issues:
- mutation-triggered refresh behavior in Training Management tables is still wrong
- initial loading state is visually incomplete because the expected skeleton/loading placeholder is not appearing

This task is **not** a broad request to reintroduce or remove all pagination changes by itself. It should focus on correcting the current behavior contract.

## Current Repo State
- Training Management currently uses a shared table component:
  - `src/components/admin/training-entity-table.tsx`
- The main page is:
  - `src/app/admin/training/page.tsx`
- Recent work introduced:
  - independent refresh buttons
  - table loading overlays
  - pagination controls
- The user has observed two remaining problems:
  - page-aware refresh behavior still occurs after editing/mutating data in a table
  - initial loading skeleton/placeholder is not visible

## Exact Gap
- Mutation refresh behavior is still not aligned with the intended admin experience.
- The initial load state lacks the expected skeleton/loading presentation.
- The current implementation likely treats:
  - initial loading
  - manual refresh
  - mutation-triggered refetch
  as the same state, when they should likely be handled more deliberately.

## Fixed Behavior Decisions
- Mutation-triggered refresh behavior should be reviewed and corrected based on the intended Training Management UX.
- The task should explicitly determine the correct expected behavior after mutations such as:
  - edit
  - activate/deactivate
  - delete
  - bulk action
- Initial loading should have a visible skeleton or loading placeholder comparable in quality to the intended admin pattern.
- Initial loading state and in-place refresh state do not have to use the exact same visual treatment.
- Prefer a clear distinction between:
  - first load
  - refresh overlay
  - post-mutation refetch

## Required Implementation
- Reconstruct the current Training Management table state transitions for:
  - first load
  - manual refresh
  - mutation-triggered refresh
  - pagination state retention
- Identify why mutation refresh is still behaving incorrectly after table edits/actions.
- Define the intended rule for how the relevant table should refresh after a mutation.
- Fix the implementation so mutation refresh follows that rule consistently.
- Add a proper initial loading skeleton/placeholder state for Training Management tables or cards.
- Ensure the skeleton/loading state appears on first load before data is available.
- Keep the refresh overlay behavior compatible with manual refreshes if that still serves the intended UX.

## Files To Read First
- `src/app/admin/training/page.tsx`
- `src/components/admin/training-entity-table.tsx`
- `src/components/admin/user-management-client.tsx`
- any related training list API routes if current refresh behavior depends on them

## Likely Files To Change
- `src/app/admin/training/page.tsx`
- `src/components/admin/training-entity-table.tsx`
- optionally one or more small helper components for skeleton/loading presentation

## API and Schema Constraints
- Do not change backend contracts unless the refresh bug genuinely depends on them.
- Prefer fixing the client table-state handling first if the issue is state orchestration rather than data shape.
- Avoid introducing a second competing loading-state model unless there is a clear separation of initial-load and refresh states.

## Dependencies
- Independent follow-up to the existing Training Management refresh/pagination work.

## Acceptance Criteria
- Mutation-triggered refresh behavior matches the intended Training Management UX and no longer behaves incorrectly after table edits/actions.
- Initial table load shows a visible skeleton or loading placeholder.
- Manual refresh behavior remains understandable and compatible with the corrected state model.
- The final behavior clearly distinguishes first load from subsequent refreshes.

## Verification Test Plan
- [ ] Load `/admin/training` from a cold page load and confirm a visible initial loading skeleton/placeholder appears.
- [ ] Edit a row in one Training Management table and confirm the post-mutation refresh behavior is correct.
- [ ] Activate/deactivate or delete a row and confirm the same refresh behavior remains correct.
- [ ] Trigger a manual refresh and confirm it still uses the intended in-place refresh treatment.
- [ ] Confirm the relevant table state remains stable and understandable during all of the above flows.

## Out Of Scope
- broad redesign of Training Management tables
- unrelated learner-facing training changes
- unrelated storage/upload issues
