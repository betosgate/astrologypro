# Mystery School Requirements Traceability Checklist

## Purpose
Map the original Mystery School requirement set to:
- existing repo coverage
- the new task files created under `tasks/06.04.2026/mystery-school/`
- any remaining note-worthy gaps in planning

## Working Rule
- Schema naming mismatch is acceptable if the existing schema performs the same business function.
- This checklist is about behavior coverage, not naming parity.

---

## 1. Mystery School access, enrollment, and subscription setup

### Requirement Coverage
- Seasonal enrollment lifecycle: covered by task file
  - [01-enrollment-and-subscription-lifecycle.md](./01-enrollment-and-subscription-lifecycle.md)
- `mystery_school_enrollments` equivalent behavior via `mystery_school_students`: covered by task file
  - [01-enrollment-and-subscription-lifecycle.md](./01-enrollment-and-subscription-lifecycle.md)
- Join flow from community back office or marketing page: covered by task file
  - [01-enrollment-and-subscription-lifecycle.md](./01-enrollment-and-subscription-lifecycle.md)
- Step 1 information page: covered by task file
  - [01-enrollment-and-subscription-lifecycle.md](./01-enrollment-and-subscription-lifecycle.md)
- Step 2 quarter selection with next 4 upcoming options: covered by task file
  - [01-enrollment-and-subscription-lifecycle.md](./01-enrollment-and-subscription-lifecycle.md)
- Step 3 payment flow:
  - existing community member changeover: covered by task file
  - new user `$97 + $27/month`: covered by task file
  - net `+$17.03/month` messaging: covered by task file
  - [01-enrollment-and-subscription-lifecycle.md](./01-enrollment-and-subscription-lifecycle.md)
- Step 4 confirmation page with start date and week 1 expectations: covered by task file
  - [01-enrollment-and-subscription-lifecycle.md](./01-enrollment-and-subscription-lifecycle.md)
- Q1 content unlock on enrollment: covered by task file
  - [01-enrollment-and-subscription-lifecycle.md](./01-enrollment-and-subscription-lifecycle.md)
- Stripe monthly subscription with dedicated pricing: already partially exists, remaining behavior covered by task file
  - [01-enrollment-and-subscription-lifecycle.md](./01-enrollment-and-subscription-lifecycle.md)
- One-time fee on first invoice: covered by task file
  - [01-enrollment-and-subscription-lifecycle.md](./01-enrollment-and-subscription-lifecycle.md)
- Community-to-Mystery-School changeover without double charge: covered by task file
  - [01-enrollment-and-subscription-lifecycle.md](./01-enrollment-and-subscription-lifecycle.md)
- Cancellation revoking access at end of billing period: covered by task file
  - [01-enrollment-and-subscription-lifecycle.md](./01-enrollment-and-subscription-lifecycle.md)
- Paused subscriptions keeping access and resuming later: covered by task file
  - [01-enrollment-and-subscription-lifecycle.md](./01-enrollment-and-subscription-lifecycle.md)

---

## 2. User role and access control dependency

### Requirement Coverage
- Mystery School role behavior without forcing a `user_roles` table: covered by task file
  - [02-role-access-and-portal-guarding.md](./02-role-access-and-portal-guarding.md)
- One user can hold multiple roles: covered by task file
  - [02-role-access-and-portal-guarding.md](./02-role-access-and-portal-guarding.md)
- Role assignment on signup/admin grant/plan upgrade: covered by task file
  - [02-role-access-and-portal-guarding.md](./02-role-access-and-portal-guarding.md)
- Role removal on cancellation/admin revoke: covered by task file
  - [02-role-access-and-portal-guarding.md](./02-role-access-and-portal-guarding.md)
- Route guards and layouts enforce role-based access: covered by task file
  - [02-role-access-and-portal-guarding.md](./02-role-access-and-portal-guarding.md)

---

## 3. Q1 foundation course requirements

### Requirement Coverage
- Foundation Q1 structured 12-week course: existing partial implementation + task coverage
  - [03-foundation-q1-task-system.md](./03-foundation-q1-task-system.md)
- `ms_foundation_weeks` equivalent via existing foundation week table: covered by task file
  - [03-foundation-q1-task-system.md](./03-foundation-q1-task-system.md)
