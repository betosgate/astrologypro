# Task 05: Acceptance Audit, Upgrade History, and Snapshotting

## Goal

Treat amendment signing as a contract upgrade event with a clear history trail.

## Why This Is Needed

The product meaning here is not “user signed a random new doc.” It is:

- user had prior contract state
- user accepted amendment
- user’s contract state was upgraded

That needs better history than a flat acceptance row.

## Required Audit Model

### 1. Acceptance chain

Store:

- prior accepted version or contract state
- amendment accepted
- resulting contract state

### 2. Snapshot rule

As with other contract work, the accepted amendment must be snapshotted as rendered at acceptance time.

### 3. Upgrade event semantics

Record amendment acceptance as an upgrade event such as:

- `accepted_amendment`
- `contract_state_upgraded`

### 4. Admin history view

Admin should be able to inspect:

- who was targeted
- who has accepted
- who is still pending
- which contract state they came from
- which contract state they moved to

## Acceptance Criteria

- amendment acceptance is auditable as a contract upgrade
- history is clearer than simple document-version acceptances only
