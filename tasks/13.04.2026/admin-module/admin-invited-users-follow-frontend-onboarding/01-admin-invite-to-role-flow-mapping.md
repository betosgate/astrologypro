# 01 Admin Invite to Role Flow Mapping

## Goal

Define the correct frontend destination for each admin-invited role.

## Current Repo Grounding

Admin invite currently uses role-to-destination mapping in:

- `src/app/api/admin/invite-user/route.ts`

This needs to stay aligned with the real frontend onboarding architecture.

## Required Rule

Admin invite destinations must map to the same role journeys used by public signup.

Examples:

- `diviner` → diviner onboarding flow
- `trainee` → trainee onboarding flow
- `perennial_mandalism` → perennial onboarding flow

## Deliverables

- canonical role-to-frontend flow map
- redirect ownership rules
- mismatch prevention rules

## Status

Done.

Implemented with shared destination ownership in `src/lib/invite-destinations.ts`, used by both `src/app/api/admin/invite-user/route.ts` and `src/app/auth/callback/route.ts` so admin invite redirects cannot drift from the frontend onboarding map.
