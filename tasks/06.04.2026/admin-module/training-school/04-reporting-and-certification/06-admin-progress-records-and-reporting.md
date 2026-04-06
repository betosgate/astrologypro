# Module 06 - Admin Progress Records and Reporting Matrix

## Objective
Define and complete the admin reporting surfaces requested by the architect for training-wise, category-wise, lesson-wise, and user-wise reporting.

## Current State In Repo
- Admin analytics already has overview, users, programs, categories, lessons, and quizzes tabs.
- Existing APIs already expose substantial aggregate data.
- The architect requirement asks for "training wise, category wise, lesson wise and user wise report with 4 different parameters," but the parameter set is not yet standardized in the tasking.

## Required Outcome
- The reporting matrix is defined clearly enough that implementation is testable.
- Progress-record views exist for both per-user inspection and hierarchy-level performance inspection.
- Existing analytics endpoints are reused or extended rather than replaced.

## Detailed Tasks
- [ ] Formalize the four required parameters for each report type instead of leaving them ambiguous.
- [ ] Propose one consistent baseline matrix for:
  - training/program wise
  - category wise
  - lesson wise
  - user wise
- [ ] Validate whether the existing analytics APIs already cover some or all of that matrix.
- [ ] Add any missing dimensions needed for progress records, for example:
  - completion status/count
  - in-progress count
  - pass rate
  - average time spent
  - last activity
  - attempts to pass
- [ ] Add a dedicated progress-record section if the current analytics dashboard is too aggregate and not user-operational enough.
- [ ] Ensure admins can pivot from a user record to that user's program/category/lesson status detail.
- [ ] Ensure naming stays aligned with current repo concepts: "program" may be displayed as "training" in the UI if needed, but table/API names remain unchanged.

## Acceptance Criteria
- Each of the four report types has a defined and implemented parameter set.
- Admins can inspect both aggregate performance and individual learner progress.
- Existing analytics surfaces are extended coherently instead of duplicated.

## Verification Test Plan
- [ ] Validate the final parameter matrix against stakeholder approval before implementation.
- [ ] Verify training/program report returns the agreed metrics for each active program.
- [ ] Verify category report returns the agreed metrics for each category and can filter by program.
- [ ] Verify lesson report returns the agreed metrics for each lesson and can filter by category.
- [ ] Verify user report returns the agreed metrics per learner and supports search/filtering.
- [ ] Confirm an admin can drill from a user record to that user's detailed progress breakdown.
