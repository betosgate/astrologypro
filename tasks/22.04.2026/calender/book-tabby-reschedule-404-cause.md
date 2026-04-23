# Cause Of 404 For `/book/tabby/reschedule/e1d4bb45-081c-4b33-8f6b-dcd493c06680`

## Reported Problem

The URL:

- `/book/tabby/reschedule/e1d4bb45-081c-4b33-8f6b-dcd493c06680`

was showing:

- `404`
- `Page not found`
- `The page you're looking for doesn't exist or has been moved.`

even though:

- `/book/tabby` was working correctly

That means `tabby` itself was already a valid public admin booking username.

## Actual Cause

The problem was in:

- `src/app/book/[username]/reschedule/[bookingId]/page.tsx`

That page was querying `admin_users` like this:

```ts
.select("user_id, username, display_name")
```

But `admin_users.display_name` does not appear to exist in the schema used by this project.

So the bug was **not** primarily that `tabby` was invalid.

The real issue was:

- the reschedule page selected a non-existent column from `admin_users`
- the admin lookup failed at that stage
- the page then fell through to `notFound()`
- which surfaced as the generic 404 page

## Why `/book/tabby` Still Worked

The main admin booking page:

- `src/app/book/[username]/page.tsx`

was using a different query:

```ts
.select("user_id, email, username")
```

That query only used valid fields, so:

- `/book/tabby` worked
- but `/book/tabby/reschedule/...` failed

## Why The 404 Was Misleading

The 404 page suggested:

- the route did not exist
- or the username/booking mapping was wrong

But the route file **did exist**, and the username `tabby` was valid.

The not-found result was being triggered by a bad database select inside the page loader, not by the URL pattern itself.

## Fix Applied

The page query was updated from:

```ts
.select("user_id, username, display_name")
```

to:

```ts
.select("user_id, username, email")
```

And the display label now uses:

- `username`
- fallback `email`
- fallback route `username`

instead of relying on `display_name`.

## Corrected Conclusion

The 404 for:

- `/book/tabby/reschedule/e1d4bb45-081c-4b33-8f6b-dcd493c06680`

was caused by a **bad column selection in the reschedule page**, not because `tabby` was an invalid username.

## Relevant Files

- `src/app/book/[username]/reschedule/[bookingId]/page.tsx`
- `src/app/book/[username]/page.tsx`

## Final Summary

The error happened because the reschedule page queried:

- `admin_users.display_name`

but that field was not available.

That caused the page lookup to fail and return `notFound()`, which showed the generic 404 screen.

After changing the query to use valid fields:

- `user_id`
- `username`
- `email`

the route can resolve properly for valid admin usernames like `tabby`.
