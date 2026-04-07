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

## Success Criteria

- All major purchase and access flows work exactly as the business rules define
- Dual membership behavior is verified, not assumed
