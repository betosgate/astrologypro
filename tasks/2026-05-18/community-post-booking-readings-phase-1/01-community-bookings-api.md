# Task 01 - Community Bookings API

- Status: Proposed
- Priority: P1
- Owner: Backend
- Area: `src/app/api/community/bookings`
- Created: 2026-05-18

## Objective

Create a Community-safe API that returns the logged-in Community member's
reading bookings in a normalized shape suitable for `/community/sessions`.

## Route

```text
GET /api/community/bookings
```

## Requirements

- Require a logged-in Supabase user.
- Require a matching `community_members` row for that user.
- Read the authenticated user's email from Supabase auth.
- Match `clients.email` against the authenticated email.
- Return only `bookings` rows linked to those client IDs.
- Include service, diviner, booking token, schedule, duration, and status data.
- Do not trust client-provided email or user ID query params.

## Suggested Response Shape

```ts
{
  ok: true;
  email: string;
  matched_clients: number;
  data: Array<{
    id: string;
    source: "bookings";
    title: string;
    diviner_name: string;
    diviner_username: string | null;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
    join_href: string | null;
    reschedule_href: string | null;
  }>;
}
```

## Join Link Rule

If `bookings.booking_token` and `diviners.username` exist:

```text
/{divinerUsername}/session/{bookingId}?token={bookingToken}
```

If no token exists but username exists, return the non-token path only if the
current access rules support it:

```text
/{divinerUsername}/session/{bookingId}
```

Otherwise return `null`.

## Implementation Notes

- Use `createClient()` for auth.
- Use `createAdminClient()` for cross-table reads if RLS blocks the joined
  query.
- Prefer explicit selects over `*`.
- Sort newest/upcoming first in a stable way:
  - upcoming ascending by `scheduled_at`
  - past descending by `scheduled_at`
  - or return one list sorted descending and let UI split it.

## Acceptance Criteria

- Unauthenticated request returns `401`.
- Authenticated non-Community user returns `403` or a clear no-membership error.
- Community member only receives bookings tied to their own auth email.
- Response contains no unrelated client data.
- Response contains `join_href` for valid tokenized booking rows.

