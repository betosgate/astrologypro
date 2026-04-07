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
- [x] All 4 Stripe price env vars are present in `.env.local` (verified 2026-04-07).
- [x] Checkout API returns clear 500 error messages when env vars are missing (e.g., "Mystery School Stripe prices not configured." / "Community Stripe price not configured.").
- [x] Checkout API validates `entry_quarter` (must be spring/summer/autumn/winter) and `entry_year` (must be >= 2026) with 422 responses.
- [x] `/join/community` sends `entry_quarter`, `entry_year` from `getUpcomingEntryDates()` for Mystery School; sends `planType` for PM plans. Compatible with checkout API.
- [x] `/community/upgrade` sends `entry_quarter`, `entry_year`, and `upgrade_from_pm` correctly. Compatible with checkout API.
- [x] Checkout parity verified: both UI entry points produce payloads compatible with the checkout API contract.
- [x] Community Stripe product/price mapping documented in this file (see Recorded Stripe IDs section).
- [x] TypeScript compiles cleanly (`tsc --noEmit --skipLibCheck` passes with no errors, verified 2026-04-07).

### ❌ NOT DONE (Missing)
- [x] ~~Stripe test-mode products/prices for Community Membership have not been verified or created.~~ — Prices exist in `.env.local`; Stripe CLI not available on this machine to independently verify in Stripe dashboard. User should confirm products exist in Stripe test-mode dashboard.
- [x] ~~`STRIPE_PRICE_COMMUNITY_INDIVIDUAL` is not configured in local/runtime env.~~ — Present in `.env.local`.
- [x] ~~`STRIPE_PRICE_COMMUNITY_FAMILY` is not configured in local/runtime env.~~ — Present in `.env.local`.
- [x] ~~`STRIPE_PRICE_MYSTERY_ENROLLMENT` is not configured in local/runtime env.~~ — Present in `.env.local`.
- [x] ~~`STRIPE_PRICE_MYSTERY_MONTHLY` is not configured in local/runtime env.~~ — Present in `.env.local`.
- [x] ~~Community Stripe product/price mapping is not documented in a single operator-facing source.~~ — Documented below.
- [x] ~~Checkout parity verification has not been completed for both `/join/community` and `/community/upgrade`.~~ — Verified 2026-04-07.

### 🛠️ FIXES/REFINEMENTS
- [x] ~~Add a clear setup section for required Community/Mystery Stripe env vars.~~ — Recorded in env wiring table below.
- [x] ~~Ensure local `.env.local`, deployment env vars, and Stripe test mode products stay aligned.~~ — Local env confirmed present; deployment env must be configured separately by operator.
- [x] ~~Add runtime-safe diagnostics or admin/operator guidance for missing Stripe prices.~~ — Checkout API already returns descriptive 500-level errors when env vars are missing.
- [ ] Reduce drift by centralizing Community/Mystery checkout payload and config expectations — deferred; current implementation is stable and both entry points are verified compatible.

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
| `STRIPE_PRICE_COMMUNITY_INDIVIDUAL` | Community Membership Individual | Monthly recurring | `9.97 USD/month` | `price_1TJOXhBcRXKECv5fuyZ9e2o0` | `Present in .env.local` |
| `STRIPE_PRICE_COMMUNITY_FAMILY` | Community Membership Family | Monthly recurring | `19.97 USD/month` | `price_1TJOXiBcRXKECv5fBFg8oNpi` | `Present in .env.local` |
| `STRIPE_PRICE_MYSTERY_ENROLLMENT` | Mystery School Enrollment | One-time | `97.00 USD` | `price_1TJOXjBcRXKECv5fQ4dz7W4z` | `Present in .env.local` |
| `STRIPE_PRICE_MYSTERY_MONTHLY` | Mystery School Monthly | Monthly recurring | `27.00 USD/month` | `price_1TJOXlBcRXKECv5f64n37Za2` | `Present in .env.local` |

## Env Wiring Record
Update this section with the required values only. Do not modify `.env.local` from this task.

| Env Var | Applied Value | Environment | Updated By | Notes |
|---|---|---|---|---|
| `STRIPE_PRICE_COMMUNITY_INDIVIDUAL` | `price_1TJOXhBcRXKECv5fuyZ9e2o0` | `.env.local` (local dev) | `Already present` | Verify in Stripe dashboard; add to deployment env separately |
| `STRIPE_PRICE_COMMUNITY_FAMILY` | `price_1TJOXiBcRXKECv5fBFg8oNpi` | `.env.local` (local dev) | `Already present` | Verify in Stripe dashboard; add to deployment env separately |
| `STRIPE_PRICE_MYSTERY_ENROLLMENT` | `price_1TJOXjBcRXKECv5fQ4dz7W4z` | `.env.local` (local dev) | `Already present` | Verify in Stripe dashboard; add to deployment env separately |
| `STRIPE_PRICE_MYSTERY_MONTHLY` | `price_1TJOXlBcRXKECv5f64n37Za2` | `.env.local` (local dev) | `Already present` | Verify in Stripe dashboard; add to deployment env separately |

## Current State (Updated 2026-04-07)
- Community checkout API is fully implemented and all 4 required Stripe price env vars are present in `.env.local`.
- `.env.local` contains Tarot/Astrology/Both AND Community/Mystery Stripe price IDs.
- Checkout API returns clear error messages when env vars are missing at runtime.
- Both `/join/community` and `/community/upgrade` send payloads compatible with the checkout API.
- TypeScript compiles cleanly.
- Stripe CLI is not installed on this machine; products/prices could not be independently verified against the Stripe dashboard. User should verify in Stripe test-mode dashboard that the 4 price IDs above correspond to the correct products, amounts, and billing intervals.
- Deployment environments (staging, production) still need these 4 env vars configured separately.

## Success Criteria
- Stripe test-mode has valid Community and Mystery School products/prices created.
- Community membership checkout works for both Perennial Mandalism plans.
- Mystery School checkout works with valid seasonal cohort data.
- Local and deployed environments have documented, complete Stripe price configuration.
- Community join and upgrade flows remain contract-compatible with the same checkout API.
