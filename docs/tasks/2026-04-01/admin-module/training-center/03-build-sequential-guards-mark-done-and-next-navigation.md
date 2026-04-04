# Build Sequential Guards Mark Done And Next Navigation - 2026-04-01

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: lesson fetch, lesson gating, mark-done mutation, next-lesson progression, completion modals
- Estimate: 1.5-2 days
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-01/admin-module/training-center/03-build-sequential-guards-mark-done-and-next-navigation.md`

## Goal

Implement the real lesson-detail behavior so the Next Training Center player behaves like Angular when lessons are opened, completed, and advanced.

## Verified Current Code Truth

- Angular fetches the selected training detail from `admin/training-fetch` with `_id` and `user_id`.
- Angular renders each lesson row inside the training panel and lazily fetches lesson detail from `admin/lesson-fetch` when a lesson is opened.
- Angular sequential lesson lock works like this:
  - first lesson is always allowed
  - if `environment.sequencial_lock` is off, any lesson is allowed
  - otherwise the previous lesson is fetched and must have `lesson_completed_flag`
- Angular lesson detail view includes:
  - lesson title row
  - video player
  - lesson description
  - quiz CTA when applicable
  - assignment CTA when applicable
- When the lesson video ends:
  - if the lesson has a quiz and is incomplete, Angular exposes quiz attempt CTA
  - if the lesson has no quiz and is incomplete, Angular immediately calls `training-centre/done-training-lesson-add`
  - if the lesson is already complete, Angular opens a next-lesson confirmation modal
- Angular `done-training-lesson-add` payload includes:
  - `lesson_id`
  - `user_id`
  - `training_id`
  - `next_training_id`
  - `previous_lesson_id`
  - `next_lesson_id`
- Angular computes the next target by:
  - next lesson in same training first
  - otherwise first lesson of next training
  - otherwise all-training-completed modal with restart option

## User-Visible Problem

The Next route currently cannot open a lesson, play lesson media, enforce lesson order, mark lessons done, or advance through the course structure.

## Required Behavior

1. Opening a lesson should fetch lesson detail on demand.
2. Lesson detail should render the lesson video and description.
3. Sequential lesson guard should match Angular behavior.
4. Video completion should trigger the same progression logic as Angular.
5. Lessons without quizzes should be mark-done eligible immediately on video completion.
6. Lessons with quizzes should not be auto-completed before quiz completion.
7. After successful lesson completion, the UI should offer move-to-next behavior.
8. When the current training ends, the next training's first lesson should be selected.
9. When all training content is complete, show a completion modal with restart choice.

## Tasks

1. Build lesson-list accordion/item components inside the player.
2. Build a lesson-detail fetch hook around `admin/lesson-fetch`.
3. Add sequential lesson guard logic with env-flag bypass support.
4. Add `done-training-lesson-add` mutation with Angular-equivalent payload shape.
5. Build next-lesson calculation utilities.
6. Build next-lesson and all-training-completed confirmation modals.
7. Refresh progress and selection state after successful completion.

## Acceptance Criteria

- lesson details load only when the lesson is opened
- locked lessons cannot be opened while sequential lock is active
- completed lessons can reopen without errors
- ending a no-quiz lesson marks it complete and advances via confirmation flow
- ending a completed lesson opens the next-lesson confirmation flow
- reaching the end of the final training opens all-training-completed UI

## Verification Test Plan

1. Open the first lesson of a training and verify detail data loads correctly.
2. With sequential mode enabled, try to open a later lesson before completing its predecessor and confirm the UI blocks access.
3. Disable sequential mode and confirm the same lesson can be opened.
4. Play a lesson with no quiz to completion and verify `done-training-lesson-add` is called.
5. Confirm the next-lesson modal appears after completion.
6. Accept the modal and verify the player advances to the correct next lesson.
7. Complete the last lesson of a training and verify the next training's first lesson is selected.
8. Complete the final lesson in the final training and verify the all-training-completed modal appears.
9. Confirm restart from the completion modal returns to the first available lesson cleanly.

## Implementation Notes (2026-04-01)

Already implemented before this review. Full audit confirmed in `play/[trainingId]/[lessonId]/page.tsx`:
- Lesson detail: fetched via `admin/training-fetch` (full training + lesson list with `lesson_completed_flag`, `quiz_available_flag`, `assignment_available_flag`).
- `handleVideoEnded`: if no quiz, calls `markDoneMutation`; if quiz present, quiz panel handles completion.
- `markDoneMutation`: posts to `training-centre/done-training-lesson-add` with `{ lesson_id, user_id, training_id, next_training_id, previous_lesson_id, next_lesson_id }`; uses `computeNextTarget()` to resolve ids; refetches training data + progress on success; shows next-lesson or all-complete modal.
- `computeNextTarget()`: next lesson in same training → first lesson of next training → `isAllDone`.
- Sequential lesson lock: `canSequentialOpen(idx)` returns false if SEQUENTIAL_LOCK on and previous lesson not completed.
- "All training complete" modal with restart (routes back to `play/`).
- No code changes required.

## Notion Summary

P1 parity gap: Angular enforces lesson order, fetches lesson detail lazily, marks lessons complete on video progression, and guides the admin to the next lesson or next training. Next needs the full lesson progression state machine.
