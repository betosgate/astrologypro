# Task: Premium Public Booking Page

## Objective
Create a stunning, shareable booking page for each diviner where clients can select a service and book a time slot based on real-time availability.

## Requirements
- [ ] **Dynamic Route**: `src/app/[username]/book/[serviceSlug]/page.tsx`
- [ ] **Real-time Availability Calculation**:
    - Combine `availability_slots`, `availability_overrides`, and existing `bookings`.
    - **Dual-Calendar Sync**: Fetch busy slots from BOTH connected **Google** and **Outlook** calendars simultaneously to calculate true availability.
    - **Event Creation**: Automatically create the confirmed booking event on BOTH **Google** and **Outlook** calendars.
- [ ] **Rescheduling Flow**:
    - Allow clients to pick a new date/time from the diviner's availability.
    - Validate that the new slot is still available.
    - Update `bookings.scheduled_at`.
    - **Multi-Calendar Update**: Update/Move the event on BOTH **Google** and **Outlook** (whichever are connected).
- [ ] **Data Persistence**: 
    - Save all possible client data during booking: IP address, User Agent, Referrer URL, and Browser Language.
    - Store these in a new `metadata` JSONB column in the `bookings` table.
- [ ] **Email Notifications**:
    - Trigger a "Booking Confirmed" email immediately.
    - **Secure Management Links**: Include unique "Reschedule" and "Cancel" links in the email that use a secure identifier (e.g., a signed token or unique slug) to allow client access without a full login.
- [ ] **Cancellation Flow**:
    - Allow users to cancel with a reason (stored in `bookings.cancellation_reason`).
    - Mark `bookings.status` as `canceled`.
    - **Multi-Calendar Sync**: Delete/Remove the event from BOTH **Google** and **Outlook** calendars.
    - Trigger "Cancellation Email" via `src/lib/email.ts`.
- [ ] **Aesthetics**:
    - Glassmorphism effects.
    - Vibrant, brand-aligned colors (Deep Blue/Purple).
    - Subtle micro-animations on hover and transition.

## Technical Details
- Use `date-fns-tz` for accurate timezone conversions.
- Ensure "US Daylight Saving" logic is correctly handled during slot generation.
- Implement a "Loading" skeleton state for a premium feel.
