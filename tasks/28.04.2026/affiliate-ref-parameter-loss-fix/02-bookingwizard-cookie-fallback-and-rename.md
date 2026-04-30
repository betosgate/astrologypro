# 02 BookingWizard — Cookie Fallback + Rename `affiliateCode` → `refCode` — 2026-04-28

- Depends on: 01
- Blocks: 03
- Spec: §3.8 step 1

## Problem

Two bugs in [src/components/booking/booking-wizard.tsx](src/components/booking/booking-wizard.tsx)
prevent commission stamping even when a valid affiliate code is in
play:

1. **Field-name mismatch** (line 558, 584): the wizard reads
   `?ref=<code>` from the URL, stores it as `affiliateCode`, and POSTs
   the field as `affiliateCode`. The booking API
   [src/app/api/stripe/booking-payment/route.ts:79-103](src/app/api/stripe/booking-payment/route.ts#L79)
   destructures both `affiliateCode` and `refCode` from the body, but
   only `refCode` is fed into `sanitizeRefCode()` and passed to
   `resolveStampForBooking`. `affiliateCode` is silently ignored.
   → Even direct `/r/<code>` → booking flows fail to stamp.

2. **No cookie fallback**: if the URL has no `?ref=` (customer
   navigated organically, came back later, or hit any of the in-site
   links that drop the param), the wizard sends nothing — even when
   the `aff_ref` cookie set by Task 01 is sitting right there.

## Code change

**File:** `src/components/booking/booking-wizard.tsx`

Around line 557-558, replace:

```ts
const urlParams = new URLSearchParams(window.location.search);
const affiliateCode = urlParams.get("ref") || undefined;
```

with:

```ts
// Spec §3.8 step 1: read ref from URL first, fall back to the
// `aff_ref` cookie set at /r/<code>. URL wins when both exist
// (handles the case where a customer with an old cookie clicks a
// new affiliate link in the same session).
const urlParams = new URLSearchParams(window.location.search);
const refFromUrl = urlParams.get("ref") || undefined;
const refFromCookie = readCookie("aff_ref");
const refCode = refFromUrl ?? refFromCookie ?? undefined;
```

And in the POST body around line 584, rename:

```ts
affiliateCode,
```

to:

```ts
refCode,
```

### `readCookie` helper

Inline a tiny reader at the top of the file (or near the existing
helpers — match the file's existing style; do not add a new util
module for one function):

```ts
function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${encodeURIComponent(name)}=`));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : undefined;
}
```

## API side — verify, don't change

The API at
[src/app/api/stripe/booking-payment/route.ts:79](src/app/api/stripe/booking-payment/route.ts#L79)
already accepts `refCode` and feeds it through `sanitizeRefCode` →
`resolveStampForBooking`. **Do not** touch the API; the rename on the
client is sufficient. Removing the now-unused `affiliateCode`
destructure from the API body is allowed but optional — verify nothing
else POSTs that field name first (grep the repo).

## Precedence rules

| URL `?ref=` | Cookie `aff_ref` | Sent as `refCode` |
|---|---|---|
| `cmp_A` | (none) | `cmp_A` |
| `cmp_A` | `cmp_B` | `cmp_A` (URL wins — last-touch via fresh click) |
| (none) | `cmp_B` | `cmp_B` (cookie fallback) |
| (none) | (none) | `undefined` (no stamp; non-affiliate booking) |

## Acceptance

- [ ] With `?ref=cmp_X` in the URL: POST body includes
      `"refCode": "cmp_X"` and no `affiliateCode` field.
- [ ] With no `?ref=` but `aff_ref=cmp_Y` cookie present: POST body
      includes `"refCode": "cmp_Y"`.
- [ ] With both URL `?ref=cmp_X` AND `aff_ref=cmp_Y` cookie: POST
      body includes `"refCode": "cmp_X"`.
- [ ] With neither: POST body has no `refCode` field (or
      `refCode: undefined` — must not stamp).
- [ ] Booking succeeds in all four cases.
- [ ] Stamping (`bookings.source_assignment_id`,
      `rate_type_stamp`, `rate_value_stamp`) is non-NULL exactly when
      `refCode` was sent and the campaign is valid.

## Suggested files

- `src/components/booking/booking-wizard.tsx` (read cookie + rename
  field; add `readCookie` helper inline).
