# Master Task — Fix Affiliate Ref Loss via Attribution Cookie

- Status: Planned
- Priority: P0
- Area: Affiliate Commission v2 / Booking Flow
- Spec: `docs/specs/affiliate-commission-system.md` §3.8 step 1, §5 Flow D step 4

---

## Goal

Make sure the affiliate `ref` code captured at `/r/<code>` survives the
full customer journey to the booking API, so `resolveStampForBooking`
can stamp the booking and commission can be credited.

## Why this exists — three confirmed bugs

Audit of the live flow against the spec found three independent breaks
between the redirect handler and the stamp call:

| # | Where | Bug |
|---|---|---|
| 1 | `src/components/marketing/reading-page-template.tsx:391` | `DivinerCard` builds `/{username}/book/{slug}` with no `ref` appended → ref dies the moment the customer clicks a diviner card on a reading landing page. |
| 2 | `src/components/booking/booking-wizard.tsx:558,584` | Wizard reads `?ref=` from the URL but POSTs it as `affiliateCode`. The booking API only stamps when `refCode` is present. Field-name mismatch. |
| 3 | All non-`/r/<code>` entry points (organic, search, social repost, returning customer) | Even with bugs #1 and #2 fixed, *only* URL-threaded refs work. Anyone who lands deep, navigates around, or comes back later loses attribution entirely. |

Net effect today: every affiliate link that doesn't go straight from
`/r/<code>` to the booking page in one shot drops the ref. Commission
stamping never runs.

## Required outcome

- Ref captured at `/r/<code>` is honored at booking time, regardless of
  which pages the customer visits in between.
- `resolveStampForBooking` receives a valid `refCode` whenever the
  customer arrived through an active campaign within the attribution
  window (30 days).
- Bookings stamp; webhook credits affiliate.
- Non-affiliate bookings remain entirely unaffected.

## Approach — attribution cookie (not URL threading)

Spec §3.8 step 1 already permits this:

> `ref_code (read from the **session** / URL query param preserved
> through the checkout flow)`

The word *session* covers cookie persistence. We use it.

**Two surgical changes**, no fan-out across 22 page files:

1. **`/r/<code>` sets `aff_ref` cookie** on the 307 happy path. 30-day
   `Max-Age`, `SameSite=Lax`, `Secure` in production, `HttpOnly=false`
   so client JS can read it. NOT set on the 410 "link not active" path.
2. **`BookingWizard` reads `aff_ref` cookie as fallback** when the URL
   has no `?ref=`, AND renames the POST field from `affiliateCode` to
   `refCode` so the API actually stamps.

URL `?ref=` keeps working (set by the `/r/<code>` redirect at
[route.ts:222](src/app/r/[code]/route.ts#L222)). The cookie is the
durable backup that survives organic navigation.

### Why cookie over URL threading

- 2 file changes vs 22 (every reading page + every internal link).
- Future-proof: new navigation paths automatically inherit attribution.
- Industry standard for affiliate attribution (Amazon Associates,
  Impact, ShareASale all use cookies with similar TTLs).
- Spec wording explicitly contemplates session persistence.

## Task breakdown

1. `01-cookie-capture-in-redirect.md` — set `aff_ref` cookie at `/r/<code>` on 307 path.
2. `02-bookingwizard-cookie-fallback-and-rename.md` — wizard reads cookie as URL fallback and POSTs `refCode` (not `affiliateCode`).
3. `03-test-affiliate-booking-end-to-end.md` — manual QA across direct, deep-link, and organic-return scenarios.
4. `04-regression-non-affiliate.md` — confirm zero impact on non-affiliate bookings.

## Cookie-banner / consent prerequisite

`aff_ref` is a strictly-necessary attribution cookie tied to a
deliberate user click on an affiliate link. It is first-party,
non-tracking-across-sites, and required for the affiliate program to
function. Document it in the cookie disclosure if a banner exists; no
opt-in gate required for a first-party functional cookie under most
regulatory frameworks. Confirm with legal if the existing banner
implies otherwise before shipping.

## Out of scope

- Marketing Kit copy/UX overhaul (Phase 1.5 territory — see memory
  `project_affiliate_phase_1_5_general.md`).
- Campaign reporting changes.
- Any change to the stamp logic itself in
  `src/lib/affiliate/stamp-resolver.ts` — that already works once
  `refCode` reaches it.
