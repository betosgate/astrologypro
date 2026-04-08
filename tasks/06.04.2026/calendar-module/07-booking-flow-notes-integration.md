# Task: Booking Flow - Notes Integration

- Status: Completed (2026-04-08, verified)
- Completion Notes: Booking notes column on bookings table; surfaced in booking-detail-sheet.tsx.

## Objective
Ensure that clients can leave specific notes or requests during the booking process, and that these notes are correctly stored and displayed to the diviner.

## Requirements
- [ ] **UI Component**: Add a "Notes/Special Requests" textarea to the last step of the public booking page.
- [ ] **Database Mapping**: Store these notes in the existing `bookings.session_notes` column (or a new `booking_notes` column if `session_notes` is reserved for post-session recap).
- [ ] **Admin View**: Update the booking detail view to prominently display the client's notes.
- [ ] **Notification**: Include the client notes in the "New Booking" notification email sent to the diviner.

## Technical Details
- Ensure character limits are enforced on the client side.
- Sanitize the input before saving to the database.
