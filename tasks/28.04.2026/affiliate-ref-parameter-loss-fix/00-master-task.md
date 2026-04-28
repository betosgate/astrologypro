# Master Task - Fix Affiliate Ref Parameter Loss in Booking URLs

- Status: Planned
- Priority: P0
- Area: Affiliate Commission / Booking Flow
- Page Routes: `/readings/*`, `/{username}`, `/{username}/book/*`

---

## Goal

Ensure the `ref` parameter from affiliate links is properly carried through the entire booking flow, from landing page to diviner profile to booking page, so that commission stamping logic can attribute bookings to affiliates.

## Why This Task Exists

Affiliate links use URLs like `/readings/saturn-return?ref=cmp_tVqyBtGF` to track referrals. When customers click these links and eventually book a reading, the system needs the `ref` parameter to:

1. Identify the affiliate campaign
2. Stamp the booking with commission rates at creation time
3. Credit the affiliate when payment is confirmed

Currently, the `ref` parameter is lost during the flow:
- Affiliate link → Reading landing page (has ref)
- Reading page → Diviner profile (loses ref)
- Diviner profile → Booking page (no ref)
- Booking creation → No stamping → No commission

This breaks the entire affiliate attribution system.

## Required Outcome

- Affiliate links result in bookings that include the `ref` parameter
- `resolveStampForBooking` receives valid ref codes
- Bookings are stamped with commission rates
- Webhooks correctly credit affiliates for successful payments
- No regression in non-affiliate booking flows

## Task Breakdown

1. `01-audit-ref-parameter-flow.md` - Map current ref parameter handling across the affiliate journey
2. `02-fix-reading-page-template-ref-propagation.md` - Modify ReadingPageTemplate to include ref in diviner links
3. `03-ensure-booking-wizard-sends-refcode.md` - Verify BookingWizard sends refCode to API
4. `04-test-affiliate-booking-end-to-end.md` - Manual QA of affiliate link → booking → commission flow
5. `05-regression-check-non-affiliate-bookings.md` - Ensure regular bookings still work