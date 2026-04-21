# Task 07 — Conversion Commission Snapshot Fix

- Status: Not Started
- Priority: P0 (Critical)
- Depends On: 2026-04-21 Task 03
- Blocks: Correct commission liability

## Goal

Make conversion credit use the frozen commission snapshot on the campaign, not the current mutable value on the assignment row. Today the hook still verifies that the source assignment is active, but it computes the commission amount from the live assignment rate. That means a diviner editing an assignment after campaigns already exist can change future payouts for those campaigns, which contradicts the V2 contract.

## Current State

- Helper: `src/lib/affiliate-attribution.ts`
- `creditAffiliateConversion(...)`:
  - resolves the affiliate campaign from `booking.ref_code`
  - verifies the destination matches
  - verifies the source assignment still exists and `is_active=true`
  - **then computes commission from `diviner_service_affiliates.commission_type/commission_value`**
- The campaign row already stores:
  - `commission_value_snapshot`
  - `commission_type_snapshot`

## Goal Decision

Preserve these semantics:

1. Assignment must still be active at booking time
2. Commission amount must come from the frozen campaign snapshot
3. A later assignment edit must affect only newly created campaigns, not existing ones

## Implementation Steps

### 1. Change the computation source

In `src/lib/affiliate-attribution.ts`, keep the active-assignment check, but compute cents from:

```ts
campaign.commission_type_snapshot
campaign.commission_value_snapshot
```

not from the assignment row.

### 2. Keep the assignment read lightweight

After the change, the assignment lookup only needs to answer:
- does `source_assignment_id` exist?
- is it active?

Do not keep reading mutable commission fields unless needed for logging.

### 3. Strengthen observability

On every credited conversion, log:
- snapshot type/value used
- assignment id checked
- whether the assignment was active

On every skipped conversion, log whether the reason was:
- missing / inactive assignment
- missing snapshot
- destination mismatch
- duplicate booking credit

### 4. Guard against missing snapshots

If an affiliate-owned campaign somehow lacks snapshot fields:
- do not fall back to the live assignment rate silently
- log a structured error
- return null / skip commission

That preserves correctness over convenience.

## Verification Plan

1. Create assignment at 12%.
2. Create affiliate-owned campaign from that assignment.
3. Edit the assignment to 25%.
4. Book via the original campaign.
5. Confirm `campaign_conversions.commission_amount_cents` equals 12% of order amount, not 25%.
6. Revoke the assignment and repeat booking attempt.
7. Confirm no new conversion row is inserted while assignment is inactive.

## Edge Cases

- `flat` snapshots must be multiplied correctly into cents
- zero-value snapshots should still insert a conversion row with `commission_amount_cents = 0` if product wants full funnel accounting
- legacy conversions flagged `legacy_campaign_affiliates` are out of scope here

## Rollback Plan

Revert the helper change. Existing conversion rows remain as written.
