# 02 Build Order Preview And Invoice Download Parity

## Why

Angular lets admins inspect order details directly from the list and download the invoice when it exists. The current Next admin Orders page does not yet expose either operation.

## Current Verified Gap

- Angular list exposes a Preview action
- Angular preview shows:
  - customer name
  - email
  - order number
  - total amount
  - shipping address
  - billing address
  - product line items
- Angular preview is loaded from `cart_management/order-preview`
- Angular list exposes invoice download using the existing invoice URL on the row
- Next `/admin/orders` currently has no preview action
- Next `/admin/orders` currently has no invoice-download action

## Required Behavior

- Add order preview to `/admin/orders`
- Add invoice-download action when an invoice URL is present
- Keep both actions row-scoped and easy to use from the list

## Acceptance Criteria

- admins can open order preview from the list
- preview shows the core order details and product breakdown
- admins can download the invoice when the order has an invoice URL
- missing invoice URLs degrade gracefully with clear feedback

## Verification Test Plan

1. Open `/admin/orders`.
2. Launch preview for a known order.
3. Confirm the preview shows customer details, addresses, and products.
4. Trigger invoice download for an order with an invoice URL and confirm it opens correctly.
5. Trigger invoice download for an order without an invoice URL and confirm the failure state is handled clearly.
