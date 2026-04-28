# 05 Regression Check Non-Affiliate Bookings - 2026-04-28

- Depends on: `04-test-affiliate-booking-end-to-end.md`
- Task File: `tasks/28.04.2026/affiliate-ref-parameter-loss-fix/05-regression-check-non-affiliate-bookings.md`

## Problem

Changes to ref parameter handling must not break regular bookings that don't involve affiliates.

## Test Cases

### Direct Booking Flow

1. **No ref parameter**
   - Navigate directly to `/{username}/book/{serviceSlug}` (no query params)
   - Complete booking
   - ✅ Should succeed, no stamping (NULL fields in booking)

2. **Invalid ref parameter**
   - Navigate to `/{username}/book/{serviceSlug}?ref=invalid`
   - Complete booking  
   - ✅ Should succeed, no stamping (logs "no_campaign" or similar)

3. **Direct profile access**
   - Navigate to `/{username}` (no ref)
   - Click service, book
   - ✅ Should succeed, no stamping

### Reading Page Flow (Non-Affiliate)

1. **Reading page without ref**
   - Visit `/readings/saturn-return` (no ref)
   - Click diviner, book
   - ✅ Should succeed, no stamping

2. **Reading page with invalid ref**
   - Visit `/readings/saturn-return?ref=invalid`
   - Click diviner, book
   - ✅ Should succeed, no stamping

## Database Checks

After each test booking:

- `bookings` table: `source_assignment_id`, `rate_type_stamp`, `rate_value_stamp` should be NULL
- No "affiliate_stamp_skipped" log entries
- No errors in booking-payment API logs
- Booking completes successfully
- Payment processes normally

## Performance Check

- No additional API calls or database queries for non-affiliate bookings
- Reading page load times unchanged
- Booking wizard performance unchanged

## Success Criteria

- ✅ All non-affiliate booking flows work exactly as before
- ✅ No performance regression
- ✅ No new error logs or console warnings
- ✅ Affiliate functionality only activates when valid ref present