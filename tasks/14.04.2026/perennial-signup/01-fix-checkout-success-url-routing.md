# 01 Fix Checkout Success URL Routing - 2026-04-14

- Status: Planned
- Priority: P0
- Owner: Backend
- Parent: `00-master-task.md`
- Task File: `tasks/14.04.2026/perennial-signup/01-fix-checkout-success-url-routing.md`

## Goal

Make the generic Stripe checkout route return users to the correct onboarding surface for their purchased product.

## Context

The failing QA path returned a Perennial signup payment to:

`/onboarding?session_id=...`

That route is for diviners. Perennial users should not enter it.

## Files To Change

| File | Change |
|---|---|
| `src/app/api/stripe/checkout/route.ts` | Build `success_url` from the resolved pricing `itemKey` |

## Required Behavior

Use the existing `itemKey` resolved from `pricing_plans.global_pricing`.

Expected routing:

```ts
const successPath =
  itemKey === "perennial_mandalism_community"
    ? "/perennial-signup/success?session_id={CHECKOUT_SESSION_ID}"
    : itemKey === "trainee_program"
      ? "/join/trainee/profile?session_id={CHECKOUT_SESSION_ID}"
      : "/onboarding?session_id={CHECKOUT_SESSION_ID}";
```

Then pass:

```ts
success_url: `${APP_URL}${successPath}`
```

## Guardrails

- Keep existing checkout metadata intact.
- Keep `type: "perennial_community_signup"` when `itemKey === "perennial_mandalism_community"`.
- Keep `type: "trainee_signup"` when `itemKey === "trainee_program"`.
- Do not change the legacy `src/app/api/perennial-signup/checkout/route.ts` unless QA proves the broken flow uses that route.

## Acceptance Criteria

- [ ] `perennial_mandalism_community` checkout sessions use a Perennial success/community path, not `/onboarding`.
- [ ] `trainee_program` checkout sessions use a trainee profile/onboarding path.
- [ ] Diviner checkout sessions still use `/onboarding`.
- [ ] Stripe metadata-based webhook routing remains unchanged.
