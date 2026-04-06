# Module 02 - Program, Category, Lesson Authoring and Priority Rules

## Objective
Make the training hierarchy and ordering behavior explicit in admin authoring and learner routing.

## Current Repo State
- `training_programs`, `training_categories`, and `training_lessons` already exist.
- Program/category/lesson priority already exists.
- `training_lessons.previous_lesson_id` already exists.
- Admin create/edit flows already exist for programs, categories, and lessons.

## Exact Gap
- The hierarchy exists, but the execution rules for next-item routing are not written in an implementation-atomic way.
- `previous_lesson_id` and priority can conflict if both are treated as competing ordering sources.
- Admin surfaces do not yet guarantee enough clarity around the actual learner path.

## Required Implementation
- Use `training_programs` as the top-level training layer. Do not introduce a new entity.
- Treat priority as the primary ordering source for:
  - programs
  - categories within a program
  - lessons within a category
- Treat `previous_lesson_id` as a validation and relational aid, not as the primary ordering source.
- Enforce this next-item rule:
  - when a learner reopens an incomplete training, send them to the lowest-priority-number incomplete category within that program
  - inside that category, send them to the lowest-priority-number incomplete lesson
  - if duplicate priorities exist, break ties by `created_at`, then `id`
- Add validation or admin warnings to prevent:
  - circular previous-lesson chains
  - previous lesson references outside the same category
  - invalid duplicate ordering behavior that makes the path ambiguous
- Update admin list/detail/preview surfaces if needed so ordering information is visible.

## Likely Affected Files
- `src/app/admin/training/page.tsx`
- `src/app/admin/training/programs/new/page.tsx`
- `src/app/admin/training/categories/new/page.tsx`
- `src/app/admin/training/lessons/new/page.tsx`
- corresponding edit pages
- corresponding admin API routes for programs/categories/lessons
- learner program/category routing logic

## API and Schema Constraints
- Keep using `training_programs`, `training_categories`, `training_lessons`.
- Keep `previous_lesson_id`; do not remove it unless dead code proves it is unused and removal is explicitly requested later.
- Do not create a separate ordering table.

## Dependencies
- Execute after Module 01.

## Acceptance Criteria
- Admin authoring makes the hierarchy and priority model clear.
- Learner next-item routing follows one deterministic priority-first rule.
- `previous_lesson_id` cannot create contradictory or invalid lesson chains.

## Verification Test Plan
- [ ] Create multiple programs and confirm priority ordering is stable.
- [ ] Create multiple categories in a program and confirm priority ordering is stable.
- [ ] Create multiple lessons in a category and confirm priority ordering is stable.
- [ ] Reopen an incomplete training and confirm the learner is sent to the lowest-priority incomplete category and lesson.
- [ ] Attempt to create an invalid previous-lesson reference and confirm validation blocks or flags it.

## Out Of Scope
- media delivery model
- video-triggered quizzes
- reporting
