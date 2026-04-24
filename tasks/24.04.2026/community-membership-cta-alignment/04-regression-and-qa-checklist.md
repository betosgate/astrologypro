# Task 04 - Regression And QA Checklist For Membership Card CTA Alignment

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / QA
- Page Route: `/community`

---

## Scenario 1 - Removed CTAs

- [ ] Open `/community` as a PM member with an active membership
- [ ] Confirm `Update Payment` is not visible
- [ ] Confirm `Subscribed` is not visible

## Scenario 2 - Remaining Billing CTA

- [ ] Confirm the remaining action is labeled `Manage Subscription`
- [ ] Click the CTA
- [ ] Confirm the user is redirected into the Stripe customer portal flow

## Scenario 3 - No Layout Regression

- [ ] Confirm the action row still aligns cleanly after CTA removal
- [ ] Confirm spacing does not look broken with fewer buttons
- [ ] Confirm desktop layout remains clean
- [ ] Confirm mobile wrapping still works

## Scenario 4 - Unrelated Actions

- [ ] Confirm `Upgrade Plan` still behaves as expected for the current requirement set
- [ ] Confirm no plan/billing/member metadata fields changed unintentionally
- [ ] Confirm no other membership-card CTA disappeared accidentally

## Acceptance Criteria

- [ ] The PM membership card shows only the intended actions
- [ ] The remaining management CTA is portal-based and correctly labeled
- [ ] CTA cleanup does not regress card structure or responsiveness
