# Task 05 - Follow-Up Checkout Finalizer Architecture

- Status: Planned
- Priority: P1
- Area: Perennial Mandalism / Payment / Membership Activation

---

## Goal

Plan the larger full-stack cleanup separately from the immediate onboarding loop fix.

This is not required to stop the current loop, but it should be tracked because PM payment success currently has multiple paths and possible webhook timing races.

## Current Risk

Stripe Checkout can return the browser to the app before the webhook has finished creating or updating the `community_members` row.

Current PM-related paths include:

- `/get-started` -> `/api/stripe/checkout` -> `perennial_community_signup`
- `/api/community/checkout` -> `type = community`
- legacy `/perennial-signup` -> `/api/perennial-signup/checkout` -> `perennial_signup`

These paths use different success URLs and different provisioning assumptions.

## Desired Future Contract

Create a dedicated PM checkout success/finalizer flow:

```text
Stripe success
-> verify checkout session
-> confirm or reconcile membership activation
-> read community_members state
-> if onboarding_completed=false, route to /community/onboarding
-> if onboarding_completed=true, route to /community
```

## Investigation Scope

- `src/app/get-started/page.tsx`
- `src/app/api/stripe/checkout/route.ts`
- `src/app/api/stripe/webhooks/route.ts`
- `src/app/api/community/checkout/route.ts`
- `src/app/perennial-signup/page.tsx`
- `src/app/perennial-signup/success/page.tsx`
- `src/app/community/onboarding/page.tsx`
- `src/app/community/layout.tsx`

## Design Questions

1. Which PM signup path is the canonical production path?
2. Should `/perennial-signup` remain active or become legacy/admin-only?
3. Should first-time PM checkout success land on a finalizer page instead of static success copy?
4. Should the finalizer call an API endpoint to verify the Stripe session?
5. Should the finalizer retry briefly while waiting for webhook-created membership rows?
6. Should repeated checkout success visits be idempotent?

## Guardrails

- Do not bypass Stripe verification
- Do not trust query params alone
- Do not create duplicate `community_members` rows
- Do not overwrite completed onboarding back to false
- Do not merge this architecture cleanup into the P0 loop hotfix unless strictly necessary

## Acceptance Criteria

- [ ] A canonical PM checkout success route is proposed
- [ ] Webhook race behavior is documented
- [ ] Idempotent finalization behavior is documented
- [ ] The implementation plan is split into small follow-up tasks
- [ ] The immediate onboarding loop fix remains small and isolated

