# Task 04 - Community Booking QA

- Status: Proposed
- Priority: P1
- Owner: QA / Full Stack
- Area: Community booking end-to-end
- Created: 2026-05-18

## Objective

Verify that a Community member can start a reading booking from Community, pay
with the 5% discount, and see the new booking under My Readings without manual
email matching.

## QA Scenarios

1. Log in as an active Community member.
2. Click Community “Book a Reading” CTA.
3. Confirm URL carries:

```text
source=community
discount_token=<token>
```

4. Select service/diviner/date/time.
5. Confirm booking email is prefilled and locked to the auth email.
6. Complete payment setup.
7. Confirm Stripe amount reflects the 5% discount.
8. Visit:

```text
/community/sessions
```

9. Confirm the new reading appears in My Readings.
10. Click Join and verify the tokenized session URL.
11. Click Details and verify the right-side drawer opens.

## Negative QA

- Try to alter the email field in the browser.
- Try to submit a different email via request payload.
- Try Community source while signed out.
- Try Community source with a non-Community user.
- Confirm normal public booking still permits arbitrary email.

## Acceptance Criteria

- New Community-origin booking reliably appears in `/community/sessions`.
- Email ownership is enforced by backend, not just UI.
- Discount and post-booking visibility both work in the same flow.
- Public booking behavior remains separate and unchanged.

