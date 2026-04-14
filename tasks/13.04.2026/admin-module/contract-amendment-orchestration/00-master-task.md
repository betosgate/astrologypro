# Contract Amendment Orchestration Pack

## Objective

Support admin-managed amendments where:

- admin can create an amendment for one or multiple roles
- existing users in those roles must accept the amendment on next login
- new users signing up later do not sign the amendment separately
- new users instead sign the newer consolidated agreement path
- signing an amendment is treated as upgrading the current contract
- admin can manage all of this from backend tools

This is architecture only. It does not implement code or migrations.

## Current Repo Grounding

### Existing legal/versioning behavior

The current repo supports:

- creating legal document versions
- activating one version per document type
- checking user acceptance against the active version
- accepting a document type against the active version

Relevant files:

- `src/app/api/admin/legal/route.ts`
- `src/app/api/admin/legal/[id]/route.ts`
- `src/app/api/legal/status/route.ts`
- `src/app/api/legal/accept/route.ts`

### Current limitation

The current system has no distinction between:

- a replacement agreement for future users
- an amendment that must be accepted by already-existing users

It also has no model for:

- applying amendments by role scope
- forcing next-login acceptance for existing role holders
- treating amendment acceptance as an upgrade to an already-signed contract chain

## Product Direction

The right model is:

1. base contract
2. amendment set attached to that contract lineage
3. role-targeted rollout rules
4. existing-user reacceptance queue
5. future-user consolidated contract path

## Workstreams

1. `01-contract-lineage-base-vs-amendment-model.md`
2. `02-existing-user-amendment-rollout-and-next-login-enforcement.md`
3. `03-new-user-consolidated-agreement-path.md`
4. `04-admin-amendment-management-for-one-or-multiple-roles.md`
5. `05-acceptance-audit-upgrade-history-and-snapshotting.md`
6. `06-role-aware-status-resolution-and-backend-gates.md`

## Acceptance Standard

This system is complete only when:

- admin can issue amendments by role scope
- existing users can be forced to accept those amendments on next login
- new users are routed to the newer agreement path without a separate amendment step
- the contract history clearly shows that the user upgraded from prior terms via amendment acceptance

## Status

- `01-contract-lineage-base-vs-amendment-model.md` — Done
- `02-existing-user-amendment-rollout-and-next-login-enforcement.md` — Done
- `03-new-user-consolidated-agreement-path.md` — Done
- `04-admin-amendment-management-for-one-or-multiple-roles.md` — Done
- `05-acceptance-audit-upgrade-history-and-snapshotting.md` — Done
- `06-role-aware-status-resolution-and-backend-gates.md` — Done
