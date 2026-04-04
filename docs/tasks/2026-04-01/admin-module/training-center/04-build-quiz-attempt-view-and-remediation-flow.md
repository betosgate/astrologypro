# Build Quiz Attempt View And Remediation Flow - 2026-04-01

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: quiz fetch/traversal, attempt mode, view mode, completion logic, remediation video flow
- Estimate: 1-1.5 days
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-01/admin-module/training-center/04-build-quiz-attempt-view-and-remediation-flow.md`

## Goal

Recreate the Angular quiz behavior so quiz-gated lessons in Next can be attempted, reviewed, completed, and remediated through targeted video replay.

## Verified Current Code Truth

- Angular only exposes quiz controls from the lesson detail view.
- Quiz behavior is driven by `admin/calculate-quiz-result`.
- Initial fetch request uses:
  - `lesson_id`
  - `training_id`
  - `user_id`
- Angular supports two quiz modes:
  - attempt mode
  - view mode via `disableQuiz = true`
- Angular preserves previously selected answers when prior user answers exist.
- Angular quiz traversal supports `next` and `prev` requests using:
  - `skip`
  - `selected_answer`
  - `quiz_id`
  - optional `previous: true`
  - `is_disableQuiz`
- When the API returns `results.quiz_completion`, Angular emits lesson completion and the parent flow marks the lesson done.
- If an answer is incorrect and the API returns review timestamps, Angular lets the user watch the relevant lesson video segment.
- After the review clip ends, Angular opens a confirmation modal with:
  - `Play Again`
  - `Go to Quiz`
  - `Cancel`
- If the lesson was already completed and quiz data exists, Angular exposes `View Quiz` instead of `Attempt Quiz`.

## User-Visible Problem

Next currently has no quiz behavior at all, which means quiz-gated lessons cannot reach completion parity with Angular.

## Required Behavior

1. Render quiz UI inside the lesson detail experience.
2. Support attempt mode for incomplete quiz-gated lessons.
3. Support read-only view mode for previously completed quiz lessons.
4. Persist and restore previously selected answers when available.
5. Allow moving forward and backward through quiz questions.
6. Mark the lesson complete only when quiz completion is reported by the API.
7. Support remediation playback when incorrect answers provide review timestamps.
8. After review playback, let the user replay the clip or jump back to quiz.

## Tasks

1. Build a quiz panel component and hook around `admin/calculate-quiz-result`.
2. Add attempt-mode and view-mode support.
3. Normalize quiz request and response state into a stable client model.
4. Restore previously answered selections when API data is present.
5. Emit completion back into the lesson mark-done flow.
6. Add targeted review-video playback controls and the replay/return modal.
7. Ensure quiz close behavior returns the admin to the lesson detail state cleanly.

## Acceptance Criteria

- incomplete quiz lessons show `Attempt Quiz`
- completed quiz lessons show `View Quiz`
- quiz navigation supports both next and previous traversal
- previous answers are restored when available
- successful quiz completion feeds back into lesson completion flow
- incorrect-answer remediation can replay the relevant lesson segment

## Verification Test Plan

1. Open a quiz-enabled incomplete lesson and confirm `Attempt Quiz` appears only after the lesson reaches the correct state.
2. Start the quiz and verify question progress is shown.
3. Select answers and move next/previous; confirm state is preserved appropriately.
4. Finish the quiz with a passing/completion response and verify the lesson completion flow is triggered.
5. Reopen a completed quiz lesson and confirm `View Quiz` opens a disabled/read-only mode.
6. Force an incorrect-answer path with review timestamps and confirm `Watch Explanation` appears.
7. Play the explanation clip and verify the replay-or-return modal appears at the configured end time.
8. Choose `Go to Quiz` and confirm the page scrolls/focuses back to the quiz section.

## Implementation Notes (2026-04-01)

Already implemented before this review. Full audit confirmed in `QuizPanel` component in `play/[trainingId]/[lessonId]/page.tsx`:
- `fetchQuestion(mode, extras)`: posts to `admin/calculate-quiz-result` with `{ lesson_id, training_id, user_id, skip, selected_answer, quiz_id, previous, is_disableQuiz }`.
- Attempt mode (`openAttempt`) and view/read-only mode (`openView`, `is_disableQuiz: true`) both supported.
- Previous answers restored from API's `res.selected_answer` field.
- `quiz_completion` in response: emits `onComplete()` → parent calls `markDoneMutation`.
- `goNext` / `goPrev`: advances/retreats by incrementing/decrementing `skip`; tracks navigation state.
- Remediation: if response has `start_time`/`end_time` and lesson video exists, shows "Watch Explanation" button; `VideoPlayer` plays from `remediationStart` to `remediationEnd` then fires `showRemediationModal` with Play Again / Go to Quiz / Cancel options.
- Quiz shows "Attempt Quiz" when `!lesson_completed_flag`, "View Quiz" when already completed.
- No code changes required.

## Notion Summary

P1 parity gap: Angular includes a full quiz state machine inside Training Center, including attempt mode, view mode, previous answer restore, completion signaling, and targeted remediation playback. Next needs the complete quiz subsystem for lesson parity.
