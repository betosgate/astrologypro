# Task: Client "My Booking" Details Page

## Objective
Create a dedicated, premium details page where clients can view their booking information, join the session, or manage (reschedule/cancel) their appointment through the AstrologyPro interface.

## Requirements
- [ ] **Dynamic Route**: `src/app/booking/[uniqueId]/page.tsx`
- [ ] **Data Display**:
    - Service Name & Description.
    - Diviner Name & Avatar.
    - Scheduled Date & Time (in the client's local timezone).
    - Status (Confirmed, Rescheduled, Canceled).
    - Client Notes.
- [ ] **Management Actions**:
    - "Join Session" (prominent button if time is close).
    - "Reschedule" button (Redirects to booking flow).
    - "Cancel" button (with confirmation dialog).
- [ ] **Security**: 
    - This page must be accessible via a **unique secure identifier** (the `uniqueId` from the URL) without requiring a full login.
- [ ] **UI/UX**: 
    - Premium layout with glassmorphism or specialized cards.
    - Print/Export option for the booking details.

## Technical Details
- Use the `uniqueId` to lookup the booking in the database.
- Ensure the page is SEO-hidden (noindex).
