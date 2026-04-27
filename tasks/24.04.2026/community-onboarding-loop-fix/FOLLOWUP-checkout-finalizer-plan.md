# Follow-Up Plan — PM Checkout Finalizer Architecture

> Status: Proposal (not part of the P0 loop hotfix)
> Author: 2026-04-24 (`community-onboarding-loop-fix` / Task 05)
> Area: Perennial Mandalism / Payment / Membership Activation

The P0 loop has been fixed by a single-line navigation change on
`src/app/community/onboarding/page.tsx`. This document proposes the
larger cleanup that Task 05 requires — it is intentionally scoped *out*
of the loop hotfix so that hotfix can ship and be rolled back
independently.

---

## Current State (as of 2026-04-24)

PM checkout + membership activation currently has three concurrent paths,
each with its own success URL and its own provisioning assumptions:

| Path | Entry | Success URL | Provisioning |
|---|---|---|---|
| A | `/get-started` → `/api/stripe/checkout` with `purpose = perennial_community_signup` | (configured in that route) | Stripe webhook creates/updates `community_members` |
| B | `/api/community/checkout` with `type = community` | (configured in that route) | Stripe webhook path |
| C (legacy) | `/perennial-signup` → `/api/perennial-signup/checkout` with `purpose = perennial_signup` → `/perennial-signup/success` | `/perennial-signup/success` | Same webhook path |

### Webhook race

Stripe Checkout can return the browser to the app **before** the webhook
has finished creating or updating the `community_members` row. When the
user then lands on `/community` (or the current success page), the row
either (a) doesn't exist yet, or (b) exists but has
`onboarding_completed = false` / `membership_status = incomplete`.
Current UI reacts by redirecting the user somewhere (often back to the
signup flow) — confusing for a user who just paid.

### Ad-hoc success copy

`/perennial-signup/success` is a static page. It does not verify the
Stripe session, it does not poll for webhook completion, and it does not
decide where the user should go next based on DB state.

---

## Desired Future Contract

```
Stripe Checkout session completes
  ↓
Browser redirected to: /community/checkout/success?session_id=cs_...
  ↓
Server Component (or Route Handler) /community/checkout/success:
  1. Read session_id from query
  2. Verify with Stripe: retrieve session, assert payment_status=paid
     and session.mode matches what we expected
  3. Read community_members row for auth.uid()
     - if missing, short-poll the webhook (up to ~5s, exponential) —
       webhook-created rows usually land within ~1s of Stripe's
       checkout.session.completed event
     - if still missing, call the reconcile path (see §reconcile)
  4. Read membership_status and onboarding_completed
  5. Decide destination deterministically:
       membership_status != 'active'           → show "activating" state
       onboarding_completed === false          → redirect /community/onboarding
       onboarding_completed === true           → redirect /community
  6. Respect Idempotency-Key: repeated visits to the same success URL
     must do the same thing (never double-provision, never reset
     onboarding_completed, never re-charge).
```

### Reconcile path

If the webhook hasn't landed within the poll budget, the success page
should fall back to a synchronous reconciliation endpoint that does
server-to-server what the webhook would do. Same idempotency keys, same
DB writes, same auditability. Running the reconcile is safe because the
webhook handler is itself idempotent (keyed by `stripe_session_id`
and/or `stripe_subscription_id`).

The reconcile path is **not** a replacement for the webhook — it's a
tie-breaker for the race. The webhook remains the normal path of
record, and the reconcile either no-ops (row already present) or
catches up.

---

## Files In Scope

