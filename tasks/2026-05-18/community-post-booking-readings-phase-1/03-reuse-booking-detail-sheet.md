# Task 03 - Reuse Booking Detail Sheet

- Status: Proposed
- Priority: P1
- Owner: Frontend / Full Stack
- Area: `BookingDetailSheet`
- Created: 2026-05-18

## Objective

Reuse the existing right-side booking details drawer for Community readings
instead of building a new details UI.

## Requirements

For each Community booking row, render `BookingDetailSheet` with client-safe
props.

Suggested props:

```tsx
<BookingDetailSheet
  booking={normalizedBooking}
  viewerRole="client"
  detailsOnly={true}
  joinHref={booking.join_href}
  rescheduleHref={booking.reschedule_href}
/>
```

## Existing Endpoint

The drawer should continue to use:

```text
/api/bookings/{id}/session-details
```

Do not create a new session details endpoint unless access QA proves the
existing helper does not support Community client access.

## Access Check

Verify `resolveBookingViewer` allows a logged-in Community member to access the
booking when:

- auth email matches `clients.email`
- booking is linked through `bookings.client_id`

## Actions Policy For Phase 1

Allowed:

- Join
- Details
- Recording/session detail display if available

Not allowed:

- Cancel
- Reschedule mutation
- Refund
- Payment sync
- Diviner/admin notes
- Dashboard-only service tools

## Acceptance Criteria

- Details drawer opens from `/community/sessions`.
- Drawer loads session details for owned bookings.
- Drawer does not expose host-only actions.
- Completed sessions can show recording/session metadata if available.
- Unauthorized booking IDs remain inaccessible through the details endpoint.

