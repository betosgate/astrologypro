# 05 User Controls Regeneration Limits and Audit

## Goal

Define the user-facing control surface for chart regeneration while enforcing the `3`-attempt correction limit.

## Product Requirement

Users can regenerate charts up to `3` times if they entered info incorrectly.

That means the UX must clearly communicate:

- why regeneration is available
- how many attempts remain
- what changes will invalidate the current chart
- what happens after the limit is exhausted

## Recommended User Experience

### Natal charts

For each profile:

- show current chart status
- show last generated timestamp
- show remaining correction attempts
- require confirmation before using a retry

### Relationship charts

Relationship charts should not expose an independent freeform retry counter if they are derivative of natal charts.

Better model:

- relationship charts refresh when underlying natal data materially changes
- staff can manually force refresh if needed

## Required Auditability

Every regeneration event should capture:

- who initiated it
- when it happened
- which profile was affected
- which fields changed before regeneration
- whether it succeeded

## Limit Exhaustion Rule

When the retry limit is exhausted:

- disable the self-service action
- present a clear explanation
- offer “Create support ticket”

## Admin Controls

Admin should be able to:

- see retry history
- reset retry counts in exceptional cases
- manually regenerate after support review

## Deliverables

- user retry UX specification
- audit event model
- admin override rules
- relationship between natal retries and relationship chart refreshes
