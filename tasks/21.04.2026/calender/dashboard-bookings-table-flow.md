# Dashboard Bookings Table Flow

This note documents how the table in route `/dashboard/bookings` currently works: where the table data comes from, which API calls are used, and what each action button does.

## Main Route

- Page route: `src/app/dashboard/bookings/page.tsx`
- Main client table component: `src/components/dashboard/bookings-client.tsx`
- Details right drawer: `src/components/dashboard/booking-detail-sheet.tsx`

## How Table Data Loads

The bookings table in `/dashboard/bookings` does **not** use a dedicated API route for the table rows.

Instead, the page is a server component and loads data directly from Supabase inside:

- `src/app/dashboard/bookings/page.tsx`

### Server-side data loading sequence

1. Get authenticated user with `createClient().auth.getUser()`.
2. Resolve current diviner from `diviners` table using `user.id`.
3. Compute `ownerId = diviner.id || user.id`.
4. Read bookings directly from `bookings` table with:
   - full select first: `FULL_SELECT`
   - fallback to `SAFE_SELECT` if newer columns are missing
5. Read related `clients` separately.
6. Read related `services` separately.
7. Read related `service_templates` separately to determine whether `Open Service` should appear.
8. Read related `orders` separately for the linked-order block in the details sheet.
9. Read previous completed sessions per upcoming client.
10. Build `sessionLinksByBookingId` using `getSessionLinkForBooking(...)`.
11. Pass everything into `<BookingsClient />`.

### Direct DB queries used by the page

In `src/app/dashboard/bookings/page.tsx`:

- `bookings`
  - main table rows
- `clients`
  - client name/email/birth data
- `services`
  - service name and `template_id`
- `service_templates`
  - `slug` and `category` for toolkit mapping
- `orders`
  - linked order badge/info
- `bookings` again
  - previous completed sessions per client

## Table Rendering Logic

The UI table itself is rendered in:

- `src/components/dashboard/bookings-client.tsx`

### Local-only filters in the client component

These are client-side only, not server round-trips:

- `Upcoming / Past` toggle
- status filter pills
- search input
- local pagination

### Search checks these fields

- client full name
- client email
- service name
- `metadata.availability_title`
- booking status
- attendee names/emails from questionnaire responses
- `secondPersonName`
- `secondPersonEmail`
- formatted booking date/time text

## Live KPI API Used On This Page

The page also makes one client-side API call for KPI cards:

- `GET /api/dashboard/bookings/stats`
- file: `src/app/api/dashboard/bookings/stats/route.ts`

Used for:

- `sessionsThisWeek`
- `hoursThisWeek`
- `upcomingCount`
- `totalClients`
- `totalRevenue`

If this API fails, the component falls back to client-computed KPI values from the loaded bookings list.

## Action Buttons In The Table

In the table row actions (`src/components/dashboard/bookings-client.tsx`) there are two action patterns:

1. `Open Service`
2. `Details`

### 1. Open Service

Rendered only when `sessionLinksByBookingId[booking.id]` is not null.

Source of this value:

- built server-side in `src/app/dashboard/bookings/page.tsx`
- uses `getSessionLinkForBooking(...)`
- file: `src/lib/service-toolkit-mapping.ts`

What it does:

- opens the toolkit/service session route for that booking
- current output is usually `/admin/session/[bookingId]`
- hidden when the service template is not mapped

### 2. Details

Rendered using:

- `<BookingDetailSheet />`
- file: `src/components/dashboard/booking-detail-sheet.tsx`

What it does:

- opens a right-side slide-over sheet
- shows booking info, payment info, history, intake, notes, recording info, linked order info
- includes additional actions like reschedule, cancel, refund, save notes, send note, sync payment, sync recording

## APIs Used By The Details Drawer

These are the live fetches triggered from `BookingDetailSheet`.

### Auto-fetch when drawer opens

- `GET /api/bookings/[id]/session-details`
- file: `src/app/api/bookings/[id]/session-details/route.ts`

Used for:

- `recording_url`
- `recording_share_id`
- `actual_duration_minutes`
- `chime_meeting_id`
- `video_provider`
- `total_amount`
- `overage_amount`

### Recording segment load

- `GET /api/bookings/[id]/recording-segments`
- file: `src/app/api/bookings/[id]/recording-segments/route.ts`

