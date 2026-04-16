# 04 End-to-End QA Checklist - 2026-04-16

- Status: Planned
- Priority: P0
- Owner: QA / Developer
- Parent: `00-master-task.md`
- Task File: `tasks/16.04.2026/plan-management-fixes/04-end-to-end-qa-checklist.md`

## Overview

Final verification to ensure plan management is fully functional across pricing, persistent storage, and payment gateways.

## Pricing & UI Consistency

- [ ] Open `/community/plan` and verify the **current plan** matches the database.
- [ ] In the **Price Calculator**, slide from 1 to 15 members.
    - [ ] Verify **Base** matches the tier base price.
    - [ ] Verify **Extra** reflects the correct charge for members exceeding the limit.
    - [ ] Verify **Total** is mathematically correct.
    - [ ] Verify no `$NaN` appears at any point.

## Plan Switching (Existing Subscriber)

- [ ] Use a test account with an active Stripe subscription.
- [ ] Select a different tier (e.g., from Individual to Family).
- [ ] Confirm "Success" toaster appears.
- [ ] Verify the **Overview** card updates instantly.
- [ ] Check Stripe Dashboard to confirm the subscription was updated with `proration_behavior: create_prorations`.

## Plan Switching (No Active Subscription)

- [ ] Use a test account with NO `stripe_subscription_id`.
- [ ] Select a plan tier.
- [ ] Verify the user is redirected to the **Stripe Checkout** page.
- [ ] Complete the checkout with a test card.
- [ ] Verify redirection back to the dashboard success URL.
- [ ] Verify the database now reflects the new tier.

## Edge Cases

- [ ] **Capacity Guard**: Try to downgrade a tier when your member count exceeds the new tier's `max_total_members`.
    - [ ] Verify the API blocks the downgrade with a clear error message.
- [ ] **Multiple Clicks**: Rapidly click the "Switch" button and verify debounce/loading logic prevents duplicate Stripe updates.
