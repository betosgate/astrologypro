# Task 08 — Tests, RLS, Sign-off

- Status: Not Started
- Priority: P1
- Depends on: 01–07
- Blocks: sprint complete
- Spec: v1.2 (all sections)

## Goal

Lock in the behavior with a runnable test matrix. Verify RLS policies
actually enforce what the API filters promise. Produce a sign-off
checklist the team can hand to QA.

## Part A — RLS verification

For each of these tables, write an integration test that:
1. Creates two test users (User A, User B) with conflicting tenancy
   (e.g. two diviners with two separate affiliates).
2. Issues queries as each (using anon key + JWT, not service-role).
3. Asserts each only sees their own rows.

Tables to cover:
- `diviner_service_affiliates`
- `diviner_service_affiliate_rate_history`
- `affiliate_campaigns` (both owner_type='diviner' and 'affiliate')
- `campaign_clicks`
- `campaign_conversions`

File: `tests/integration/affiliate-rls.test.ts`

## Part B — Flow integration tests

One file per major flow, following the existing `tsx --test` convention.

| File | Covers |
|---|---|
| `tests/integration/affiliate-assignment-rate-history.test.ts` | PATCH assignment edits rate → history row + in-app notification written (email stub asserted via spy). Notification copy mentions "future bookings". |
| `tests/integration/affiliate-campaign-selfserve.test.ts` | POST `/api/affiliate/assignments/[id]/campaigns` happy path + 403 cross-affiliate + 403 revoked + rate-limited |
| `tests/integration/affiliate-booking-stamp.test.ts` (new) | Booking creation with valid ref_code → booking row has all 3 stamp columns set. All 5 skip conditions tested: no_ref / no_campaign / campaign_inactive / assignment_inactive / destination_mismatch / account_not_active → stamp fields NULL |
| `tests/integration/affiliate-conversion-stamped-rate.test.ts` | End-to-end: assignment at 15%, booking stamped at 15%, webhook → conversion with commission_amount_cents matching 15% + rate_value_used=15. Then edit rate to 10%, create NEW booking (stamps 10%), webhook → new conversion at 10%. Edit rate to 25%, trigger webhook on the FIRST booking (still stamped 15%) → conversion pays 15% (rate-stamp wins) |
| `tests/integration/affiliate-blocked-account-credit.test.ts` (new) | Book at 15%, stamp succeeds. Block affiliate (`status='blocked'`). Trigger webhook → no conversion row, logs `account_not_active_at_credit`. Unblock, re-trigger → webhook is idempotent so still no row (booking already processed). Separate booking-then-block-before-stamp scenario → stamp fields NULL |
| `tests/integration/affiliate-revoked-link.test.ts` | Hit `/r/<code>` for active campaign → 307. Revoke assignment. Hit again → 410, static page rendered, no click row. |
| `tests/integration/affiliate-reversal.test.ts` | Admin reverse endpoint sets reversed_at, fires notification, removes from affiliate's totals, writes `admin_action_log` row |
| `tests/integration/affiliate-admin-override.test.ts` (new) | POST admin force-revoke → assignment is_active flips, both diviner and affiliate get notified, `admin_action_log` row written with reason. POST admin force-archive → campaign status archived, notifications sent. Non-admin caller → 403. Empty reason → 422. |

## Part C — Unit tests

File: `tests/unit/affiliate-commission-math.test.ts`

Covers `computeCommissionCents` for:
- percent / flat
- zero / negative rates
- order amount edge cases (0, very large)
- Confirms no regression vs the function's current behavior.

## Part D — E2E (Playwright, best-effort)

One spec that walks through:
1. Diviner logs in → assigns an affiliate to a service at 20%
2. Affiliate logs in → sees assignment → creates a campaign → copies share URL
3. Visitor (no auth) → clicks share URL → lands on service page with `?ref`
4. Visitor → completes checkout (Stripe test card)
5. Wait for webhook → affiliate refreshes earnings → sees new commission row
6. Diviner edits rate to 10% → affiliate sees rate-change notification
7. Diviner revokes → visitor hits share URL → sees "no longer active" page

File: `tests/e2e/affiliate-commission-v2.spec.ts`

