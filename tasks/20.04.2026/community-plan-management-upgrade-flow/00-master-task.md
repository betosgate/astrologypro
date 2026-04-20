# Master Task - Community Plan Management and Upgrade Payment Flow - 2026-04-20

- Status: Planned
- Priority: P0 (Revenue and access control)
- Owner: Full-stack / Payments
- Scope: Community plan calculator, current plan persistence, upgrade payment preview, Stripe recurring subscription conversion, prorated upgrade payment, webhook/finalizer safety, and end-to-end QA.
- Task File: `tasks/20.04.2026/community-plan-management-upgrade-flow/00-master-task.md`

---

## Purpose

This task is the single implementation entrypoint for Community plan management fixes and the updated upgrade payment model.

Use this folder as the full source bundle for the Community plan management and upgrade payment work. The implementing developer or AI must read every task file in this folder and treat them as one coordinated workstream.

## Problem

The Community plan management flow currently has several related issues:

1. The price calculator can show `$NaN` because the preview API response shape does not match the frontend's expected flat fields.
2. The current plan UI can default to Individual instead of reading the member's real saved `pm_tier_id`.
3. The current upgrade handling does not fully distinguish between:
   - active recurring Stripe subscribers
   - one-time/manual/no-subscription users
4. Users must never receive a free plan upgrade before payment is confirmed.
5. Plan upgrades must show a clear price breakdown before checkout or payment confirmation.

## Updated Business Rule

For an active recurring subscriber:

- User selects a higher Community plan.
- System calculates the prorated remaining difference between current and target plan.
- User pays only the prorated difference for the remaining period.
- Target plan access starts immediately after successful payment.
- Renewal date resets to the new upgrade date cycle.
- Next renewal charges the full target plan price.

Example:

```txt
Current Plan A: $50/month
Target Plan B: $120/month
Upgrade happens mid-cycle
User pays only the prorated difference now
User gets Plan B immediately
Next renewal is one month from upgrade date
Next renewal charge is full $120
```

For one-time/manual/no-subscription users:

- There is no active recurring Stripe subscription to upgrade.
- User must be converted into a new recurring Stripe subscription checkout.
- Target tier must have a valid recurring `stripe_price_id`.
- `pm_tier_id` must not be updated until Stripe confirms payment.

## Sub-Tasks

| # | File | What to do | Status |
|---|---|---|---|
| 01 | `01-fix-pricing-calculator-nan.md` | Align preview API response with the frontend pricing shape so `$NaN` cannot render. | Planned |
| 02 | `02-fix-current-plan-persistence.md` | Read the user's real `pm_tier_id` and show the correct current tier after refresh. | Planned |
| 03 | `03-audit-payment-state-and-tier-data.md` | Classify users by active recurring subscription vs one-time/manual/no-subscription state. | Planned |
| 04 | `04-preview-prorated-upgrade-for-active-subscribers.md` | Generate a clear prorated upgrade preview for active recurring subscribers. | Planned |
| 05 | `05-convert-one-time-or-no-subscription-users-to-recurring.md` | Route one-time/manual/no-subscription users into new recurring Stripe checkout. | Planned |
| 06 | `06-finalize-payment-and-update-membership.md` | Update Stripe subscription and DB membership only after successful payment confirmation. | Planned |
| 07 | `07-frontend-upgrade-breakdown-and-checkout-ui.md` | Show the correct upgrade breakdown and route users through the proper payment path. | Planned |
| 08 | `08-regression-and-e2e-qa-checklist.md` | Verify pricing, persistence, upgrade payment, checkout conversion, and regressions. | Planned |

## Execution Order

1. Read this master task.
2. Complete `01-fix-pricing-calculator-nan.md`.
3. Complete `02-fix-current-plan-persistence.md`.
4. Complete `03-audit-payment-state-and-tier-data.md`.
5. Complete `04-preview-prorated-upgrade-for-active-subscribers.md`.
6. Complete `05-convert-one-time-or-no-subscription-users-to-recurring.md`.
7. Complete `06-finalize-payment-and-update-membership.md`.
8. Complete `07-frontend-upgrade-breakdown-and-checkout-ui.md`.
9. Complete `08-regression-and-e2e-qa-checklist.md`.

## Implementation Constraints

- Do not update `community_members.pm_tier_id` until payment is confirmed.
- Do not give away free upgrades.
- Do not assume all users have active recurring Stripe subscriptions.
- Do not treat one-time/manual/no-subscription users as normal subscription upgrades.
- Do not hardcode Stripe price IDs in frontend code.
- Fetch target tier and `stripe_price_id` dynamically from DB/API.
- Do not reuse `perennial_community_signup` metadata for upgrade/conversion checkout.
- Preserve existing Perennial signup, Mystery School, and trainee checkout metadata behavior.
- Keep unexpected payment/database errors logged and debuggable.

## Acceptance Criteria

- [ ] Pricing calculator never renders `$NaN`.
- [ ] `/api/community/plan` returns the user's real current tier from `pm_tier_id`.
- [ ] Active recurring subscribers see a prorated upgrade breakdown before payment.
- [ ] Active recurring subscribers pay the prorated difference before receiving upgraded access.
- [ ] Active recurring subscribers get target plan access immediately after successful payment.
- [ ] Renewal cycle is reset according to the updated business rule.
- [ ] One-time/manual/no-subscription users are redirected to a new recurring Stripe Checkout session.
- [ ] Target tier checkout uses the target tier's recurring `stripe_price_id`.
- [ ] `pm_tier_id` is not updated before payment confirmation.
- [ ] Failed or abandoned payments leave the existing plan unchanged.
- [ ] Existing Perennial signup, Mystery School subscription, and trainee checkout flows still work.
