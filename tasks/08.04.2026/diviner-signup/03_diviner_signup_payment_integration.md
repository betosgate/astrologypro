# Diviner Signup Stripe Payment Gateway Integration

- Status: Completed (2026-04-08)
- Completion Notes: Implemented. New endpoint POST /api/diviner-signup/payment-intent creates a one-time Stripe PaymentIntent for the live global_pricing.professional_divination_course price (currency-aware via SMALLEST_UNIT_MULTIPLIER, automatic_payment_methods enabled, metadata.type=diviner_signup). New component src/components/diviner-signup/payment-modal.tsx renders Stripe Elements inside a Dialog with the standard pattern (loadStripe singleton, Elements provider, PaymentElement, confirmPayment with redirect: "if_required"). The signup page wires it: after /api/diviner-signup returns user_id, the modal opens with a "redirecting to secure payment" toast; on success the page navigates to /diviner-signup/success. Webhook handler in src/app/api/stripe/webhooks/route.ts gains a handleDivinerSignupPaymentSucceeded branch that detects metadata.type=diviner_signup, marks trainees.training_status=paid + payment_intent_id + paid_at, and logs the event. Requires NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY + STRIPE_SECRET_KEY env vars and the global_pricing migration applied.

## Overview
Implement the internal Stripe payment modal integration for the professional divination course.

## Logic Specification

### 1. Create Payment Intent
- After a successful user registration from Task 2, call `POST /payment/create-payment-intent`.
- Payload: `{ user_id, email, name, user_type: "is_trainee", amount, currency }`.
- Extract `clientSecret` from response to bind payment gateway.

### 2. Stripe Modal Setup
- Use `@stripe/react-stripe-js` to render the payment elements in a modal widget.
- Headings & Text:
  - Modal Heading: `Complete Your Payment`
  - Description: `Total Amount: Full - [Currency] [Amount]`
- Stripe Form Button: `Pay Now (with a Lock Icon)`

### 3. UI Status Messages
- Show Snackbar: `We've registered your details. Redirecting you to secure payment. Please wait...`
- While Loading Gateway: `Payment gateway is not ready. Please wait a moment.`

### 4. Payment Completion
- Process card setup using `stripe.confirmPayment`.
- Set callback configuration `return_url: /stripe_success_page_diviner`.

## Task Summary
1. Connect backend API to generate `clientSecret` via payment intent.
2. Build Payment Modal using Stripe SDK components.
3. Handle UI status message cues via Snackbars.
4. Execute payment confirmation and trigger redirection to the Stripe Success page.
