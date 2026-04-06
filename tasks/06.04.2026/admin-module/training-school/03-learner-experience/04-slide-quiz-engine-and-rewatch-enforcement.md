# Module 04 - Slide Quiz Engine and Rewatch Enforcement

## Objective
Replace the current end-of-lesson quiz experience with the required slide-triggered quiz engine for video lessons.

## Current State In Repo
- `quiz_questions` exists and is used as a lesson-level question bank.
- `quiz_attempts` exists and records lesson-level quiz submissions.
- `lesson-viewer-quiz.tsx` submits one combined answer set after the learner completes all questions.
- No current implementation pauses the video at trigger timestamps or forces rewind before retry.

## Required Outcome
- The video player pauses at configured trigger points.
- A full-screen/lightbox quiz appears at each trigger.
- Both questions at a trigger must be answered correctly before playback continues.
- Wrong answers show the required short redirecting notification and force the learner to rewatch the relevant segment before another answer attempt.
- Server-side rules prevent bypassing the rewatch requirement.

## Detailed Tasks
- [ ] Design the additive schema needed for trigger-based playback without replacing current tables.
- [ ] Introduce `lesson_quiz_triggers` if no equivalent trigger table exists yet.
- [ ] Decide whether `quiz_questions` can absorb `slide_index` and trigger linkage safely or needs a minimal additive relation.
- [ ] Decide how to store the "slide start timestamp" or rewind target required for wrong-answer redirects.
- [ ] Add server-tracked rewatch evidence so the backend can enforce "no try again without rewatch."
- [ ] Update the learner lesson API to return trigger metadata in addition to question payloads.
- [ ] Replace or extend the current lesson viewer to:
  - load trigger timestamps at lesson start
  - pause at each trigger
  - open a modal/lightbox
  - prevent manual scrubbing past unpassed trigger points
  - save resume position every 10 seconds
- [ ] Implement the wrong-answer flow:
  - show a 5-second progress-bar style notification
  - explain the answer was wrong
  - redirect to the relevant video point
  - replay the segment
  - reshow the quiz at the trigger boundary
- [ ] Ensure server validation governs progression instead of trusting client state.
- [ ] Preserve the existing non-trigger quiz flow only if needed for lessons that do not yet use trigger-based quizzes.

## Acceptance Criteria
- Trigger-based questions interrupt playback at the configured timestamps.
- Learners cannot skip ahead past unanswered triggers.
- Wrong answers require a rewatch before a retry is accepted.
- Playback resume state survives refresh/re-entry.

## Verification Test Plan
- [ ] Configure a lesson with at least two trigger points and confirm the video pauses at each timestamp.
- [ ] Confirm the trigger modal shows the correct question pair and prevents background interaction.
- [ ] Answer both questions correctly and confirm playback resumes to the next segment.
- [ ] Answer a question incorrectly and confirm the 5-second redirect notification appears and rewinds to the configured segment start.
- [ ] Attempt to resubmit without completing the required rewatch and confirm the server rejects it.
- [ ] Attempt to scrub past an unpassed trigger and confirm the player blocks the action.
- [ ] Refresh the page mid-lesson and confirm playback resumes from the saved progress point.
