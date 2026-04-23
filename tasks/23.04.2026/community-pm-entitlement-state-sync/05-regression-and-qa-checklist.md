# Task 05 - Regression And QA Checklist

- Status: Planned
- Priority: P0
- Area: QA / PM / Community Family

---

## Execution Order

Do this task last, only after Tasks 01-04 are complete.

Do not combine this QA task with implementation work. For junior developers and AI agents, the safest and most accurate approach is to run this checklist after the code and migration tasks have already been completed and reviewed.

Required previous tasks:

```txt
tasks/23.04.2026/community-pm-entitlement-state-sync/01-audit-canonical-pm-entitlement-source.md
tasks/23.04.2026/community-pm-entitlement-state-sync/02-sync-legacy-plan-type-on-tier-change-and-billing-events.md
tasks/23.04.2026/community-pm-entitlement-state-sync/03-fix-family-api-and-page-gating-from-canonical-entitlement.md
tasks/23.04.2026/community-pm-entitlement-state-sync/04-backfill-repair-migration-for-out-of-sync-membership-state.md
```

## Goal

Verify that PM entitlement state stays consistent across billing, plan UI, family UI, and family-member write access.

## Upgrade QA

- [ ] User upgrades from Individual to Family successfully.
- [ ] Stripe/payment success updates canonical PM tier state.
- [ ] Legacy compatibility state is synchronized after successful upgrade.
- [ ] `/api/community/plan` shows the new Family tier after refresh.
- [ ] `/api/community/subscription` reports Family entitlement after refresh.
- [ ] `/api/community/family` reports Family entitlement after refresh.
- [ ] `/community/family` does not show the Individual upgrade banner after upgrade.
- [ ] `/community/family` empty state says to add the first member, not to upgrade.
- [ ] Family member creation succeeds after upgrade.

## Downgrade QA

- [ ] User downgrades from Family to Individual successfully.
- [ ] Stripe/payment success updates canonical PM tier state.
- [ ] Legacy compatibility state is synchronized after successful downgrade.
- [ ] `/api/community/plan` shows the downgraded tier after refresh.
- [ ] Family-only messaging and add-member affordances are removed after downgrade.
- [ ] Family-member creation is blocked after downgrade.

## Existing Bad Data QA

- [ ] A user row with `pm_tier_id = Family` and `plan_type = individual` is repaired correctly.
- [ ] After repair, family page messaging is correct.
- [ ] After repair, subscription and family APIs agree.

## Regression QA

- [ ] Existing PM billing portal still works.
- [ ] Existing tier preview and tier confirmation flow still works.
- [ ] Existing Stripe webhook processing still works.
- [ ] Existing onboarding completion still works.
- [ ] Existing family member editing and deletion still works.
- [ ] Existing membership summary card still shows the correct plan state.

## Final Handoff Notes

Before closing the bundle, document:

- canonical entitlement rule
- legacy `plan_type` compatibility rule
- routes updated
- migration added
- any known unsupported tier-name edge cases
