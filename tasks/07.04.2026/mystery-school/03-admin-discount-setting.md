# Task 03: Admin Discount Setting
Date: 2026-04-07
Category: Mystery School Module

## Status

- Mostly implemented
- Admin setting storage and UI already exist in the codebase
- Audit current behavior before changing it
- Focus only on missing behavior, bugs, or integration gaps

## Objective
Add a global admin-controlled setting that enables or disables the PM-user Mystery School monthly discount.

## Business Rule

- Discount applies only to Mystery School monthly billing
- Discount amount is fixed for this version
- Fixed PM-user discount:
  - `9.97 USD`
- Effective discounted Mystery School monthly charge:
  - `17.03 USD/month`

## Behavior

- If admin toggle is ON:
  - eligible active PM users pay `17.03 USD/month` for Mystery School monthly
- If admin toggle is OFF:
  - eligible active PM users pay `27.00 USD/month`
- One-time Mystery School enrollment remains `97.00 USD` in both cases

## Requirements

- Create a persistent global configuration setting
- Expose the setting in the admin panel
- Apply the setting automatically during Mystery School checkout
- No manual coupon codes
- No user-by-user override in this version
- The setting must be stored in a durable server-side configuration source
- The setting must be readable by checkout logic without relying on client-side state

## Price Selection Rule

Use `STRIPE_PRICE_MYSTERY_MONTHLY_PM_DISCOUNT` only when both conditions are true:

1. the user is currently an eligible active PM member
2. the admin global discount toggle is ON

Otherwise use:

- `STRIPE_PRICE_MYSTERY_MONTHLY`

## Files / Areas Likely Affected

- admin settings/config UI
- checkout pricing decision logic
- any config storage or admin settings API

## Success Criteria

- Admin can toggle PM-user discount on/off
- Eligible PM users automatically receive correct pricing based on the toggle
- Non-PM users are unaffected
