# Perennial Payment Flow Contract And Stripe Lifecycle

- Completion Notes: Implemented. Lifecycle: (1) page POST -> /api/perennial-signup/checkout -> insert pending_perennial_signups row + create Stripe Checkout session -> redirect to Stripe. (2) Stripe completes payment -> checkout.session.completed webhook -> handlePerennialSignupCheckoutCompleted reads the pending row by stripe_session_id, calls provisionPerennialHousehold which generates strong passwords (12+ chars, mixed-case, digit, special) via crypto.randomBytes, creates auth users with email_confirm=true, upserts community_members + community_family_members rows, and emails credentials. The pending row is marked completed (or failed with error_message). Idempotent — re-running the webhook is a no-op once status=completed. Couple plan is gated on STRIPE_PRICE_COMMUNITY_COUPLE env var: returns 503 with the missing_env name until configured. Single + Family work as soon as migration 20260408000115 has been applied.
- Earlier deferred-notes: NOT IMPLEMENTED — deferred. Requires the Couple Stripe price + a checkout-session-style endpoint + webhook hooks for post-payment provisioning. This is the largest single piece of remaining perennial work and needs its own focused session.
- Status: Completed (2026-04-08)
- Date: 2026-04-08
- Category: Perennial Signup
- Owner: Fullstack
- Priority: P0
- Task File: `tasks/08.04.2026/perennial/09-payment-flow-contract-and-stripe-lifecycle.md`

## Goal

Make the Perennial payment flow explicit enough that the implementing AI does not invent checkout behavior, account-provisioning timing, or redirect logic.

This file is the payment-source-of-truth companion to the Perennial frontend task set.

## Why This File Exists

The current Perennial task pack already defines the business outcome:

1. full household signup happens before payment
2. membership activates only after successful payment
3. all member accounts are created only after successful payment
4. generated credentials are emailed after successful payment

But that is not yet sufficient to guarantee a one-run implementation.

The implementing AI also needs an explicit payment contract:

1. how checkout starts
2. what data is sent
3. where signup data lives before payment success
4. what happens on success
5. what happens on cancel/failure
6. what backend mechanism is authoritative for post-payment provisioning

## Canonical Payment Model

Use a Stripe-hosted checkout lifecycle unless a newer explicit instruction replaces it.

For this implementation pack, the intended model is:

1. user completes household signup form
2. user reviews household + plan + pricing
3. frontend sends a payment-init request with the full normalized household payload
4. backend stores pre-payment signup payload in a pending state
5. backend creates a Stripe Checkout session
6. frontend redirects user to Stripe Checkout
7. Stripe success returns to a dedicated Perennial success/finalization route
8. Stripe cancel returns to a dedicated Perennial cancel/recovery route
9. final account creation and membership activation happen only after verified successful payment

## Stripe Env Dependency

The confirmed Perennial pricing model requires separate Stripe prices for:

1. `Single`
2. `Couple`
3. `Family`

That means the implementation should expect these env vars:

1. `STRIPE_PRICE_COMMUNITY_INDIVIDUAL`
2. `STRIPE_PRICE_COMMUNITY_COUPLE`
3. `STRIPE_PRICE_COMMUNITY_FAMILY`

Current repo state:

1. `STRIPE_PRICE_COMMUNITY_INDIVIDUAL` exists in `.env.local`
2. `STRIPE_PRICE_COMMUNITY_FAMILY` exists in `.env.local`
3. `STRIPE_PRICE_COMMUNITY_COUPLE` is currently missing and must be added manually later

Until that missing env var exists, the `Couple` payment path cannot be fully wired end-to-end.

## Preferred Stripe Pattern

Preferred implementation pattern:

1. Stripe Checkout for the payment collection step
2. webhook-driven payment confirmation as the backend source of truth
3. frontend success page should reflect verified successful payment/finalization, not assume success merely because the browser returned

## Required Flow Stages

### Stage 1: Household Signup Completion

Before payment starts, the user completes:

1. plan selection
2. primary member form
3. additional member forms
4. optional questionnaire sections
5. review confirmation

