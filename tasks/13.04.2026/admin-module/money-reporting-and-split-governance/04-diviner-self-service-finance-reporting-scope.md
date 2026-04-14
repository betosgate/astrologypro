# Task 04: Diviner Self-Service Finance Reporting Scope

## Status

Done.

Implemented with:
- `src/app/api/dashboard/finance/route.ts`
- `src/app/dashboard/finance/page.tsx`
- `src/components/dashboard/sidebar.tsx`
- `src/components/dashboard/mobile-nav.tsx`

What was delivered:
- a diviner-only finance API that resolves the authenticated user to their own `diviners` row and never accepts client-supplied diviner ids
- finance summary cards for gross revenue, platform fees, affiliate deductions, diviner gross, diviner net, and refunds
- monthly breakdown and recent ledger activity using `revenue_ledger_entries`
- refund visibility scoped to the current diviner
- payout readiness visibility for Stripe account, charges, and payouts state
- dashboard navigation entry so the report is a first-class part of the diviner back office

## Goal

Give diviners a proper finance view of their own data only, with no cross-diviner leakage.

## Why This Is Needed

The requested access model is:

- admin sees all diviners
- diviner sees only their own data

This applies to:

- pay-in data
- platform fee deductions
- payout status
- refund effects
- affiliate commissions deducted from their side

## Required Diviner Views

### 1. Own pay-in report

Diviner should see:

- gross sales
- platform fee deducted
- affiliate share deducted
- net earnings
- source type breakdown
- date filtering

### 2. Own payout report

Diviner should see:

- paid out amounts
- pending amounts
- failed or held payouts
- Stripe connection readiness
- payout timeline

### 3. Own refund report

Diviner should see:

- refunded orders
- refund amounts
- refund reason
- financial effect on their net earnings

### 4. Own affiliate cost report

Diviner should see:

- affiliate commissions committed
- commissions pending approval
- commissions paid
- how much was deducted from their share

### 5. Access boundaries

All routes should resolve diviner identity from the authenticated user, not from client-supplied diviner ids.

This must also be reflected in RLS or service-layer authorization.

## Important Existing Risk

Some older affiliate tables use `auth.uid() = diviner_id`, while newer systems model `diviner_id` as a profile id and `user_id` separately.

That needs an explicit access-review task because it is a likely permission mismatch.

## Acceptance Criteria

- diviners can see their own finance data clearly
- no route allows them to see another diviner’s finance data
- the reporting language makes platform fee and affiliate deductions understandable
