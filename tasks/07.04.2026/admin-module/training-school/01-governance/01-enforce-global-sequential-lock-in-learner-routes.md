# Module 01 - Enforce Global Sequential Lock in Learner Routes

## Objective
Make `training_settings.global_sequential_lock` actually control learner-side progression behavior.

## Why This Task Exists
The setting already exists in admin settings, but learner-side code still behaves as if program/category sequential flags are always active. That makes the admin toggle misleading and breaks the intended control model.

## Current Repo State
- Admin settings UI and API can read/write `global_sequential_lock`.
- Learner routes still enforce sequencing only from `training_programs.is_sequential` and `training_categories.is_sequential`.
- No active learner route currently reads `training_settings.global_sequential_lock`.

## Exact Gap
- The setting exists but does not change trainee behavior.
- Admins can toggle it, but the toggle is not the real source of truth for route gating.

## Fixed Behavior Decisions
- `training_settings.global_sequential_lock` is the global master switch.
- If `global_sequential_lock = false`, learner routes must not block access because of `training_programs.is_sequential` or `training_categories.is_sequential`.
- If `global_sequential_lock = true`, existing program/category sequential flags continue to decide locking behavior.
- Learner-facing lock metadata must be computed from the same rule set as route access checks.

## Required Implementation
- Read `training_settings.global_sequential_lock` in the learner training APIs that enforce sequential access.
- Apply this rule consistently:
  - if `global_sequential_lock = false`, learner routes must not block access based on `training_programs.is_sequential` or `training_categories.is_sequential`
  - if `global_sequential_lock = true`, current program/category sequential flags determine locking behavior
- Update both:
  - the lesson detail route gate
  - the training programs hierarchy response that marks items as locked/unlocked
- Ensure future learner-facing lock messaging reflects the global setting outcome.

## Files To Read First
- `src/app/api/admin/training/settings/route.ts`
- `src/app/api/trainee/training/programs/route.ts`
- `src/app/api/trainee/training/lessons/[id]/route.ts`

## Likely Helpers To Reuse Or Extract
- any current training settings fetch logic
- any learner-lock evaluation logic already embedded in trainee training routes

## Likely Files To Change
- `src/app/api/trainee/training/lessons/[id]/route.ts`
- `src/app/api/trainee/training/programs/route.ts`
- any shared helper introduced for training settings lookup

## API and Schema Constraints
- Keep using `training_settings.global_sequential_lock`
- Keep `training_programs.is_sequential` and `training_categories.is_sequential`
- Do not add a second global settings source

## Dependencies
- None. Execute first in this follow-up pack.

## Acceptance Criteria
- Toggling global sequential lock changes actual learner route behavior.
- When global lock is off, program/category sequential flags do not block lesson access.
- When global lock is on, current sequential flag behavior remains intact.
- Program/category/lesson lock metadata and route-gate decisions no longer contradict each other.

## Verification Test Plan
- [ ] Set `global_sequential_lock = false` and confirm learner can open later lessons/categories despite sequential flags.
- [ ] Set `global_sequential_lock = true` and confirm learner is blocked by current program/category sequence rules.
- [ ] Verify `/api/admin/training/settings` still round-trips the saved value.
- [ ] Compare a route access decision and the corresponding `is_locked` metadata for the same learner state.

## Out Of Scope
- trigger-player wiring
- lesson completion model
