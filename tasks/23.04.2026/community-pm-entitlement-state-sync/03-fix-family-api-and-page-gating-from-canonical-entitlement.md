# Task 03 - Fix Family API And Page Gating From Canonical Entitlement

- Status: Planned
- Priority: P0
- Area: Community / Backend / Frontend
- Endpoints: `GET /api/community/family`, `POST /api/community/family`, `GET /api/community/subscription`
- Page Route: `/community/family`

---

## Execution Order

Do this task only after Task 02 is complete and tier-change/write-path state sync is working.

Do not attempt Tasks 04 or 05 in the same pass. For junior developers and AI agents, the safest and most accurate approach is to complete one task file at a time, verify it, then stop for review before moving to the next file.

Required previous task:

```txt
tasks/23.04.2026/community-pm-entitlement-state-sync/02-sync-legacy-plan-type-on-tier-change-and-billing-events.md
```

After this task is complete and reviewed, continue with:

```txt
tasks/23.04.2026/community-pm-entitlement-state-sync/04-backfill-repair-migration-for-out-of-sync-membership-state.md
```

## Goal

Make the family page and family-member create flow use real family entitlement instead of stale legacy plan state.

## Problem

Right now the family page banner and empty state are driven by `plan_type`, and the family create route does not fully enforce real Family entitlement before insert. This allows contradictory states such as:

- banner says `Individual Plan`
- family member list already exists

## Primary Files

- `src/app/api/community/family/route.ts`
- `src/app/community/family/page.tsx`
- `src/app/api/community/subscription/route.ts`
- `src/components/community/membership-card.tsx`

## Implementation Steps

1. Add or reuse a canonical entitlement resolver for the authenticated PM member.
2. Update `GET /api/community/family` to return entitlement-aware state, not just raw legacy `plan_type`.
3. Update `POST /api/community/family` to reject creation when family entitlement is not active.
4. Keep the 5-member hard limit behavior intact for entitled Family users.
5. Update `/community/family` page logic so banner/empty-state/add-member controls use canonical entitlement.
6. Update any nearby subscription/member summary response that still reports the wrong Family/Individual state.
7. Verify the page handles:
   - Family tier + zero members
   - Family tier + existing members
   - Individual tier + zero members
   - stale bad data row repaired later by Task 04

## UX Copy Expectations

Use specific entitlement-based messaging:

- Individual entitlement: upgrade prompt is allowed
- Family entitlement and zero members: no upgrade prompt, only add-first-member guidance
- Family entitlement and members present: no upgrade prompt

## Constraints

- Do not hardcode “family” from member count alone.
- Do not allow member creation just because the UI button is hidden.
- Backend enforcement is required even if frontend logic is corrected.

## Acceptance Criteria

- [ ] Family page no longer shows the Individual upgrade banner for truly entitled Family users.
- [ ] Empty state copy is correct for both Individual and Family users.
- [ ] Add-member actions are shown only when entitlement allows them.
- [ ] Family-member creation is blocked server-side for non-Family users.
- [ ] `/api/community/family` and `/api/community/subscription` do not disagree about Family entitlement for the same user.
