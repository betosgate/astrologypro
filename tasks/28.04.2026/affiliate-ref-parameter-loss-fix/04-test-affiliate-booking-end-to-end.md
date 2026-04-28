# 04 Test Affiliate Booking End-to-End - 2026-04-28

- Depends on: `03-ensure-booking-wizard-sends-refcode.md`
- Task File: `tasks/28.04.2026/affiliate-ref-parameter-loss-fix/04-test-affiliate-booking-end-to-end.md`

## Manual QA Checklist

Test the complete affiliate → booking → commission flow.

### Test Setup

1. Create test affiliate campaign with code `cmp_test123`
2. Generate affiliate link: `https://astrologypro.com/readings/saturn-return?ref=cmp_test123`
3. Use incognito/private browser window

### Test Steps

1. **Click Affiliate Link**
   - Navigate to affiliate link
   - Verify URL shows `?ref=cmp_test123`
   - ✅ Reading page loads with ref parameter

2. **Navigate to Diviner Profile**
   - Click "Book with [Diviner]" button
   - Verify URL includes `?ref=cmp_test123`
   - ✅ Diviner profile loads with ref parameter

3. **Navigate to Booking Page**
   - Click "Book This Reading" on a service
   - Verify URL includes `?ref=cmp_test123`
   - ✅ Booking page loads with ref parameter

4. **Complete Booking**
   - Fill booking form
   - Complete payment (use test card)
   - ✅ Booking succeeds

5. **Verify Commission Stamping**
   - Check database: `bookings` table should have non-NULL `source_assignment_id`, `rate_type_stamp`, `rate_value_stamp`
   - Check logs for "affiliate_stamp_skipped" — should NOT appear
   - ✅ Booking is stamped with commission info

6. **Verify Webhook Processing**
   - Wait for Stripe webhook (or trigger manually in test)
   - Check `affiliate_commissions` table for new record
   - Check affiliate dashboard shows pending commission
   - ✅ Commission credited to affiliate

### Edge Cases to Test

- **Invalid ref code**: `?ref=invalid` → should not stamp
- **Expired campaign**: Use expired campaign code → should not stamp  
- **Inactive affiliate**: Use inactive affiliate code → should not stamp
- **No ref parameter**: Regular booking without ref → should not stamp
- **Direct booking URL**: Skip reading page, go direct to `/{username}/book/{slug}?ref=cmp_test123` → should work

### Success Criteria

- ✅ Affiliate bookings get stamped and credited
- ✅ Invalid/missing refs don't break regular bookings
- ✅ No console errors or failed API calls
- ✅ All URLs properly carry ref parameter through the flow