# Task 01 - Audit Canonical PM Entitlement Source

- Status: Planned
- Priority: P0
- Area: Architecture / Backend / Entitlements

---

## Execution Order

This task must be done first.

Do not attempt Tasks 02, 03, 04, or 05 in the same pass. For junior developers and AI agents, the safest and most accurate approach is to complete one task file at a time, verify it, then stop for review before moving to the next file.

After this task is complete and reviewed, continue with:

```txt
tasks/23.04.2026/community-pm-entitlement-state-sync/02-sync-legacy-plan-type-on-tier-change-and-billing-events.md
```

## Goal

Define one canonical source for PM entitlement decisions so the rest of the implementation can be done without guesswork.

## Problem

The codebase currently mixes:

- `community_members.pm_tier_id`
- `community_members.plan_type`

This task is analysis first. The implementer must document exactly which field is canonical for:

- billing state
- family entitlement
- plan labels and UI messaging
- household limits

## Read First

- `src/app/api/community/plan/route.ts`
- `src/app/api/community/plan/change-tier/confirm/route.ts`
- `src/app/api/community/family/route.ts`
- `src/app/api/community/subscription/route.ts`
- `src/app/community/family/page.tsx`
- `src/app/api/stripe/webhooks/route.ts`
- `src/app/api/community/onboarding/complete/route.ts`

## Implementation Steps

1. List every route/page in the PM/community area that reads `pm_tier_id`.
2. List every route/page in the PM/community area that reads `plan_type`.
3. List every write path that updates `pm_tier_id`.
4. List every write path that updates `plan_type`.
5. Confirm which field should be the canonical entitlement source going forward.
6. Write down the rule for deriving:
   - `isFamilyEntitled`
   - `maxMembers`
   - family upgrade messaging
7. Document any routes that must keep reading `plan_type` for compatibility.
8. Write a short implementation note for Tasks 02-04 so a junior developer can follow it.

## Expected Output

Produce a short audit note inside the PR/task handoff covering:

- canonical source of truth
- legacy compatibility field(s)
- routes to update
- routes safe to leave alone
- known downgrade/upgrade risk points

## Constraints

- Do not make schema changes in this task.
- Do not change runtime behavior in this task unless necessary to add logs for debugging.
- Do not assume `plan_type` can be deleted immediately.

## Acceptance Criteria

- [ ] A clear canonical PM entitlement source is defined.
- [ ] Every known read/write path for `pm_tier_id` and `plan_type` is listed.
- [ ] The team can implement the next tasks without re-deciding the contract.
- [ ] Upgrade and downgrade stale-state risks are explicitly documented.
