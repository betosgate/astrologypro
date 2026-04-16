# 02 Fix Sticky Plan Tier UI - 2026-04-16

- Status: Planned
- Priority: P0
- Owner: Backend
- Parent: `00-master-task.md`
- Task File: `tasks/16.04.2026/plan-management-fixes/02-fix-sticky-plan-tier-ui.md`

## Goal

Ensure that the Dashboard/Plan page correctly reflects the member's current tier (e.g. Family instead of Individual) by reading the correct ID from the database.

## Context

Currently, `src/app/api/community/plan/route.ts` hardcodes the current tier to the first item in the list (`availableTiers[0]`). This causes the UI to show "Individual" even if the user has successfully switched to "Family" in the background.

## Files To Change

| File | Change |
|---|---|
| `src/app/api/community/plan/route.ts` | Select `pm_tier_id` from `community_members` and use it to find the active tier object. |

## Required Behavior

1. In the `community_members` query, add `pm_tier_id` to the select list.
2. After fetching `availableTiers`, find the tier whose `id` matches `member.pm_tier_id`.
3. Default to `availableTiers[0]` ONLY if `member.pm_tier_id` is null or not found in the list.

## Acceptance Criteria

- [ ] Fetching `/api/community/plan` for a user with a "Family" `pm_tier_id` returns the "Family" tier object in the response.
- [ ] On page refresh, the **current plan card** at the top of the Plan page correctly shows the name and price of the actually selected tier.
