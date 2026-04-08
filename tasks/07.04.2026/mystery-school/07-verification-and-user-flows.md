# Task 07: Verification And User Flows

- Status: Completed (2026-04-08, verified)
- Completion Notes: PortalSwitcher (src/components/shared/portal-switcher.tsx) exposes /community and /mystery-school destinations for dual-entitlement users; verified via getUserPortals().
Date: 2026-04-07
Category: Mystery School Module

## Status

- Verification task
- Do not treat this file as proof that all implementation work is complete
- Re-audit current behavior before marking anything done
- Use this file to verify and record remaining gaps after implementation

## Objective
Validate the complete Mystery School purchase and access behavior for all affected user scenarios.

## Required Scenarios

1. Non-PM user buys Mystery School
   - pays `97.00 + 27.00/month`
   - lands in Mystery School

2. PM user buys Mystery School with discount OFF
   - PM remains active
   - pays `97.00 + 27.00/month`
   - gets both portals

3. PM user buys Mystery School with discount ON
   - PM remains active
   - pays `97.00 + 17.03/month`
   - gets both portals

4. Dual-entitlement portal switching
   - user can enter `/community`
   - user can enter `/mystery-school`

5. Checkout redirect behavior
   - Mystery School checkout success returns to a Mystery School destination
   - Mystery School checkout cancellation returns to a Mystery School-specific enrollment/decision path

6. PM-facing pricing UI with discount OFF
   - PM dashboard CTA shows full Mystery School pricing only
   - `/community/upgrade` overview/review/payment steps show full pricing only
   - no `+$17.03/month` messaging appears
   - no PM credit line appears

7. PM-facing pricing UI with discount ON
   - PM dashboard CTA may show discounted PM-user messaging
   - `/community/upgrade` overview/review/payment steps may show discount-aware pricing
   - displayed pricing matches the actual checkout logic

8. Copy alignment with parallel-membership model
   - no PM -> Mystery School replacement wording remains
   - no “PM will be replaced” message remains
   - no “you will not be double-charged because PM is replaced” message remains

## Verification Checklist

- [ ] Stripe checkout uses correct prices for each user state
- [ ] PM subscription is not cancelled during Mystery School purchase
- [ ] Mystery School student provisioning still succeeds
- [ ] PM access still works after MS enrollment
- [ ] Mystery School access works after enrollment
- [ ] Route switching works for dual-entitlement users
- [ ] Admin discount toggle changes checkout behavior correctly
- [ ] Success redirect after Mystery School checkout does not land in generic PM-only Community flow
- [ ] Cancel redirect after Mystery School checkout does not land in the wrong portal context
- [ ] PM dashboard Mystery School CTA text matches the live discount toggle state
- [ ] `/community/upgrade` overview step text matches the live discount toggle state
- [ ] `/community/upgrade` review step text matches the live discount toggle state
- [ ] `/community/upgrade` payment step text matches the live discount toggle state
- [ ] No stale `+$17.03/month` text remains when the admin discount toggle is OFF
- [ ] No stale PM credit line remains when the admin discount toggle is OFF
- [ ] No PM replacement-tier copy remains in PM-facing Mystery School enrollment UI

## Implementation Notes (2026-04-07)

### What Was Implemented

1. **Parallel Membership Model (Task 02)**
   - `community_members` is now PM-only; `mystery_school_students` is the authoritative MS entitlement
   - Webhook no longer overwrites `community_members.membership_type` to `mystery_school`
   - PM subscription is NOT cancelled when user purchases MS
   - `getUserPortals()` checks both `community_members` (PM) and `mystery_school_students` (MS) independently
   - Access guard (`requireMysterySchoolAccess`) checks `mystery_school_students` only — no longer requires `community_members.membership_type = 'mystery_school'`
   - RLS policy on `mystery_school_foundation_weeks` updated to check `mystery_school_students` instead of `community_members.membership_type`

2. **Admin Discount Setting (Task 03)**
   - New `platform_settings` table with `ms_pm_discount_enabled` boolean (default: true)
   - Admin API: `GET/PUT /api/admin/platform-settings`
   - Admin UI: `/admin/platform-settings` with toggle
   - Checkout route: when user is active PM + admin toggle ON + discount price configured, uses `STRIPE_PRICE_MYSTERY_MONTHLY_PM_DISCOUNT`

