# Implementation Guide - 2026-04-24 Affiliate Identity Follow-Ups

## READ THIS FIRST

This folder contains follow-up tasks created from repo verification of the 2026-04-23 affiliate identity refactor.

- Task folder: `docs/tasks/2026-04-24/affiliate-identity-followups/`
- Created: 2026-04-24
- Scope: close the remaining implementation and verification gaps found after reviewing the shipped code against `docs/tasks/2026-04-23/affiliate-identity-refactor/`

## Execution Order

Complete the P0 tasks first, then move through the P1 tasks in order.

| Step | Task File | Priority | Summary |
|---|---|---|---|
| 1 | `affiliate-identity-followups/00-master-task.md` | P0 | Entry point and shared rules for this follow-up set. |
| 2 | `affiliate-identity-followups/01-fix-accept-flow-existing-user-branch.md` | P0 | Fix accept flow so already-registered users with matching invite email can claim without duplicate-user failure. |
| 3 | `affiliate-identity-followups/02-add-affiliate-identity-v2-flag-and-gating.md` | ~~P0~~ OBSOLETE | Superseded by commit 0a356268 — the refactor ships unconditionally, no flag. |
| 4 | `affiliate-identity-followups/03-complete-affiliate-portal-surfaces.md` | ~~P1~~ DEFERRED | Nothing broken today; re-evaluate when a real ask appears. |
| 5 | `affiliate-identity-followups/04-close-affiliate-test-coverage-gaps.md` | ~~P1~~ NARROWED | Task 01 regression guard landed; rest deferred. |

## Verification Baseline

The follow-up audit checked the live repo state on 2026-04-24 against the 2026-04-23 task folder and found:

- Schema and RPC work is present for canonical `affiliate_accounts`, invites, and accept consumption.
- `npm run test:affiliate-invite-rpc` passed.
- `npm run test:affiliate-accept-rpc` passed.
- The accept route still mishandles the "existing auth user but unlinked canonical account" branch.
- ~~The documented `AFFILIATE_IDENTITY_V2` feature flag and route/UI gating are not implemented.~~ Intentionally dropped — commit 0a356268 ships the refactor unconditionally.
- Several affiliate portal/API surfaces from Task 05 are still missing — confirmed not reachable by users and not causing runtime errors; Task 03 deferred.
- Most of the test matrix described in Task 07 is still not present in the repo — Task 04 narrowed to the Task 01 regression guard (landed 2026-04-24); rest deferred.

## Start Here

1. Read this README.
2. Read `docs/tasks/2026-04-24/affiliate-identity-followups/00-master-task.md`.
3. Re-read the relevant 2026-04-23 task docs before implementation.
4. Execute the child tasks in order.
