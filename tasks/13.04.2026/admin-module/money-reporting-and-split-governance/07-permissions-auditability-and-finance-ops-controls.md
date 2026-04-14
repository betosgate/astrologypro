# Task 07: Permissions, Auditability, and Finance Ops Controls

## Goal

Make the money system operationally safe by enforcing access boundaries, audit trails, and finance-admin controls.

## Why This Is Needed

Gold-standard finance features are not just calculations and reports. They also require:

- strict access control
- auditability
- reason logging
- operational review states

## Required Controls

### 1. Role-based visibility

Admin:

- can view all diviners
- can issue refunds
- can review payout status
- can change platform finance settings

Diviner:

- can only view their own finance reports
- can manage their own affiliate rates within allowed cap
- cannot view platform-wide or other-diviner finance data

### 2. Audit logs

Audit the following:

- refund issued
- payout marked paid/held/reversed
- affiliate rule created or changed
- global cap changed
- platform fee rule changed

### 3. Finance review states

Support explicit states such as:

- pending
- approved
- held
- paid
- reversed
- disputed

### 4. Operational notes

Admin tools should allow notes for:

- payout holds
- refund investigations
- manual adjustments
- affiliate disputes

### 5. Permissions review

Review all finance-related RLS and service-layer authorization, especially the older affiliate tables that appear to mix `auth.users.id` and `diviners.id`.

This is a concrete risk area and should be validated before relying on those routes for gold-standard reporting.

## Acceptance Criteria

- finance actions are auditable
- access boundaries are explicit and testable
- the money system supports real operations work, not just passive dashboards

## Status

Done.

## Completion Notes

- finance-sensitive admin actions now log to `admin_activity_log`, including:
  - refund issuance
  - affiliate rule creation and updates
  - commission refunds and adjustments
  - finance-related platform settings changes
  - ledger status changes
- admin now has a dedicated finance ops screen at `/admin/reports/finance-ops` for:
  - payout review states
  - hold or dispute status changes
  - operational note capture
  - recent ledger-level refund impact review
- diviner visibility remains scoped to own finance data through `/api/dashboard/finance`.
