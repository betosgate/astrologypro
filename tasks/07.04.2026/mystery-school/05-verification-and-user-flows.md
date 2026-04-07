# Task 05: Verification And User Flows
Date: 2026-04-07
Category: Mystery School Module

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

## Success Criteria

- All major purchase and access flows work exactly as the business rules define
- Dual membership behavior is verified, not assumed
