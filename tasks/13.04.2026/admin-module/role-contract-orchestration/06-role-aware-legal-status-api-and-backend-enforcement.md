# Task 06: Role-Aware Legal Status API and Backend Enforcement

## Goal

Upgrade the legal-status and acceptance layer so backend services can ask for contract readiness by role, not just by raw document type.

## Why This Is Needed

Current APIs:

- `GET /api/legal/status`
- `POST /api/legal/accept`

operate on document types only. That is too low-level for role-gated onboarding and backend checks.

## Required API Evolution

### 1. Role-aware status endpoint

Add or evolve an endpoint that can answer:

- required contracts for this user
- signed contracts
- outstanding contracts
- blocking contracts by role

### 2. Acceptance endpoint evolution

Acceptance should target a rendered contract requirement or snapshot, not just a broad `document_type`.

### 3. Backend enforcement helpers

Create shared helpers that can be used by:

- signup completion flows
- payout onboarding flows
- affiliate activation flows
- role-protected APIs

### 4. Backend-first validation

Frontend contract flows are not enough. Protected backend routes must also validate that required contracts are signed before enabling critical role actions.

## Acceptance Criteria

- backend can resolve contract status by role
- acceptance is recorded against the exact required contract instance
- role-gated routes can enforce missing contracts centrally

## Status

Done.
