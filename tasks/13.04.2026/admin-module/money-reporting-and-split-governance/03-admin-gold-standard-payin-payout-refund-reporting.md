# Task 03: Admin Gold-Standard Pay-In, Payout, and Refund Reporting

## Goal

Give admin a complete finance command view across all diviners, with reconciled reporting for money in, money out, and money reversed.

## Why This Is Needed

The user requirement is clear: admin can see all diviners and all relevant finance data properly.

Current reports are partial:

- payouts report exists, but uses simplified fee math
- refunds route exists, but it is an operation endpoint more than a reporting system
- affiliate reports exist, but they are not fully unified with pay-in and payout reporting

## Required Admin Views

### 1. Pay-in report

Admin should see across all diviners:

- gross collected
- platform fees recognized
- diviner gross amounts
- affiliate commission obligations
- diviner net amounts
- source type breakdown
- payment status and refund status

### 2. Payout report

Admin should see:

- all diviners
- Stripe connected account status
- payable balances
- paid balances
- withheld balances
- payout exceptions
- affiliate payout obligations if the platform is operationally involved

### 3. Refund report

Admin should see:

- full refunds
- partial refunds
- refund reasons
- refund initiator
- refund effect on platform, diviner, and affiliate shares
- unreconciled refund rows needing manual review

### 4. Diviner drilldown

Admin should be able to move from the platform-wide report into a single diviner finance view showing:

- bookings and pay-ins
- payouts
- refunds
- affiliate commissions
- net settled versus pending

### 5. Reconciliation states

Each report should expose states such as:

- recognized
- pending payout
- paid
- refunded
- partially refunded
- under review

## Files Likely In Scope

- admin finance report pages
- `/api/admin/reports/payouts`
- new or expanded admin finance APIs
- new finance summary queries over `revenue_ledger_entries`

## Acceptance Criteria

- admin can see all diviners in one finance reporting system
- reporting covers pay-in, payout, and refund from one reconciled model
- drilldowns make discrepancies traceable