The frontend must not initiate payment with an invalid household payload.

### Stage 2: Payment Initialization

The frontend must call a dedicated Perennial payment-init endpoint.

The init payload must contain:

1. selected plan
2. normalized primary member payload
3. normalized additional member payloads
4. billing-owner designation
5. questionnaire payload
6. total household member count
7. expected monthly amount

## Pending Signup Persistence Rule

Before redirecting to Stripe, the backend must persist the pending Perennial signup payload in a recoverable pre-payment state.

Reason:

1. household form is long
2. multiple accounts are being provisioned after payment
3. success/failure/cancel recovery must not depend only on in-memory client state

The implementing AI must not design this flow so that the only copy of the household payload lives in client memory after redirect.

## Payment Initialization Response Contract

The payment-init response should provide enough data for redirect and later reconciliation.

Expected response shape conceptually:

1. `checkout_url` or equivalent redirect target
2. `pending_signup_id` or equivalent durable identifier
3. `session_id` if exposed/needed

The implementing AI may adjust field names, but the concepts must exist.

## Stripe Success Behavior

Success return path must be Perennial-specific.

Required behavior:

1. Stripe success must not drop the user onto a generic community page without context
2. the user must return to a Perennial success/finalization surface
3. the UI must not declare account creation complete until payment success has actually been verified

## Stripe Cancel Behavior

Cancel return path must also be Perennial-specific.

Required behavior:

1. user must return to the Perennial signup flow or a Perennial cancel page
2. the household payload must remain recoverable
3. the user should be able to retry payment without re-entering everything

## Source Of Truth For Provisioning

For account creation and membership activation, do not trust frontend redirect alone.

Canonical source of truth:

1. verified successful payment from Stripe
2. backend finalization logic tied to that payment verification

Preferred backend truth mechanism:

1. Stripe webhook receives successful checkout/subscription event
2. webhook or a tightly controlled finalization step resolves the pending signup
3. backend creates:
   - all member auth accounts
   - active Perennial membership records
   - generated passwords
   - outbound credential emails

## Frontend Success Page Requirements

The frontend success route/page should:

1. show payment success state
2. communicate that accounts are being finalized or have been finalized
3. communicate that credentials will be emailed
4. clearly identify the primary billing owner
5. avoid false-positive success if finalization has not been verified yet

Acceptable states:

1. `processing your membership`
2. `membership activated`
3. `credentials sent by email`

## Frontend Cancel/Failure Page Requirements

The frontend cancel/recovery route/page should:

1. explain that payment was not completed
2. preserve or recover pending household signup data
3. offer a clear retry path
4. not imply that accounts were created

## Plan And Amount Integrity

The payment-init and finalization logic must preserve these exact plan rules:

1. `Single` = 1 total member = `$19.95/month`
2. `Couple` = 2 total members = `$29.95/month`
3. `Family` = 3 to 5 total members = `$39.95/month`

The backend must not accept mismatched member-count/plan combinations.

## Required Backend/Frontend Contract Clarity

The implementing AI must explicitly define or locate:

1. payment-init route
2. success route
3. cancel route
4. pending-signup persistence model
5. finalization trigger point
6. credential-email trigger point
7. Stripe env variables for all three Perennial plans, including the currently missing `STRIPE_PRICE_COMMUNITY_COUPLE`

None of those should be left implicit.

## Anti-Patterns To Avoid

1. Do not activate membership before verified payment success.
2. Do not create all accounts before payment.
3. Do not rely on client-only state after redirect to Stripe.
4. Do not treat browser return from Stripe as the only proof of payment.
5. Do not send users to a generic unrelated page after success/cancel.
6. Do not leave retry behavior undefined.

## Acceptance Criteria

1. the Perennial payment flow is described end-to-end
2. Stripe Checkout lifecycle is explicit
3. pre-payment signup persistence is explicit
4. success and cancel routes are Perennial-specific
5. account creation timing is tied to verified payment success
6. the implementing AI has enough payment-flow detail to build without inventing the lifecycle
