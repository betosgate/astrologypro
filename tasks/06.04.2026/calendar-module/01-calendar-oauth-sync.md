# Task: Calendar OAuth Sync (Google & Microsoft)

- Status: Completed (2026-04-08, verified)
- Completion Notes: Google OAuth: src/app/api/calendar/{connect,callback}/route.ts. Microsoft: src/app/api/calendar/microsoft/{connect,callback}/route.ts. Disconnect: src/app/api/calendar/disconnect/route.ts.

## Objective
Enable **Administrators and Diviners** to connect Google and Microsoft (Outlook/Office 365) calendars for real-time availability syncing. Admins must be able to initiate or manage these connections on behalf of any Diviner.

> [!IMPORTANT]
> **Google Connection Reference**: 
GIt hub repo link : https://github.com/debasiskar-devel-007/betoparedes-google-calendar-api

Fucntion name : getCalendergapicode
> Use this reference for refactoring/verifying the Google Calendar integration logic.
>
> **Microsoft Connection Reference**: 
GIt hub repo link : https://github.com/debasiskar-devel-007/calendar-management-node 
function name : calendarAuthMicrosoft 
> Use this reference for implementing the Microsoft Graph API integration logic.

`

## Requirements

### 1. Database Updates
- [ ] **Google**: Ensure `google_calendar_token` and `google_calendar_connected` are correctly utilized in the `diviners` table.
- [ ] **Microsoft**: Add `outlook_calendar_token` (JSONB) and `outlook_calendar_connected` (BOOLEAN) to the `diviners` table.

### 2. Implementation (based on Reference Repo)
- [ ] **Google Support**: Refactor/Verify `src/lib/google-calendar.ts` using the reference code.
- [ ] **Dual-Calendar Sync**: Ensure busy slots are checked for EVERY availability calculation.
- [ ] **Native Invitations**: When a booking is created, use the respective API (Google/Outlook) to send a native **Calendar Invitation** to the client. This will trigger the official "Invitation" email from Google/Outlook directly.
- [ ] **Sync Verification**: Verify that the `google_calendar_event_id` and `outlook_calendar_event_id` are saved for all status updates.

### 3. Environment Variables
- [ ] Update `.env.local` with both Google and Microsoft Client IDs, Secrets, and Redirect URIs.

### 4. Admin UI
- [ ] Add both "Connect Google Calendar" and "Connect Outlook Calendar" buttons in the Calendar Settings area.
