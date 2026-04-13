# Task 02: Platform, Diviner, and Affiliate Split Rule Engine

## Goal

Define one canonical split engine for all money flows so the platform, diviner, and affiliate shares are always computed the same way.

## Why This Is Needed

Current repo behavior mixes:

- `PRICING.platformFeePercent`
- Stripe `application_fee_amount`
- revenue-ledger derived net amounts
- separate affiliate commission rules

That is not strong enough for finance-grade consistency.

## Requested Business Rule

The requested split model is:

1. customer pays gross amount
2. admin/platform takes the platform share
3. diviner gets the diviner share
4. affiliate share comes from the diviner share only
5. diviner keeps the remainder

## Required Rule Engine

### 1. Canonical split formula

For every commissionable order:

- `gross_amount`
- `platform_fee`
- `diviner_gross`
- `affiliate_share`
- `diviner_net`
- `platform_net`

with:

- `diviner_gross = gross_amount - platform_fee`
- `affiliate_share <= diviner_gross`
- `diviner_net = diviner_gross - affiliate_share`
- `platform_net = platform_fee`

### 2. Rule ownership layers

The split engine should support layered configuration:

- system default platform fee
- diviner-level platform fee override if ever allowed
- affiliate rule for that diviner and affiliate
- product-specific affiliate override

But all outputs should still flow through one calculator.

### 3. Stored calculation trace

Every finance event should store enough metadata to explain:

- which rule produced the platform fee
- which rule produced the affiliate share
- which cap was applied
- whether any admin override affected the result

### 4. Stripe alignment

The Stripe payment path must align with the rule engine so the ledger and actual transfer behavior do not diverge.

If Stripe moves gross minus application fee to the diviner immediately, but affiliate share is tracked separately, that must be explicitly documented as:

- operational payout flow
- not a hidden contradiction in accounting

## Acceptance Criteria

- every order uses one canonical split formula
- affiliate share is explicitly modeled as taken from the diviner side
- rule provenance is auditable on every money event
