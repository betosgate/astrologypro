# Role-Based Contract Orchestration Pack

## Objective

Build a gold-standard contract system where:

- admin can manage role-based contracts from the backend
- each role can require its own contract set
- if a user signs up with multiple roles, they must sign more than one contract after signup
- contracts support both static and dynamic content
- dynamic fields like name, company name, effective date, payout terms, and other variables are easy for admin to manage

This is architecture and task definition only. It does not implement code or migrations.

## Current Repo Grounding

### Existing legal foundation

The repo already has:

- `legal_documents`
- `legal_acceptances`
- admin legal management APIs
- legal acceptance/status APIs

Relevant files:

- `src/app/api/legal/status/route.ts`
- `src/app/api/legal/accept/route.ts`
- `src/app/api/admin/legal/route.ts`
- `src/app/api/admin/legal/[id]/route.ts`
- `supabase/migrations/20260407000056_legal_content_seed.sql`

### Current limitation

The current legal model is document-type based, using fixed types like:

- `customer_terms`
- `diviner_agreement`
- `affiliate_agreement`
- `telephony_consent`
- `marketing_consent`
- `privacy_policy`

This is not enough for a role-orchestrated contract system because it does not answer:

- which contracts are required for which role
- which contracts are required for a user with multiple roles
- which contract version must be signed before role activation
- how dynamic variable parts are rendered

### Current signup reality

Role signup flows exist separately, for example:

- `src/app/api/diviner-signup/route.ts`
- `src/app/api/join/advocate/signup/route.ts`

They create users and role records, but there is no centralized contract requirement engine that blocks or sequences role activation.

## Product Direction

The right model is not “legal document types only.”
The right model is:

1. contract templates
2. role-to-contract assignment rules
3. dynamic variable resolution
4. acceptance records by rendered contract version
5. onboarding and role activation gates

## Workstreams

1. `01-contract-template-and-variable-model.md`
2. `02-role-to-contract-assignment-and-multi-role-requirements.md`
3. `03-post-signup-contract-sequencing-and-role-activation-gates.md`
4. `04-admin-contract-management-ui-and-dynamic-part-editing.md`
5. `05-contract-rendering-versioning-and-acceptance-audit.md`
6. `06-role-aware-legal-status-api-and-backend-enforcement.md`
7. `07-static-vs-dynamic-content-governance.md`

## Acceptance Standard

This system is complete only when:

- admin can manage contracts per role from backend tools
- multi-role users can be required to sign multiple contracts
- contracts can mix fixed legal text with dynamic variables cleanly
- every acceptance is tied to the rendered contract version actually shown
- role activation and protected flows can enforce missing contracts

## Status

- `01-contract-template-and-variable-model.md` — Done
- `02-role-to-contract-assignment-and-multi-role-requirements.md` — Done
- `03-post-signup-contract-sequencing-and-role-activation-gates.md` — Done
- `04-admin-contract-management-ui-and-dynamic-part-editing.md` — Done
- `05-contract-rendering-versioning-and-acceptance-audit.md` — Done
- `06-role-aware-legal-status-api-and-backend-enforcement.md` — Done
- `07-static-vs-dynamic-content-governance.md` — Done
