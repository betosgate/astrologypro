# Task 01 - Community Dashboard My Readings Entry

- Status: Proposed
- Priority: P1
- Owner: Frontend
- Area: Community dashboard
- Created: 2026-05-18

## Objective

Add a clear entry point from the Community dashboard to the existing My Readings
experience on:

```text
/community/sessions
```

Community users should not need to remember the URL after booking.

## Recommended Work

- Add a visible “My Readings” or “View My Readings” CTA/card on the Community dashboard.
- If the Community bookings API is cheap enough to call there, show upcoming count.
- Link directly to `/community/sessions`.
- Keep the section compact and consistent with existing dashboard UI.

## Acceptance Criteria

- Logged-in Community user sees an obvious My Readings entry point.
- Entry point routes to `/community/sessions`.
- Empty state still encourages “Book a Reading”.
- No duplicate drawer or booking-list logic is added to the dashboard.
