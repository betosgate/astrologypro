# Task 02: Role-to-Contract Assignment and Multi-Role Requirements

## Goal

Define which contracts are required for which roles, including users who hold more than one role.

## Why This Is Needed

The current system knows document types, but it does not know role requirements. That becomes a blocker as soon as one user can be:

- customer
- diviner
- affiliate or advocate
- trainee
- other future operational roles

## Required Model

### 1. Role-contract assignment layer

Create a table such as:

- `role_contract_requirements`

Recommended fields:

- `role_key`
- `contract_template_id`
- `is_required`
- `trigger_event`
- `priority`

### 2. Trigger events

Support contract timing like:

- on account creation
- before role activation
- before payout eligibility
- before feature usage

### 3. Multi-role resolution

If a user has multiple roles, resolve the full required contract set as:

- union of all required contracts for all active or requested roles

The system should not assume one acceptance covers all roles unless explicitly configured.

### 4. Duplicate prevention

If two roles map to the same contract template and same rendered version, the user should not be asked to sign it twice unnecessarily.

If the same base template renders differently for different roles or variable contexts, treat those as distinct required contracts.

## Acceptance Criteria

- the backend can determine required contracts from a user’s role set
- multi-role users can be required to sign more than one contract after signup
- duplicate and equivalent contract cases are handled intentionally

## Status

Done.
