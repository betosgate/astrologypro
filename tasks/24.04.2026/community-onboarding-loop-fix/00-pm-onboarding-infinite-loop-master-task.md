# Master Task - PM Onboarding Infinite Loop Fix

- Status: Planned
- Priority: P0
- Area: Perennial Mandalism / Signup / Payment / Onboarding / Dashboard Access
- Signup Route: `/get-started`
- Onboarding Route: `/community/onboarding`
- Dashboard Route: `/community`

---

## Goal

Stop the Perennial Mandalism onboarding/profile completion infinite loop after successful payment and onboarding completion.

The immediate production fix must preserve the existing project fundamentals:

- `community_members.onboarding_completed` remains the source of truth
- `/community/layout.tsx` remains the dashboard access guard
- `/api/community/onboarding/complete` remains the persistence endpoint
- no bypass of membership, auth, payment, or onboarding validation

## Current Observed Bug

After successful PM checkout:

1. User completes payment
2. User is routed into `/community/onboarding`
3. User completes the onboarding form
4. API saves the profile and sets `community_members.onboarding_completed = true`
5. Client uses soft navigation to `/community`
6. The stale `/community` layout can still behave as if `onboarding_completed = false`
7. `OnboardingGuard` redirects the user back to `/community/onboarding`
8. User is trapped in the onboarding loop

## Likely Root Cause

The data write is likely correct, but the client navigation after completion is too soft.

`src/app/community/onboarding/page.tsx` currently does `router.push("/community")` after successful save.

Because `/community/layout.tsx` is a server component that decides access based on `community_members.onboarding_completed`, the browser must force the server tree to read the fresh database state after the save.

This same pattern already exists in the diviner onboarding flow, which uses hard navigation after completion to avoid stale layout state.

## Non-Goals

- Do not remove `/community/layout.tsx` onboarding protection
- Do not skip `onboarding_completed`
- Do not trust only client-side state
- Do not disable `OnboardingGuard`
- Do not redesign the onboarding form
- Do not implement the full checkout finalizer in the immediate fix

## Task Breakdown

1. `01-audit-current-onboarding-loop-contract.md`
   Confirm the exact current data and redirect contract before editing.

2. `02-fix-post-onboarding-navigation-refresh.md`
   Replace the stale soft navigation with a reliable server-state refresh path.

3. `03-verify-onboarding-complete-persistence.md`
   Confirm the API persists `onboarding_completed = true` and does not fail silently.

4. `04-regression-and-qa-checklist.md`
   Verify the fixed first-time PM onboarding path and key edge cases.

5. `05-follow-up-checkout-finalizer-architecture.md`
   Document the separate full-stack cleanup for payment success finalization and webhook race handling.

## Acceptance Criteria

- [ ] Completing `/community/onboarding` no longer returns the user to onboarding
- [ ] `/community/layout.tsx` still blocks users whose `onboarding_completed` is false
- [ ] The fix does not bypass DB-driven access control
- [ ] A completed member lands on `/community` with the full dashboard layout
- [ ] The larger payment finalizer cleanup is tracked separately and not mixed into the loop hotfix

