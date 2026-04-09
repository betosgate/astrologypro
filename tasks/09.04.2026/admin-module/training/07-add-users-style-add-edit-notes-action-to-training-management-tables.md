# Add Users-Style Add/Edit Notes Action To Training Management Tables

- Status: Planned

## Objective
Add a direct `Add Notes` / `Edit Notes` action to Training Management tables so the row-level notes workflow matches the `admin/users` table pattern.

## Why This Task Exists
Training Management already supports entity notes through the detail sheet, but the table ergonomics are still weaker than the Users table:
- there is no obvious direct `Add Notes` / `Edit Notes` action in the row actions
- notes feel secondary instead of first-class
- admins must take a less direct path to open note management

The requested behavior is to align Training Management with the Users-table standard.

## Actual Problem To Solve
The admin can manage notes for training entities, but the current table action set does not expose a familiar row-level notes action like Users does.

That means the feature technically exists, but the entry point is inconsistent and harder to discover.

## Current Repo State
- Training Management page:
  - `src/app/admin/training/page.tsx`
- Shared training table:
  - `src/components/admin/training-entity-table.tsx`
- Shared entity sheet:
  - `src/components/admin/training-entity-sheet.tsx`
- Users reference surface:
  - `src/app/admin/users/page.tsx`
  - `src/components/admin/user-management-client.tsx`
- Training note surfaces already exist in the admin flows, but are not exposed with the same direct row-action pattern as Users.

## Exact Gap
- Users table exposes a clearer notes action pattern.
- Training Management tables currently rely more on opening the general entity sheet and then navigating to notes.
- The result is inconsistent admin UX across management surfaces.

## Fixed Behavior Decisions
- Each Training Management table row should expose a direct notes action comparable to Users.
- The action label should behave like:
  - `Add Notes` when there are no existing notes
  - `Edit Notes` when notes already exist
- The action should open the existing note-management surface for that entity rather than introducing a second notes UI.
- Keep the current notes count display if it already exists; this task is about adding the missing direct action pattern.

## Required Implementation
- Inspect how `admin/users` determines and renders its `Add Notes` / `Edit Notes` action.
- Mirror that interaction pattern in `TrainingEntityTable` for:
  - programs
  - categories
  - lessons
  - quizzes
- Reuse the existing Training Management entity sheet / notes tab if possible.
- Ensure the row action opens the correct entity and lands directly in the notes context.
- Ensure the label switches correctly based on whether notes already exist for the row.

## Files To Read First
- `src/app/admin/users/page.tsx`
- `src/components/admin/user-management-client.tsx`
- `src/app/admin/training/page.tsx`
- `src/components/admin/training-entity-table.tsx`
- `src/components/admin/training-entity-sheet.tsx`

## Likely Files To Change
- `src/components/admin/training-entity-table.tsx`
- optionally `src/components/admin/training-entity-sheet.tsx`
- optionally `src/app/admin/training/page.tsx` if notes-count or open-state wiring needs adjustment

## API and Schema Constraints
- Do not create a new notes system for training entities.
- Reuse the existing note data and existing note-management surface.
- Do not break existing note counts or sheet navigation behavior.

## Dependencies
- Independent of the learner-facing training tasks.
- Should remain compatible with the existing Training Management table and sheet structure.

## Acceptance Criteria
- Each Training Management table row exposes a direct `Add Notes` or `Edit Notes` action.
- The label correctly reflects whether notes already exist for that row.
- Clicking the action opens the correct entity in the existing notes-management context.
- The resulting UX is aligned with the Users table pattern.

## Verification Test Plan
- [ ] Open `/admin/training` and confirm each entity table row includes a direct notes action.
- [ ] Confirm a row with no notes shows `Add Notes`.
- [ ] Confirm a row with existing notes shows `Edit Notes`.
- [ ] Click the action and confirm the correct entity opens directly in the notes context.
- [ ] Add or edit a note and confirm notes count/display remains consistent after refresh.

## Out Of Scope
- redesigning the full Training Management notes UI
- changing note schema or storage
- unrelated table pagination or refresh behavior