- `student_foundation_progress` equivalent via existing progress table: covered by task file
  - [03-foundation-q1-task-system.md](./03-foundation-q1-task-system.md)
- Week includes title, description, task list, Beto audio: covered by task file
  - [03-foundation-q1-task-system.md](./03-foundation-q1-task-system.md)
- Checklist UI with all-tasks-complete rule: covered by task file
  - [03-foundation-q1-task-system.md](./03-foundation-q1-task-system.md)
- Week 1 unlocks immediately: covered by task file
  - [03-foundation-q1-task-system.md](./03-foundation-q1-task-system.md)
- Week N+1 unlocks only after Week N complete: covered by task file
  - [03-foundation-q1-task-system.md](./03-foundation-q1-task-system.md)
- Q1 student-paced, not time-locked: covered by task file
  - [03-foundation-q1-task-system.md](./03-foundation-q1-task-system.md)
- Completing Week 12 unlocks decans: covered by task file
  - [03-foundation-q1-task-system.md](./03-foundation-q1-task-system.md)
- Foundation overview page with statuses: covered by task file
  - [03-foundation-q1-task-system.md](./03-foundation-q1-task-system.md)
- Week detail page and progress indicator: covered by task file
  - [03-foundation-q1-task-system.md](./03-foundation-q1-task-system.md)
- Admin interface for week content/audio: existing partial implementation + task coverage
  - [03-foundation-q1-task-system.md](./03-foundation-q1-task-system.md)

---

## 4. Core decan curriculum requirements

### Requirement Coverage
- 36-decan curriculum after Q1: existing partial implementation + task coverage
  - [04-decan-curriculum-and-student-dashboard.md](./04-decan-curriculum-and-student-dashboard.md)
- `decans` equivalent via current `decans` table: covered by task file
  - [04-decan-curriculum-and-student-dashboard.md](./04-decan-curriculum-and-student-dashboard.md)
- `student_decan_progress` equivalent via current table: covered by task file
  - [04-decan-curriculum-and-student-dashboard.md](./04-decan-curriculum-and-student-dashboard.md)
- Calendar/date logic using current year and proper lifecycle fields: split across task files
  - [04-decan-curriculum-and-student-dashboard.md](./04-decan-curriculum-and-student-dashboard.md)
  - [07-decan-unlock-dates-grace-and-timeline.md](./07-decan-unlock-dates-grace-and-timeline.md)
- Yearly recalculation and UTC storage concern: covered by task file
  - [07-decan-unlock-dates-grace-and-timeline.md](./07-decan-unlock-dates-grace-and-timeline.md)
- Student dashboard:
  - 36 grid
  - statuses
  - active decan prominence
  - next 3 preview
  - completed/missed visual states
  - covered by task file
  - [04-decan-curriculum-and-student-dashboard.md](./04-decan-curriculum-and-student-dashboard.md)
- Admin requirements:
  - metadata entry
  - artwork
  - all students’ progress
  - status override with reason
  - covered by task files
  - [04-decan-curriculum-and-student-dashboard.md](./04-decan-curriculum-and-student-dashboard.md)
  - [08-missed-decan-retry-and-admin-excuse.md](./08-missed-decan-retry-and-admin-excuse.md)

---

## 5. Task 1 ritual praxis

### Requirement Coverage
- Locked pre-built decan rituals: covered by task file
  - [05-ritual-praxis-runner.md](./05-ritual-praxis-runner.md)
- Ritual step structure requirements: covered by task file
  - [05-ritual-praxis-runner.md](./05-ritual-praxis-runner.md)
- Student ritual UI:
  - one-step-at-a-time
  - focus mode
  - cannot skip
  - completion marks Task 1 done
  - repeat during active window
  - covered by task file
  - [05-ritual-praxis-runner.md](./05-ritual-praxis-runner.md)
- Admin ritual UI:
  - build all 36
  - preview mode
  - publish/unpublish
  - versioning
  - covered by task file
  - [05-ritual-praxis-runner.md](./05-ritual-praxis-runner.md)

---

## 6. Task 2 and Task 3 journaling and scrying

