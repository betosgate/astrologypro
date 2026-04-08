# Task: Booking Rescheduling & Cancellation Flows

- Status: Completed (2026-04-08, verified)
- Completion Notes: Reschedule/cancel handled by src/app/api/dashboard/bookings/[id]/{reschedule,cancel}/route.ts (with calendar sync side effects).

## Objective
Implement robust workflows for **Administrators, Diviners, and Clients** to reschedule or cancel appointments, ensuring all external calendars and notifications are synchronized.

## Requirements
- [ ] **Rescheduling Flow**:
    - Allow clients to pick a new date/time from the diviner's availability.
    - Validate that the new slot is still available.
    - Update `bookings.scheduled_at`.
    - **Multi-Calendar Sync**: Update/Move the event on BOTH **Google** and **Outlook** calendars (if connected).
- [ ] **Cancellation Flow**:
    - Allow users and administrators to cancel with a reason (stored in `bookings.cancellation_reason`).
    - Mark `bookings.status` as `canceled`.
    - **Multi-Calendar Sync**: Automatically delete/remove the event from BOTH **Google** and **Outlook** calendars.
    - Trigger "Cancellation Email" via `src/lib/email.ts`.
- [ ] **UI Action**:
    - Add "Reschedule" and "Cancel" buttons in BOTH the **Admin Dashboard** and **Diviner Dashboard**.
    - Include these same controls on the client confirmation page.
- [ ] **Email Notifications**:
    - Trigger "Reschedule Confirmation" email to both client and diviner.
    - Trigger "Cancellation Confirmation" email.
    - Ensure all emails contain the **Secure Management Links** for future changes.
- [ ] **Secure Identifiers**:
    - Implement a mechanism to generate and verify unique identifiers for booking management links (Reschedule/Cancel).

## Technical Details
- Use the `eventId` stored in `bookings.google_calendar_event_id` and the upcoming `outlook_calendar_event_id` to perform updates/deletions.
- Handle edge cases like "Rescheduling within 24 hours" if cancellation policies are added later.
