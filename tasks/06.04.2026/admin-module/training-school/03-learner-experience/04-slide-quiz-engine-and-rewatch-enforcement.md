# Module 04 - Slide Quiz Engine and Rewatch Enforcement

## Objective
Implement the required slide-triggered video quiz engine with server-enforced rewind/rewatch behavior.

## Current Repo State
- `quiz_questions` already exists.
- `quiz_attempts` already exists.
- `lesson-viewer-quiz.tsx` is currently an end-of-lesson quiz flow.
- The current lesson player does not pause at trigger timestamps and does not enforce rewatch before retry.

## Exact Gap
- Module 22 requires timestamp-based quiz triggers inside video playback.
- The current implementation only supports one aggregated lesson quiz submission.
- Wrong-answer rewind enforcement is missing both in player behavior and in server-side validation.

## Required Implementation
- Add trigger support without replacing current quiz tables.
- Introduce `lesson_quiz_triggers` if no equivalent trigger table already exists.
- Extend current question/attempt/progress behavior so the system can represent:
  - trigger timestamp
  - slide index if required
  - question pair per trigger
  - rewind target timestamp
  - rewatch completion evidence before retry
- Update learner lesson data loading to return:
  - video trigger metadata
  - trigger questions
  - learner pass/retry status per trigger
- Update the learner player so it:
  - pauses at trigger timestamps
  - opens a blocking lightbox/modal
  - prevents scrubbing past unanswered triggers
  - saves position every 10 seconds
- Implement this wrong-answer behavior:
  - show a 5-second progress-style notification
  - rewind to the configured segment start
  - require the learner to replay the segment before another answer submission is accepted
- Enforce the retry gate on the server. Client-only enforcement is not sufficient.
- Keep the current end-of-lesson quiz flow only as a fallback for lessons that have no trigger records.

## Likely Affected Files
- `src/components/trainee/lesson-viewer-quiz.tsx`
- lesson playback UI/component file(s)
- `src/app/api/trainee/training/lessons/[id]/route.ts`
- `src/app/api/trainee/training/lessons/[id]/quiz/route.ts`
- `src/app/api/trainee/training/lessons/[id]/heartbeat/route.ts`
- Supabase migration(s) for quiz triggers and rewatch state
- admin quiz-authoring endpoints/pages if trigger authoring is included in the same pass

## API and Schema Constraints
- Keep `quiz_questions`, `quiz_attempts`, and `lesson_progress`.
- Additive schema is allowed where current tables cannot represent trigger/rewatch state.
- Do not rename current quiz APIs just to match external documentation names.

## Dependencies
- Execute after Modules 02 and 03.

## Acceptance Criteria
- Video pauses at configured trigger points.
- Learners cannot skip unpassed triggers.
- Wrong answers force rewind and replay before retry.
- Trigger progress survives refresh and re-entry.

## Verification Test Plan
- [ ] Configure a lesson with multiple trigger points and verify pause behavior.
- [ ] Verify the trigger lightbox blocks playback progression until the trigger is cleared.
- [ ] Answer correctly and verify playback resumes.
- [ ] Answer incorrectly and verify the 5-second redirect notification and rewind behavior.
- [ ] Attempt to answer again without required replay and verify server rejection.
- [ ] Attempt to scrub past an unanswered trigger and verify blocking behavior.
- [ ] Refresh mid-lesson and verify trigger/progress state persists.

## Out Of Scope
- final reporting dashboards
- certificate email