### Requirement Coverage
- Scrying journal requirements: covered by task file
  - [06-scrying-and-mundane-journals.md](./06-scrying-and-mundane-journals.md)
- Mundane journal three-section requirements: covered by task file
  - [06-scrying-and-mundane-journals.md](./06-scrying-and-mundane-journals.md)
- Minimum 50 characters per required section: covered by task file
  - [06-scrying-and-mundane-journals.md](./06-scrying-and-mundane-journals.md)
- Submission marks task progress: covered by task file
  - [06-scrying-and-mundane-journals.md](./06-scrying-and-mundane-journals.md)
- Student access to entries and read-only state after window closes: covered by task file
  - [06-scrying-and-mundane-journals.md](./06-scrying-and-mundane-journals.md)
- Admin can view all student journal submissions: covered by task file
  - [06-scrying-and-mundane-journals.md](./06-scrying-and-mundane-journals.md)
- Admin export PDF history: covered by task file
  - [06-scrying-and-mundane-journals.md](./06-scrying-and-mundane-journals.md)

---

## 7. Decan unlock timing, dates, and dashboard behavior

### Requirement Coverage
- Seasonal entry points: handled in enrollment and timing modules
  - [01-enrollment-and-subscription-lifecycle.md](./01-enrollment-and-subscription-lifecycle.md)
  - [07-decan-unlock-dates-grace-and-timeline.md](./07-decan-unlock-dates-grace-and-timeline.md)
- Q1 begins on enrollment date: covered by task file
  - [01-enrollment-and-subscription-lifecycle.md](./01-enrollment-and-subscription-lifecycle.md)
- Q2 begins after Q1 completion: covered by task file
  - [03-foundation-q1-task-system.md](./03-foundation-q1-task-system.md)
- Each decan lasts approximately 10 days by astronomical calendar: covered by task file
  - [07-decan-unlock-dates-grace-and-timeline.md](./07-decan-unlock-dates-grace-and-timeline.md)
- One-week sign-set preview unlock: covered by task file
  - [07-decan-unlock-dates-grace-and-timeline.md](./07-decan-unlock-dates-grace-and-timeline.md)
- Decan actionable only on start date: covered by task file
  - [07-decan-unlock-dates-grace-and-timeline.md](./07-decan-unlock-dates-grace-and-timeline.md)
- Grace period exactly two days: covered by task file
  - [07-decan-unlock-dates-grace-and-timeline.md](./07-decan-unlock-dates-grace-and-timeline.md)
- Date display requirements: covered by task file
  - [07-decan-unlock-dates-grace-and-timeline.md](./07-decan-unlock-dates-grace-and-timeline.md)
- Countdown and grace banner: covered by task file
  - [07-decan-unlock-dates-grace-and-timeline.md](./07-decan-unlock-dates-grace-and-timeline.md)
- Visual timeline and quick task access: split across task files
  - [04-decan-curriculum-and-student-dashboard.md](./04-decan-curriculum-and-student-dashboard.md)
  - [07-decan-unlock-dates-grace-and-timeline.md](./07-decan-unlock-dates-grace-and-timeline.md)

---

## 8. Missed decan enforcement and repeat-year rules

### Requirement Coverage
- Missed/incomplete lifecycle: covered by task file
  - [08-missed-decan-retry-and-admin-excuse.md](./08-missed-decan-retry-and-admin-excuse.md)
- Retry only in correct future year/window: covered by task file
  - [08-missed-decan-retry-and-admin-excuse.md](./08-missed-decan-retry-and-admin-excuse.md)
- Auto-reopen missed decans next year: covered by task file
  - [08-missed-decan-retry-and-admin-excuse.md](./08-missed-decan-retry-and-admin-excuse.md)
- Track attempts per student/decan: covered by task file
  - [08-missed-decan-retry-and-admin-excuse.md](./08-missed-decan-retry-and-admin-excuse.md)
- Graduation blocker rules: covered by task file
  - [08-missed-decan-retry-and-admin-excuse.md](./08-missed-decan-retry-and-admin-excuse.md)
  - [09-graduation-and-post-graduation-unlocks.md](./09-graduation-and-post-graduation-unlocks.md)
- Admin excuse with reason: covered by task file
  - [08-missed-decan-retry-and-admin-excuse.md](./08-missed-decan-retry-and-admin-excuse.md)
