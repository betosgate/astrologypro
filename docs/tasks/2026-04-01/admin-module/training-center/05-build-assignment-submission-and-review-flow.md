# Build Assignment Submission And Review Flow - 2026-04-01

- Status: Done
- Priority: P2
- Owner: Frontend
- Scope: assignment CTA visibility, multi-question submission modal, submission state lookup, review modal
- Estimate: 1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-01/admin-module/training-center/05-build-assignment-submission-and-review-flow.md`

## Goal

Port the assignment workflow from Angular so assignment-enabled lessons in Next can collect answers, submit them, and later display the submitted result.

## Verified Current Code Truth

- Angular checks assignment behavior from the lesson detail component.
- When a completed lesson has `assignment_available_flag`, Angular calls `training-centre/fetch-assignment-notification`.
- If submission data exists:
  - `showViewAssignment = true`
  - `showAssignment = false`
  - first submission payload is stored for display
- If no submission exists:
  - `showAssignment = true`
- Clicking `Assignment` fetches question data from `training-centre/fetch-assignment`.
- Angular opens a modal that steps through assignment prompts one by one.
- Each step collects a required textarea answer.
- Angular accumulates answers in `assignmentArray` and submits them to `training-centre/assginment-notification-add`.
- Submission payload includes:
  - `added_by_name`
  - `added_by_email`
  - `answerdata`
  - `lesson_name`
  - `lesson_title`
  - `added_by`
- Clicking `View Assignment` opens a modal that renders submitted `answerdata` entries.

## User-Visible Problem

Next has no assignment flow, so admins cannot submit or review assignment responses for assignment-enabled training lessons.

## Required Behavior

1. Determine assignment CTA state from lesson data plus assignment notification lookup.
2. Show `Assignment` when the lesson has assignment support but no submission exists.
3. Show `View Assignment` when a submission already exists.
4. Fetch assignment prompts before opening the submission flow.
5. Support multi-step assignment answer entry.
6. Enforce required answers per step.
7. Submit accumulated answers with the Angular-equivalent payload semantics.
8. After submission, refresh assignment state so the CTA changes to review mode.
9. Render submitted answers in a review modal or panel.

## Tasks

1. Build assignment state hook around:
   - `training-centre/fetch-assignment`
   - `training-centre/fetch-assignment-notification`
   - `training-centre/assginment-notification-add`
2. Build an assignment submission modal or drawer.
3. Add step navigation and required-answer validation.
4. Build assignment review UI for stored `answerdata`.
5. Refresh lesson CTA state after successful submission.
6. Add error handling for fetch and submit failures.

## Acceptance Criteria

- assignment-enabled lessons surface the correct CTA based on submission state
- assignment prompts can be filled step-by-step and submitted successfully
- empty required answers are blocked
- successful submission flips the lesson UI from submit mode to review mode
- previously submitted answers can be reviewed later

## Verification Test Plan

1. Open an assignment-enabled lesson with no previous submission and verify `Assignment` appears.
2. Launch the assignment flow and confirm prompts load.
3. Try to advance with an empty answer and verify validation blocks submission.
4. Complete all steps and submit; confirm the success path closes the modal and refreshes state.
5. Reopen the same lesson and verify the CTA changes to `View Assignment`.
6. Open review mode and confirm the stored assignment titles and answers render correctly.
7. Test an API error path for fetch or submit and verify the UI recovers without breaking the lesson view.

## Implementation Notes (2026-04-01)

Already implemented before this review. Full audit confirmed in `AssignmentPanel` component in `play/[trainingId]/[lessonId]/page.tsx`:
- On `lesson_completed_flag` available: calls `training-centre/fetch-assignment-notification` with `{ lesson_id, user_id }`; if submission data exists sets `hasSubmission = true` and stores answers for review.
- "Assignment" button visible when `!hasSubmission`; "View Assignment" when `hasSubmission`.
- `openSubmit()`: fetches prompts from `training-centre/fetch-assignment`; opens step-through modal.
- Step modal: collects one textarea answer per question; Prev/Next navigation; required-field validation blocks empty answers.
- `submitAssignment()`: posts to `training-centre/assginment-notification-add` with `{ added_by_name, added_by_email, answerdata, lesson_name, lesson_title, added_by }`. On success: sets `hasSubmission = true`, renders review view.
- Review view: renders stored `answerdata` question/answer pairs in the modal.
- No code changes required.

## Notion Summary

P2 parity gap: Angular supports assignment submission and later review inside Training Center lessons. Next needs submission-state lookup, a multi-step answer flow, and a review surface for stored assignment responses.
