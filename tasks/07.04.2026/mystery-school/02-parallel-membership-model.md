# Task 02: Parallel Membership Model

- Status: Completed (2026-04-08, re-audited)
- Completion Notes: mystery_school_students is now the effective Mystery School entitlement source; stale membership_type-based guards were replaced with requireMysterySchoolAccess(), and legacy community_members mystery_school users were backfilled via 20260408000105_backfill_legacy_mystery_school_students.sql so no legacy user is missing a student row.
Date: 2026-04-07
Category: Mystery School Module

## Status

- Mostly implemented
- Audit the existing code and data model before making changes
- Do not reintroduce single-membership replacement logic
- Only patch remaining mismatches or regressions

## Objective
Change the membership model so Perennial Mandalism and Mystery School can coexist for the same user.

## Problem

The current implementation appears to assume one community `membership_type` per user.
That is incompatible with the desired state where a user can hold both:
- `perennial_mandalism`
- `mystery_school`

## Requirements

- Remove replacement-tier semantics for PM -> Mystery School
- Mystery School purchase must not cancel PM subscription
- Mystery School purchase must not overwrite PM access
- Provision Mystery School as an additional entitlement/program
- Design a clean source of truth for dual membership state
- The final implementation must support one user being recognized as both:
  - PM-enabled for `/community`
  - Mystery School-enabled for `/mystery-school`

## Architecture Requirement

This task must produce an implementation where dual access is represented explicitly in data.

Acceptable outcome:
- separate entitlement/program records, or
- another explicit multi-membership model

Unacceptable outcome:
- a single exclusive `membership_type` flag being toggled between PM and Mystery School
- fake dual access implemented only through UI conditionals without a real data model

## Files Likely Affected

- `src/app/api/community/checkout/route.ts`
- `src/app/api/stripe/webhooks/route.ts`
- `src/lib/user-roles.ts`
- `src/types/user.ts`
- any tables or logic currently relying on a single exclusive `membership_type`

## Key Rule

- A PM user who buys Mystery School keeps PM active and gains MS access

## Success Criteria

- A single user can hold PM and Mystery School at the same time
- PM billing and access remain intact after Mystery School purchase
- Mystery School is provisioned without replacing PM
- The system has a real multi-membership source of truth, not a conflicting single-value membership hack
