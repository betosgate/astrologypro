# Module 01 - Mystery School Enrollment and Subscription Lifecycle

## Objective
Upgrade the current Mystery School entry flow so it supports the full enrollment lifecycle using the existing schema where possible, especially `mystery_school_students` in place of `mystery_school_enrollments`.

## Current State In Repo
- Upgrade page exists at `/community/upgrade`.
- Stripe checkout exists in `/api/community/checkout`.
- Webhook provisioning creates/updates `community_members` and `mystery_school_students`.
- `mystery_school_students` is currently too thin to serve as the full enrollment source of truth.

## Required Outcome
- `mystery_school_students` must act as the enrollment record if no new enrollment table is introduced.
- Seasonal entry logic must be supported.
- Existing community member upgrades must be handled without double charge.
- Cancellation, pause, resume, and access state must be explicit and reliable.

## Detailed Tasks
- [ ] Audit current `mystery_school_students` fields and define the minimum additional fields needed for enrollment-source-of-truth behavior.
- [ ] Extend `mystery_school_students` to hold the missing enrollment lifecycle data instead of introducing `mystery_school_enrollments`.
- [ ] Add support for:
  - `entry_quarter`
  - `entry_year`
  - `enrollment_date`
  - `stripe_subscription_id`
  - `status`
  - `one_time_fee_paid`
  - pause/resume/cancel timing fields if needed
- [ ] Define and implement the quarter-entry calculation for:
  - spring equinox
  - summer solstice
  - autumn equinox
  - winter solstice
- [ ] Build a quarter-selection step that shows the next 4 upcoming entry options with actual dates.
- [ ] Replace the current one-button upgrade flow with a structured 4-step flow:
  - information
  - quarter selection
  - payment/changeover
  - confirmation
- [ ] Add copy that clearly explains:
  - what Mystery School is
  - 5-quarter commitment
  - pricing `$97 one-time + $27/month`
  - for existing PM members: net `+$17.03/month`
- [ ] Implement upgrade handling for existing `perennial_mandalism` members so PM is replaced by Mystery School without overlapping active billing.
- [ ] Verify Stripe checkout/session metadata carries enough data to finalize quarter assignment and enrollment state on webhook completion.
- [ ] Update webhook logic so enrollment state is written idempotently into `mystery_school_students`.
- [ ] Ensure Q1 unlock begins immediately after successful enrollment creation.
- [ ] Add confirmation page content showing:
  - start date
  - selected quarter
  - what to expect in week 1
- [ ] Implement cancellation behavior so access revokes at the end of the paid period, not immediately.
- [ ] Implement paused-subscription behavior so access and resume rules match business requirements.

## Technical Notes
- Do not add a separate enrollment table unless the current model cannot safely represent enrollment history or repeated re-enrollment.
- If `community_members.membership_type = mystery_school` remains the access gate, keep it, but make sure lifecycle fields in `mystery_school_students` are authoritative enough for reporting and automation.

## Acceptance Criteria
- A new user can enroll into Mystery School through a quarter-aware flow.
- A PM member can upgrade without double charge.
- Enrollment data is recoverable from `mystery_school_students`.
- Cancellation and pause/resume states behave predictably.
- The confirmation step reflects actual enrollment state, not static copy.
