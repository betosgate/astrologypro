# Task 02 - Fix Post-Onboarding Navigation Refresh

- Status: Planned
- Priority: P0
- Area: Perennial Mandalism / Onboarding
- Primary File: `src/app/community/onboarding/page.tsx`

---

## Goal

Stop the infinite loop after successful PM onboarding completion by forcing the dashboard route to read fresh server-side state.

## Current Problem

After `POST /api/community/onboarding/complete` succeeds, the page currently performs a soft client navigation to:

```ts
router.push("/community");
```

That can reuse stale App Router layout state where `/community/layout.tsx` still thinks:

```ts
member.onboarding_completed === false
```

Then `OnboardingGuard` redirects back to `/community/onboarding`.

## Required Change

After the onboarding completion API returns success, replace soft navigation with a reliable refresh path.

Preferred immediate fix:

```ts
window.location.href = "/community";
```

Reason:

- It forces a fresh request
- `/community/layout.tsx` re-runs on the server
- The layout reads the updated `community_members.onboarding_completed = true`
- Access control remains DB-driven

## Important Guardrails

- Do not remove `OnboardingGuard`
- Do not change `/community/layout.tsx` access rules
- Do not set local client state as the source of truth
- Do not skip the API response check
- Do not redirect to `/community` before the API confirms success

## Suggested Implementation Detail

Add a short comment similar to the diviner onboarding page:

```ts
// Hard navigation forces /community/layout.tsx to read the fresh
// onboarding_completed flag instead of reusing stale App Router state.
window.location.href = "/community";
```

## Acceptance Criteria

- [ ] Successful onboarding completion uses hard navigation or an equally reliable server refresh path
- [ ] Failed API responses still show the existing error state
- [ ] No auth, membership, or onboarding guard is bypassed
- [ ] The user lands on `/community` after completion
- [ ] Refreshing `/community` after completion stays on dashboard

