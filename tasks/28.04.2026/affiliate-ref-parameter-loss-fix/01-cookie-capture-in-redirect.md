# 01 Capture `aff_ref` Cookie in `/r/<code>` Redirect — 2026-04-28

- Depends on: None
- Blocks: 02, 03
- Spec: §3.8 step 1 ("read from the session / URL query param preserved through the checkout flow"), §5 Flow D step 4

## Problem

The redirect handler at [src/app/r/[code]/route.ts](src/app/r/[code]/route.ts)
already appends `?ref=<code>` to the destination URL on the 307 happy
path (line 222), but that ref is the *only* surviving attribution. The
moment the customer clicks a different link inside the site (a diviner
profile from a reading page, or any organic navigation), the URL
parameter is dropped and attribution is lost.

A first-party cookie set at the redirect step preserves attribution
across navigation for the spec-defined 30-day window.

## Code change

**File:** `src/app/r/[code]/route.ts`

The handler currently ends with:

```ts
return NextResponse.redirect(redirectUrl, 307);
```

at line 230. Replace the bare redirect with one that sets the cookie
on the **happy 307 path only** (the `isCampaignLink` branch where
`?ref=<code>` is also being appended). Do **not** set the cookie on:

- the `/link-not-active` 307 redirects (lines 44, 62, 75) — revoked /
  inactive / dead campaign,
- the home-redirect when no link is found (line 36),
- the legacy non-campaign destination path (line 161).

Sketch:

```ts
const response = NextResponse.redirect(redirectUrl, 307);

if (isCampaignLink) {
  response.cookies.set("aff_ref", code, {
    maxAge: 60 * 60 * 24 * 30, // 30 days — spec attribution window
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false, // BookingWizard (client) needs to read it
    path: "/",
  });
}

return response;
```

## Cookie spec

| Attribute | Value | Why |
|---|---|---|
| name | `aff_ref` | Short, namespaced, unlikely to collide. |
| value | `<code>` (the campaign code) | Same value the URL `?ref=` carries. |
| maxAge | 2 592 000 s (30 days) | Industry standard; matches spec attribution window. |
| sameSite | `lax` | Allow cross-site top-level navigation (clicking an affiliate link from email/social). Reject for embedded subrequests. |
| secure | `true` in production | HTTPS only off-localhost. |
| httpOnly | `false` | BookingWizard reads it via `document.cookie`. Acceptable: it's a non-sensitive attribution code, not a credential. |
| path | `/` | Available across the whole site. |

## When to NOT set the cookie

- Bot traffic (`clickData.is_bot`) — already short-circuits at line
  169; that path stays unchanged. Bots don't book, so the cookie would
  just be noise.
- 410 / revoked / inactive campaign — revoked attribution must not
  silently re-appear on a future booking. The redirect goes to
  `/link-not-active` and we do nothing else.

## When the cookie is overwritten

- Customer clicks a *different* `/r/<code>` link → the new code
  overwrites the old. Last-touch attribution. (Matches spec §3.8 — we
  use the most recent valid ref at booking time.)

## Acceptance

- [ ] Hitting `/r/<code>` for an active campaign returns 307 with both
      `?ref=<code>` in the URL and `Set-Cookie: aff_ref=<code>; ...`
      in the response.
- [ ] Cookie has `Max-Age=2592000`, `SameSite=Lax`, `Path=/`,
      `Secure` (in production), and is **not** `HttpOnly`.
- [ ] Hitting `/r/<code>` for a revoked / inactive / dead campaign
      redirects to `/link-not-active` with **no** `Set-Cookie: aff_ref`
      header.
- [ ] Hitting an unknown code redirects to `/` with no cookie set.
- [ ] Bot traffic increments the counter and redirects without setting
      the cookie.
- [ ] A second `/r/<other-code>` click from the same browser
      overwrites `aff_ref` with the new value.

## Suggested file

- `src/app/r/[code]/route.ts` (modify the final `NextResponse.redirect`
  on the happy path).
