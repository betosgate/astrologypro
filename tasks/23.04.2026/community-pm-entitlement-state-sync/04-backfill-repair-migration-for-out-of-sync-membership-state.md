# Task 04 - Backfill Repair Migration For Out-Of-Sync Membership State

- Status: Planned
- Priority: P1
- Area: Data Repair / Migration / PM State

---

## Execution Order

Do this task only after Tasks 02 and 03 are complete. Runtime logic must be fixed before repairing existing data.

Do not attempt Task 05 in the same pass. For junior developers and AI agents, the safest and most accurate approach is to complete one task file at a time, verify it, then stop for review before moving to the next file.

Required previous tasks:

```txt
tasks/23.04.2026/community-pm-entitlement-state-sync/02-sync-legacy-plan-type-on-tier-change-and-billing-events.md
tasks/23.04.2026/community-pm-entitlement-state-sync/03-fix-family-api-and-page-gating-from-canonical-entitlement.md
```

After this task is complete and reviewed, continue with:

```txt
tasks/23.04.2026/community-pm-entitlement-state-sync/05-regression-and-qa-checklist.md
```

## Goal

Repair existing `community_members` rows where the saved canonical PM tier and the legacy `plan_type` no longer agree.

## Problem

Even after runtime logic is fixed, existing rows may still contain stale `plan_type` values from earlier upgrade/downgrade flows. Those rows must be repaired so old pages, reports, and support/admin queries stop showing contradictory state.

## Primary Inputs

- `community_members.pm_tier_id`
- `community_members.plan_type`
- `pm_plan_tiers`

## Implementation Steps

1. Confirm the canonical mapping from active PM tier to legacy `plan_type`.
2. Write a safe migration or data-repair script that:
   - finds rows with non-null `pm_tier_id`
   - joins to `pm_plan_tiers`
   - computes expected legacy `plan_type`
   - updates only mismatched rows
3. Keep the migration idempotent.
4. Log or document how many rows would be changed.
5. If the tier cannot be mapped cleanly, skip the row and log/document it for manual review.

## Junior Developer Notes

- Do not guess tier meaning from price alone if the tier name/limit already gives the answer.
- Do not mass-update rows that have no PM tier data.
- Keep this repair scoped to the mismatch problem.

## Constraints

- Do not use the migration as a substitute for runtime fixes.
- Do not overwrite rows blindly without a tier mapping rule.
- Do not touch unrelated membership fields.

## Acceptance Criteria

- [ ] Existing mismatched PM member rows are repaired safely.
- [ ] Running the migration twice does not create new changes.
- [ ] Rows with unknown tier mapping are preserved and flagged for manual review.
- [ ] After repair, legacy `plan_type` matches canonical PM tier intent for repaired rows.
