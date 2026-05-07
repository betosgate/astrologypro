# Diviner Signup Payment Success and Error Routes

## Primary diviner signup flow

- Signup page: `/diviner-signup`
  - Source: `src/app/diviner-signup/page.tsx`
  - After registration succeeds, this page opens the Stripe Elements payment modal.

- Payment success page: `/diviner-signup/success`
  - Source: `src/app/diviner-signup/success/page.tsx`
  - Current redirect after inline Stripe payment success:
    - `router.push(/diviner-signup/success?email=...)`

- Payment error page: no standalone route exists for this flow yet.
  - Current payment errors are shown inline inside the Stripe modal.
  - Source: `src/components/diviner-signup/payment-modal.tsx`
  - Error states handled there:
    - PaymentIntent creation/load failure.
    - Stripe confirmation failure.
    - Unexpected PaymentIntent status.
    - Processing status message.

## Invited diviner checkout flow

- Plan/checkout entry page: `/join/diviner/plan`
  - Source: `src/app/join/diviner/plan/page.tsx`

- Payment success/finalizer route: `/join/diviner/success`
  - Source: `src/app/join/diviner/success/page.tsx`
  - Stripe Checkout returns here with `session_id`.
  - The page finalizes invited diviner provisioning server-side.

- Payment error route: no standalone error page exists for this flow.
  - Missing `session_id` redirects to:
    - `/join/diviner/plan?error=missing-session`
  - Provisioning failure redirects to:
    - `/join/diviner/plan?error=provision-failed`

## Trainee dashboard upgrade flows

- Become a Diviner payment success page: `/trainee/diviner-upgrade/success`
  - Source: `src/app/trainee/diviner-upgrade/success/page.tsx`
  - Stripe Checkout returns here with `session_id`.
  - The page finalizes the trainee-to-diviner upgrade, shows a payment success confirmation, and the `OK` button routes to:
    - `/contracts/pending?source=trainee-upgrade&session_id=...&next=/dashboard`

- Become a Diviner payment error page: `/join/diviner/error`
  - Source: `src/app/join/diviner/error/page.tsx`
  - Trainee-origin Stripe cancellation now routes here with:
    - `/join/diviner/error?source=trainee-upgrade&reason=cancelled`
  - Finalization failures route here with:
    - `reason=missing-session`
    - `reason=provision-failed`

- Join Perennial Mandalism payment success page: `/join/community/checkout/success?source=trainee`
  - Source: `src/app/join/community/checkout/success/page.tsx`
  - Stripe Checkout returns here with `session_id`.
  - For trainee-origin checkout, the page finalizes the Perennial Mandalism membership, shows a payment success confirmation, and the `OK` button routes to:
    - `/contracts/pending?source=trainee-pm-upgrade&session_id=...&next=/community`

- Join Perennial Mandalism payment error page: `/join/community/checkout/error`
  - Source: `src/app/join/community/checkout/error/page.tsx`
  - Trainee-origin Stripe cancellation now routes here with:
    - `/join/community/checkout/error?source=trainee&reason=cancelled`
  - Finalization failures route here with:
    - `reason=missing-session`
    - `reason=provision-failed`

## Remaining gap

The primary `/diviner-signup` inline Stripe Elements flow still does not have a standalone error page. Its payment errors remain inside `src/components/diviner-signup/payment-modal.tsx`.
