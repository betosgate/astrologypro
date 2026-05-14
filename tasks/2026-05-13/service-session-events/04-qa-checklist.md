# Day 1 QA Checklist

## Manual Checks

- Log in as an active Perennial Mandalism member with no bookings.
  - `/community/sessions` shows a professional empty state.
  - `/community/events` still works.

- Log in as a member with an upcoming confirmed booking.
  - `/community/sessions` shows that booking under upcoming sessions.
  - Join link points to the existing session route.
  - Manage link points to `/booking/{bookingToken}` when available.

- Log in as a member with a completed recording.
  - `/community/sessions` shows the completed session.
  - Watch action points to `/session/{recordingShareId}/recording`.

- Confirm unrelated member sessions do not appear.

## Technical Checks

- Run lint on touched files.
- Confirm no changes were made to payment confirmation logic.
- Confirm no changes were made to Chime session room logic.
- Confirm no changes were made to booking reminder cron logic.

## Known Risks To Watch

- Guest bookings may not map cleanly to `clients.user_id`.
- Some completed sessions may not have recordings yet.
- Some services may lack slugs, preventing Book Again links.
- Some bookings may lack `booking_token`, preventing token manage links.