| File | Role in future contract |
|---|---|
| `src/app/get-started/page.tsx` | All PM signups should funnel through this page; set `success_url = /community/checkout/success?session_id={CHECKOUT_SESSION_ID}`. |
| `src/app/api/stripe/checkout/route.ts` | Centralise PM success URL + cancel URL. Enforce a single `purpose` value per product. |
| `src/app/api/stripe/webhooks/route.ts` | Remain the canonical provisioning path. No change except adding correlation IDs so the reconcile path can prove idempotency. |
| `src/app/api/community/checkout/route.ts` | Deprecate or collapse into `/api/stripe/checkout` — having two PM checkout entry routes is the root of most confusion. |
| `src/app/perennial-signup/page.tsx` + `/perennial-signup/success/page.tsx` | Mark legacy. Add a visible banner in admin mode; redirect public traffic to `/get-started`. Keep the routes for backward-compat links for one release cycle, then remove. |
| **new** `src/app/community/checkout/success/page.tsx` | The canonical finalizer page described above. |
| **new** `src/app/api/community/checkout/reconcile/route.ts` | The tie-breaker endpoint. POST `{ sessionId }`, returns the resolved `community_members` row state. |
| `src/app/community/layout.tsx` | No change — it remains the DB-driven dashboard guard. The finalizer redirects to `/community` only when the DB says the user is ready. |
| `src/app/community/onboarding/page.tsx` | P0 fix already in. Future: consider moving the hard-nav up one level to the finalizer so the onboarding page can stay SPA-like. Low priority. |

---

## Design Answers

1. **Canonical production path:** `/get-started` → `/api/stripe/checkout` (purpose `perennial_community_signup`). `/perennial-signup` becomes legacy.
2. **Should `/perennial-signup` stay?** Legacy-only for one release. Admin-created onboarding can continue using it until the admin flow is migrated.
3. **Finalizer page vs. static success?** Finalizer page. Static copy has no way to decide the right next hop.
4. **Should the finalizer verify the Stripe session?** Yes — session id is user-supplied in the URL, so verify `payment_status === "paid"` and `customer === current_user_mapping` before acting.
5. **Retry-while-webhook-landing?** Yes. Short exponential poll (e.g. 250ms, 500ms, 1s, 2s — cap ~5s wall clock). Fall back to the reconcile endpoint.
6. **Idempotent repeat visits?** Yes, keyed by `stripe_session_id`. The reconcile endpoint uses `ON CONFLICT` / existence checks — never double-provisions.

---

## Guardrails Preserved

- No Stripe verification bypass (always re-check session against Stripe, never trust query params).
- Never create duplicate `community_members` rows for the same `user_id` + `membership_type`.
- Never overwrite `onboarding_completed = true` back to false.
- Never remove `OnboardingGuard` or the layout-level `onboarding_completed` check — the finalizer just helps the user *reach* the right page; the DB-driven guards still enforce access.
- No merging of this cleanup into the P0 loop hotfix unless strictly necessary (currently: not necessary — the one-line navigation fix is sufficient to stop the loop).

---

## Implementation Plan (phased)

Each phase is a separate PR:

1. **Phase 1 — Finalizer skeleton (behind flag).**
   - Add `/community/checkout/success/page.tsx` + `/api/community/checkout/reconcile/route.ts`, gated by env `PM_FINALIZER_ENABLED=true`.
   - Wire `/api/stripe/checkout` so PM purpose writes `success_url = /community/checkout/success?session_id={CHECKOUT_SESSION_ID}` **only when the flag is set**.
   - Ship no-op to prod with flag off.

2. **Phase 2 — Turn the flag on for a staging tenant, measure webhook vs. redirect latency.**
   - Add correlation IDs to the webhook handler and the finalizer so we can join logs.
   - Tune the poll budget.

3. **Phase 3 — Enable in prod for new signups. Legacy `/perennial-signup/success` starts redirecting to `/community/checkout/success?session_id=...` when a session id is present.**

4. **Phase 4 — Collapse `/api/community/checkout` into `/api/stripe/checkout`. Single canonical entry. Remove the flag.**

5. **Phase 5 — Retire `/perennial-signup` for public traffic. Admin flow migrated, legacy route returns a 301.**

Each phase has its own small task sheet; none of them depend on the P0 hotfix being rolled back.

---

## Exit Criteria for This Follow-Up

- A canonical PM checkout success route exists (`/community/checkout/success`).
- The webhook race is handled by short-poll + reconcile fallback, not by user-visible redirects.
- Repeat visits to the success URL are idempotent.
- Only one PM checkout entry route remains.
- The onboarding loop hotfix (this day's P0 change) remains unchanged by the finalizer rollout.
