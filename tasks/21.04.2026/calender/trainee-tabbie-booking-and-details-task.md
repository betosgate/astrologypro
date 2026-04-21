# Trainee Tabbie Booking And Details Task

This task note defines the required work for the `/trainee` route around post-training Tabbie appointment booking and booking visibility after a trainee has booked through the admin calendar flow.

## Goal

When a trainee finishes training and clicks the booking CTA from `/trainee`, they should be redirected to the admin calendar booking link in a way that:

- prepopulates the trainee email in the booking form
- does not allow the trainee to manually edit that email
- lets the trainee see their booked appointment details from the dashboard once a matching booking exists
- reuses the same booking details drawer behavior already used in `/dashboard/bookings`

## Scope

This task is for the trainee dashboard flow only.

It covers:

- booking redirect behavior from `/trainee`
- calendar prefill contract
- schedule lookup API for trainee dashboard
- a trainee-facing appointment details action
- reuse of `BookingDetailSheet` and its existing APIs where possible

It does not require changing the admin config editor behavior itself.

## Required Booking Redirect Behavior

From `/trainee`, when the user clicks the Tabbie booking button:

1. Redirect the trainee to the admin calendar booking link from the Tabbie config.
2. Pass the authenticated trainee email into the booking link as a prefilled value.
3. The email input on the booking page must already contain that trainee email.
4. The email input must not be editable manually by the trainee.

## Booking Link Requirements

The config currently provides:

- `bookingLink`
- `openMode`

The redirect logic should preserve:

- `same_tab`
  - open in the current tab
- `new_tab`
  - open in a new tab

In addition, the link construction now needs trainee identity context:

- authenticated trainee email
- any query parameter or route state required by the admin calendar booking page to prefill and lock the email field

## Booking Page Requirements

On the admin calendar booking page opened from the trainee dashboard:

- read the incoming trainee email from the redirect payload
- prefill the email input
- keep the email input read-only or disabled
- prevent manual edits through the UI
- ensure the final booking is still created with that same email

If the trainee is authenticated but no email is available:

- fail gracefully
- do not allow a blank or mismatched email booking flow

## Email Resolution Implementation Detail

The note above says:

- read the incoming trainee email from the redirect payload

That does **not** mean we should manually decode or parse the browser cookie value like:

- `sb-wyluvclvtvwptsvvtgkv-auth-token`

Even though that cookie contains a Supabase auth payload, the implementation should **not** manually base64-decode it inside app logic.

### What To Do Instead

Use the existing Supabase server auth helper in the route/page/component that builds the redirect or booking prefill state:

1. Read the authenticated user through `createClient()`.
2. Call `supabase.auth.getUser()`.
3. Resolve the email from the authenticated user object returned by Supabase.
4. Use that resolved email to build the redirect URL or booking prefill state.

### Why

- the cookie format is an implementation detail of Supabase auth
- manual parsing is brittle and can break if the cookie format changes
- the cookie can contain more data than we should trust directly
- `supabase.auth.getUser()` is the supported way already used across this codebase
- server-side auth resolution keeps the logic aligned with the app’s current auth pattern

### Expected Resolution Order

When resolving the trainee email for redirect and booking prefill, use:

1. `const supabase = await createClient()`
2. `const { data: { user } } = await supabase.auth.getUser()`
3. `const traineeEmail = user?.email?.trim() ?? null`

If `traineeEmail` is missing:

- stop the prefill flow
- show a safe error state
- do not continue with an editable blank email field

### Important Clarification

The cookie is only the transport for the session.

The implementation should treat Supabase auth as the source of truth, not the raw cookie string.

## Where The Admin Calendar Booking Code Lives

The trainee task needs to integrate with the admin calendar booking flow, and the relevant code is in the following route/component stack.

### Main Admin Calendar Booking Route

- route: `src/app/book/[username]/page.tsx`

What it does:

- resolves the admin user by username from `admin_users`
- loads the admin availability template defaults
- renders the admin-facing booking page
- mounts `AdminBookingWizard`

### Main Booking UI Component

- component: `src/app/book/[username]/admin-booking-wizard.tsx`

What it does:

- renders the admin calendar booking flow UI
- loads available dates
- loads available slots
- collects the booker’s `name`, `email`, and `note`
- submits the booking creation request

This is the main component where the trainee-prefilled email field should be:

- populated from the authenticated trainee context / redirect state
- locked from manual editing
- passed through booking submission unchanged

### Supporting Booking APIs For The Admin Calendar Route

- `src/app/api/book/[username]/month/route.ts`
  - returns available dates for the selected month
- `src/app/api/book/[username]/slots/route.ts`
  - returns available slots for the selected date
