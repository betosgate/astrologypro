# Task 02 - Community Booking Confirmation Copy

- Status: Proposed
- Priority: P1
- Owner: Frontend
- Area: Booking wizard confirmation
- Created: 2026-05-18

## Objective

For bookings started with:

```text
source=community
```

the confirmation screen should clearly tell the user that the booking is also
available later inside Community Sessions.

## Recommended Work

- Detect Community-origin booking in the booking wizard confirmation state.
- Add a Community-specific secondary CTA:

```text
View My Readings
```

- Link it to:

```text
/community/sessions
```

- Keep the existing Join and Add to Calendar actions.
- Do not show Community copy for normal public bookings.

## Acceptance Criteria

- Community-origin confirmation includes a link to `/community/sessions`.
- Public booking confirmation remains unchanged.
- Join link remains visible for current QA.
- Copy is short and action-oriented.
