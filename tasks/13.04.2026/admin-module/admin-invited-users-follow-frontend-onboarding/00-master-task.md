# Admin Invited Users Follow Frontend Onboarding Pack

## Objective

Define the rule that users invited by admin into any supported role must go through the same general frontend onboarding or stepper flow as users who came through the normal public signup path.

This applies across roles such as:

- `diviner`
- `trainee`
- `perennial_mandalism`
- `mystery_school`
- other invited roles where a frontend onboarding path exists

This pack is architecture and task writing only. It does not implement the feature.

## Current Repo Grounding

### Existing admin invite flow

The repo already has an admin invite entrypoint:

- `src/app/api/admin/invite-user/route.ts`

This route currently:

- invites a user by email
- stamps role metadata
- sets a redirect path through auth callback

### Existing post-login routing

The repo already has role-aware post-login routing in:

- `src/app/api/auth/post-login-redirect/route.ts`

This route already gates several roles by onboarding completion:

- `diviner`
- `trainee`
- `perennial_mandalism`

### Existing unified frontend signup architecture

The current source-of-truth signup architecture is already documented in:

- `tasks/13.04.2026/sign-up/00-master-task.md`

That document establishes the intended flow:

- basic signup
- role provisioning
- post-login onboarding gate
- dashboard access only after required onboarding

## Product Direction

Admin invitation should not create a second-class onboarding path.

The correct rule is:

1. admin can initiate account creation or invitation
2. the invited user accepts the invite
3. the user enters the same frontend role flow as a normal user of that role
4. the same onboarding-completed gates apply before dashboard access

## Workstreams

1. `01-admin-invite-to-role-flow-mapping.md`
2. `02-same-onboarding-gates-as-public-signup.md`
3. `03-stepper-prefill-and-invited-user-context.md`
4. `04-role-record-provisioning-and-first-login-state.md`
5. `05-admin-visibility-resend-and-exception-rules.md`

## Acceptance Standard

This feature set is complete only when:

- admin can invite supported roles
- invited users are routed into the same frontend onboarding path as self-signup users
- onboarding and completion gates remain authoritative
- admin can inspect invite status without bypassing the normal user journey

## Status

- `01-admin-invite-to-role-flow-mapping.md` — Done
- `02-same-onboarding-gates-as-public-signup.md` — Done
- `03-stepper-prefill-and-invited-user-context.md` — Done
- `04-role-record-provisioning-and-first-login-state.md` — Done
- `05-admin-visibility-resend-and-exception-rules.md` — Done
