# Master Task - Affiliate Identity Follow-Ups - 2026-04-24

- Status: Not Started
- Priority: P0
- Parent Folder: `docs/tasks/2026-04-24/affiliate-identity-followups`
- Depends On: 2026-04-23 affiliate identity refactor work being present in the repo

## Purpose

Close the remaining gaps discovered after auditing the implemented 2026-04-23 affiliate identity refactor against its own task docs and verification report.

This is a follow-up sprint, not a redesign. The canonical data model introduced on 2026-04-23 stays in place:

- `affiliate_accounts` remains the canonical identity table.
- `affiliate_invites` remains the invite-token table.
- `diviner_affiliates.id` remains the downstream FK target for commissions, payouts, assignments, and analytics.

## Findings That Created This Folder

1. The accept flow does not correctly handle the "existing auth user with matching invite email but unlinked canonical account" branch.
2. ~~The documented `AFFILIATE_IDENTITY_V2` rollout flag and gating rules are missing.~~ Intentionally dropped — commit 0a356268 (2026-04-24) ships the refactor unconditionally. Task 02 is obsolete.
3. ~~The affiliate portal is only partially implemented relative to Task 05.~~ Confirmed on 2026-04-24: no user-reachable gaps and no runtime errors. Task 03 deferred pending real demand.
4. The seed/test work is partially implemented, but most of Task 07's coverage matrix is still absent. → Task 04 narrowed 2026-04-24: Task 01 regression guard landed, rest deferred.

## Execution Order

| Step | Task File | Priority | Blocks |
|---|---|---|---|
| 1 | `01-fix-accept-flow-existing-user-branch.md` | P0 | 02, 04 |
| 2 | `02-add-affiliate-identity-v2-flag-and-gating.md` | ~~P0~~ OBSOLETE | Superseded by commit 0a356268 (2026-04-24) — no flag, ships unconditionally. |
| 3 | `03-complete-affiliate-portal-surfaces.md` | ~~P1~~ DEFERRED | — |
| 4 | `04-close-affiliate-test-coverage-gaps.md` | ~~P1~~ NARROWED | — |

## Non-Negotiable Rules

1. Preserve D5 from the 2026-04-23 README: no silent email-based linking outside the explicit invite accept path.
2. Do not remove or rename the canonical affiliate tables introduced on 2026-04-23.
3. Keep response shapes additive where the diviner/admin UI already depends on flat affiliate fields.
4. ~~Gate all new affiliate-identity behavior behind the missing rollout flag before calling the refactor complete.~~ No longer applies — see Task 02 (obsolete).
5. Prefer extending the current implementation over introducing parallel routes or duplicate flag systems.

## Acceptance Criteria

- The accept flow works for all three branches: new sign-up, existing sign-in, already-signed-in matching user.
- ~~The new affiliate identity surfaces honor the rollout flag exactly as specified in the 2026-04-23 verification report.~~ No longer applies — commit 0a356268 ships the refactor unconditionally.
- ~~Task 05's missing affiliate pages and APIs are either implemented or explicitly re-scoped in the task docs.~~ Re-scoped: Task 03 deferred (see its doc for the 2026-04-24 audit).
- ~~Task 07's missing verification coverage is present and runnable from `package.json`.~~ Narrowed to: Task 01 regression guard (`npm run test:affiliate-accept-existing-user`). Rest deferred.

## References

- `docs/tasks/2026-04-23/affiliate-identity-refactor/README.md`
- `docs/tasks/2026-04-23/affiliate-identity-refactor/00-verification-report.md`
- `docs/tasks/2026-04-23/affiliate-identity-refactor/03-accept-flow.md`
- `docs/tasks/2026-04-23/affiliate-identity-refactor/05-affiliate-portal.md`
- `docs/tasks/2026-04-23/affiliate-identity-refactor/07-seeds-fixtures-and-tests.md`
