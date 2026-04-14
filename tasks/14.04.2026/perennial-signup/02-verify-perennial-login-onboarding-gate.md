# 02 Verify Perennial Login Onboarding Gate - 2026-04-14

- Status: Planned
- Priority: P0
- Owner: Full-stack
- Parent: `00-master-task.md`
- Task File: `tasks/14.04.2026/perennial-signup/02-verify-perennial-login-onboarding-gate.md`

## Goal

Confirm that after payment and login, an incomplete Perennial user is routed to the Perennial profile completion flow, not diviner onboarding.

## Files To Inspect

| File | What to verify |
|---|---|
| `src/lib/auth/resolve-login-destination.ts` | Active Perennial members with `onboarding_completed = false` route to `/community/onboarding` |
| `src/app/community/onboarding/page.tsx` | This is the Perennial profile completion surface |
| `src/app/onboarding/page.tsx` | Diviner-only route; Perennial users should not enter this route |

## Required Behavior

For a user with:

```text
community_members.membership_type = 'perennial_mandalism'
community_members.membership_status = 'active'
community_members.onboarding_completed = false
```

the login resolver must return:

`/community/onboarding`

For the same user after onboarding completion, it must return:

`/community`

## Guardrails

- Do not route Perennial users to `/onboarding`.
- Do not create a separate new Perennial onboarding route if `/community/onboarding` already handles the flow.
- Do not weaken diviner, trainee, mystery school, or client routing.

## Acceptance Criteria

- [ ] Incomplete active Perennial users are gated to `/community/onboarding`.
- [ ] Completed active Perennial users can enter `/community`.
- [ ] Perennial routing does not depend on diviner records.
- [ ] No redirect loop occurs on refresh.
