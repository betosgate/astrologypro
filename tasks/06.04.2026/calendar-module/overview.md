# Calendar Management Module - High-Level Technical Overview

## 🎯 Goal: Multi-Role Scheduling System
Implement a system where **Administrators and Diviners** can manage availability and bookings across both **Google and Outlook** calendars, supporting both **US and IST** timezones.

## 🛠️ What We are Going to Do

### Phase 1: Core OAuth & Logic (The Engine)
*   **Unified Sync Engine**: Refactor existing Google logic and implement Microsoft Graph API for 100% sync reliability.
*   **Timezone Core**: Standardize all calculations on UTC internally, with a "Wall-Clock" anchor for **IST** and **6 US Timezones** to handle DST shifts without shifting user appointments.

### Phase 2: Premium Admin Experience (The Dashboard)
*   **Availability Tool**: Build the custom availability builder (as per mockup) that handles specific date ranges and recurring weekly slots.
*   **Management Hub**: Integrated Admin Sidebar with "Copy-Link" utilities and a real-time booking overview.

### Phase 3: High-Conversion Booking (The Client Side)
*   **Public Booking Flow**: A "no-login" step-by-step wizard (Date → Time → Details → Confirm).
*   **Exhaustive Tracking**: Silently capture IP, Browser, and Referrer data to help diviners understand where their bookings are coming from.
*   **Self-Service Details**: A secure `astrologypro.com/booking/[uniqueId]` page where clients can manage their own sessions.

### Phase 4: Automation & Notification Loop
*   **Branded Triggers**: Transactional emails that look like "Google/Outlook" premium service mails.
*   **Dual-Trigger Loop**: Fire both an AstrologyPro branded email AND a native Calendar Invite for maximum visibility.
*   **Reminders & Sync**: Automated 24h/1h reminders and bidirectional webhooks (if a diviner moves an event in their phone app, it moves in our system).

## ✅ What Needs to be Achieved (Success Criteria)

1.  **Zero Overlaps**: Confirmed sessions must be checked against Google, Outlook, and our own DB in real-time.
2.  **Dashboard Integration**: The module must be fully integrated and visible in both the **Admin Dashboard** (for platform oversight) and the **Diviner Dashboard** (for personal schedule management).
3.  **No Login Friction**: Clients must be able to book, reschedule, and cancel using only the unique tokens sent to their email.
3.  **Global Reach (US + India)**: Seamless scheduling between diviners in India and clients in the US mainland/Alaska/Hawaii.
4.  **Premium Aesthetics**: All UI elements (Rich Text editor, custom date-pickers, gradient buttons) must feel high-end and professional.

## 👥 User Roles & Access

*   **Administrators (Platform Admin)**: 
    - **Full Management Parity**: Ability to create/edit availability, set hours, and connect calendars ON BEHALF of any Diviner.
    - Full visibility into all Diviners' bookings and performance.
    - Ability to override or cancel appointments from the admin dashboard.
    - Configuration of platform-wide scheduling rules and default templates.
*   **Diviners (Practitioners)**:
    - Self-management of personal availability and date overrides.
    - Connection of personal Google and Microsoft calendars for sync.
    - Easy access to "My Bookings" and shareable session links.

---

## 📂 Detailed Task Index

1.  **[01-calendar-oauth-sync.md](./01-calendar-oauth-sync.md)**: OAuth Integration & Native Invites.
2.  **[02-availability-management-ui.md](./02-availability-management-ui.md)**: Custom Form Builder per Mockup.
3.  **[03-booking-page-premium-ui.md](./03-booking-page-premium-ui.md)**: Client Booking Page & Tracking.
4.  **[04-timezone-dst-logic.md](./04-timezone-dst-logic.md)**: IST & 6 US Timezone standard.
5.  **[05-booking-rescheduling-cancellation.md](./05-booking-rescheduling-cancellation.md)**: Workflow Automation.
6.  **[06-shareable-booking-links.md](./06-shareable-booking-links.md)**: Admin Side Nav & Utilities.
7.  **[07-booking-flow-notes-integration.md](./07-booking-flow-notes-integration.md)**: Rich Client Metadata.
8.  **[08-email-template-enhancement.md](./08-email-template-enhancement.md)**: Transactional Brand Standards.
9.  **[09-reminders-webhook-sync.md](./09-reminders-webhook-sync.md)**: Reminders & Bidirectional Watchers.
10. **[10-client-booking-details-page.md](./10-client-booking-details-page.md)**: Secure Self-Service Hub.
