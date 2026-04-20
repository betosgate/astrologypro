# Task 04 - Preview Prorated Upgrade For Active Recurring Subscribers

- Status: Planned
- Priority: P0
- Area: Backend / Payments / Pricing
- Applies To: Users with an active recurring Stripe subscription

---

## Goal

Show active recurring subscribers an accurate prorated upgrade breakdown before payment.

## Business Rule

When a user upgrades from a lower plan to a higher plan mid-cycle:

- Charge only the prorated difference for the remaining period.
- Grant target plan access immediately after successful payment.
- Reset the renewal cycle from the upgrade date.
- Charge the full target plan amount on the next renewal.

## Preview Should Include

- current tier name
- target tier name
- current plan price
- target plan price
- billing period start
- billing period end
- remaining period information
- prorated amount due now
- new renewal date
- next renewal amount
- currency

## Implementation Notes

- Use authoritative tier data from DB/API.
- Use Stripe subscription data where needed for current billing period.
- Do not rely on frontend-calculated proration for final payment amounts.
- Avoid floating point money math. Use cents/minor units for calculations.
- Return display-ready values only after internal cents calculations are complete.

## Acceptance Criteria

- [ ] Preview returns a valid prorated amount for active recurring subscribers.
- [ ] Preview returns `0` only when that is mathematically correct.
- [ ] Preview never returns `NaN`, `undefined`, or negative upgrade charges.
- [ ] Preview explains the next renewal amount and renewal date.
- [ ] Preview does not update Stripe or DB state.
