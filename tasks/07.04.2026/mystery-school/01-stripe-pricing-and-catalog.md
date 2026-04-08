# Task 01: Stripe Pricing And Catalog

- Status: Partially Complete (2026-04-08, re-audited)
- Completion Notes: Stripe price IDs are wired in src/app/api/community/checkout/route.ts and the documented PM-discount price exists, but this task file still requires the env var to be present locally before the discounted checkout path is fully verified.
Date: 2026-04-07
Category: Mystery School Module

## Status

- Partially implemented
- Standard Mystery School Stripe prices already exist and are recorded here
- The PM-discount Stripe price is still pending manual creation
- Inspect current env/config before changing code
- Do not recreate prices that already exist

## Execution Note For AI Agent

- After creating or verifying the Stripe prices, update this file with the real Stripe `price_...` IDs.
- Do not update `.env.local`.
- Do not create a new `.env.local`.
- Do not write env values into any local `.env` file from this task.
- Use this task file as the record of truth for the newly created Stripe price IDs.

## Objective
Define and prepare the Stripe product/price catalog required for Mystery School standard billing and PM-user discounted billing.

## Required Stripe Prices

1. `STRIPE_PRICE_MYSTERY_ENROLLMENT`
   - `97.00 USD`
   - one-time

2. `STRIPE_PRICE_MYSTERY_MONTHLY`
   - `27.00 USD/month`
   - recurring monthly

3. `STRIPE_PRICE_MYSTERY_MONTHLY_PM_DISCOUNT`
   - `17.03 USD/month`
   - recurring monthly

## Requirements

- Create or verify all three Stripe prices in test mode
- Record the real `price_...` IDs in this file after creation
- Do not write values into `.env.local`
- Do not create a new `.env.local`
- Document the exact env var mappings only

## Recorded Stripe IDs

| Env Var | Expected Price | Billing Type | Stripe Price ID | Status |
|---|---|---|---|---|
| `STRIPE_PRICE_MYSTERY_ENROLLMENT` | `97.00 USD` | One-time | `price_1TJOXjBcRXKECv5fQ4dz7W4z` | **Exists in .env.local** |
| `STRIPE_PRICE_MYSTERY_MONTHLY` | `27.00 USD/month` | Monthly recurring | `price_1TJOXlBcRXKECv5f64n37Za2` | **Exists in .env.local** |
| `STRIPE_PRICE_MYSTERY_MONTHLY_PM_DISCOUNT` | `17.03 USD/month` | Monthly recurring | `price_1TJZCPBcRXKECv5fhwdSCyXL` | **Created in Stripe test mode** |

## Manual Action Required

The PM-discount price now exists in Stripe test mode:

- `STRIPE_PRICE_MYSTERY_MONTHLY_PM_DISCOUNT=price_1TJZCPBcRXKECv5fhwdSCyXL`

Manual step remaining:

1. Add to your local env manually:
   - `STRIPE_PRICE_MYSTERY_MONTHLY_PM_DISCOUNT=price_1TJZCPBcRXKECv5fhwdSCyXL`

Once the env var is set, the checkout logic (Task 03) will automatically
select this price for eligible PM users when the admin discount toggle is enabled.

## Success Criteria

- [x] Enrollment price exists: `price_1TJOXjBcRXKECv5fQ4dz7W4z`
- [x] Monthly price exists: `price_1TJOXlBcRXKECv5f64n37Za2`
- [x] PM discount price exists: `price_1TJZCPBcRXKECv5fhwdSCyXL`
- [ ] Env var `STRIPE_PRICE_MYSTERY_MONTHLY_PM_DISCOUNT` added to `.env.local` after creation
