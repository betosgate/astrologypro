# Cause Of 404 For `/book/tabby/reschedule/e1d4bb45-081c-4b33-8f6b-dcd493c06680`

## Reported URL

`/book/tabby/reschedule/e1d4bb45-081c-4b33-8f6b-dcd493c06680`

## Why It Shows 404

The URL returns:

- `Page not found`
- `The page you're looking for doesn't exist or has been moved.`

because the route only works when **all of these conditions are true**:

1. `/book/[username]/reschedule/[bookingId]` exists in the app.
2. The `[username]` segment must match an existing row in `admin_users.username`.
3. The `[bookingId]` must exist in `admin_bookings`.
4. That `admin_bookings.admin_user_id` must belong to the same `admin_users.user_id` resolved from `[username]`.

The page implementation is:

- `src/app/book/[username]/reschedule/[bookingId]/page.tsx`

That page does this:

1. looks up `admin_users` by `username`
2. if no matching admin user is found, it calls `notFound()`
3. then looks up the booking in `admin_bookings`
4. if no matching booking is found for that admin user, it also calls `notFound()`

So the page is not a generic public reschedule route for any booking id. It is a **username-scoped admin calendar reschedule route**.

## Exact Cause For This URL

The path uses:

- username: `tabby`
- booking id: `e1d4bb45-081c-4b33-8f6b-dcd493c06680`

This 404 happens if either:

- there is no `admin_users.username = "tabby"`
- or that booking id is not in `admin_bookings`
- or that booking exists, but it does **not** belong to the admin user whose username is `tabby`

## Important Route Distinction

There are **two different reschedule route families** in this codebase:

### Legacy booking reschedule

Used for rows in `bookings`:

- `src/app/[username]/reschedule/[bookingId]/page.tsx`
- URL shape: `/{username}/reschedule/{bookingId}`

Example:

- `/some-diviner/reschedule/<bookingId>`

### Admin calendar reschedule

Used for rows in `admin_bookings`:

- `src/app/book/[username]/reschedule/[bookingId]/page.tsx`
- URL shape: `/book/{adminUsername}/reschedule/{bookingId}`

Example:

- `/book/some-admin-username/reschedule/<bookingId>`

## Most Likely Problem In This Case

Most likely one of these is true:

1. `tabby` is not a valid `admin_users.username`
2. the booking id belongs to a legacy `bookings` row, not an `admin_bookings` row
3. the booking id is an `admin_bookings` row, but it belongs to a different admin username

## What The Correct URL Should Be

If the booking is a legacy `bookings` row:

- use `/{divinerUsername}/reschedule/{bookingId}`

If the booking is an `admin_bookings` row:

- use `/book/{adminUsername}/reschedule/{bookingId}`

but only with the **actual username tied to that booking owner**.

## Relevant Files

- `src/app/book/[username]/reschedule/[bookingId]/page.tsx`
- `src/app/[username]/reschedule/[bookingId]/page.tsx`
- `src/app/api/trainee/appointments/route.ts`

## Summary

The 404 is caused by a route/data mismatch, not by the generic not-found page itself.

The URL `/book/tabby/reschedule/e1d4bb45-081c-4b33-8f6b-dcd493c06680` only works if:

- `tabby` is a real admin booking username
- and that exact booking id exists in `admin_bookings`
- and that booking belongs to `tabby`

If any of those are false, the page intentionally returns `notFound()`.
