# Task 04 - Close Affiliate Test Coverage Gaps - 2026-04-24

- Status: NARROWED (2026-04-24) — Task 01 regression guard landed, rest deferred
- Priority: ~~P1~~ (re-evaluate when a real ask appears)
- Depends On: ~~Tasks 01-03~~ (Task 02 obsolete, Task 03 deferred)
- Blocks: ~~sign-off~~

## Rescope Note (2026-04-24)

Since the parent sprint collapsed — Task 02 dropped to obsolete, Task 03
deferred, Task 01 shipped — the original matrix here is mostly covering
code paths that either no longer exist (the V2 flag) or aren't reachable
to users (the unbuilt portal surfaces). Building all 13 test files on
spec would be chart-ticking.

### Landed

- `tests/integration/affiliate-accept-existing-user-branch.test.ts` —
  regression guard for the Task 01 accept-flow fix (existing auth user
  with `affiliate_accounts.user_id` NULL). Wired up as
  `npm run test:affiliate-accept-existing-user` in `package.json`.

  While writing this test, `admin.auth.admin.listUsers` was found to
  error with "Database error finding users" on page 2 of the dev
  Supabase Auth endpoint. The helper was rewritten to use the existing
  `get_auth_users_info()` SECURITY DEFINER RPC instead (same pattern as
  `src/app/admin/*`). The fix is in `src/app/api/affiliate/accept/route.ts`.

### Deferred

Everything else on the original list below. Pick up specific items only
when an incident or user-facing gap justifies the work.

Original task content preserved below for historical context only.

---

## Problem

The repo currently has seed updates and two RPC integration tests, but most of the test matrix promised by the 2026-04-23 task set is still missing.

## Present Today

- `tests/integration/affiliate-invite-rpc.test.ts`
- `tests/integration/affiliate-accept-rpc.test.ts`
- `scripts/seed-affiliate-accounts.mjs`
- affiliate personas documented in `docs/test-users.md`

## Still Missing

### Unit coverage

- affiliate account helper tests
- invite route tests
- accept route tests
- rate-limit tests

### Integration coverage

- backfill/migration verification
- full route-level invite flow
- full route-level accept flow
- RLS coverage
- downstream-reader response-shape coverage
- shipped-invariant regression coverage

### E2E coverage

- invite -> accept (new user)
- invite -> accept (existing user)
- mismatch branch
- multi-diviner portal
- affiliate portal authz
- pending resend flow
- blocked account flow

## Required Outcome

Add the missing runnable coverage and wire it into `package.json` scripts using the repo’s `tsx --test` convention.

## Verification

- New affiliate test scripts exist in `package.json`
- The route-level tests cover the existing-user accept branch fixed in Task 01
- E2E coverage exists for at least the core happy paths and highest-risk auth branches
- Tests are named and organized consistently with the repo’s current structure

## Suggested Files

- `tests/unit/lib/affiliate-accounts.test.ts`
- `tests/unit/api/dashboard/affiliates/invite.test.ts`
- `tests/unit/api/affiliate/accept.test.ts`
- `tests/unit/lib/rate-limit.test.ts`
- `tests/integration/affiliate-identity-migration.test.ts`
- `tests/integration/invite-flow.test.ts`
- `tests/integration/accept-flow.test.ts`
- `tests/integration/rls-affiliate-accounts.test.ts`
- `tests/integration/downstream-readers.test.ts`
- `tests/integration/shipped-invariants.test.ts`
- `tests/e2e/affiliate-invite-accept-new.spec.ts`
- `tests/e2e/affiliate-invite-accept-existing.spec.ts`
- `tests/e2e/affiliate-multi-diviner-portal.spec.ts`
