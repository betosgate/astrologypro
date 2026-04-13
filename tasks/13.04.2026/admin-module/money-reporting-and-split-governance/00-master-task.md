# Money Reporting and Split Governance Pack

## Objective

Design a gold-standard finance layer for:

- pay-in reporting
- payout reporting
- refund reporting
- admin visibility across all diviners
- diviner visibility limited to their own data
- platform versus diviner revenue splits
- diviner-controlled affiliate sharing with a configurable admin cap

The new affiliate-sharing rule requested is:

- the affiliate share comes out of the diviner’s side, not the platform side
- diviner may choose the share amount for affiliates
- default maximum affiliate share is `60%`
- admin must be able to configure that maximum globally

This pack is architecture only. It does not implement code or migrations.

## Current Repo Grounding

### Existing payment and Stripe Connect foundations

Current booking checkout and Connect payout logic already exist in:

- `src/app/api/stripe/booking-payment/route.ts`
- `src/lib/stripe/connect.ts`

Current Connect behavior:

- customer pays on the platform
- Stripe `application_fee_amount` is used for the platform fee
- `transfer_data.destination` sends the remainder to the diviner’s connected Stripe account

### Existing revenue-ledger foundation

There is already a normalized revenue ledger in:

- `src/lib/revenue-ledger.ts`
- `supabase/migrations/20260413000010_revenue_ledger_and_subscription_preferences.sql`

This is currently the strongest foundation for a finance-grade reporting layer.

### Existing refund operations

Admin refund handling already exists in:

- `src/app/api/admin/refunds/route.ts`

But it currently behaves as a basic booking refund tool, not a full refund-governance and reporting system.

### Existing payout reporting

An admin payouts report exists in:

- `src/app/api/admin/reports/payouts/route.ts`

But it still uses simplified calculations tied to `PRICING.platformFeePercent`, which is too weak for a full split-governance model.

### Existing affiliate systems

The repo currently has two overlapping affiliate/commission rule systems:

1. older:
   - `commission_rules`
   - `commission_ledger_entries`
   - `affiliate_payout_records`
   - migration: `supabase/migrations/20260406000030_affiliate_commission.sql`

2. newer:
   - `diviner_affiliates`
   - `affiliate_commissions`
   - `affiliate_payouts`
   - `affiliate_commission_rules`
   - migrations:
     - `supabase/migrations/20260407000063_affiliate_commission.sql`
     - `supabase/migrations/20260407000076_commission_rules.sql`

This duplication is a real architecture risk and must be resolved before money reporting can be called gold-standard.

## Product Rules To Encode

### 1. Pay-in

Pay-in means customer money collected by the platform for:

- bookings
- subscriptions
- gift certificates
- future live or group purchases if added later

### 2. Split order

The split must be modeled in this order:

1. gross customer payment
2. platform fee
3. diviner gross share
4. affiliate share from the diviner gross share
5. diviner net share

The affiliate share does not reduce the platform fee.

### 3. Affiliate cap

The maximum affiliate share should be controlled by admin via configuration.

Initial requested cap:

- `60%`

This cap should apply to percentage-based affiliate rules and any UI that lets a diviner set affiliate rates.

## Workstreams

1. `01-unify-money-source-of-truth-and-ledgers.md`
2. `02-platform-diviner-affiliate-split-rule-engine.md`
3. `03-admin-gold-standard-payin-payout-refund-reporting.md`
4. `04-diviner-self-service-finance-reporting-scope.md`
5. `05-refund-governance-and-ledger-reconciliation.md`
6. `06-affiliate-share-cap-and-config-governance.md`
7. `07-permissions-auditability-and-finance-ops-controls.md`

## Acceptance Standard

This finance program is complete only when:

- all money flows reconcile from a single source of truth
- admin can see all diviners and all platform-level finance data
- diviner can only see their own finance data
- refunds, payouts, affiliate commissions, and platform fees all reconcile to the same ledger model
- affiliate share is explicitly modeled as coming out of the diviner’s side
- the admin-configurable maximum affiliate share is enforced everywhere

## Status

- `01-unify-money-source-of-truth-and-ledgers.md` — Pending
- `02-platform-diviner-affiliate-split-rule-engine.md` — Pending
- `03-admin-gold-standard-payin-payout-refund-reporting.md` — Done
- `04-diviner-self-service-finance-reporting-scope.md` — Done
- `05-refund-governance-and-ledger-reconciliation.md` — Pending
- `06-affiliate-share-cap-and-config-governance.md` — Done
- `07-permissions-auditability-and-finance-ops-controls.md` — Pending
