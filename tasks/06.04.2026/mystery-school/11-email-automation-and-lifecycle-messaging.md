# Module 11 - Email Automation and Lifecycle Messaging

- Status: Completed (2026-04-08, verified)
- Completion Notes: Enrollment + graduation emails fire from stripe webhook + graduation.ts; missed-decan emails fire from src/app/api/cron/decan-unlock.

## Objective
Fill in the missing Mystery School email automation around enrollment, decan lifecycle, missed-state handling, and post-graduation follow-up.

## Current State In Repo
- Graduation email exists.
- General community billing reminders exist.
- Mystery School-specific lifecycle messaging is incomplete.

## Required Outcome
- Students receive the critical emails needed for enrollment, progress, urgency, and graduation follow-through.
- Transactional vs non-transactional behavior is handled appropriately.

## Detailed Tasks
- [ ] Add Mystery School enrollment confirmation email.
- [ ] Add decan lifecycle emails for:
  - decan opens
  - 3 days before normal close
  - grace period starts
  - 1 day before grace ends
  - decan missed
  - missed decan reopens next year
- [ ] Decide which of these are transactional and which must honor preference/unsubscribe rules.
- [ ] Map every Mystery School email into one of these buckets:
  - transactional
  - operational but non-transactional
  - post-graduation nurture/reminder
- [ ] Make sure non-transactional Mystery School messages integrate with the app's unsubscribe and email-preference behavior instead of bypassing it.
- [ ] Build the trigger points in cron/services so these emails fire once and idempotently.
- [ ] Add post-graduation consultation reminder sequence:
  - day 0
  - day 3
  - day 7
  - weekly until booked
- [ ] Define the stop condition for “consultation booked”.
- [ ] Add branded email copy/templates consistent with current email rendering helpers.
- [ ] Ensure templates are visually aligned with the branded email system already used elsewhere in the app.
- [ ] Verify links in these emails point to the correct current app routes and billing/profile destinations.
- [ ] Add logging/traceability for lifecycle email sends.

## Acceptance Criteria
- Every major Mystery School lifecycle transition has an email trigger.
- Duplicate sends are prevented.
- Post-graduation reminder flow stops when the target action is completed.
- Non-transactional emails respect preference-center and unsubscribe requirements.