- Email lifecycle tied to missed/grace/open/reopen: covered by task file
  - [11-email-automation-and-lifecycle-messaging.md](./11-email-automation-and-lifecycle-messaging.md)

---

## 9. Graduation requirements and post-graduation state

### Requirement Coverage
- Automatic graduation once all requirements are met: covered by task file
  - [09-graduation-and-post-graduation-unlocks.md](./09-graduation-and-post-graduation-unlocks.md)
- Nightly cron check: covered by task file
  - [09-graduation-and-post-graduation-unlocks.md](./09-graduation-and-post-graduation-unlocks.md)
- Set graduation status and graduated timestamp: covered by task file
  - [09-graduation-and-post-graduation-unlocks.md](./09-graduation-and-post-graduation-unlocks.md)
- Unlock post-graduation builder: covered by task file
  - [09-graduation-and-post-graduation-unlocks.md](./09-graduation-and-post-graduation-unlocks.md)
- Graduation email: existing partial implementation + task coverage
  - [09-graduation-and-post-graduation-unlocks.md](./09-graduation-and-post-graduation-unlocks.md)
  - [11-email-automation-and-lifecycle-messaging.md](./11-email-automation-and-lifecycle-messaging.md)
- Graduation record with full completion summary: covered by task file
  - [09-graduation-and-post-graduation-unlocks.md](./09-graduation-and-post-graduation-unlocks.md)
- Badge in back office, admin notification, graduation page: covered by task file
  - [09-graduation-and-post-graduation-unlocks.md](./09-graduation-and-post-graduation-unlocks.md)

---

## 10. Post-graduation ritual builder access

### Requirement Coverage
- Locked state for non-graduates: covered by task file
  - [09-graduation-and-post-graduation-unlocks.md](./09-graduation-and-post-graduation-unlocks.md)
- Unlock triggered only by graduation state: covered by task file
  - [09-graduation-and-post-graduation-unlocks.md](./09-graduation-and-post-graduation-unlocks.md)
- Builder capabilities:
  - ritual type selection
  - component library
  - drag-and-drop ordering
  - guided preview
  - save with names and tags
  - personal ritual library
  - transit-based suggestions
  - admin review/publishing share
  - print/export PDF
  - covered by task file
  - [09-graduation-and-post-graduation-unlocks.md](./09-graduation-and-post-graduation-unlocks.md)

---

## 11. Tarot dependency that Mystery School needs

### Requirement Coverage
- 36 Minor Arcana pip card mapping to decans: covered by task file
  - [10-tarot-dependency-integration.md](./10-tarot-dependency-integration.md)
- Card detail pages show decan info: covered by task file
  - [10-tarot-dependency-integration.md](./10-tarot-dependency-integration.md)
- Admin can manage mappings: covered by task file
  - [10-tarot-dependency-integration.md](./10-tarot-dependency-integration.md)
- Student can open the associated card for scrying: covered by task file
  - [10-tarot-dependency-integration.md](./10-tarot-dependency-integration.md)
  - [06-scrying-and-mundane-journals.md](./06-scrying-and-mundane-journals.md)

---

## 12. Email automation dependency for Mystery School

### Requirement Coverage
- Enrollment confirmation email: covered by task file
  - [11-email-automation-and-lifecycle-messaging.md](./11-email-automation-and-lifecycle-messaging.md)
- Decan lifecycle emails:
  - open
  - 3-day reminder
  - grace start
  - 1-day urgent reminder
  - missed
  - reopen next year
  - covered by task file
  - [11-email-automation-and-lifecycle-messaging.md](./11-email-automation-and-lifecycle-messaging.md)
- Post-graduation sequence for consultation booking: covered by task file
  - [11-email-automation-and-lifecycle-messaging.md](./11-email-automation-and-lifecycle-messaging.md)
- Stop reminder sequence once consultation is booked: covered by task file
  - [11-email-automation-and-lifecycle-messaging.md](./11-email-automation-and-lifecycle-messaging.md)
- Branded templates, unsubscribe links, preference center: covered by task file
  - [11-email-automation-and-lifecycle-messaging.md](./11-email-automation-and-lifecycle-messaging.md)

