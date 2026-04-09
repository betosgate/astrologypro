# Stop On Wrong Answer And Drive Remediation Video Playback From Configured Timestamps

- Status: Planned

## Objective
Implement the expected lesson-quiz remediation flow so a wrong answer immediately stops the current quiz attempt, shows a temporary wrong-answer notice, shifts focus to the training video, plays the relevant remediation segment from a configured timestamp, then returns focus to the failed quiz question so the learner can retry.

## Why This Task Exists
The expected quiz behavior is not simple scoring. It is instructional remediation:
- the learner answers one question at a time
- a correct answer advances to the next question
- a wrong answer interrupts progress immediately
- the system redirects the learner to the relevant part of the lesson video
- the learner watches that specific segment
- the UI returns them to the failed question and only then allows retry

Without this behavior, the quiz does not function as a guided training mechanism.

## Expected Functional Scenario
Assume a lesson has 5 quiz questions.

Desired flow:
1. learner answers question 1
2. learner clicks next/submit
3. if correct:
   - question 1 is accepted
   - the UI advances to question 2
4. if wrong:
   - the current attempt is interrupted immediately
   - the learner sees a visible message for about 5 to 10 seconds telling them the answer was incorrect and they are being redirected to the relevant part of the training video
   - UI focus shifts away from the quiz to the video
   - the video seeks to a configured remediation timestamp
   - the video auto-plays from that point
   - after the relevant playback segment completes, the video stops
   - UI focus returns to the failed quiz question
   - the learner retries that same question

## Current Repo State
- The quiz runtime currently lives in:
  - `src/components/trainee/lesson-viewer-quiz.tsx`
  - `src/components/trainee/lesson-viewer-client.tsx`
- Per-question grading currently uses:
  - `src/app/api/trainee/training/lessons/[id]/quiz/answer/route.ts`
- The existing codebase already contains remediation-related fields and playback hooks for lesson quizzes:
  - `remediation_video_id`
  - `remediation_video_index`
  - `remediation_start_seconds`
  - `remediation_replay_until_seconds`
  - `remediation_message`
- The lesson viewer already has a remediation request path that can drive video seek/play/stop behavior.

## Exact Gap
- The required behavior must be locked in explicitly as a product contract.
- Wrong-answer handling needs to behave as a hard stop, not a loose warning.
- The handoff between quiz state, message timing, video focus, playback window, and question retry must be deterministic.
- The remediation authoring model must be clear enough that admins can define the right video timestamp window for each question.

## Fixed Behavior Decisions
- The lesson quiz runs one question at a time.
- A correct answer advances immediately to the next question.
- A wrong answer does not allow advancing.
- Wrong-answer flow must:
  - show a visible wrong-answer notice
  - interrupt quiz progression
  - move focus to the video
  - seek to the configured remediation start time
  - auto-play the remediation segment
  - stop at the configured remediation end time
  - return focus to the failed question
- The learner retries the same failed question after remediation, not the whole quiz from the beginning, unless a separate rule is intentionally introduced.
- Preferred authoring model:
  - remediation timestamps should be configured per quiz question
  - store both start and stop values explicitly
  - optional remediation message can accompany the video segment
- If the current schema already supports this, reuse it rather than introducing a second timestamp system.

## Required Implementation
- Formalize the wrong-answer runtime so quiz progression halts immediately on incorrect answers.
- Ensure the UI shows a temporary wrong-answer message before or during the remediation transition.
- Ensure the lesson viewer moves visual focus from quiz to video when remediation starts.
- Drive video playback from configured remediation timestamps:
  - seek to start time
  - auto-play
  - stop at replay-until time
- After playback stops, restore UI focus to the failed quiz question and allow retry.
- Keep the learner on the same question until they answer it correctly.
- Review the existing remediation fields and decide whether they fully satisfy the authoring need.
- If additional admin authoring affordances are needed, define them around the existing question-level remediation model rather than inventing a disconnected lesson-level timestamp map.
- Ensure the learner-facing runtime and the admin authoring contract stay aligned.

## Files To Read First
- `src/components/trainee/lesson-viewer-quiz.tsx`
- `src/components/trainee/lesson-viewer-client.tsx`
- `src/app/api/trainee/training/lessons/[id]/quiz/answer/route.ts`
- `src/app/api/trainee/training/lessons/[id]/route.ts`
- `src/app/admin/training/lessons/[id]/edit/page.tsx`
- `src/app/admin/training/quizzes/new/page.tsx`
- any admin training quiz/lesson authoring components that edit question metadata

## Likely Files To Change
- `src/components/trainee/lesson-viewer-quiz.tsx`
- `src/components/trainee/lesson-viewer-client.tsx`
- `src/app/api/trainee/training/lessons/[id]/quiz/answer/route.ts` if response payload needs tightening
- one or more admin quiz/lesson authoring files for remediation timestamp inputs
- optionally related admin APIs if question remediation metadata is not yet editable end to end

## API and Schema Constraints
- Do not expose `correct_answer` to the client.
- Prefer reusing the existing question-level remediation fields if they already cover:
  - video reference
  - start timestamp
  - stop timestamp
  - message
- Do not create a separate parallel remediation state model if the current per-question metadata can be extended or completed.
- Keep the learner runtime deterministic even if remediation metadata is missing:
  - define a fallback behavior rather than breaking the quiz

## Dependencies
- Closely related to the quiz-visibility and inline-lesson tasks, but can be executed as a dedicated remediation behavior task.

## Acceptance Criteria
- Standard lesson quizzes advance question-by-question.
- A correct answer advances to the next question immediately.
- A wrong answer stops progression on the current question.
- A visible wrong-answer/remediation message appears for a short period.
- The UI shifts to the video and starts playback from the configured remediation timestamp.
- Playback stops at the configured end timestamp.
- Focus returns to the failed question and the learner retries that same question.
- The authoring model for remediation timestamps is clear and aligned with the learner runtime.

## Verification Test Plan
- [ ] Create or use a lesson with at least one quiz question that has remediation timestamps configured.
- [ ] Confirm a correct answer advances to the next question without remediation playback.
- [ ] Confirm a wrong answer shows the wrong-answer notice and does not advance the quiz.
- [ ] Confirm the video seeks to the configured start timestamp and auto-plays.
- [ ] Confirm the video stops at the configured end timestamp.
- [ ] Confirm focus returns to the same failed question after playback.
- [ ] Confirm the learner can retry that same question and continue only after answering correctly.
- [ ] Confirm a lesson with multiple questions preserves prior correct answers while retrying only the failed question.
- [ ] Confirm fallback behavior is sensible when remediation metadata is missing or incomplete.

## Out Of Scope
- rewriting lesson scoring policy beyond the described remediation flow
- redesigning the entire admin quiz builder unless needed to expose remediation metadata cleanly
- changing trigger-gated in-video quiz rules beyond compatibility with this behavior
