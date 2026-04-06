# Module 08 - Missed Decan, Retry Logic, and Admin Excuse Flow

## Objective
Implement the enforcement layer that turns decan timing into real progression rules.

## Current State In Repo
- The cron can mark decans as missed.
- There is no full retry-year model.
- There is no verified admin excuse flow with required reason.

## Required Outcome
- Incomplete decans become missed after grace.
- Missed decans block graduation until resolved.
- Retry can only happen in the correct future window.
- Admins can excuse edge cases with an audit reason.

## Detailed Tasks
- [ ] Decide whether retry and excuse state should live in `student_decan_progress` or an additional supporting status table.
- [ ] Add the missing fields needed for:
  - missed timestamp
  - retry window
  - retry year
  - attempt count
  - excused flag
  - excuse reason
  - admin override metadata
- [ ] Update cron logic so missed decans are not just flagged once, but remain part of the long-term progression model.
- [ ] Implement future-window reopening for missed decans.
- [ ] Prevent unresolved missed decans from being treated as graduation-safe.
- [ ] Build admin tooling to:
  - view missed decans
  - excuse a missed decan
  - require a reason
  - optionally override status with traceability
- [ ] Add user-facing messaging for retry state, including a future retry year/date.
- [ ] Add tests for:
  - missed after grace
  - retry reopen
  - excuse behavior
  - graduation blocking

## Acceptance Criteria
- Missed decans are enforceable business objects, not just a badge.
- Retry behavior is deterministic.
- Admin excuses are auditable and reasoned.
