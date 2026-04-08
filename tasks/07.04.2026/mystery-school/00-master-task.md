# Mystery School Module Master Task

- Status: Completed (2026-04-08, verified)
- Completion Notes: Verified complete: parallel PM + Mystery School memberships, dedicated /mystery-school route base, Stripe price IDs (STRIPE_PRICE_MYSTERY_ENROLLMENT/MONTHLY/MONTHLY_PM_DISCOUNT), admin-controlled ms_pm_discount_enabled platform setting, /community PM-only guard.
Date: 2026-04-07
Category: Mystery School Module

## Status

- Active coordination file
- Use this folder as the source of truth for sequencing
- Inspect current code before changing anything
- Do not rebuild completed work; patch only remaining gaps

## Goal
Implement Mystery School as a distinct product area with:
- a dedicated frontend route base at `/mystery-school`
- independent coexistence with Perennial Mandalism
- correct Stripe pricing for standard and PM-discounted Mystery School billing
- a global admin-controlled PM-user monthly discount
- working portal switching for users who hold both PM and Mystery School access

## Product Rules

1. Perennial Mandalism and Mystery School are separate memberships
2. A user can hold both memberships at the same time
3. PM must not be cancelled when a PM user purchases Mystery School
4. Mystery School routes must live under `/mystery-school`
5. `/mystery-school` itself must show the current decans landing experience
6. Standard Mystery School billing:
   - `97.00 USD` one-time
   - `27.00 USD/month`
7. PM-user discount applies to monthly only
8. Discounted PM-user Mystery School monthly charge:
   - `17.03 USD/month`
9. The PM-user discount is global and admin-controlled
10. If discount is OFF, PM users still pay full Mystery School monthly price
11. A dual-entitlement user must see two distinct switcher destinations:
   - `/community`
   - `/mystery-school`
12. The implementation must not rely on a single exclusive `community_members.membership_type` value as the only source of truth for dual access
13. Mystery School checkout success must return users to the Mystery School experience, not the generic Community landing
14. Mystery School checkout cancel behavior must also return users to the Mystery School-specific flow, not a PM-only flow

## Execution Order

1. `01-stripe-pricing-and-catalog.md`
2. `02-parallel-membership-model.md`
3. `03-admin-discount-setting.md`
4. `04-dedicated-route-migration.md`
5. `05-community-pm-only-guard.md`
6. `06-pm-discount-ui-and-upgrade-copy-alignment.md`
7. `07-verification-and-user-flows.md`

## Scope Notes

- This folder supersedes the older scattered Mystery School task notes under `tasks/07.04.2026/community-membership/` for implementation sequencing.
- Older files may still be useful as reference context, but AI execution should follow this folder first.

## Non-Negotiable Implementation Constraints

1. Do not implement dual membership by simply overwriting `membership_type` back and forth.
2. Do not cancel PM billing when a PM user buys Mystery School.
3. Do not keep Mystery School as a hidden subsection of `/community`.
4. Do not leave checkout redirect behavior ambiguous.
5. Do not leave the admin discount toggle as an in-memory or hardcoded-only setting.

## Expected Outcome

- Mystery School is no longer modeled as a PM replacement
- Mystery School is no longer hosted under `/community`
- `/community` behaves as a PM-only portal and does not render Mystery School dashboard content
- PM + Mystery School dual-access users can use a switcher to enter either portal
- Stripe pricing and admin controls match the defined business rules