- `src/app/api/book/[username]/create/route.ts`
  - creates the booking after the user submits the form

### Existing Trainee Entry Point

- route: `src/app/trainee/page.tsx`
- component: `src/components/trainee/tabbie-appointment-section.tsx`
- config API: `src/app/api/dashboard/tabbie-appointment-config/route.ts`

What it currently does:

- loads the Tabbie appointment config for the trainee dashboard
- renders the trainee booking CTA
- opens the configured `bookingLink` in same-tab or new-tab mode

This is the entry point that should be upgraded so the redirect includes enough context for the admin booking page to prefill the trainee email.

## Dashboard Follow-up After Booking

Once the trainee has booked the appointment, the trainee dashboard should detect and show the related appointment record.

That requires a dashboard API that fetches the trainee booking schedule using the trainee email.

## New API Requirement

Create a trainee/dashboard-facing API that:

- runs for the authenticated dashboard user
- resolves the trainee user email
- fetches the related booking schedule from the database by matching client email
- returns the booking rows needed for the trainee dashboard UI

### Expected API Responsibility

The API should:

1. Authenticate the current dashboard user.
2. Resolve the user email from auth.
3. Query bookings by the matching client email.
4. Return the trainee’s relevant Tabbie/admin-calendar appointment records.
5. Include enough related booking data for a details action and status display.

### Suggested Response Shape

```json
{
  "ok": true,
  "data": [
    {
      "id": "booking-id",
      "status": "confirmed",
      "scheduled_at": "2026-04-21T11:16:03.717+00:00",
      "duration_minutes": 60,
      "client_id": "client-id",
      "diviner_id": "diviner-id",
      "service_id": "service-id"
    }
  ]
}
```

## Trainee Dashboard UI Requirement

If the trainee has a matching booked appointment and the calendar connection flow is done:

- show a button like `See Details`
- clicking it should open the same right-side details drawer pattern already used elsewhere

## Details Drawer Requirement

The trainee dashboard details action should work the same way as:

### 2. Details

Rendered using:

- `<BookingDetailSheet />`
- file: `src/components/dashboard/booking-detail-sheet.tsx`

What it does:

- opens a right-side slide-over sheet
- shows booking info, payment info, history, intake, notes, recording info, linked order info
- includes additional actions like reschedule, cancel, save notes, send note, sync payment, sync recording

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
  - calls `/api/bookings/[id]/cancel`
- `Save Notes`
  - calls `/api/bookings/session-notes`
- `Send to Client`
  - calls `/api/bookings/[id]/send-note`
- `Sync Payment Status`
  - calls `/api/stripe/sync-booking`
- `Sync Recording from S3`
  - calls `/api/admin/sync-recording`

## Important Implementation Notes

- The trainee dashboard should not rely on manual email entry for this booking flow.
- The booking email must come from the authenticated trainee account.
- The booking page must enforce the locked email field at the UI level.
- The schedule lookup API should fetch bookings by client email from the database.
- The trainee details view should reuse existing booking drawer behavior instead of creating a separate booking detail implementation.
- If permission checks block trainee access to shared booking APIs, those routes may need a safe trainee-aware access layer.
- Reuse existing service-link mapping logic where possible instead of duplicating it.

## Relevant Files

- `src/app/trainee/page.tsx`
- `src/components/trainee/tabbie-appointment-section.tsx`
- `src/app/book/[username]/page.tsx`
- `src/app/book/[username]/admin-booking-wizard.tsx`
- `src/app/api/book/[username]/month/route.ts`
- `src/app/api/book/[username]/slots/route.ts`
- `src/app/api/book/[username]/create/route.ts`
- `src/components/dashboard/booking-detail-sheet.tsx`
- `src/app/api/dashboard/tabbie-appointment-config/route.ts`
- `src/app/api/bookings/[id]/session-details/route.ts`
- `src/app/api/bookings/[id]/recording-segments/route.ts`
- `src/app/api/bookings/session-notes/route.ts`
- `src/app/api/bookings/[id]/reschedule/route.ts`
- `src/app/api/bookings/[id]/cancel/route.ts`
- `src/app/api/bookings/[id]/send-note/route.ts`
- `src/app/api/stripe/sync-booking/route.ts`
- `src/app/api/admin/sync-recording/route.ts`
- `src/lib/service-toolkit-mapping.ts`

## Suggested Implementation Order

1. Update the trainee redirect so the booking link carries the authenticated trainee email.
2. Update the admin calendar booking page to prefill and lock the email input.
3. Create the trainee dashboard schedule API that fetches bookings by client email.
4. Show the trainee appointment state on `/trainee`.
5. Add a `See Details` action that opens `BookingDetailSheet`.
6. Extend permissions only where needed so the drawer APIs work safely for trainees.
