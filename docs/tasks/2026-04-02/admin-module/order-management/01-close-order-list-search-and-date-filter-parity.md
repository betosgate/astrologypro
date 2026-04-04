# 01 Close Order List Search And Date Filter Parity

## Why

Angular’s admin Orders flow lets admins search by order number and filter by payment date. The current Next page has basic search, but it does not yet expose the full working search and date-filter workflow from the Angular admin screen.

## Current Verified Gap

- Angular search supports:
  - order-number search on `order_number`
  - payment-date range filtering on `created_on`
  - admin-only user lookup search
- Next `/admin/orders` currently does not expose a payment-date range filter
- Next `/admin/orders` should be aligned around the working order-number search behavior from the Angular admin flow

## Required Behavior

- Add payment-date range filtering on the order payment date field
- Ensure order-number search behaves consistently with the working admin order flow
- Preserve current sorting and existing useful search behavior where it does not conflict

## Acceptance Criteria

- admins can search orders by order number
- admins can filter orders by payment-date range
- search and date filtering compose cleanly with existing list behavior
- sorting still behaves correctly after filtering

## Verification Test Plan

1. Open `/admin/orders`.
2. Search for a known order number and confirm the matching order appears.
3. Apply a payment-date range that should include a known order.
4. Confirm in-range orders remain visible and out-of-range orders are excluded.
5. Change sort order and confirm the filtered results still sort correctly.
