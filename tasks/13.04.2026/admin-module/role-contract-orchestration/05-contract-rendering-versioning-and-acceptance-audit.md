# Task 05: Contract Rendering, Versioning, and Acceptance Audit

## Goal

Make contract acceptance legally defensible by storing exactly what was rendered and accepted.

## Why This Is Needed

The current `legal_acceptances` pattern records:

- user
- document id
- type
- version
- accepted at

That is useful, but for dynamic contracts it is not enough. If variables can change, the system must preserve the actual rendered text or render hash that the user accepted.

## Required Audit Model

### 1. Render snapshot

Store:

- template id
- template version
- rendered content snapshot
- rendered variable payload
- content hash

### 2. Acceptance record

Acceptance should capture:

- user id
- role context
- rendered contract snapshot id
- accepted at
- IP address
- user agent
- optional signer display name

### 3. Re-sign rules

If:

- template version changes
- required variables materially change
- effective date rolls to a new contract version

the system should determine whether a re-sign is required.

### 4. Admin evidence view

Admin should be able to inspect:

- who signed
- when they signed
- which rendered version they signed
- what variables were used

## Acceptance Criteria

- every acceptance is tied to a rendered contract snapshot
- dynamic variables do not make legal history ambiguous
- admin can audit contract history per user and per role

## Status

Done.
