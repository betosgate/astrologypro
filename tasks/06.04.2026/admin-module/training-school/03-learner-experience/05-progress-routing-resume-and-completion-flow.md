# Module 05 - Progress Routing, Resume, and Completion Flow

## Objective
Make the learner progression model explicit from training start to training completion, including resume behavior, completion gating, and the interaction between progress tables and completion tables.

## Current State In Repo
- `lesson_progress`, `lesson_completions`, `category_completions`, `user_program_progress`, and `user_category_progress` already exist.
- Learner APIs already expose next lesson/category fields from cache tables.
- Lesson completion today is driven mainly by passing the whole lesson quiz.
- The documented requirements expect trigger-by-trigger progression and completion based on all required question pairs.

## Required Outcome
- Progress records reflect real in-progress learner state.
- Resume logic and completion logic remain consistent after the slide quiz engine is introduced.
- Incomplete training entry always routes the learner to the correct next target.

## Detailed Tasks
- [ ] Audit how `lesson_progress` is currently updated by lesson start, heartbeat, quiz pass, and lesson completion routes.
- [ ] Decide whether the current progress model can represent trigger-level state or whether it needs additive fields/tables.
- [ ] Ensure lesson completion only occurs after all required trigger questions have been answered correctly.
- [ ] Ensure category completion only occurs after all active lessons in that category are complete.
- [ ] Ensure program/training completion only occurs after all required categories are complete.
- [ ] Define how the app chooses the learner's next destination when:
  - program sequential is on
  - program sequential is off
  - category sequential is on
  - category sequential is off
- [ ] Validate the architect rule that reopening an incomplete training jumps to the highest-priority incomplete category and highest-priority incomplete lesson.
- [ ] Ensure the learner-facing progress bar is consistent on:
  - lesson page
  - category overview
  - program overview
- [ ] Remove or reconcile any legacy progress flow such as `trainee_lesson_progress` if it causes behavioral duplication with the current model.

## Acceptance Criteria
- Progress state is durable and consistent across route refreshes and re-entry.
- Completion state only advances when the required lesson/category/program conditions are met.
- Next-item routing is deterministic and aligns with the architect requirement.

## Verification Test Plan
- [ ] Open a lesson, confirm `lesson_progress` is created or updated.
- [ ] Leave and re-enter an incomplete lesson, then confirm resume state and next destination are stable.
- [ ] Complete all lessons in a category and confirm `category_completions` updates exactly once.
- [ ] Complete all categories in a program and confirm program-level progress becomes complete.
- [ ] Re-open an incomplete program and confirm the learner lands on the correct highest-priority incomplete path.
- [ ] Confirm progress percentages remain correct when one lesson is partially watched but not complete.
