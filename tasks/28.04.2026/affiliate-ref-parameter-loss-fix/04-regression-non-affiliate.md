# 04 Regression — Non-Affiliate Bookings — 2026-04-28

- Depends on: 01, 02
- Spec: §3.8 step 1

## Problem

The cookie-capture change touches the `/r/<code>` redirect handler and
the BookingWizard payload. Both are in the path of every booking,
including ones that have nothing to do with affiliates. We need to
prove zero behavioral drift for non-affiliate bookings.

## Test cases

### Direct-flow bookings (never touched `/r/<code>`)

1. **Fresh browser, no cookie, no URL ref**
   - Open incognito → navigate directly to `/<username>/book/<slug>`.
   - Confirm `aff_ref` cookie is absent in DevTools.
   - Complete payment.
   - Booking row: `source_assignment_id`, `rate_type_stamp`,
     `rate_value_stamp` all NULL.

2. **Junk URL ref**
   - Visit `/<username>/book/<slug>?ref=not_a_real_code`.
   - Wizard sends `refCode: "not_a_real_code"`.
   - API stamp resolver should log `affiliate_stamp_skipped` with a
     reason like `no_campaign` and write the booking with NULL stamp
     fields. Booking still succeeds.

3. **Reading-page → diviner → book without ever hitting `/r/`**
   - Visit `/readings/<slug>` directly (no ref, no cookie).
   - Click through to a diviner profile, then service, then book.
   - Cookie remains absent throughout. Stamp NULL.

### Cookie hygiene

4. **Cookie absent for non-affiliate visitors**
   - Confirm no code path sets `aff_ref` outside of the `/r/<code>`
     happy path. Search: `aff_ref` should only appear in
     `src/app/r/[code]/route.ts` and `src/components/booking/booking-wizard.tsx`.

5. **Stale cookie does not silently re-attribute non-affiliate flows
   *that arrived via fresh URL ref*** — covered by Task 03 Scenario E
   (URL beats cookie). Mention here so reviewers don't double-test.

## Performance & log checks

- Network tab: booking POST payload size unchanged for non-affiliate
  flows (cookie read is local; no extra request).
- No new error logs, console warnings, or 4xx/5xx responses in the
  booking flow.
- API server logs: `affiliate_stamp_skipped` only ever fires with
  reason codes the resolver already emits (`missing_ref_code`,
  `no_campaign`, `revoked_assignment`, etc.) — no new reason codes
  introduced.

## Pass criteria

- ✅ All four direct-flow scenarios book successfully.
- ✅ All four leave `source_assignment_id`/`rate_type_stamp`/
      `rate_value_stamp` NULL.
- ✅ No `aff_ref` cookie set outside the `/r/<code>` happy path.
- ✅ No console errors, no new server-log noise.
- ✅ Page load times for `/readings/*`, `/<username>`, and the booking
      page are unchanged (within normal variance).