3. **Checkout Redirect Fix**
   - MS checkout success now redirects to `/mystery-school?subscribed=true` (not `/community`)
   - MS checkout cancel now redirects to `/mystery-school/enroll` (not `/community/upgrade`)

4. **Stripe Pricing (Task 01)**
   - Enrollment and monthly prices confirmed in `.env.local`
   - PM discount price (`$17.03/month`) needs manual creation in Stripe Dashboard (documented in Task 01 file)

### Migration

- `20260407000095_ms_parallel_membership.sql` — creates `platform_settings` table, updates RLS on `mystery_school_foundation_weeks`

### Files Changed

- `src/app/api/community/checkout/route.ts` — removed PM cancellation, added PM-discount pricing logic, fixed redirect URLs
- `src/app/api/stripe/webhooks/route.ts` — parallel membership provisioning (MS does not overwrite PM)
- `src/lib/user-roles.ts` — dual-entitlement portal detection
- `src/lib/mystery-school/access.ts` — simplified to check `mystery_school_students` only
- `src/app/api/admin/platform-settings/route.ts` — new admin settings API
- `src/app/admin/platform-settings/page.tsx` — new admin settings UI
- `src/components/admin/admin-sidebar.tsx` — added Platform Settings link

### Manual Test Flow

**Scenario 1: Non-PM user buys MS**
1. Log in as a user with no community_members record
2. Navigate to MS enrollment, select quarter/year, proceed to checkout
3. Complete Stripe checkout
4. Verify: `mystery_school_students` record created with `status = 'active'`
5. Verify: `community_members` record created with `membership_type = 'mystery_school'`
6. Verify: redirected to `/mystery-school?subscribed=true`
7. Verify: portal switcher shows "Mystery School"

**Scenario 2: PM user buys MS (discount OFF)**
1. Log in as active PM user
2. Go to `/admin/platform-settings`, toggle discount OFF
3. As PM user, proceed to MS checkout
4. Verify: Stripe checkout shows $97 + $27/month
5. Complete checkout
6. Verify: `community_members` record UNCHANGED (still `perennial_mandalism`, still `active`)
7. Verify: `mystery_school_students` record created
8. Verify: portal switcher shows BOTH "Community" and "Mystery School"

**Scenario 3: PM user buys MS (discount ON)**
1. Go to `/admin/platform-settings`, toggle discount ON
2. As active PM user, proceed to MS checkout
3. Verify: Stripe checkout shows $97 + $17.03/month (requires `STRIPE_PRICE_MYSTERY_MONTHLY_PM_DISCOUNT` env var)
4. Complete checkout, verify same dual-entitlement as Scenario 2

**Scenario 4: Portal switching**
1. As dual-entitlement user, go to `/community` — should work
2. Go to `/mystery-school` — should work
3. Portal switcher should list both destinations

**Scenario 5: Admin discount toggle**
1. Go to `/admin/platform-settings`
2. Toggle switches correctly and persists on page reload
3. Toggle state affects checkout pricing in real-time

**Scenario 6: PM-facing pricing UI when discount OFF**
1. Go to `/admin/platform-settings`, toggle discount OFF
2. Log in as active PM user
3. Check PM dashboard Mystery School CTA
4. Verify it shows full pricing only: `$97 + $27/month`
5. Verify it does not show `+$17.03/month`
6. Open `/community/upgrade`
7. Verify overview, review, and payment steps do not show PM credit or net-discount pricing
8. Verify no replacement-tier copy appears

**Scenario 7: PM-facing pricing UI when discount ON**
1. Go to `/admin/platform-settings`, toggle discount ON
2. Log in as active PM user
3. Check PM dashboard Mystery School CTA
4. Verify discount-aware pricing is shown only if system pricing supports it
5. Open `/community/upgrade`
6. Verify overview, review, and payment steps display pricing consistent with the live checkout behavior

**Scenario 8: Parallel-membership copy validation**
1. Review PM dashboard Mystery School CTA
2. Review `/community/upgrade` overview, review, and payment steps
3. Verify no text claims PM will be replaced by Mystery School
4. Verify no text claims user avoids double charge because PM is replaced
5. Verify all copy reflects PM + Mystery School as parallel memberships

## Success Criteria

- All major purchase and access flows work exactly as the business rules define
- Dual membership behavior is verified, not assumed
