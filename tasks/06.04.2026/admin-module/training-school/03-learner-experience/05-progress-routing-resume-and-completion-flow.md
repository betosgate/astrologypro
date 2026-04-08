# Module 05 - Progress Routing, Resume, and Completion Flow

- Status: Completed (2026-04-08, verified)
- Completion Notes: lesson-viewer-client.tsx persists last_position_seconds at ~10s heartbeat; trigger answer route promotes to lesson_completions via completeLessonAndProgressForUser.

## Objective
Finalize how progress is stored, resumed, and completed once the trigger-based quiz model is introduced.

## Current Repo State
- `lesson_progress`, `lesson_completions`, `category_completions`, `user_program_progress`, and `user_category_progress` already exist.
- Learner APIs already expose next lesson/category information from cache tables.
- Current lesson completion is mainly tied to passing the whole lesson quiz.

## Exact Gap
- Trigger-based quiz progression requires more granular state than the current end-of-lesson model.
- Resume and completion semantics must be unified so the learner always returns to the correct item.
- Legacy progress paths may conflict with the newer tracking model.

## Required Implementation
- Use `lesson_progress` as the primary in-progress lesson state.
- Extend the progress model if required so it can store trigger-level progress without replacing current tables unnecessarily.
- Mark a lesson complete only when all required trigger question pairs are answered correctly.
- Mark a category complete only when all active lessons in that category are complete.
- Mark a program complete only when all required categories in that program are complete.
- Enforce this next-destination rule:
  - learner re-entry goes to the lowest-priority incomplete category in the current program
  - inside that category, learner re-entry goes to the lowest-priority incomplete lesson
  - sequential settings from Module 01 determine what is locked, not what is considered the next item
- Reconcile or retire any legacy path such as `trainee_lesson_progress` if it causes duplicate truth.
- Keep learner progress indicators consistent across lesson, category, and program views.

## Likely Affected Files
- `src/app/api/trainee/training/lessons/[id]/start/route.ts`
- `src/app/api/trainee/training/lessons/[id]/heartbeat/route.ts`
- `src/app/api/trainee/training/lessons/[id]/complete/route.ts`
- `src/app/api/trainee/training/programs/route.ts`
- `src/app/api/trainee/training/lessons/[id]/quiz/route.ts`
- trainee training page components
- progress-related migrations if trigger progress requires additive storage

## API and Schema Constraints
- Keep current progress/completion/cache table names unless explicit cleanup is necessary.
- Do not create a parallel progress stack if additive fields or a small helper table are sufficient.

## Dependencies
- Execute after Module 04.

## Acceptance Criteria
- Progress is durable and resumes correctly after refresh or route re-entry.
- Completion only advances when the final required conditions are met.
- Next-item routing is deterministic and consistent with priority rules.

## Verification Test Plan
- [ ] Start a lesson and confirm progress state is created or updated.
- [ ] Leave a lesson mid-progress and confirm resume state is preserved.
- [ ] Complete all required triggers in a lesson and confirm lesson completion is recorded once.
- [ ] Complete all lessons in a category and confirm category completion is recorded once.
- [ ] Complete all required categories in a program and confirm program completion is recorded once.
- [ ] Reopen an incomplete program and confirm routing lands on the correct next incomplete category and lesson.

## Out Of Scope
- admin analytics UI work
- certificate delivery
