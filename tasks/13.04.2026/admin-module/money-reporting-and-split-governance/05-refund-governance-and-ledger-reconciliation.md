# Task 05: Refund Governance and Ledger Reconciliation

## Goal

Make refunds finance-grade so refunds do not just change booking rows but also correctly reverse ledger consequences.

## Why This Is Needed

Current admin refund handling in `src/app/api/admin/refunds/route.ts` is operationally useful, but it is not yet a full refund-governance system.

For a gold-standard system, a refund must affect:

- payment status
- booking/order status
- finance ledger
- diviner earnings
- affiliate commissions where applicable

## Required Refund Model

### 1. Refund event record

Create or standardize a dedicated refund-event layer that stores:

- refund id
- booking/order reference
- amount
- full or partial
- reason
- initiated by
- provider reference
- created at

### 2. Ledger impact

Refunds should adjust or reverse:

- gross recognized revenue
- platform fee recognized
- diviner gross
- affiliate share
- diviner net

### 3. Affiliate consequence

If an affiliate commission was attached to the refunded order:

- full refund should reverse the commission obligation
- partial refund should recalculate affiliate share proportionally or according to business rules

The repo already has related tools for affiliate refund adjustments; this should be unified into the core money model, not treated as a side path only.

### 4. Reporting visibility

Refund reports should clearly show:

- original amount
- refunded amount
- remaining recognized amount
- effect on affiliate commission
- effect on diviner payout

## Acceptance Criteria

- refund handling reconciles across booking/order state and finance ledger state
- refund effects are visible to admin and to the affected diviner
- affiliate consequences are explicit and auditable

## Status

Done.

## Completion Notes

- admin and diviner refund routes now record `refund_events` and immediately reconcile the linked revenue ledger row.
- refund reconciliation now updates:
  - gross recognized revenue reversal
  - platform fee reversal
  - affiliate commission reversal
  - diviner net reversal
- refund reporting now exposes remaining recognized amount and finance note context in admin and diviner finance views.
