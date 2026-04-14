# Master Task - Perennial Signup Post-Payment Routing Fix - 2026-04-14

- Status: Planned
- Priority: P0
- Owner: Full-stack
- Scope: Perennial signup checkout routing, post-login onboarding gate verification, diviner services upsert schema guard, QA
- Task File: `tasks/14.04.2026/perennial-signup/00-master-task.md`

---

## Problem

During Perennial signup QA, after completing payment the browser landed on:

`/onboarding?session_id=...&step=2`

That route is the diviner onboarding flow, not the Perennial profile completion flow. The user then reached diviner onboarding step 2 and triggered a Supabase/PostgREST error:

```json
{
  "code": "42P10",
  "message": "there is no unique or exclusion constraint matching the ON CONFLICT specification"
}
```

The failing request was:

```text
POST /rest/v1/services?on_conflict=diviner_id%2Cslug
```

This indicates two issues:

1. Perennial checkout is returning to the wrong product onboarding route.
2. Diviner service upsert expects a unique constraint on `services(diviner_id, slug)` that does not exist.

## Goal

Fix the Perennial signup path so Perennial users never enter diviner onboarding after payment, while also making the diviner services upsert schema-safe for the diviner flow.

## Expected Architecture

| Flow | Expected post-payment route | Expected post-login route |
|---|---|---|
| Diviner / professional course | `/onboarding?session_id=...` | `/onboarding` until diviner setup completes |
| Trainee-only | `/join/trainee/profile?session_id=...` or equivalent trainee success route | `/join/trainee/profile` until trainee profile completes |
| Perennial Mandalism | `/perennial-signup/success?session_id=...` or `/community/onboarding?subscribed=true` | `/community/onboarding` until Perennial profile completes |

## Sub-Tasks

| # | File | What to do | Depends on | Status |
|---|---|---|---|---|
| 01 | `01-fix-checkout-success-url-routing.md` | Route Stripe checkout success URLs by pricing `itemKey` so Perennial does not return to `/onboarding` | - | Planned |
| 02 | `02-verify-perennial-login-onboarding-gate.md` | Verify incomplete active Perennial users route to `/community/onboarding` after login | 01 | Planned |
| 03 | `03-add-services-diviner-slug-unique-index.md` | Add safe DB migration for `services(diviner_id, slug)` upsert support | - | Planned |
| 04 | `04-end-to-end-qa-checklist.md` | Retest Perennial signup with a fresh Stripe session and verify diviner regression coverage | 01, 02, 03 | Planned |

## Implementation Notes

- Do not reuse an old Stripe checkout link while testing; old Stripe sessions keep their embedded `success_url`.
- Do not route Perennial users to `/onboarding`.
- Do not remove the diviner services upsert unless the diviner onboarding architecture is intentionally changed.
- Do not auto-delete duplicate `services` rows in a migration without reviewing bookings or related references.
- Do not modify the legacy direct `/perennial-signup` household checkout flow unless QA confirms the failing path uses it.

## Acceptance Criteria

- [ ] Perennial checkout no longer redirects to `/onboarding`.
- [ ] Perennial users with incomplete profile data are routed to `/community/onboarding`.
- [ ] Perennial signup does not call the `services` table during profile completion.
- [ ] Diviner onboarding service save no longer throws Postgres error `42P10`.
- [ ] A fresh Stripe checkout session is used for verification.
- [ ] Existing diviner, trainee, and Perennial webhook metadata routing remains intact.
- [ ] If duplicate `services(diviner_id, slug)` rows exist, cleanup is handled explicitly before the unique index is applied.
