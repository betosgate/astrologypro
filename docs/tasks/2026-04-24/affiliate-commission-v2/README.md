# Affiliate Commission v2 — Sprint Plan (2026-04-24)

## Source of truth

The authoritative requirements live in
[`docs/specs/affiliate-commission-system.md`](../../../specs/affiliate-commission-system.md)
(currently v1.2). **Read that first.** This folder is the implementation
plan — what to do, in what order — against that spec.

## Scope

Phase 1 of the affiliate commission system as defined in §10 of the spec.
Phase 2 (Stripe Connect auto-split) is NOT in this sprint.

## Execution order

The tasks below have real dependencies. Follow the order; don't parallelize
01 → 02 or 04 → 05.

| # | Task | Priority | Depends on |
|---|---|---|---|
| 00 | [Master task + ground rules](00-master-task.md) | P0 | — |
| 01 | [Schema migrations](01-schema-migrations.md) | P0 | — |
| 02 | [Rewire Stripe webhook + retire System A](02-rewire-webhook-retire-system-a.md) | P0 | 01 |
| 03 | [Affiliate self-serve campaign endpoint](03-affiliate-campaign-selfserve.md) | P0 | 01 |
| 04 | [Booking rate stamping + webhook credit](04-booking-rate-stamping-and-credit.md) | P0 | 01, 02 |
| 05 | [Rate-edit flow + history + notifications](05-rate-edit-history-and-notifications.md) | P0 | 01 |
| 06 | [Revoked-link + archive behavior](06-revoked-link-and-archive-behavior.md) | P1 | 01 |
| 07 | [Reporting + dashboards + admin overrides](07-reporting-and-dashboards.md) | P1 | 01, 02, 04 |
| 08 | [Tests, RLS, sign-off](08-tests-rls-signoff.md) | P1 | 01–07 |

**Estimated size:** 1–2 week sprint depending on UI polish.

## Hard rules (apply to every task)

1. **Spec stays in sync.** Any task that changes behavior in the spec's
   scope MUST update `docs/specs/affiliate-commission-system.md` in the
   same commit, including a dated Changelog line.
2. **Additive migrations first.** Destructive steps (drop column, drop
   table) land in their own final migration, never mixed with additive
   work.
3. **Don't touch `social_advocates`.** Non-goal per the spec.
4. **No admin approval state machine.** Commissions auto-record to the
   final state. Reversal is a separate explicit action.
5. **Both notification channels always.** In-app + email for all seven
   notification kinds (§7 of the spec — includes `admin.override.*`).
6. **RLS + API filter together.** Tenant scoping lives in BOTH the
   query's WHERE clause and the RLS policy (CLAUDE.md §13 + §22).
7. **Rate-stamp commission at booking creation, not at webhook time.**
   Only `affiliate_accounts.status` is re-read at webhook (§5 Flow F
   step 3 of the spec). Everything else comes from the stamp.

## Sign-off gate

Before marking sprint complete:
- All 8 tasks' acceptance criteria pass.
- Test suite in task 08 runs green via `npm run test:affiliate-*`.
- Spec doc reflects every change landed.
- System A tables, endpoints, and library functions are gone from
  `git grep` searches.
