# Task 02 - Booking Wizard Locked Community Email

- Status: Proposed
- Priority: P1
- Owner: Frontend / Full Stack
- Area: Public reading booking pages and `BookingWizard`
- Created: 2026-05-18

## Objective

When a booking starts from Community, resolve the authenticated user email and
lock the booking email field to that account email.

## Behavior

For Community-origin bookings:

```text
source=community
→ server resolves auth user
→ booking wizard receives locked email
→ email input is prefilled
→ email input is read-only/disabled
```

The UI should clearly explain:

```text
Locked to your Community account email.
```

## Requirements

- Do not read the locked email from query params.
- Resolve email from Supabase auth server-side where possible.
- If the user is not signed in, do not silently continue as Community:
  - redirect to login, or
  - show a clear sign-in-required state.
- Add a `lockedEmail` or equivalent prop to the booking wizard.
- If locked email exists:
  - initialize `bookingDetails.email` from locked email
  - ignore user edits
  - render disabled/read-only input
  - keep form validation compatible

## Acceptance Criteria

- Community-origin booking page shows email prefilled with auth email.
- Email field cannot be edited.
- Name/phone/notes and required intake fields remain editable.
- Public/non-Community booking page still allows arbitrary email entry.
- Hydration does not briefly overwrite the locked email with an empty value.

