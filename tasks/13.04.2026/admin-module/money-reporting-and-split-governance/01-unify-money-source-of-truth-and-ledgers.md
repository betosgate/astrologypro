# Task 01: Unify Money Source of Truth and Ledgers

## Goal

Create a single authoritative finance model so reporting, payouts, refunds, and affiliate commissions all reconcile consistently.

## Why This Is Needed

The repo already has a promising `revenue_ledger_entries` table, but the money model is still fragmented across:

- booking payment logic
- Stripe transfer logic
- booking refund writes
- affiliate commission ledgers
- payout reporting routes

There is also an unresolved duplicate affiliate-rule architecture.

Without a single finance source of truth, every report will drift.

## Required Direction

### 1. Declare the finance ledger authority

Use `revenue_ledger_entries` as the authoritative gross-to-net record for platform and diviner revenue.

Every monetized event should have one canonical revenue row keyed by:

- source type
- source reference

### 2. Link auxiliary ledgers to the finance ledger

Affiliate commissions, refunds, and payout records should not calculate independently forever. They should reconcile against the finance ledger.

Recommended relationships:

- booking/order -> revenue ledger entry
- revenue ledger entry -> affiliate commission rows
- revenue ledger entry -> refund events
- revenue ledger entry -> payout settlement status

### 3. Resolve duplicate commission systems

The current coexistence of:

- `commission_rules` and `commission_ledger_entries`
- `affiliate_commission_rules` and `affiliate_commissions`

must be rationalized.

Recommended direction:

- keep one rule engine
- keep one affiliate commission ledger
- map legacy paths into the chosen model

### 4. Separate operational state from accounting state

Booking status and finance state are related but not identical.

Example:

- a booking can be `completed`
- its payout can still be pending
- its affiliate commission can still be held
- its refund can be partial later

The finance design must support those independent states explicitly.

## Acceptance Criteria

- one finance ledger becomes the reporting authority
- affiliate and refund subsystems reconcile to it
- duplicate commission architectures are marked for consolidation
