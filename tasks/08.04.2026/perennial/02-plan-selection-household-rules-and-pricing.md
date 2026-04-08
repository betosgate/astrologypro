# Perennial Plan Selection, Household Rules, And Pricing

- Completion Notes: Implemented in src/app/perennial-signup/page.tsx — three-card plan selector (Single $19.95, Couple $29.95, Family $39.95). Capacity rules enforced: changing plan trims members down if needed. Family validates 3-5 members; Single/Couple require exactly the plan size. UI shows household count vs allowed and a callout when STRIPE_PRICE_COMMUNITY_COUPLE is missing.
- Status: Partial (2026-04-08)
- Date: 2026-04-08
- Category: Perennial Signup
- Owner: Frontend
- Priority: P0
- Task File: `tasks/08.04.2026/perennial/02-plan-selection-household-rules-and-pricing.md`

## Goal

Implement clear Perennial plan selection with strict household-capacity enforcement and correct monthly pricing.

## Confirmed Pricing Rules

- `Single` = `1` total member = `$19.95/month`
- `Couple` = `2` total members = `$29.95/month`
- `Family` = `3` to `5` total members = `$39.95/month`

## Stripe Env Requirement

To support these three plans cleanly, the backend/payment setup needs three Stripe price env vars:

1. `STRIPE_PRICE_COMMUNITY_INDIVIDUAL`
2. `STRIPE_PRICE_COMMUNITY_COUPLE`
3. `STRIPE_PRICE_COMMUNITY_FAMILY`

Current known status in this repo:

1. `STRIPE_PRICE_COMMUNITY_INDIVIDUAL` exists
2. `STRIPE_PRICE_COMMUNITY_FAMILY` exists
3. `STRIPE_PRICE_COMMUNITY_COUPLE` is missing and must be added manually later

## Confirmed Capacity Rules

1. `Single` allows exactly 1 total member.
2. `Couple` allows exactly 2 total members.
3. `Family` allows up to 5 total members including the primary member.
4. The page must not permit the user to exceed the selected plan capacity.

## Confirmed Checkout Validity Rules

1. `Single` is valid only when exactly 1 member is fully completed.
2. `Couple` is valid only when exactly 2 members are fully completed.
3. `Family` is valid only when 3 to 5 members are fully completed.
4. The page must not allow the user to proceed to payment with an underfilled or overfilled plan.

## Required UI Behavior

1. The user must choose a plan before payment.
2. Plan cards or selectors must clearly show:
   - plan name
   - monthly price
   - included total-member capacity
3. Selecting a plan must immediately update:
   - visible price
   - allowed member count
   - household add/remove controls
   - order summary

## Household Count Rules

1. Primary member counts toward plan capacity.
2. Additional members count toward total household capacity.
3. Count display must always show:
   - current household count
   - selected plan capacity
4. For `Single`, the add-member action must be disabled or hidden.
5. For `Couple`, only one additional member is allowed.
6. For `Family`, up to four additional members are allowed.

## Plan-Change Rules

1. If the user reduces the plan after adding members, the UI must handle overflow intentionally.
2. The UI must not silently discard member data without warning.
3. If a lower plan cannot support the current household count, the user must be clearly told to:
   - remove excess members, or
   - keep/upgrade the plan

## Summary Requirements

The order summary must always show:

1. selected plan
2. monthly amount
3. total household members currently entered
4. billing owner note
5. credentials-generated-after-payment note

## Acceptance Criteria

1. plan selection is explicit and visually clear
2. pricing matches the confirmed values exactly
3. capacity enforcement matches the confirmed limits exactly
4. changing plans updates limits and summary immediately
5. the UI never permits invalid plan/member-count combinations without surfacing an error state
6. `Family` cannot proceed to payment with fewer than 3 completed members
7. the task clearly identifies the missing `STRIPE_PRICE_COMMUNITY_COUPLE` dependency
