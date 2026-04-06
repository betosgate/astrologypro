# Training School Requirements Traceability Checklist

## Purpose
Map the architect notes and the documented Module 22 requirement to:
- existing repo coverage
- the new task files created under `tasks/06.04.2026/admin-module/training-school/`
- the remaining implementation gaps that still need code work

## Working Rule
- Naming mismatch is acceptable if the current repo model already fulfills the business function.
- This checklist is about behavioral coverage, not literal requirement wording.

## Architect Requirement 1
### Two common controls for Training School
- sequential lock on/off: covered by task file
  - [01-governance/01-governance-access-and-sequential-lock.md](./01-governance/01-governance-access-and-sequential-lock.md)
- which roles can access Training School nav: existing partial implementation + task coverage
  - `training_settings.allowed_roles` already exists
  - [01-governance/01-governance-access-and-sequential-lock.md](./01-governance/01-governance-access-and-sequential-lock.md)

## Architect Requirement 2
### Main training layer -> categories -> lessons, with priority and previous lesson
- existing partial implementation + task coverage
  - `training_programs`, `training_categories`, `training_lessons`, and `previous_lesson_id` already exist
  - [02-authoring/02-program-category-lesson-authoring-and-priority-rules.md](./02-authoring/02-program-category-lesson-authoring-and-priority-rules.md)

## Architect Requirement 3
### Category priority and resume to highest incomplete category/highest incomplete lesson
- existing priority fields + task coverage for routing behavior
  - [02-authoring/02-program-category-lesson-authoring-and-priority-rules.md](./02-authoring/02-program-category-lesson-authoring-and-priority-rules.md)
  - [03-learner-experience/05-progress-routing-resume-and-completion-flow.md](./03-learner-experience/05-progress-routing-resume-and-completion-flow.md)

## Architect Requirement 4
### Training progress record section
- existing partial implementation + task coverage
  - `lesson_progress`, progress cache tables, and analytics already exist
  - [03-learner-experience/05-progress-routing-resume-and-completion-flow.md](./03-learner-experience/05-progress-routing-resume-and-completion-flow.md)
  - [04-reporting-and-certification/06-admin-progress-records-and-reporting.md](./04-reporting-and-certification/06-admin-progress-records-and-reporting.md)

## Architect Requirement 5
### Sequential lock on means one-by-one completion, off means jump allowed
- existing partial implementation + task coverage
  - [01-governance/01-governance-access-and-sequential-lock.md](./01-governance/01-governance-access-and-sequential-lock.md)
  - [03-learner-experience/05-progress-routing-resume-and-completion-flow.md](./03-learner-experience/05-progress-routing-resume-and-completion-flow.md)

## Architect Requirement 6
### Lesson supports upload video, multiple files, YouTube, file URL
- existing partial implementation + task coverage
  - `training_lessons`, `lesson_videos`, and `lesson_assets` already exist
  - [02-authoring/03-lesson-content-assets-and-delivery-model.md](./02-authoring/03-lesson-content-assets-and-delivery-model.md)

## Architect Requirement 7
### Sequential lock primarily at training level, also at category level
- existing flags + task coverage for precedence clarification
  - [01-governance/01-governance-access-and-sequential-lock.md](./01-governance/01-governance-access-and-sequential-lock.md)
  - [03-learner-experience/05-progress-routing-resume-and-completion-flow.md](./03-learner-experience/05-progress-routing-resume-and-completion-flow.md)

## Architect Requirement 8
### Quiz questions inside lesson with wrong-answer rewind and retry after rewatch
- major gap, covered by task file
  - [03-learner-experience/04-slide-quiz-engine-and-rewatch-enforcement.md](./03-learner-experience/04-slide-quiz-engine-and-rewatch-enforcement.md)

## Architect Requirement 9
### User-wise and training-wise reporting, including training/category/lesson/user views
- existing analytics partial coverage + task coverage
  - [04-reporting-and-certification/06-admin-progress-records-and-reporting.md](./04-reporting-and-certification/06-admin-progress-records-and-reporting.md)

## Architect Requirement 10
### Training-wise and category-wise mean/median/average completion-time report
- existing average-time partial coverage + task coverage
  - [04-reporting-and-certification/07-time-to-complete-statistics-and-benchmarks.md](./04-reporting-and-certification/07-time-to-complete-statistics-and-benchmarks.md)

## Architect Requirement 11
### Certificate email after completion
- existing partial implementation + task coverage
  - certificate page, verification, and graduation fields already exist
  - [04-reporting-and-certification/08-certificate-award-email-and-verification.md](./04-reporting-and-certification/08-certificate-award-email-and-verification.md)

## Module 22 - Video Player + Slide Quiz Engine
### Database
- `lesson_quiz_triggers`: not present, covered by task file
  - [03-learner-experience/04-slide-quiz-engine-and-rewatch-enforcement.md](./03-learner-experience/04-slide-quiz-engine-and-rewatch-enforcement.md)
- `quiz_questions`: already exists; extend instead of rename where possible
  - [03-learner-experience/04-slide-quiz-engine-and-rewatch-enforcement.md](./03-learner-experience/04-slide-quiz-engine-and-rewatch-enforcement.md)
- `student_quiz_attempts`: existing equivalent behavior partly covered by `quiz_attempts`; do not rename, extend only if needed
  - [03-learner-experience/04-slide-quiz-engine-and-rewatch-enforcement.md](./03-learner-experience/04-slide-quiz-engine-and-rewatch-enforcement.md)
- `student_lesson_progress`: existing equivalent behavior partly covered by `lesson_progress`; do not rename, extend only if needed
  - [03-learner-experience/05-progress-routing-resume-and-completion-flow.md](./03-learner-experience/05-progress-routing-resume-and-completion-flow.md)

### Video Player
- custom player with triggers, no-skip, and 10-second save: covered by task file
  - [03-learner-experience/04-slide-quiz-engine-and-rewatch-enforcement.md](./03-learner-experience/04-slide-quiz-engine-and-rewatch-enforcement.md)

### Quiz Lightbox
- full-screen modal, correct/wrong flow, rewind requirement, and enforced rewatch: covered by task file
  - [03-learner-experience/04-slide-quiz-engine-and-rewatch-enforcement.md](./03-learner-experience/04-slide-quiz-engine-and-rewatch-enforcement.md)

### Progress Tracking
- lesson/category/program completion and progress bars: existing partial implementation + task coverage
  - [03-learner-experience/05-progress-routing-resume-and-completion-flow.md](./03-learner-experience/05-progress-routing-resume-and-completion-flow.md)

## Summary
- The repo already has a strong Training School base.
- The biggest functional gap is the trigger-based quiz engine and the stricter completion model attached to it.
- The second biggest gap is turning broad reporting language into an implementation-grade metric matrix.
