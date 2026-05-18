# Task 04 - Confirmation Link Consistency And QA

- Status: Proposed
- Priority: P1
- Owner: QA / Full Stack
- Area: Community bookings flow
- Created: 2026-05-18

## Objective

Verify that the booking confirmation experience, email link, Community “My
Readings” list, and session page all point to the same usable session access
path.

## Link Contract

For reading bookings with a booking token:

```text
/{divinerUsername}/session/{bookingId}?token={bookingToken}
```

This link should be used consistently in:

- Booking confirmation screen
- Booking confirmation/access emails
- `/api/community/bookings` response
- `/community/sessions` Join button

## QA Scenarios

1. Active Community member books a paid reading.
2. Active Community member books a free reading, if available.
3. Community member returns to `/community/sessions`.
4. Upcoming reading shows Join and Details.
5. Details drawer opens and loads session details.
6. Completed reading appears in Past.
7. Non-owner Community user cannot see or open another user's booking.
8. Expired or missing token does not create a broken primary Join action.

## Regression Checks

- Existing public booking confirmation still works.
- Existing diviner dashboard bookings still work.
- Existing trainee appointment drawer remains unaffected.
- Existing `/api/bookings/{id}/session-details` access rules still protect
  unrelated bookings.

## Acceptance Criteria

- QA confirms consistent join URL across all visible post-booking surfaces.
- No raw booking token is exposed outside intended session links.
- No Community UI route leaks another client's booking data.
- Phase 1 ships without cancel/reschedule mutations.