---

## 13. Full Mystery School journey in order

### Requirement Coverage
- Enrollment through seasonal onboarding/payment: covered by task file
  - [01-enrollment-and-subscription-lifecycle.md](./01-enrollment-and-subscription-lifecycle.md)
- Q1 unlocks immediately: covered by task files
  - [01-enrollment-and-subscription-lifecycle.md](./01-enrollment-and-subscription-lifecycle.md)
  - [03-foundation-q1-task-system.md](./03-foundation-q1-task-system.md)
- Student completes Q1 in order: covered by task file
  - [03-foundation-q1-task-system.md](./03-foundation-q1-task-system.md)
- Q2-Q5 decan curriculum unlocks: covered by task files
  - [03-foundation-q1-task-system.md](./03-foundation-q1-task-system.md)
  - [04-decan-curriculum-and-student-dashboard.md](./04-decan-curriculum-and-student-dashboard.md)
- Each decan has 3 tasks: covered by task files
  - [05-ritual-praxis-runner.md](./05-ritual-praxis-runner.md)
  - [06-scrying-and-mundane-journals.md](./06-scrying-and-mundane-journals.md)
- Time-bound active/grace phases: covered by task files
  - [07-decan-unlock-dates-grace-and-timeline.md](./07-decan-unlock-dates-grace-and-timeline.md)
  - [08-missed-decan-retry-and-admin-excuse.md](./08-missed-decan-retry-and-admin-excuse.md)
- Incomplete decans become missed and retry next year: covered by task file
  - [08-missed-decan-retry-and-admin-excuse.md](./08-missed-decan-retry-and-admin-excuse.md)
- Graduation blocked until requirements are resolved: covered by task files
  - [08-missed-decan-retry-and-admin-excuse.md](./08-missed-decan-retry-and-admin-excuse.md)
  - [09-graduation-and-post-graduation-unlocks.md](./09-graduation-and-post-graduation-unlocks.md)
- Auto-graduation to Priest/Priestess and unlock of full custom ritual builder: covered by task file
  - [09-graduation-and-post-graduation-unlocks.md](./09-graduation-and-post-graduation-unlocks.md)

---

## 14. Easy-to-miss requirements

### Requirement Coverage
- Q1 student-paced: covered by task file
  - [03-foundation-q1-task-system.md](./03-foundation-q1-task-system.md)
- Decan preview unlock one week early and read-only: covered by task file
  - [07-decan-unlock-dates-grace-and-timeline.md](./07-decan-unlock-dates-grace-and-timeline.md)
- Grace period exactly 2 days: covered by task file
  - [07-decan-unlock-dates-grace-and-timeline.md](./07-decan-unlock-dates-grace-and-timeline.md)
- Rituals pre-authored and cannot be skipped: covered by task file
  - [05-ritual-praxis-runner.md](./05-ritual-praxis-runner.md)
- Scrying requires at least one submission: covered by task file
  - [06-scrying-and-mundane-journals.md](./06-scrying-and-mundane-journals.md)
- Mundane journal requires 3 sections with minimum length: covered by task file
  - [06-scrying-and-mundane-journals.md](./06-scrying-and-mundane-journals.md)
- Admin can excuse missed decans with reason: covered by task file
  - [08-missed-decan-retry-and-admin-excuse.md](./08-missed-decan-retry-and-admin-excuse.md)
- Graduation automated nightly: covered by task file
  - [09-graduation-and-post-graduation-unlocks.md](./09-graduation-and-post-graduation-unlocks.md)
- Post-graduation builder remains locked until proper graduation state: covered by task file
  - [09-graduation-and-post-graduation-unlocks.md](./09-graduation-and-post-graduation-unlocks.md)

---

## Final Verification Summary

### Existing implementation already covers part of the requirement set
- Basic Mystery School area
- Basic checkout
- Basic foundation UI
- Basic decan UI
- Basic ritual/scry/journal submission
- Basic graduation email

### New task pack now covers the remaining requirement gaps
- Yes, at the planning/task-definition level

### Remaining planning gaps
- None identified at the module-planning level after this traceability pass.
- Any remaining gaps from here should be implementation-level discoveries, not missing task coverage.
