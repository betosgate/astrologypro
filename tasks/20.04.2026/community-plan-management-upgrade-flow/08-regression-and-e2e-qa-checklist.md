# Task 08 - Regression And End-To-End QA Checklist

- Status: Planned
- Priority: P0
- Area: QA / Payments / Regression

---

## Goal

Verify the full Community plan management and upgrade payment flow before release.

## Pricing Calculator QA

- [ ] `/community/plan` loads without calculator errors.
- [ ] Calculator does not show `$NaN`.
- [ ] Individual plan pricing is correct.
- [ ] Couple plan pricing is correct.
- [ ] Family plan pricing is correct.
- [ ] Member count changes produce valid totals.

## Current Plan Persistence QA

- [ ] User with saved Individual tier sees Individual after refresh.
- [ ] User with saved Couple tier sees Couple after refresh.
- [ ] User with saved Family tier sees Family after refresh.
- [ ] Invalid or missing `pm_tier_id` uses safe fallback and logs debug context.

## Active Recurring Subscriber Upgrade QA

- [ ] Backend detects active recurring Stripe subscription.
- [ ] Upgrade preview shows current plan, target plan, amount due now, next renewal date, and next renewal amount.
- [ ] Prorated amount is calculated in cents/minor units.
- [ ] Payment succeeds and target plan access is granted immediately after confirmation.
- [ ] Stripe subscription uses the target tier's recurring `stripe_price_id`.
- [ ] Renewal cycle follows the new business rule.
- [ ] Failed payment leaves the current plan unchanged.

## One-Time / Manual / No-Subscription QA

- [ ] Backend detects missing active recurring subscription.
- [ ] User is routed to recurring Stripe Checkout.
- [ ] Checkout uses target tier's recurring `stripe_price_id`.
- [ ] `pm_tier_id` does not change before payment success.
- [ ] Webhook/finalizer updates `pm_tier_id` after successful payment.
- [ ] Abandoned checkout leaves the current plan unchanged.

## Regression QA

- [ ] Existing Perennial signup checkout still works.
- [ ] Existing Mystery School subscription flow still works.
- [ ] Existing trainee checkout flow still works.
- [ ] Existing Community billing portal still works.
- [ ] Existing Community onboarding flow is not affected.
- [ ] Existing family member management is not affected.

## Final Handoff Notes

Before closing this task, document:

- final API response shape for pricing preview
- current plan persistence behavior
- active subscriber upgrade behavior
- no-subscription conversion behavior
- Stripe metadata used for the new conversion flow
- tested Stripe event names
- any manual reconciliation steps for partial failures
