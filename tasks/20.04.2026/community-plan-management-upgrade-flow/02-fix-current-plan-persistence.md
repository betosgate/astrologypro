# Task 02 - Fix Current Plan Persistence From Database

- Status: Planned
- Priority: P0
- Area: Backend / Plan UI
- Endpoint: `GET /api/community/plan`
- Page Route: `/community/plan`

---

## Goal

Ensure the Community plan page shows the user's true current plan after refresh instead of defaulting to the first or Individual tier.

## Problem

The plan fetch route must not rely on a hardcoded default tier when the user's `community_members.pm_tier_id` exists.

## Implementation Steps

1. Inspect `src/app/api/community/plan/route.ts`.
2. Confirm whether `community_members.pm_tier_id` exists in code and active DB schema.
3. Fetch the authenticated user's `community_members` row.
4. Read `pm_tier_id` from the member row.
5. Fetch active plan tiers from `pm_plan_tiers`.
6. Match `pm_tier_id` against the available tiers.
7. Return the matched tier as the current tier.
8. Use a safe fallback only when `pm_tier_id` is missing or invalid, and document the fallback.

## Constraints

- Do not hardcode Individual as the active plan when DB has a saved tier.
- Do not update `pm_tier_id` in this read route.
- Do not hide invalid tier data silently. Log enough detail to debug.

## Acceptance Criteria

- [ ] Family/Couple users still show the correct tier after refresh.
- [ ] Individual users still show Individual when that is their saved tier.
- [ ] Missing `pm_tier_id` falls back safely without crashing.
- [ ] Invalid `pm_tier_id` is logged and does not break the page.
- [ ] No payment state is changed by this read-only task.
