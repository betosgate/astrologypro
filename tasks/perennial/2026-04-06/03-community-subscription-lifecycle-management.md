# Add Community Subscription Lifecycle Management - 2026-04-06

- Status: Completed (2026-04-08, upstream)
- Completion Notes: Cancel: `src/app/api/community/plan/cancel/route.ts`. Uncancel: `.../uncancel/route.ts`. Tier change (upgrade/downgrade individual↔family): `.../change-tier/route.ts`. Period-end cancel from `src/app/api/community/billing/unsubscribe/route.ts` (added in 2026-04-07/10.1).
- Priority: P1
- Owner: Fullstack
- Scope: cancel, upgrade, downgrade, plan enforcement
- Estimate: 1.5-3 days
- Task File: `docs/tasks/perennial/2026-04-06/03-community-subscription-lifecycle-management.md`

## Goal

Implement the missing Perennial subscription lifecycle rules from the requirement document.

## Verified Current Code Truth

- Community checkout start exists in `src/app/api/community/checkout/route.ts`.
- Family member CRUD basics already exist.
- A verified member-facing lifecycle flow for:
  - cancel at end of billing period
  - upgrade individual to family
  - downgrade family to individual
  is not fully exposed in current code.

## Required Behavior

1. Members can cancel at period end and retain access until expiry.
2. Members can upgrade from individual to family following the billing rule.
3. Members can downgrade from family to individual effective next cycle.
4. Plan-specific family-member limits remain enforced.

## Tasks

1. Add subscription status read/update path for community memberships.
2. Add cancel-at-period-end behavior.
3. Add individual-to-family upgrade behavior.
4. Add family-to-individual downgrade behavior.
5. Enforce family-member plan limits consistently after lifecycle changes.

## Acceptance Criteria

- cancel keeps access until current period end
- upgrade changes the effective plan and member limits correctly
- downgrade applies on the intended next-cycle boundary
- extra-member handling is defined and enforced

## Verification Test Plan

1. Cancel an active membership and confirm end-of-period access.
2. Upgrade individual to family and confirm expanded member allowance.
3. Downgrade family to individual and confirm next-cycle handling.
4. Attempt to exceed plan limits and confirm enforcement still works.

## Notion Summary

P1 subscription gap: the current Perennial flow can start checkout, but the member-facing cancel, upgrade, and downgrade lifecycle still needs to match the requirement document.
