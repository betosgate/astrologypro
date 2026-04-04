# 03 Build Order Invoice Email Resend Parity

## Why

Angular’s admin Orders flow lets admins resend the invoice email directly from the order row. That is a real operational admin action and is not yet available on the current Next admin Orders page.

## Current Verified Gap

- Angular list exposes an `Email Resend` action
- Angular resend uses `cart_management/Resend-mail-invoice-pdf-by-orderid`
- Next `/admin/orders` currently has no invoice-email resend action

## Required Behavior

- Add an invoice-email resend action to the admin Orders list
- Surface clear success and failure feedback
- Keep the action row-scoped so admins can retry a specific order only

## Acceptance Criteria

- admins can trigger invoice-email resend from an order row
- successful resend shows clear success feedback
- failed resend shows clear error feedback
- existing list interactions continue to work

## Verification Test Plan

1. Open `/admin/orders`.
2. Trigger invoice-email resend for a safe test order.
3. Confirm the resend call succeeds and success feedback is shown.
4. Trigger the resend action for a known failing case if available.
5. Confirm the failure state is visible and does not break the list.
