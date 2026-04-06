# Mystery School Module - Gap Closure Master Task

## Goal
Close the real behavioral gaps in the current Mystery School implementation without forcing schema renames purely for parity with the external requirement document.

## Important Working Rule
- Existing schema/table/column names are acceptable if they already perform the required business function.
- Do not create or rename schema only to match requirement naming.
- Only add schema changes when the current data model cannot support the required behavior.

## Current Repo Reality
- The app already has a working Mystery School member area under `/community`.
- The app already has:
  - Mystery School checkout
  - Foundation training pages
  - Decan grid
  - Ritual, scry, and journal submission basics
  - Admin content entry for foundation weeks and decan ritual steps
- The remaining work is mostly around lifecycle depth, timing rules, task-level completion, admin oversight, graduation rigor, and automation.

## Success Criteria
1. Seasonal enrollment and subscription handling are fully defined using the existing data model where possible.
2. Foundation Q1 behaves like a true task-driven course, not just a week-complete toggle.
3. Decan progression supports the intended active, grace, missed, retry, and graduation logic.
4. Student ritual, scrying, and mundane journaling flows enforce the required rules.
5. Admins can monitor and intervene where the requirements explicitly allow it.
6. Graduation and post-graduation unlocks are reliable and automated.
7. Tarot and email dependencies are integrated where the Mystery School flow requires them.

## Module Index
1. [01-enrollment-and-subscription-lifecycle.md](./01-enrollment-and-subscription-lifecycle.md)
2. [02-role-access-and-portal-guarding.md](./02-role-access-and-portal-guarding.md)
3. [03-foundation-q1-task-system.md](./03-foundation-q1-task-system.md)
4. [04-decan-curriculum-and-student-dashboard.md](./04-decan-curriculum-and-student-dashboard.md)
5. [05-ritual-praxis-runner.md](./05-ritual-praxis-runner.md)
6. [06-scrying-and-mundane-journals.md](./06-scrying-and-mundane-journals.md)
7. [07-decan-unlock-dates-grace-and-timeline.md](./07-decan-unlock-dates-grace-and-timeline.md)
8. [08-missed-decan-retry-and-admin-excuse.md](./08-missed-decan-retry-and-admin-excuse.md)
9. [09-graduation-and-post-graduation-unlocks.md](./09-graduation-and-post-graduation-unlocks.md)
10. [10-tarot-dependency-integration.md](./10-tarot-dependency-integration.md)
11. [11-email-automation-and-lifecycle-messaging.md](./11-email-automation-and-lifecycle-messaging.md)

## Recommended Execution Order
1. Enrollment and subscription lifecycle
2. Role/access enforcement cleanup
3. Foundation Q1 task system
4. Decan timing and status model
5. Ritual runner
6. Journals and validations
7. Missed/retry/admin excuse logic
8. Graduation and post-graduation unlocks
9. Tarot dependency wiring
10. Email automation pass

## Implementation Note For AI Workers
- Before changing schema, first inspect whether an existing table can safely absorb the requirement.
- Prefer extending `mystery_school_students`, `student_foundation_progress`, `student_decan_progress`, `scry_journals`, and `mundane_journals` instead of introducing duplicate concept tables.
- If a required behavior cannot be represented safely with the current structure, document that explicitly in the PR/task notes and then extend the schema minimally.
