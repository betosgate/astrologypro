# Fix Broken Admin Quiz Edit Flow

- Status: Planned

## Objective
Fix the admin quiz edit flow so an existing quiz can be opened, loaded, edited, and saved successfully from the Training Management area.

## Why This Task Exists
The current admin experience for editing quizzes is broken.

From the admin perspective, this blocks a core content-management workflow:
- open an existing quiz
- review its current configuration
- update title, lesson assignment, questions, pass score, or active state
- save changes without hitting routing or data-load failures

## Actual Problem To Solve
The user currently cannot edit a quiz.

That failure may come from one or more parts of the edit flow:
- missing or broken edit route
- edit link pointing to the wrong path
- quiz detail fetch failing on load
- lesson options not loading correctly
- form-state mismatch with the saved quiz schema
- update API failure on submit

This task should treat the issue as an end-to-end broken edit workflow, not just a route-only symptom.

## Current Repo State
- Training Management page:
  - `src/app/admin/training/page.tsx`
- Quiz edit route:
  - `src/app/admin/training/quizzes/[id]/edit/page.tsx`
- Quiz APIs:
  - `src/app/api/admin/training/quizzes/[id]/route.ts`
  - `src/app/api/admin/training/quizzes/route.ts`
- Related lesson list for quiz assignment:
  - `src/app/api/admin/training/lessons/route.ts`

## Exact Gap
- The admin cannot reliably edit an existing quiz from the current UI.
- The edit surface may not be reachable, may not preload data correctly, or may fail on save.
- This breaks ongoing management of lesson quizzes.

## Fixed Behavior Decisions
- Clicking `Edit` on a quiz should open a working quiz edit page.
- The edit page should preload the existing quiz data and related lesson options.
- Saving should persist valid changes and return the admin to a sensible destination with clear success/error feedback.
- If the quiz id is invalid or missing, the page should fail gracefully with clear messaging rather than a broken experience.

## Required Implementation
- Audit the full quiz edit path starting from the Training Management table action.
- Verify:
  - the edit link path
  - the route file existence and behavior
  - initial quiz fetch
  - lesson lookup fetch
  - form data normalization
  - submit/update API contract
- Fix the broken part or parts so the full edit workflow works again.
- Ensure question data, pass score, assigned lesson, and active status are all loaded and editable as intended.
- Preserve any existing notes or related admin conveniences on the edit page.

## Files To Read First
- `src/app/admin/training/page.tsx`
- `src/components/admin/training-entity-table.tsx`
- `src/app/admin/training/quizzes/[id]/edit/page.tsx`
- `src/app/api/admin/training/quizzes/[id]/route.ts`
- `src/app/api/admin/training/quizzes/route.ts`
- `src/app/api/admin/training/lessons/route.ts`

## Likely Files To Change
- `src/app/admin/training/quizzes/[id]/edit/page.tsx`
- optionally `src/components/admin/training-entity-table.tsx`
- optionally `src/app/api/admin/training/quizzes/[id]/route.ts`

## API and Schema Constraints
- Do not change the quiz authoring schema unless the current edit bug requires a compatibility fix.
- Preserve existing question structure and grading-related fields.
- Do not create a separate edit implementation that diverges from quiz create/update semantics.

## Dependencies
- Independent of learner-side quiz runtime changes.
- Should remain compatible with current Training Management table behavior.

## Acceptance Criteria
- An existing quiz can be opened from Training Management via `Edit`.
- The edit page loads the current quiz data correctly.
- The admin can update the quiz and save successfully.
- The flow handles invalid ids or failed loads with clear feedback instead of a broken page.

## Verification Test Plan
- [ ] Open `/admin/training` and click `Edit` on an existing quiz.
- [ ] Confirm the quiz edit page loads without 404 or broken state.
- [ ] Confirm the current quiz title, lesson assignment, questions, pass score, and active state preload correctly.
- [ ] Change one or more fields and save.
- [ ] Confirm the update persists and is reflected when reopening the same quiz.
- [ ] Confirm invalid quiz ids fail gracefully with understandable messaging.

## Out Of Scope
- redesigning the quiz authoring UI
- changing learner-facing quiz behavior
- unrelated lesson video upload issues