Used by `RecordingSection` for:

- loading all segment URLs from S3
- playing multi-part recording via `SegmentVideoPlayer`

### Save session notes

- `PATCH /api/bookings/session-notes`
- file: `src/app/api/bookings/session-notes/route.ts`

Request body:

```json
{
  "bookingId": "booking-id",
  "sessionNotes": "text",
  "role": "diviner"
}
```

Used for:

- saving private diviner session notes

### Reschedule booking

- `POST /api/bookings/[id]/reschedule`
- file: `src/app/api/bookings/[id]/reschedule/route.ts`

Request body:

```json
{
  "scheduled_at": "ISO date string"
}
```

Used for:

- rescheduling pending/confirmed bookings

### Cancel booking

- `POST /api/bookings/[id]/cancel`
- file: `src/app/api/bookings/[id]/cancel/route.ts`

Request body:

```json
{
  "reason": "cancellation reason"
}
```

Used for:

- cancel booking action
- also used after refund when cancel flow does auto-refund first

### Refund booking

- `POST /api/stripe/refund`
- file: `src/app/api/stripe/refund/route.ts`

Request body:

```json
{
  "bookingId": "booking-id",
  "reason": "refund reason"
}
```

Used for:

- manual refund action
- automatic refund step inside cancel flow

### Sync payment status

- `POST /api/stripe/sync-booking`
- file: `src/app/api/stripe/sync-booking/route.ts`

Request body:

```json
{
  "booking_id": "booking-id"
}
```

Used for:

- checking Stripe payment intent
- updating booking from pending/unpaid to confirmed/paid if payment succeeded

### Send note to client

- `POST /api/bookings/[id]/send-note`
- file: `src/app/api/bookings/[id]/send-note/route.ts`

Request body:

```json
{
  "note": "message text"
}
```

Used for:

- emailing a note to the client and extra attendees

### Sync recording from S3

- `POST /api/admin/sync-recording`
- file: `src/app/api/admin/sync-recording/route.ts`

Request body:

```json
{
  "bookingId": "booking-id"
}
```

Used for:

- manually syncing a recording URL from S3 into the booking

## Drawer Actions Summary

Inside `BookingDetailSheet`, these actions are available depending on booking state:

- `Join Session`
  - navigates to `/${username}/session/${booking.id}`
- `Open Service`
  - uses `sessionLink`
- `Reschedule`
  - calls `/api/bookings/[id]/reschedule`
- `Cancel Booking`
  - calls refund first when needed, then `/api/bookings/[id]/cancel`
- `Issue Refund`
  - calls `/api/stripe/refund`
- `Save Notes`
  - calls `/api/bookings/session-notes`
- `Send to Client`
  - calls `/api/bookings/[id]/send-note`
- `Sync Payment Status`
  - calls `/api/stripe/sync-booking`
- `Sync Recording from S3`
  - calls `/api/admin/sync-recording`

## Important Implementation Notes

- The table rows are loaded server-side from Supabase directly, not through `/api/dashboard/bookings`.
- `/api/dashboard/bookings` exists, but it is mainly for dashboard calendar/manual-booking flows, not for this table.
- The `Open Service` button is controlled entirely by service-template mapping in `src/lib/service-toolkit-mapping.ts`.
- The `Details` drawer is the most action-heavy part of the page and is responsible for most booking mutations.
- The page intentionally fetches related `clients` and `services` separately to avoid join failures.

## Relevant Files

- `src/app/dashboard/bookings/page.tsx`
- `src/components/dashboard/bookings-client.tsx`
- `src/components/dashboard/booking-detail-sheet.tsx`
- `src/app/api/dashboard/bookings/stats/route.ts`
- `src/app/api/bookings/[id]/session-details/route.ts`
- `src/app/api/bookings/[id]/recording-segments/route.ts`
- `src/app/api/bookings/session-notes/route.ts`
- `src/app/api/bookings/[id]/reschedule/route.ts`
- `src/app/api/bookings/[id]/cancel/route.ts`
- `src/app/api/bookings/[id]/send-note/route.ts`
- `src/app/api/stripe/refund/route.ts`
- `src/app/api/stripe/sync-booking/route.ts`
- `src/app/api/admin/sync-recording/route.ts`
- `src/lib/service-toolkit-mapping.ts`
