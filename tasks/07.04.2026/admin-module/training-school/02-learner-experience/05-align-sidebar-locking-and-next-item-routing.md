# Module 05 - Align Sidebar Locking and Next-Item Routing

- Status: Completed (2026-04-08, verified)
- Completion Notes: Sidebar lock + next-item metadata sourced from /api/trainee/training/programs response (which now uses global_sequential_lock); local divergence in lesson page replaced.

## Objective
Make sidebar locking, category routing, and next-item behavior consistent with the final priority/sequential model instead of older ad hoc checks.

## Why This Task Exists
The learner API and the learner UI do not always derive lock state and next-item behavior from the same rule set. That causes contradictory UX between page-level routing and the lesson sidebar.

## Current Repo State
- Program/category learner API already exposes `is_locked`, `next_lesson_id`, and `next_category_id` style data.
- The trainee lesson page sidebar still uses `previous_lesson_id` fallback logic for lock display.
- Re-entry routing is not fully unified across all training pages.
- The program page and category page already consume API-derived progress and next-item metadata, so the lesson page is currently the main UI outlier.

## Exact Gap
- Sidebar and page-level routing are still partially driven by older assumptions.
- The trainee experience can present different “next” or “locked” states depending on which screen the learner is on.

## Fixed Behavior Decisions
- Learner lock state and next-item routing must come from one consistent rule set.
- The lesson sidebar must reflect the same access rules enforced by learner routes.
- Re-entry should route the learner to the next incomplete category by priority, then the next incomplete lesson by priority inside that category.
- The final rule set must respect:
  - `training_settings.global_sequential_lock`
  - `training_programs.is_sequential`
  - `training_categories.is_sequential`
- `previous_lesson_id` may still exist as a content relationship, but it must not create contradictory lock behavior.
- Prefer reusing `/api/trainee/training/programs` response metadata for UI consistency before inventing a second navigation-state computation path.

## Required Implementation
- Use one consistent learner locking/routing model across:
  - training program page
  - category page
  - lesson page sidebar
- Sidebar locking should reflect the same progression rules exposed by learner APIs, not only `previous_lesson_id`.
- Re-entry should always direct the learner to:
  - the next incomplete category by priority within the program
  - the next incomplete lesson by priority within that category
- Ensure the final behavior respects:
  - global sequential lock
  - program sequential flag
  - category sequential flag

## Files To Read First
- `src/app/api/trainee/training/programs/route.ts`
- `src/app/trainee/training/page.tsx`
- `src/app/trainee/training/[programId]/page.tsx`
- `src/app/trainee/training/[programId]/[categoryId]/page.tsx`
- `src/app/trainee/training/[programId]/[categoryId]/[lessonId]/page.tsx`

## Likely Files To Change
- `src/app/trainee/training/page.tsx`
- `src/app/trainee/training/[programId]/page.tsx`
- `src/app/trainee/training/[programId]/[categoryId]/page.tsx`
- `src/app/trainee/training/[programId]/[categoryId]/[lessonId]/page.tsx`
- `src/app/api/trainee/training/programs/route.ts`
- any shared learner navigation helper introduced or extended

## API and Schema Constraints
- Reuse progress cache tables and existing learner API response shape where possible
- Do not create a parallel “navigation state” service

## Dependencies
- Execute after Modules 01 and 03

## Acceptance Criteria
- Learner lock state and next-item routing are consistent across all training pages.
- Sidebar links reflect the same actual access logic as the route APIs.
- Re-entry logic and displayed “next” destinations no longer contradict each other between pages.

## Verification Test Plan
- [ ] Compare program page, category page, and lesson sidebar for the same learner state and confirm lock behavior matches.
- [ ] Reopen an incomplete program and confirm the learner lands on the expected next category/lesson.
- [ ] Confirm `previous_lesson_id` no longer creates contradictory sidebar lock behavior.
- [ ] Confirm sequential-off behavior still allows expected direct navigation.

## Out Of Scope
- certificate generation
