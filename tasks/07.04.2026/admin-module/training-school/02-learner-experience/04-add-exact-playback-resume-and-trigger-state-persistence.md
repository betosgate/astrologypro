# Module 04 - Add Exact Playback Resume and Trigger State Persistence

- Status: Completed (2026-04-08, verified)
- Completion Notes: lesson-viewer-client.tsx:106 + 290 + 314 + 353 + 663 + 677 — initial position resume from API, ~10s heartbeat persisting last_position_seconds for exact resume.

## Objective
Store and restore actual lesson playback position and ensure trigger/rewatch state survives refresh and re-entry in a predictable way.

## Why This Task Exists
Elapsed-time tracking alone is not enough for the intended resume behavior. Trigger enforcement also becomes unreliable after refresh unless playback position and rewatch state are persisted consistently.

## Current Repo State
- `lesson_progress` tracks time spent and activity timestamps.
- Heartbeat currently accumulates elapsed time every 30 seconds.
- The current system does not store precise playback position as the main resume source.
- The current heartbeat route also attempts to roll time up to `program_enrollments`, so any heartbeat changes must account for existing downstream time-tracking behavior instead of replacing it blindly.

## Exact Gap
- The requirement expected exact resume behavior, not only elapsed-time tracking.
- Trigger replay and rewatch enforcement need durable lesson-position state to feel correct after refresh or route re-entry.

## Fixed Behavior Decisions
- Exact playback position should be persisted through the current lesson-progress model unless that proves impossible.
- Target save cadence is 10 seconds for playback position.
- Time-spent analytics must continue to work after position tracking is added.
- Resume position must not allow a learner to bypass an active rewatch requirement or an unpassed trigger gate.
- If heartbeat payloads are extended, preserve backward-compatible handling for existing time-spent accumulation during the transition.

## Required Implementation
- Add precise playback position support to the current lesson progress model.
- Store playback position at a tighter cadence appropriate for resume behavior, targeting the intended 10-second save interval.
- Load the saved position when the learner reopens the lesson.
- Ensure trigger state and rewatch requirements still take precedence over resume position where needed.
- Preserve existing time-spent analytics while adding position persistence.

## Files To Read First
- `src/components/trainee/lesson-viewer-client.tsx`
- `src/app/api/trainee/training/lessons/[id]/heartbeat/route.ts`
- `src/app/api/trainee/training/lessons/[id]/start/route.ts`
- any current migration or query logic around `lesson_progress`

## Likely Files To Change
- `src/components/trainee/lesson-viewer-client.tsx`
- `src/app/api/trainee/training/lessons/[id]/heartbeat/route.ts`
- `src/app/api/trainee/training/lessons/[id]/start/route.ts`
- one or more migrations for `lesson_progress` if a position field is needed

## API and Schema Constraints
- Prefer extending `lesson_progress`
- Do not introduce a separate resume-position table unless there is a strong reason

## Dependencies
- Execute after Module 02 and before final certificate alignment

## Acceptance Criteria
- Lesson playback resumes from saved position after refresh/re-entry.
- Position saves occur at the intended cadence.
- Trigger and rewatch gating still behave correctly with resume enabled.
- Existing time-spent reporting remains intact.

## Verification Test Plan
- [ ] Watch part of a lesson, refresh the page, and confirm resume position restores.
- [ ] Trigger a wrong-answer rewind, refresh after partial rewatch, and confirm state is still consistent.
- [ ] Confirm time-spent analytics continue to accumulate correctly.
- [ ] Confirm resume cannot jump ahead of an unpassed trigger boundary.

## Out Of Scope
- graduation logic
