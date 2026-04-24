# Task 02 - Add Affiliate Identity V2 Flag and Gating - 2026-04-24

- Status: OBSOLETE (2026-04-24) — do not implement
- Priority: ~~P0~~
- Depends On: none
- Blocks: ~~safe rollout~~

## Obsolete

This task is superseded by commit `0a356268` ("Remove feature flag gates for
affiliate and landing-page V2", 2026-04-24). The affiliate identity refactor
ships unconditionally — there is no `AFFILIATE_IDENTITY_V2` flag, no
`isAffiliateIdentityV2Enabled()` helper, and no 503 guards. Reintroducing any
of this would undo an intentional decision.

If a future rollout/rollback capability is needed, open a new task rather
than revive this one — the scope, justification, and affected surfaces have
all moved on since this was written.

Original task content preserved below for historical context only.

---

## Problem

The 2026-04-23 verification report explicitly required a dedicated rollout flag for the refactor, but the repo currently has no `isAffiliateIdentityV2Enabled()` implementation and no consistent route/UI gating.

That means the refactor cannot be safely rolled out or rolled back using the documented plan.

## Required Outcome

Implement the missing `AFFILIATE_IDENTITY_V2` gate exactly once and apply it to the affiliate identity surfaces documented in the 2026-04-23 verification report.

## Scope

### Add

- a single feature-flag helper in the project’s current flag location
- one shared helper for routes to return a 503 Problem response when the flag is off, if useful

### Gate

- new invite/accept endpoints
- affiliate portal APIs under `/api/affiliate/*`
- affiliate portal visibility in `getUserPortals()`
- `/affiliate/*` access in `src/proxy.ts`, except for the public referral page and accept flow

### Preserve

- `/affiliate/[code]` remains public
- `/affiliate/accept/[token]` remains public
- diviner-side invite-only UI change remains permanent even when the flag is off

## Verification

- Flag off in prod-like env -> gated APIs return 503
- Flag off -> affiliate tile is hidden from the switcher
- Flag off -> gated `/affiliate/*` routes do not remain publicly reachable
- Flag on -> current affiliate identity behavior still works

## Suggested Files

- `src/lib/feature-flags.ts`
- `src/lib/user-roles.ts`
- `src/proxy.ts`
- `src/app/api/dashboard/affiliates/invite/route.ts`
- `src/app/api/dashboard/affiliates/invite/[inviteId]/resend/route.ts`
- `src/app/api/dashboard/affiliates/invite/[inviteId]/revoke/route.ts`
- `src/app/api/dashboard/affiliates/invite/junction/[junctionId]/resend/route.ts`
- `src/app/api/affiliate/*`
