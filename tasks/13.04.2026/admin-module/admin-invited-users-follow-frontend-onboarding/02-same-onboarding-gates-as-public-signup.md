# 02 Same Onboarding Gates as Public Signup

## Goal

Ensure admin-invited users are subject to the same onboarding-completion gates as normal frontend users.

## Product Rule

Being invited by admin must not bypass:

- onboarding stepper
- required profile completion
- role-specific intake requirements

## Current Repo Grounding

The repo already has onboarding-completion checks in:

- `src/app/api/auth/post-login-redirect/route.ts`

This is the right enforcement layer.

## Deliverables

- parity rules between invited and self-signup users
- onboarding gate requirements by role
- no-bypass principle

## Status

Done.

`src/app/api/auth/post-login-redirect/route.ts` now keeps invite-origin users behind the same incomplete-onboarding gates as self-signup users for `diviner`, `trainee`, `perennial_mandalism`, and `social_advo`, while preserving invited destinations instead of bypassing straight into dashboards.
