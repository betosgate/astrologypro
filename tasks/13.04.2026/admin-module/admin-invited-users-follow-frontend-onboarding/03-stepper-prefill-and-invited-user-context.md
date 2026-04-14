# 03 Stepper Prefill and Invited User Context

## Goal

Define how the frontend stepper should behave when the user arrived through an admin invite.

## Recommended Rule

The stepper should be the same flow, but it may be prefilled with known invite context such as:

- role
- invited email
- display name if known
- assigned plan or package if already chosen

The user experience should feel native, not like a separate admin shortcut flow.

## Deliverables

- prefill rules
- invited-user context flags
- frontend copy rules for invited users

## Status

Done.

Invited routes now carry a canonical `?invited=true` flag via `src/lib/invite-destinations.ts`, and invited-context copy is rendered on the real onboarding screens in `src/app/onboarding/page.tsx`, `src/app/join/trainee/profile/page.tsx`, and `src/app/community/onboarding/page.tsx`. Existing prefill behavior continues to source known user and membership data from auth metadata and onboarding prefill APIs.
