# Task 02 - Sync Legacy plan_type On Tier Change And Billing Events

- Status: Planned
- Priority: P0
- Area: Backend / Billing / PM State Sync

---

## Execution Order

Do this task only after Task 01 is complete and the canonical entitlement rule is documented.

Do not attempt Tasks 03, 04, or 05 in the same pass. For junior developers and AI agents, the safest and most accurate approach is to complete one task file at a time, verify it, then stop for review before moving to the next file.

Required previous task:

```txt
tasks/23.04.2026/community-pm-entitlement-state-sync/01-audit-canonical-pm-entitlement-source.md
```

After this task is complete and reviewed, continue with:

```txt
tasks/23.04.2026/community-pm-entitlement-state-sync/03-fix-family-api-and-page-gating-from-canonical-entitlement.md
```

## Goal

Ensure that when PM tier changes succeed, legacy `plan_type` is also updated consistently so older community routes do not remain in stale state.

## Problem

The PM tier-change flow updates `pm_tier_id`, but older logic still reads `plan_type`. If `plan_type` is not synchronized after a successful tier change or checkout finalization, the app can behave as if the user is still on the old plan.

## Primary Files

- `src/app/api/community/plan/change-tier/confirm/route.ts`
- `src/app/api/stripe/webhooks/route.ts`
- `src/app/api/community/onboarding/complete/route.ts`

## Implementation Steps

1. Confirm the canonical rule from Task 01 for mapping a saved tier to a legacy `plan_type`.
2. Update the successful tier-change path so the same DB write also keeps `plan_type` aligned.
3. Review Stripe checkout/webhook flows and confirm they also write aligned state.
4. Review onboarding completion to ensure it does not overwrite a newer paid Family tier incorrectly.
5. Add targeted logs when canonical entitlement and legacy `plan_type` disagree at write time.
6. Keep failed payment behavior unchanged: no entitlement update before success.

## Junior Developer Notes

- Do not change Stripe billing math here.
- Do not add new pricing logic.
- Only touch the state-sync part after payment/tier success is already confirmed.
- If a route can represent Couple as Family for legacy compatibility, document that clearly in code comments or task notes.

## Constraints

- Do not update plan access before Stripe success.
- Do not break one-time/manual/no-subscription flows.
- Do not silently remap unsupported tier names without logging.

## Acceptance Criteria

- [ ] Successful PM tier changes update both canonical tier state and the compatible legacy plan flag.
- [ ] Checkout/webhook success paths do not leave `pm_tier_id` and `plan_type` mismatched.
- [ ] Failed or abandoned payments still leave plan state unchanged.
- [ ] Downgrade flows do not leave stale Family legacy state behind.
