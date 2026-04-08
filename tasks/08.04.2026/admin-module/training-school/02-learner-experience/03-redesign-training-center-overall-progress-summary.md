# Module 03 - Redesign Training Center Overall Progress Summary

- Status: Planned

## Objective
Replace the current top-level `Overall Progress` summary on `/trainee/training` with a more informative split-status summary that reflects all lessons the current learner can access.

## Why This Task Exists
The current summary is too generic:
- it mostly reads like a single progress bar
- it does not clearly separate `Not Started`, `Ongoing`, and `Completed`
- it is easy to confuse started content with total accessible content

The requested redesign should make the learner’s full accessible workload obvious at a glance.

## Current Repo State
- `/trainee/training` already fetches program/category/lesson hierarchy from `/api/trainee/training/programs`.
- The page already computes overall completed lessons and total lessons.
- The same API response already contains lesson completion booleans and program/category scope for all accessible training programs.
- The current page does not derive or display a learner-wide `not started` versus `ongoing` split.

## Exact Gap
- The summary is under-detailed and visually weak.
- Counts do not explicitly communicate:
  - how many accessible lessons are untouched
  - how many are in progress
  - how many are complete
- The visual layout does not use the available space to create a standard dashboard summary.

## Fixed Behavior Decisions
- The summary should be based on all lessons the current user can access through accessible programs, not only lessons they have already touched.
- Summary statuses:
  - `Completed`: lessons already in authoritative completion state
  - `Ongoing`: lessons started or otherwise meaningfully in progress, but not completed
  - `Not Started`: accessible lessons with no completion and no meaningful progress state
- Layout rules:
  - left half: three clearly differentiated colored status blocks
  - right half: top-right count like `3/5 lessons`
  - right half bottom: progress bar based on completed over total accessible lessons
- The final counts must be mutually exclusive and collectively exhaustive across accessible lessons.

## Required Implementation
- Define the exact learner-wide counting rules for `not started`, `ongoing`, and `completed`.
- Prefer deriving these counts from existing learner-accessible lesson metadata plus the current progress model instead of creating new reporting tables.
- Redesign the `Overall Progress` block on `/trainee/training` to match the requested structure.
- Ensure the summary still behaves correctly when:
  - no programs are accessible
  - accessible programs exist but nothing is started
  - partially completed learner state exists
  - everything is completed
- Make the visual treatment clear but measured, not decorative noise.

## Files To Read First
- `src/app/trainee/training/page.tsx`
- `src/app/api/trainee/training/programs/route.ts`
- `src/app/api/trainee/training/lessons/[id]/start/route.ts`
- `src/app/api/trainee/training/lessons/[id]/heartbeat/route.ts`
- `src/app/api/trainee/training/lessons/[id]/complete/route.ts`
- `src/lib/training/completion.ts`

## Likely Files To Change
- `src/app/trainee/training/page.tsx`
- `src/app/api/trainee/training/programs/route.ts` if richer in-progress metadata is required for a correct ongoing count
- any extracted learner progress summarization helper

## API and Schema Constraints
- Keep `/api/trainee/training/programs` as the top-level page’s primary data source where practical.
- Do not introduce a second standalone analytics endpoint just for this summary unless absolutely necessary.
- Reuse existing progress/completion tables and current learner state semantics.

## Dependencies
- Execute after Module 02 only if the implementation wants to reuse shared progress helper work.
- Can otherwise be executed after Module 01 once status semantics are clear.

## Acceptance Criteria
- The Training Center index shows `Not Started`, `Ongoing`, and `Completed` counts for all accessible lessons.
- The displayed total count includes untouched but accessible lessons.
- The progress bar and `x/y lessons` count reflect the same total lesson universe as the status blocks.
- Empty, partial, and complete learner states all render sensibly.

## Verification Test Plan
- [ ] Confirm a learner with zero started lessons sees all accessible lessons counted as `Not Started`.
- [ ] Confirm a learner with partially started lessons sees mutually exclusive `Not Started`, `Ongoing`, and `Completed` counts.
- [ ] Confirm a fully complete learner sees `Completed = total` and the progress bar at 100%.
- [ ] Confirm the displayed `x/y lessons` count matches the same accessible-lesson total used by the status blocks.

## Out Of Scope
- program workspace redesign
- lesson-quiz remediation runtime
