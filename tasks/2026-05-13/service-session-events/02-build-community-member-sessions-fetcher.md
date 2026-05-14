# Build Community Member Sessions Fetcher

## Objective

Create a focused server-side fetch path for the logged-in Perennial member's service bookings.

## Scope

Add a helper or local server function that fetches service sessions for the current authenticated user.

Recommended source:

- `bookings`
- `clients`
- `services`
- `diviners`

Do not use `calendar_events` for private booked service sessions.

## Suggested Data Shape

Return normalized items similar to:

```ts
type CommunityServiceSession = {
  id: string;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  serviceName: string;
  serviceSlug: string | null;
  divinerName: string;
  divinerUsername: string | null;
  bookingToken: string | null;
  recordingShareId: string | null;
  recordingUrl: string | null;
  canJoin: boolean;
  joinHref: string | null;
  manageHref: string | null;
  recordingHref: string | null;
  bookAgainHref: string | null;
};
```

## Access Rules

- Only return bookings belonging to the current authenticated user's linked `clients.id`.
- Do not return all household/family bookings in this phase unless there is an already verified ownership contract.
- Do not expose another user's `booking_token`.

## Join URL Rule

If the booking has a diviner username and booking token:

```txt
/{divinerUsername}/session/{bookingId}?token={bookingToken}
```

If the token is missing, prefer a logged-in route only if one already exists and is authorized. Otherwise hide the join action.

## Recording URL Rule

If booking status is `completed` and both `recording_share_id` and `recording_url` exist:

```txt
/session/{recordingShareId}/recording
```

## Acceptance Criteria

- Fetcher returns only sessions owned by the current logged-in community member.
- Query is server-side.
- Existing `/portal/bookings` behavior remains unchanged.
- Existing `/{username}/session/{bookingId}` behavior remains unchanged.
- Existing recording route remains unchanged.

