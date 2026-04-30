# 03 Test Affiliate Booking End-to-End — 2026-04-28

- Depends on: 01, 02
- Spec: §3.8 step 1, §5 Flow D

## Manual QA — full affiliate → booking → stamp → credit flow

The cookie-capture rewrite means we must test more than "click link, book,
done." The whole point of the cookie is that attribution survives navigation,
so the test matrix has to cover navigation paths that the URL-threading
approach would have failed at.

### Setup

1. Active campaign with code `cmp_test_<timestamp>` (use an existing
   diviner_affiliate; do not bother with general/Phase 1.5 cases).
2. Confirm campaign is `status=active`, within date window, and its
   `source_assignment_id` is on an active assignment.
3. Test card: `4242 4242 4242 4242`, any future expiry, any CVC.
4. Use a fresh incognito window for each scenario so cookie state is
   clean.

### Scenario A — Direct `/r/<code>` then book (golden path)

1. Visit `https://astrologypro.com/r/cmp_test_<ts>`.
2. Verify 307 redirect lands on the configured destination (reading
   page or diviner profile) with `?ref=cmp_test_<ts>` on the URL.
3. DevTools → Application → Cookies: confirm `aff_ref=cmp_test_<ts>`,
   `Max-Age` ≈ 30 days, `SameSite=Lax`, `Secure` (production), not
   `HttpOnly`.
4. Click through to a booking page, complete payment.
5. DB check: `bookings.source_assignment_id`, `rate_type_stamp`,
   `rate_value_stamp` all NON-NULL on the new row.
6. Watch webhook: `affiliate_commissions` row appears once payment
   confirms; affiliate dashboard shows pending commission.

### Scenario B — Reading page → diviner card → book (the bug-1 case)

1. Visit `/r/cmp_test_<ts>` → lands on a reading page with
   `?ref=cmp_test_<ts>`.
2. Click a `DivinerCard` "Book with X" button.
3. Note: the URL on the diviner profile may **not** carry `?ref=` —
   that's the un-fixed bug-1 — but the cookie is still set. That's
   the whole point of this approach.
4. Click any service → land on the booking page.
5. Complete booking. Confirm stamp + commission as in Scenario A.

### Scenario C — Organic return (cookie-only attribution)

1. Visit `/r/cmp_test_<ts>` to set the cookie. Close the page.
2. New tab, fresh navigation: type the diviner's profile URL directly
   (`/<username>`) — no `?ref=` anywhere.
3. Click through to booking. Confirm `aff_ref` cookie is still
   present (DevTools).
4. Complete booking. Confirm stamp + commission.

### Scenario D — Last-touch when two campaigns clicked

1. Visit `/r/cmp_A` → cookie `aff_ref=cmp_A`.
2. In same browser, visit `/r/cmp_B` → cookie overwritten to `cmp_B`.
3. Book via the in-site flow (no `?ref=` in URL).
4. Stamp must reference `cmp_B`, not `cmp_A`.

### Scenario E — URL beats cookie

1. Cookie set to `aff_ref=cmp_old` from a prior visit.
2. Click a fresh `/r/cmp_new` link in another tab → cookie now
   `cmp_new`. (This is normal overwrite — covered above.)
3. Now visit a booking page with `?ref=cmp_explicit` directly,
   different from the cookie value.
4. POST body must send `refCode=cmp_explicit` (URL wins; matches
   precedence table in Task 02).

### Scenario F — Revoked campaign does NOT leak attribution

1. Set `aff_ref=cmp_test_<ts>` via Scenario A.
2. Admin revokes the source assignment for that campaign.
3. New `/r/cmp_test_<ts>` click → 307 to `/link-not-active`. Cookie
   for that code must **not** be re-set on this revoked path (Task 01
   acceptance #3). Existing cookie from before the revoke is still
   on the browser, but that's expected — at booking time the stamp
   resolver will re-check campaign validity and refuse to stamp.
4. Customer books anyway → no stamp written; `affiliate_stamp_skipped`
   log entry with reason indicating revoked/inactive.

### DB / log inventory after each booking

Query:

```sql
select id, source_assignment_id, rate_type_stamp, rate_value_stamp,
       campaign_id, ref_code
from bookings
where created_at > now() - interval '15 minutes'
order by created_at desc;
```

Cross-check against `campaign_conversions` and (after webhook)
`affiliate_commissions`.

### Pass criteria

- ✅ A, B, C, D — booking stamps; commission credited.
- ✅ E — URL `refCode` wins; cookie ignored.
- ✅ F — no stamp on revoked-campaign booking.
- ✅ No `affiliate_stamp_skipped: missing_ref_code` in logs for
      Scenarios A-D.
- ✅ Wizard POST body uses `refCode`, never `affiliateCode`
      (verify via Network tab).
