# Audit Current Service Session Contract

## Objective

Document the exact data and route contract for `/services` bookings before changing `/community/sessions`.

## Files To Inspect

- `src/app/portal/bookings/page.tsx`
- `src/app/booking/[uniqueId]/page.tsx`
- `src/components/booking/booking-manage-client.tsx`
- `src/app/[username]/session/[bookingId]/page.tsx`
- `src/app/session/[shareId]/recording/page.tsx`
- `src/app/api/cron/booking-reminders/route.ts`
- `src/app/api/bookings/[id]/ics/route.ts`
- `src/lib/booking-access.ts`

## Questions To Answer

- Which `bookings` columns are needed for a member session card?
- Which joins are needed for service name, service slug, diviner display name, diviner username, and recording state?
- Which fields indicate a session is upcoming vs past vs completed?
- Which fields are needed to build the client join URL?
- Which fields are needed to build the recording URL?
- Can logged-in community users be mapped to `clients.id` through `clients.user_id` consistently?
- Are there existing cases where a Perennial member may book as a guest without a matching `clients.user_id`?

## Expected Output

Add a short implementation note to this task file or a follow-up implementation PR summary that documents:

- chosen query shape for `bookings`
- client ownership rule
- join URL rule
- recording URL rule
- known edge cases

## Acceptance Criteria

- No code behavior changed by this task alone.
- The implementing developer knows exactly which data contract `/community/sessions` will use.
- Any unsafe assumption about guest bookings is explicitly called out before implementation.

