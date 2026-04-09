# Fix Unstarted Program Card Total Lesson Count

- Status: Planned

## Objective
Fix the Training Center program cards on `/trainee/training` so unstarted programs show their real lesson totals and render progress text as `0/{total} lessons complete` instead of `0 lessons` and `0/0 lessons complete`.

## Why This Task Exists
The current cards are misleading for untouched programs:
- they imply the program contains zero lessons when the learner has simply not started it yet
- they make the progress line read like there is no defined workload
- they create inconsistency between started programs and unstarted programs in the same grid

This is a data-contract correctness issue, not just a copy tweak.

## Current Repo State
- `/trainee/training` renders program cards from the payload returned by `/api/trainee/training/programs`.
- `src/app/api/trainee/training/programs/route.ts` pulls program/category progress primarily from:
  - `user_program_progress`
  - `user_category_progress`
- When a user has not started a program yet, there may be no `user_program_progress` row for that user+program.
- The API currently falls back to `0` for `program.total_lessons` and some other aggregate fields when the cache row is absent.
- The same API already fetches the full category and lesson hierarchy for accessible programs, so the raw lesson count is already available in memory at response-assembly time.

## Exact Gap
- For unstarted programs with no `user_program_progress` row:
  - `total_lessons` falls back to `0`
  - the card badge renders `0 lessons`
  - the card progress line renders `0/0 lessons complete`
- This is incorrect because the program’s real accessible lesson total is determinable from the fetched lesson hierarchy even before any learner progress row exists.

## Fixed Behavior Decisions
- `total_lessons` for a program must represent the actual number of active lessons inside that accessible program, regardless of whether the learner has started it.
- `completed_lessons` should remain `0` for an untouched program.
- `progress_pct` should remain `0` for an untouched program.
- The UI should therefore naturally render:
  - lesson badge: `{actualTotal} lessons`
  - progress line: `0/{actualTotal} lessons complete`
- Prefer fixing this in the API response assembly so every consumer receives correct totals, rather than patching only the card component.

## Required Implementation
- Inspect how `/api/trainee/training/programs` computes fallback program aggregates when `user_program_progress` is missing.
- Replace the `total_lessons: 0` fallback with a derived count from the already-fetched active lessons belonging to that program.
- Confirm `total_categories` also falls back to the real category count consistently when the cache row is missing.
- Verify the top-level Training Center page and program card UI use the corrected API value without requiring special-case UI hacks.
- Keep the existing cache-backed values authoritative when a cache row does exist.

## Files To Read First
- `src/app/api/trainee/training/programs/route.ts`
- `src/app/trainee/training/page.tsx`
- `src/app/trainee/training/[programId]/page.tsx`
- `src/components/trainee/program-workspace.tsx`

## Likely Files To Change
- `src/app/api/trainee/training/programs/route.ts`
- optionally a small shared helper if program aggregate fallback logic is extracted

## API and Schema Constraints
- Do not introduce a new endpoint for this.
- Do not add a new reporting table or background sync path for this fix.
- Reuse the already-fetched in-memory hierarchy when computing fallback totals.
- Preserve the existing response shape of `/api/trainee/training/programs`.

## Dependencies
- Independent.

## Acceptance Criteria
- An unstarted program card shows its actual total lesson count, not `0 lessons`.
- The unstarted card progress line reads `0/{actualTotal} lessons complete`.
- Started programs still show their existing progress values correctly.
- Fully completed programs still show correct totals and progress percentages.
- No UI consumer of `/api/trainee/training/programs` needs a one-off workaround for missing total counts.

## Verification Test Plan
- [ ] Open `/trainee/training` as a learner with at least one accessible program that has active lessons but no progress row yet, and confirm the card shows the real total lesson count.
- [ ] Confirm the same unstarted card renders `0/{actualTotal} lessons complete`.
- [ ] Confirm a started program with an existing progress row still shows the correct completed count and total.
- [ ] Confirm the program detail page still renders correct category and lesson selection state after the API fallback change.
- [ ] Confirm a program with no active lessons still renders `0 lessons` legitimately.

## Out Of Scope
- redesigning the visual layout of the program cards
- changing progress semantics for categories or lessons
- altering sequential lock behavior
