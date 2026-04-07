# Task: Community Membership Stripe Price Configuration & Checkout Parity
Date: 2026-04-07
Category: Community Membership Module

## Execution Note For AI Agent
- This task is intended to be executable by an AI agent.
- The agent must treat this file as both:
  - the implementation brief
  - the handoff record for the final Stripe configuration
- After creating or verifying the Stripe products/prices, the agent must update this file with the actual Stripe `price_...` IDs.
- After wiring env vars, the agent must also record which env var received which Stripe price ID.
- Do not leave the task in a generic state once the Stripe catalog work is complete.
- Do not edit `.env.local`.
- Do not create a new `.env.local`.
- Do not write any secret or environment value directly into local env files unless the user explicitly asks for that in a separate instruction.
- If env wiring is needed, record the required env var names and values in this task file only, so the user can apply them manually.

## Problem Statement
The Community Membership checkout flow is partially implemented, but the Stripe catalog and runtime environment are incomplete for the current API contract.

Current observed failures:
- `POST /api/community/checkout` for `mystery_school` fails with `Mystery School Stripe prices not configured.`
- `POST /api/community/checkout` for community plans will also fail if the required Community Stripe env vars are not present.
- The required Community/Mystery School Stripe products and prices may not exist yet in Stripe test mode.
- The join and upgrade entry points can drift if they do not share the same checkout payload expectations.

## Current Status (Audit)

### ✅ DONE (Functional)
- [x] Community checkout API exists at `src/app/api/community/checkout/route.ts`.
- [x] Mystery School validation requires `entry_quarter` and `entry_year`.
- [x] Mystery School upgrade flow already sends seasonal enrollment data from `/community/upgrade`.
- [x] Join Community page now includes the required Mystery School cohort payload.

### ❌ NOT DONE (Missing)
- [ ] Stripe test-mode products/prices for Community Membership have not been verified or created.
- [ ] `STRIPE_PRICE_COMMUNITY_INDIVIDUAL` is not configured in local/runtime env.
- [ ] `STRIPE_PRICE_COMMUNITY_FAMILY` is not configured in local/runtime env.
- [ ] `STRIPE_PRICE_MYSTERY_ENROLLMENT` is not configured in local/runtime env.
- [ ] `STRIPE_PRICE_MYSTERY_MONTHLY` is not configured in local/runtime env.
- [ ] Community Stripe product/price mapping is not documented in a single operator-facing source.
- [ ] Checkout parity verification has not been completed for both `/join/community` and `/community/upgrade`.

### 🛠️ FIXES/REFINEMENTS
- [ ] Add a clear setup section for required Community/Mystery Stripe env vars.
- [ ] Ensure local `.env.local`, deployment env vars, and Stripe test mode products stay aligned.
- [ ] Add runtime-safe diagnostics or admin/operator guidance for missing Stripe prices.
- [ ] Reduce drift by centralizing Community/Mystery checkout payload and config expectations.

## Detailed Requirements

1. **Stripe Product & Price Creation**
   * Create or verify the following Stripe **test-mode** products/prices:
     * Community Membership Individual: `9.97 USD` recurring monthly
     * Community Membership Family: `19.97 USD` recurring monthly
     * Mystery School Enrollment: `97.00 USD` one-time
     * Mystery School Monthly: `27.00 USD` recurring monthly
   * Capture the resulting Stripe `price_...` IDs.
   * Confirm the product/price mode is correct:
     * one-time for enrollment
     * recurring monthly for ongoing memberships
   * Stripe/env mapping:
     * `STRIPE_PRICE_COMMUNITY_INDIVIDUAL` → Community Membership Individual (`9.97 USD/month`)
     * `STRIPE_PRICE_COMMUNITY_FAMILY` → Community Membership Family (`19.97 USD/month`)
     * `STRIPE_PRICE_MYSTERY_ENROLLMENT` → Mystery School Enrollment (`97.00 USD` one-time)
     * `STRIPE_PRICE_MYSTERY_MONTHLY` → Mystery School Monthly (`27.00 USD/month`)
   * After this step is completed, update the **Recorded Stripe IDs** section in this file.

