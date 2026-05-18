# Task 03 - Backend Auth Email Enforcement

- Status: Proposed
- Priority: P1
- Owner: Backend
- Area: `src/app/api/stripe/booking-payment/route.ts`
- Created: 2026-05-18

## Objective

Enforce Community ownership on the server. The frontend locked email is a UX
aid, but the backend must be the source of truth.

## Required Request Signal

Booking payment request should include a Community source marker, for example:

```json
{
  "source": "community"
}
```

or equivalent metadata if the existing request contract uses another field.

## Requirements

When source is Community:

- Require authenticated Supabase user.
- Require matching `community_members` row.
- Read email from `supabase.auth.getUser()`.
- Force `clientEmail` to the authenticated email server-side.
- Ignore or reject a different client-submitted email.
- Keep discount token validation intact.
- Persist enough metadata to inspect Community-origin bookings later.

Suggested metadata:

```ts
metadata: {
  booking_source: "community",
  community_member_user_id: user.id
}
```

## Important Boundary

Do not apply this rule to normal public bookings. Public service booking should
still support arbitrary guest email later.

## Acceptance Criteria

- Community-origin request without auth fails.
- Community-origin request without Community membership fails.
- Community-origin request with mismatched submitted email still creates/uses
  the auth email, or fails with a clear mismatch error.
- Created booking links to a `clients.email` matching the Community auth email.
- `/api/community/bookings` can find the booking immediately after payment setup.
- Public booking request behavior remains unchanged.

