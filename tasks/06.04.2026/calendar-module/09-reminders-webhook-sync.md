# Task: Booking Reminders & Webhook Sync

## Objective
Implement automated reminders and bidirectional sync (webhooks) to ensure the AstrologyPro calendar is always up to date and clients don't miss their sessions.

## Requirements
- [ ] **Automated Reminders**:
    - Trigger an email **24 hours** and **1 hour** before the session.
    - Check if the booking is still `confirmed` before sending.
- [ ] **Bidirectional Sync (Webhooks)**:
    - **Google**: Set up a watch request to listen for changes on the Diviner's calendar.
    - **Outlook**: Set up a Microsoft Graph subscription for calendar changes.
    - **Logic**: If an event is deleted/moved in the external calendar, update the corresponding `booking` in AstrologyPro.
- [ ] **UI Task**: Added a "Sync Status" indicator in the admin dashboard to show the last successful sync time.

## Technical Details
- Use a Cron job (or Supabase Edge Function) for reminders.
- Use a public-facing `/api/webhooks/calendar` endpoint to receive updates.
- Ensure proper validation of webhook signatures for security.
