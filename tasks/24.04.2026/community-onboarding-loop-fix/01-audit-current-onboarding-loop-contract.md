# Task 01 - Audit Current Onboarding Loop Contract

- Status: Planned
- Priority: P0
- Area: Perennial Mandalism / Onboarding / Dashboard Guard

---

## Goal

Confirm the current contract before changing behavior.

This task is read-only.

## Files To Inspect

- `src/app/community/onboarding/page.tsx`
- `src/app/api/community/onboarding/complete/route.ts`
- `src/app/community/layout.tsx`
- `src/components/community/onboarding-guard.tsx`
- `src/lib/auth/resolve-login-destination.ts`
- `src/app/onboarding/page.tsx`

## What To Confirm

1. Confirm onboarding submit calls:

   `POST /api/community/onboarding/complete`

2. Confirm the API update payload includes:

   `onboarding_completed: true`

3. Confirm the dashboard layout checks:

   `community_members.onboarding_completed`

4. Confirm incomplete members render the minimal community layout with:

   `OnboardingGuard`

5. Confirm `OnboardingGuard` redirects non-onboarding community routes back to:

   `/community/onboarding`

6. Confirm the PM onboarding page currently uses soft navigation:

   `router.push("/community")`

7. Compare with the diviner onboarding completion pattern, which uses hard navigation to avoid stale layout state.

## Expected Finding

The API persistence path should be valid, but the client navigation is likely stale because it does not force `/community/layout.tsx` to re-read the freshly updated `community_members` row.

## Acceptance Criteria

- [ ] The data source of truth is documented
- [ ] The redirect guard chain is documented
- [ ] The exact line causing stale navigation risk is identified
- [ ] No code is changed in this audit task

