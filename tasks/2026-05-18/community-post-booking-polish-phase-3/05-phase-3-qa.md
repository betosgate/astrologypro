# Task 05 - Phase 3 QA

- Status: Proposed
- Priority: P1
- Owner: QA / Full Stack
- Area: Community post-booking polish
- Created: 2026-05-18

## Objective

Verify the polished Community post-booking experience after Phase 3 changes.

## QA Scenarios

1. Log in as an active Community user.
2. Confirm Community dashboard has a My Readings entry point.
3. Open My Readings and confirm existing Phase 1 list still works.
4. Start a new booking from Community.
5. Confirm 5% discount messaging appears before checkout.
6. Confirm email remains locked from Phase 2.
7. Complete booking.
8. Confirm booking confirmation links back to `/community/sessions`.
9. Confirm the new reading appears in My Readings.
10. Confirm Details drawer still opens.
11. Confirm Join behavior matches the current configured rule.

## Regression Checks

- Public booking without Community source still allows arbitrary email.
- Public `/services` does not show misleading Community-only discount copy.
- Trainee appointments are not broken.
- Existing booking detail drawer remains shared.

## Acceptance Criteria

- Community users can discover, book, confirm, and revisit readings cleanly.
- Discount messaging is visible before payment and accurate at payment.
- Join access behavior is understood and consistent with the active QA/production setting.