Note: Playwright E2E against a real Stripe requires either Stripe's test
mode webhook simulator or a local `stripe listen` bridge. Either is
acceptable; document which in the spec file.

## Part E — `package.json` scripts

```json
"test:affiliate-rls": "tsx --env-file=.env.local --test tests/integration/affiliate-rls.test.ts",
"test:affiliate-assignment-rate": "tsx --env-file=.env.local --test tests/integration/affiliate-assignment-rate-history.test.ts",
"test:affiliate-campaign-selfserve": "tsx --env-file=.env.local --test tests/integration/affiliate-campaign-selfserve.test.ts",
"test:affiliate-booking-stamp": "tsx --env-file=.env.local --test tests/integration/affiliate-booking-stamp.test.ts",
"test:affiliate-conversion-stamped-rate": "tsx --env-file=.env.local --test tests/integration/affiliate-conversion-stamped-rate.test.ts",
"test:affiliate-blocked-account": "tsx --env-file=.env.local --test tests/integration/affiliate-blocked-account-credit.test.ts",
"test:affiliate-revoked-link": "tsx --env-file=.env.local --test tests/integration/affiliate-revoked-link.test.ts",
"test:affiliate-reversal": "tsx --env-file=.env.local --test tests/integration/affiliate-reversal.test.ts",
"test:affiliate-admin-override": "tsx --env-file=.env.local --test tests/integration/affiliate-admin-override.test.ts",
"test:affiliate-commission": "npm run test:affiliate-rls && npm run test:affiliate-assignment-rate && npm run test:affiliate-campaign-selfserve && npm run test:affiliate-booking-stamp && npm run test:affiliate-conversion-stamped-rate && npm run test:affiliate-blocked-account && npm run test:affiliate-revoked-link && npm run test:affiliate-reversal && npm run test:affiliate-admin-override"
```

## Part F — Sign-off checklist

Before declaring the sprint done, tick every box:

- [ ] Migrations 01a + 01b applied to dev Supabase, re-runnable (idempotent)
- [ ] `npm run test:affiliate-commission` green
- [ ] `git grep -E "recordAffiliateCommission|recordSignupAffiliateCommission|affiliate_commissions|affiliate_referral_links|affiliate_commission_history|affiliate_payouts|affiliate_clicks\b|commission_value_snapshot|commission_type_snapshot" -- src/` returns zero
- [ ] `git grep "'suspended'" -- src/` (affiliate_accounts context) returns zero — enum is trimmed to `unclaimed|active|blocked`
- [ ] Manual E2E on deployed preview (see Part D) green
- [ ] Admin / diviner / affiliate dashboards accessible and scope-correct
- [ ] Nav entries added on all three dashboards for every new page
- [ ] Each page has `loading.tsx` and an empty-state component
- [ ] WCAG 2.2 keyboard + screen-reader checks pass on each new page
- [ ] Existing-UI verification checklist (task 07 Part H.4) all ticked
- [ ] "Link no longer active" page visible on both revoke and archive paths
- [ ] Booking stamping verified: a booking with ref_code has all three
      stamp columns populated; a booking without ref_code has NULL stamps
- [ ] Rate edit after booking creation does NOT affect that booking's
      eventual commission (rate-stamp wins)
- [ ] Blocking an affiliate AFTER booking but BEFORE webhook blocks the
      commission credit (fraud-enforcement path)
- [ ] Notifications land in-app AND email for all 7 kinds: assigned,
      rate_changed, revoked, conversion (immediate in-app, digested email),
      reversal, admin.override.assignment_revoked,
      admin.override.campaign_archived
- [ ] Conversion digest email cron fires next midnight UTC and sends
- [ ] Notification preferences toggles persist and actually suppress
      notifications when off
- [ ] Admin overrides write `admin_action_log` rows with reason
- [ ] Spec changelog has entries for every landed change
- [ ] Phase 2 placeholder (Stripe auto-split) untouched

## Acceptance

- All scripts listed in Part E exist in `package.json`.
- Running `npm run test:affiliate-commission` returns 0 failures.
- RLS tests prove cross-tenant access is rejected at DB level, not just
  API level.
- E2E spec passes on at least one Playwright run against preview env.

## Suggested files

(see above)

- Spec: final Changelog entry "Phase 1 shipped YYYY-MM-DD"
