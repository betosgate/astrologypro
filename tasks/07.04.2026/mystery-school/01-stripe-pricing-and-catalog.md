# Task 01: Stripe Pricing And Catalog
Date: 2026-04-07
Category: Mystery School Module

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
| `STRIPE_PRICE_MYSTERY_ENROLLMENT` | `97.00 USD` | One-time | `TBD` | `Pending` |
| `STRIPE_PRICE_MYSTERY_MONTHLY` | `27.00 USD/month` | Monthly recurring | `TBD` | `Pending` |
| `STRIPE_PRICE_MYSTERY_MONTHLY_PM_DISCOUNT` | `17.03 USD/month` | Monthly recurring | `TBD` | `Pending` |

## Success Criteria

- All required Mystery School Stripe prices exist
- The discounted PM-user monthly price exists as a separate Stripe price
- The env var names needed by the app are unambiguous
