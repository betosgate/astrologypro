# 04 End-To-End QA Checklist - 2026-04-14

- Status: Planned
- Priority: P0
- Owner: QA / Full-stack
- Parent: `00-master-task.md`
- Task File: `tasks/14.04.2026/perennial-signup/04-end-to-end-qa-checklist.md`

## Goal

Verify the Perennial signup fix end to end and confirm the diviner services schema guard does not regress diviner onboarding.

## Preconditions

- Checkout success URL routing fix is deployed locally.
- Perennial login gate behavior is verified.
- `services(diviner_id, slug)` unique-index migration is applied or queued for the target environment.
- A brand-new Stripe checkout session is used.

## QA Steps

1. Restart the local dev server after code changes.
2. Start a new Perennial signup from `/get-started` or the intended Perennial entry point.
3. Create a new Stripe checkout session.
4. Complete payment.
5. Confirm Stripe returns to a Perennial success/community path, not `/onboarding`.
6. Log in as the new Perennial user.
7. Confirm incomplete profile state routes to `/community/onboarding`.
8. Complete Perennial profile onboarding.
9. Confirm completed user can enter `/community`.
10. Confirm no `services?on_conflict=diviner_id%2Cslug` request fires during the Perennial flow.
11. Run a diviner onboarding services save after the DB migration.
12. Confirm diviner onboarding services save succeeds without Postgres error `42P10`.

## Common Testing Pitfall

Do not reuse the old Stripe checkout URL. Stripe stores the success URL at session creation time, so an old session will still redirect to the old path even after the code is fixed.

## Acceptance Criteria

- [ ] Fresh Perennial checkout does not redirect to `/onboarding`.
- [ ] Perennial profile completion uses `/community/onboarding`.
- [ ] Perennial flow does not touch diviner `services`.
- [ ] Diviner onboarding still works after the schema migration.
- [ ] Test notes include the exact checkout entry point used and the final post-login URL.
