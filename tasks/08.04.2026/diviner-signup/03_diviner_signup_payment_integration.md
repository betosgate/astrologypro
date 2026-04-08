# Diviner Signup Stripe Payment Gateway Integration

- Status: Partial — deferred (2026-04-08)
- Completion Notes: NOT YET IMPLEMENTED — deferred. The signup page redirects to /diviner-signup/success after successful registration. Stripe Elements modal + create-payment-intent API need real test keys + a UI rebuild that mirrors the existing /community/upgrade Stripe Elements pattern. Best done in a focused follow-up session with Stripe test mode keys configured.

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
