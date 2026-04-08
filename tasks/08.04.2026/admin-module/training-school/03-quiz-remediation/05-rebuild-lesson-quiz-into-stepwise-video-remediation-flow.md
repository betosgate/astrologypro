# Module 05 - Rebuild Lesson Quiz Into Stepwise Video Remediation Flow

- Status: Planned

## Objective
Replace the current end-of-quiz batch submission behavior for lesson quizzes with a question-by-question remediation flow that redirects the learner back to the relevant video segment after each wrong answer.

## Why This Task Exists
The requested learning model is not “answer everything, then grade at the end.” It is:
- answer one question
- if correct, continue
- if wrong, stop immediately
- show a temporary explanation message
- return the learner to the relevant training-video segment
- require the replay segment to finish
- return focus to the quiz for retry

The repo already contains trigger-based playback and replay enforcement concepts. This task should adapt that strength to ordinary lesson-quiz flow.

## Current Repo State
- `LessonViewerQuiz` currently collects all answers first and submits them in one batch to `/api/trainee/training/lessons/[id]/quiz`.
- The current quiz route grades the full quiz at once and records a single attempt.
- `TriggerVideoPlayer` already knows how to:
  - pause the video
  - control replay boundaries
  - enforce rewatch before retry
  - return focus to question flow
- The current lesson page already combines video playback, quiz UI, and lesson completion behavior in one client experience.

## Exact Gap
- Ordinary lesson quizzes still behave like a traditional submit-all assessment.
- A wrong answer does not immediately force remediation playback.
- The lesson-quiz runtime and the trigger-video runtime still act like separate systems.

## Fixed Behavior Decisions
- The new lesson quiz should run one question at a time.
- On `Next`:
  - correct answer: advance to the next question immediately
  - wrong answer: stop the attempt immediately and enter remediation mode
- Wrong-answer remediation behavior:
  - show a temporary learner message for roughly 5 to 10 seconds
  - shift focus from quiz to video
  - seek the correct remediation segment
  - autoplay the required replay segment
  - pause at the end of the required replay segment
  - shift focus back to the quiz
- The learner must not continue to later questions while a wrong-answer remediation cycle is active.
- Completion semantics must remain authoritative and consistent with the final question-by-question pass model.
- Reuse existing trigger-style replay enforcement where practical instead of implementing a second unrelated player-control state machine.

## Required Implementation
- Redesign the lesson quiz client flow into a stepwise progression model.
- Update the learner quiz API contract so it can validate one question at a time or otherwise support immediate-question adjudication cleanly.
- Integrate question-level remediation metadata from Module 04 into the lesson player and quiz UI.
- Reuse or generalize the current video control/replay enforcement logic so remediation playback is reliable.
- Ensure focus handling is intentional:
  - learner message visible
  - video becomes active during remediation
  - quiz regains focus afterward
- Reconcile final lesson completion behavior with the new stepwise quiz model so completed lessons are not marked by stale batch-submit rules.

## Files To Read First
- `src/components/trainee/lesson-viewer-quiz.tsx`
- `src/components/trainee/lesson-viewer-client.tsx`
- `src/app/api/trainee/training/lessons/[id]/quiz/route.ts`
- `src/app/api/trainee/training/lessons/[id]/route.ts`
- `src/app/trainee/training/[programId]/[categoryId]/[lessonId]/page.tsx`
- `src/app/api/trainee/training/lessons/[id]/triggers/[triggerId]/answer/route.ts`
- `src/app/api/trainee/training/lessons/[id]/triggers/[triggerId]/rewatch/route.ts`
- `src/lib/training/completion.ts`

## Likely Files To Change
- `src/components/trainee/lesson-viewer-quiz.tsx`
- `src/components/trainee/lesson-viewer-client.tsx`
- `src/app/api/trainee/training/lessons/[id]/quiz/route.ts`
- `src/app/api/trainee/training/lessons/[id]/route.ts`
- `src/app/trainee/training/[programId]/[categoryId]/[lessonId]/page.tsx`
- any new shared learner types/helpers for remediation state

## API and Schema Constraints
- Reuse the existing lesson page/player structure where practical.
- Do not leave the old batch-submit model as the effective learner-facing behavior after this module is complete.
- Prefer extending existing replay-control logic over inventing a second player implementation.

## Dependencies
- Execute after Module 04.

## Acceptance Criteria
- Lesson quizzes run one question at a time.
- A wrong answer immediately halts question progression and starts a remediation flow.
- The learner is returned to the correct video segment and required replay completes before retry.
- After the replay window completes, focus returns to the quiz.
- Final quiz completion and lesson completion behavior remain deterministic and do not rely on the old submit-all-first model.

## Verification Test Plan
- [ ] Answer the first quiz question correctly and confirm the UI advances directly to the next question.
- [ ] Answer a question incorrectly and confirm the remediation flow starts immediately.
- [ ] Confirm a temporary remediation message appears after the wrong answer.
- [ ] Confirm the UI shifts back to video.
- [ ] Confirm the player seeks to the configured remediation segment.
- [ ] Confirm required playback runs and then pauses.
- [ ] Confirm focus returns to the quiz for retry.
- [ ] Confirm a learner cannot skip ahead in the question flow during active remediation.
- [ ] Confirm final lesson completion is recorded only when the full intended quiz/remediation path is satisfied.

## Out Of Scope
- redesign of the program workspace layout
- top-level Training Center overall-progress summary
