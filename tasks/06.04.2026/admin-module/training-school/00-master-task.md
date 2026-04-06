# Training School Module - Gap Closure Master Task

## Goal
Close the real behavioral gaps between the architect discussion, the documented Training School requirements, and the current repo implementation without renaming existing tables, APIs, or schemas that already serve the required business function.

## Important Working Rules
- Keep existing names when they already exist in repo, especially `training_programs`, `training_categories`, `training_lessons`, `training_settings`, `quiz_questions`, `quiz_attempts`, `lesson_progress`, `lesson_completions`, `category_completions`, `user_program_progress`, and `user_category_progress`.
- Do not introduce duplicate tables just to match requirement wording if an existing table can be extended safely.
- Treat `training_programs` as the top-level "training" layer described by the architect.
- Treat program-level and category-level sequential locking as separate behaviors with a clear precedence rule.

## Current Repo Reality
- Admin CRUD already exists for training programs, categories, lessons, quizzes, notes, settings, and analytics.
- Program and category priority already exist.
- Program and category sequential flags already exist.
- Training center role access already exists in `training_settings.allowed_roles`.
- Lessons already support `video_url`, `pdf_url`, `lesson_videos`, and `lesson_assets`.
- Learner APIs already expose program, category, lesson, quiz, and progress data.
- Learner quiz flow is currently a standard end-of-lesson quiz, not a slide-triggered in-video quiz engine.
- Analytics pages and APIs already exist for overview, users, programs, categories, lessons, and quizzes.
- Certificate generation/verification already exists, but needs to be checked against the required completion and email flow.

## Confirmed Gaps To Close
1. Global training governance is incomplete because admin settings currently handle role access but not the top-level sequential lock strategy.
2. Priority-based auto-routing to the highest incomplete category and lesson needs explicit product rules and verification coverage.
3. Lesson delivery requirements are richer than the current authoring UX, especially around multi-source media and downloadable/previewable files.
4. The required slide-triggered video quiz engine is not implemented by the current learner experience.
5. Wrong-answer rewatch enforcement and video rewind events are not modeled server-side today.
6. The requested progress-record and reporting matrix needs a stricter definition across training, category, lesson, and user views.
7. Mean, median, and average completion-time analytics need explicit scope and implementation guidance.
8. Certificate email dispatch should be validated against the final graduation rule after all required trainings complete.

## Success Criteria
1. Admins can control who sees Training School navigation and whether program-level sequencing is enforced globally.
2. Program, category, and lesson authoring reflect the required hierarchy, priority rules, and previous-lesson relationships.
3. Learners resume at the correct next incomplete item according to program/category priority and sequential-lock rules.
4. Lessons support the required content-source combinations without breaking existing asset/video APIs.
5. In-video quiz triggers, rewind enforcement, and progress saving work reliably and are enforced server-side.
6. Admins can inspect user-wise and hierarchy-wise progress with a clearly defined reporting matrix.
7. Completion-time analytics expose mean, median, and average for training and category views.
8. Final completion issues the certificate email and preserves certificate verification behavior.

## Module Index
1. [README.md](./README.md)
2. [01-governance/01-governance-access-and-sequential-lock.md](./01-governance/01-governance-access-and-sequential-lock.md)
3. [02-authoring/02-program-category-lesson-authoring-and-priority-rules.md](./02-authoring/02-program-category-lesson-authoring-and-priority-rules.md)
4. [02-authoring/03-lesson-content-assets-and-delivery-model.md](./02-authoring/03-lesson-content-assets-and-delivery-model.md)
5. [03-learner-experience/04-slide-quiz-engine-and-rewatch-enforcement.md](./03-learner-experience/04-slide-quiz-engine-and-rewatch-enforcement.md)
6. [03-learner-experience/05-progress-routing-resume-and-completion-flow.md](./03-learner-experience/05-progress-routing-resume-and-completion-flow.md)
7. [04-reporting-and-certification/06-admin-progress-records-and-reporting.md](./04-reporting-and-certification/06-admin-progress-records-and-reporting.md)
8. [04-reporting-and-certification/07-time-to-complete-statistics-and-benchmarks.md](./04-reporting-and-certification/07-time-to-complete-statistics-and-benchmarks.md)
9. [04-reporting-and-certification/08-certificate-award-email-and-verification.md](./04-reporting-and-certification/08-certificate-award-email-and-verification.md)
10. [09-requirements-traceability-checklist.md](./09-requirements-traceability-checklist.md)

## Recommended Execution Order
1. Governance, role access, and global sequential-lock rule
2. Program/category/lesson model and admin authoring gaps
3. Lesson media and asset delivery model
4. Slide-triggered quiz engine and rewatch enforcement
5. Resume, next-item routing, and completion flow validation
6. Reporting matrix and admin dashboards
7. Time-to-complete statistics
8. Certificate issuance and graduation email validation

## Implementation Note For AI Workers
- First inspect the existing admin and trainee training routes before changing schema.
- Prefer extending current tables and APIs rather than adding parallel versions of the same concept.
- If new tables are required for quiz triggers or rewind enforcement, keep them additive and integrate them with the existing `quiz_questions`, `quiz_attempts`, and `lesson_progress` flow.
- Preserve current certificate verification URLs and existing graduation fields unless a requirement cannot be met otherwise.

## Verification Gate
1. Review the child task files before implementation.
2. Execute them in the order above unless a dependency forces a reorder.
3. For each task, complete the verification test plan inside that file.
4. Run one end-to-end admin-to-learner walkthrough covering setup, consumption, analytics, and certification.
