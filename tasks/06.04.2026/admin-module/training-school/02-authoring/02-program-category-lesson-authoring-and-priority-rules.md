# Module 02 - Program, Category, Lesson Authoring and Priority Rules

## Objective
Bring the training content model and admin authoring flow into line with the architect requirement for training -> categories -> lessons, each with priority and explicit progression behavior.

## Current State In Repo
- `training_programs`, `training_categories`, and `training_lessons` already exist.
- Program, category, and lesson priority already exist.
- `training_lessons.previous_lesson_id` already exists.
- Admin CRUD pages already exist, but the resume/priority behavior is not fully documented from the admin perspective.

## Required Outcome
- The authoring flow clearly supports:
  - top-level trainings
  - nested categories
  - nested lessons
  - category priority
  - lesson priority
  - previous lesson linkage
- The learner resume rule is based on the highest-priority incomplete category and lesson, not just generic ordering.

## Detailed Tasks
- [ ] Review all admin create/edit pages and APIs for programs, categories, and lessons to ensure priority fields are first-class and validated consistently.
- [ ] Confirm the app uses `training_programs` as the architect's "main layer named training" and update labels/help text where needed instead of inventing a new layer.
- [ ] Validate that `training_lessons.previous_lesson_id` is optional but coherent with the final lesson-ordering logic.
- [ ] Decide whether previous-lesson linkage is purely informational, purely enforcement-driven, or both when priority already exists.
- [ ] Define the exact next-item algorithm for:
  - incomplete training entry
  - next category
  - next lesson
  - ties or duplicate priorities
- [ ] Ensure admin list and preview surfaces show enough ordering metadata that content managers can reason about the learner path.
- [ ] Add guardrails so invalid priority collisions or circular previous-lesson relationships are prevented or flagged.

## Acceptance Criteria
- Admins can author programs, categories, and lessons with clear priority semantics.
- The repo has one explicit rule for next-item routing and it is consistent across admin expectations and learner APIs.
- Previous-lesson data does not conflict with priority-driven progression.

## Verification Test Plan
- [ ] Create at least two programs with different priorities and confirm ordering is stable in admin and learner APIs.
- [ ] Create multiple categories in one program and confirm lower priority values surface first.
- [ ] Create multiple lessons in one category and confirm ordering is stable and matches the chosen next-item algorithm.
- [ ] Verify invalid previous-lesson references are rejected or prevented.
- [ ] Start an incomplete training and confirm the learner is routed to the highest-priority incomplete category and the highest-priority incomplete lesson within that category.
