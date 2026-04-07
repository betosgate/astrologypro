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
| `STRIPE_PRICE_MYSTERY_ENROLLMENT` | `97.00 USD` | One-time | `price_1TJOXjBcRXKECv5fQ4dz7W4z` | **Exists in .env.local** |
| `STRIPE_PRICE_MYSTERY_MONTHLY` | `27.00 USD/month` | Monthly recurring | `price_1TJOXlBcRXKECv5f64n37Za2` | **Exists in .env.local** |
| `STRIPE_PRICE_MYSTERY_MONTHLY_PM_DISCOUNT` | `17.03 USD/month` | Monthly recurring | `TBD` | **MANUAL ACTION REQUIRED** |

## Manual Action Required

The PM-discount price (`STRIPE_PRICE_MYSTERY_MONTHLY_PM_DISCOUNT`) does **not** exist yet.
Stripe CLI is not installed, so this price must be created manually.

### Steps to create in Stripe Dashboard (test mode):

1. Go to Stripe Dashboard > Products
2. Find the existing Mystery School product (the one that owns `price_1TJOXjBcRXKECv5fQ4dz7W4z` and `price_1TJOXlBcRXKECv5f64n37Za2`)
3. Click "Add another price"
4. Set: **$17.03 USD / month**, recurring
5. Optionally set nickname: "Mystery School Monthly - PM Discount"
6. Save the new price
7. Copy the `price_...` ID
8. Add to `.env.local` as: `STRIPE_PRICE_MYSTERY_MONTHLY_PM_DISCOUNT=price_XXXXXXXXX`

Once the price is created and the env var is set, the checkout logic (Task 03) will automatically
select this price for eligible PM users when the admin discount toggle is enabled.

## Success Criteria

- [x] Enrollment price exists: `price_1TJOXjBcRXKECv5fQ4dz7W4z`
- [x] Monthly price exists: `price_1TJOXlBcRXKECv5f64n37Za2`
- [ ] PM discount price: needs manual creation in Stripe Dashboard at $17.03/month
- [ ] Env var `STRIPE_PRICE_MYSTERY_MONTHLY_PM_DISCOUNT` added to `.env.local` after creation
