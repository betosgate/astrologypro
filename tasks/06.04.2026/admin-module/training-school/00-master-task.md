# Training School Module - AI Execution Master Task

## Goal
Execute the Training School gap-closure work against the current repo implementation in a way that is deterministic, implementation-ready, and safe for an AI coding agent.

## Canonical Folder
- Repo path: `tasks/06.04.2026/admin-module/training-school`
- GitHub folder: `https://github.com/betosgate/astrologypro/tree/master/tasks/06.04.2026/admin-module/training-school`

## Non-Negotiable Constraints
- Do not rename existing tables, APIs, or schemas only to match external requirement wording.
- Reuse current repo concepts:
  - `training_programs` = top-level training layer
  - `training_categories` = category layer
  - `training_lessons` = lesson layer
- Prefer extending current routes and tables over introducing parallel replacements.
- Read the relevant Next.js guide under `node_modules/next/dist/docs/` before changing framework-sensitive code.

## Existing Repo Truth
- Admin CRUD already exists for training programs, categories, lessons, quizzes, settings, notes, and analytics.
- Program/category priority and sequential flags already exist.
- Learner training APIs and progress cache tables already exist.
- Certificate generation and verification already exist.
- The largest missing behavior is the trigger-based in-video quiz engine with forced rewatch enforcement.

## AI Execution Pattern For All Child Tasks
Every child task in this folder should be executed using this pattern:
1. Read the task file completely.
2. Confirm the exact gap against the current repo.
3. Change only the likely affected files unless repo reality forces a wider change.
4. Keep naming stable.
5. Verify using the file’s verification plan before closing the task.

## Execution Order
1. `01-governance/01-governance-access-and-sequential-lock.md`
2. `02-authoring/02-program-category-lesson-authoring-and-priority-rules.md`
3. `02-authoring/03-lesson-content-assets-and-delivery-model.md`
4. `03-learner-experience/04-slide-quiz-engine-and-rewatch-enforcement.md`
5. `03-learner-experience/05-progress-routing-resume-and-completion-flow.md`
6. `04-reporting-and-certification/06-admin-progress-records-and-reporting.md`
7. `04-reporting-and-certification/07-time-to-complete-statistics-and-benchmarks.md`
8. `04-reporting-and-certification/08-certificate-award-email-and-verification.md`
9. `09-requirements-traceability-checklist.md`

## Dependency Rules
- Do not start reporting or certificate work before the learner progression model is settled.
- Do not finalize completion-time analytics before completion semantics are finalized.
- Do not finalize certificate rules before the final completion trigger is finalized.

## Done Definition
- Each child task is implemented, not just analyzed.
- Acceptance criteria in each child task are met.
- Verification steps in each child task are run or explicitly reported as blocked.
- No existing table/API names are renamed for terminology parity alone.