2. **Stripe Price Configuration**
   * Required env vars:
     * `STRIPE_PRICE_COMMUNITY_INDIVIDUAL`
     * `STRIPE_PRICE_COMMUNITY_FAMILY`
     * `STRIPE_PRICE_MYSTERY_ENROLLMENT`
     * `STRIPE_PRICE_MYSTERY_MONTHLY`
   * Do not write these into `.env.local` as part of this task.
   * Do not create or modify any `.env` file as part of this task.
   * Instead, document the exact values that must be added manually by the user.
   * Ensure all values point to valid Stripe **test-mode** prices for non-production environments.

3. **Checkout API Parity**
   * Path: `src/app/api/community/checkout/route.ts`
   * Validate that:
     * Perennial Mandalism uses the correct community monthly price IDs.
     * Mystery School uses the correct enrollment + monthly price IDs.
     * Mystery School requires and persists `entry_quarter` and `entry_year`.

4. **UI Entry Point Parity**
   * Paths:
     * `src/app/join/community/page.tsx`
     * `src/app/community/upgrade/page.tsx`
   * Ensure both entry points submit payloads compatible with the checkout API.
   * Ensure the Mystery School flow does not rely on hidden assumptions that only exist in one screen.

5. **Operator Documentation**
   * Add or update setup documentation so operators know:
     * which Stripe products/prices must exist
     * which env vars map to which plans
     * which environments need those values
     * that server restart/redeploy is required after env changes
   * This task file itself must be updated as an operator-readable record.

6. **Verification**
   * Confirm Perennial Mandalism individual checkout starts successfully.
   * Confirm Perennial Mandalism family checkout starts successfully.
   * Confirm Mystery School checkout starts successfully with selected cohort data.
   * Confirm missing env configuration surfaces a clear operational error.

## Technical Notes
- API contract currently expects price IDs from env vars, not from database configuration.
- The checkout route should remain strict about required Mystery School fields.
- Seasonal enrollment data is product logic and should not be removed just to bypass setup issues.
- If this module grows, consider extracting shared checkout request building and price configuration validation.

## Recorded Stripe IDs
Update this section after Stripe setup is completed.

| Env Var | Product / Purpose | Billing Type | Expected Price | Stripe Price ID | Status |
|---|---|---|---|---|---|
| `STRIPE_PRICE_COMMUNITY_INDIVIDUAL` | Community Membership Individual | Monthly recurring | `9.97 USD/month` | `TBD` | `Pending` |
| `STRIPE_PRICE_COMMUNITY_FAMILY` | Community Membership Family | Monthly recurring | `19.97 USD/month` | `TBD` | `Pending` |
| `STRIPE_PRICE_MYSTERY_ENROLLMENT` | Mystery School Enrollment | One-time | `97.00 USD` | `TBD` | `Pending` |
| `STRIPE_PRICE_MYSTERY_MONTHLY` | Mystery School Monthly | Monthly recurring | `27.00 USD/month` | `TBD` | `Pending` |

## Env Wiring Record
Update this section with the required values only. Do not modify `.env.local` from this task.

| Env Var | Applied Value | Environment | Updated By | Notes |
|---|---|---|---|---|
| `STRIPE_PRICE_COMMUNITY_INDIVIDUAL` | `TBD` | `Manual user update required` | `User` | `Record value here only; do not edit .env.local` |
| `STRIPE_PRICE_COMMUNITY_FAMILY` | `TBD` | `Manual user update required` | `User` | `Record value here only; do not edit .env.local` |
| `STRIPE_PRICE_MYSTERY_ENROLLMENT` | `TBD` | `Manual user update required` | `User` | `Record value here only; do not edit .env.local` |
| `STRIPE_PRICE_MYSTERY_MONTHLY` | `TBD` | `Manual user update required` | `User` | `Record value here only; do not edit .env.local` |

## Current State
- Community checkout API is implemented but blocked by missing Stripe price env vars.
- Stripe product/price creation work is a prerequisite before `.env.local` can be completed.
- `.env.local` currently contains Tarot/Astrology/Both Stripe prices but not Community/Mystery price IDs.
- Runtime errors currently appear only when the affected checkout path is exercised.

## Success Criteria
- Stripe test-mode has valid Community and Mystery School products/prices created.
- Community membership checkout works for both Perennial Mandalism plans.
- Mystery School checkout works with valid seasonal cohort data.
- Local and deployed environments have documented, complete Stripe price configuration.
- Community join and upgrade flows remain contract-compatible with the same checkout API.
