# 01 Close Payment List Date Filter Parity

- Status: Done

## Why

Angular supports date-range search on `payment_on`. The current Next list supports text search, status filtering, and purchase-type filtering, but it does not yet expose a date-range filter for payment date.

## Current Verified Gap

- Angular search settings include:
  - start date label: `Search By Payment On Start Date`
  - end date label: `Search By Payment On End Date`
  - field: `payment_on`
- Next `/admin/payments` currently has no date-range filter UI or matching searchcondition wiring for `payment_on`.

## Required Behavior

- Add a date-range filter to `/admin/payments` for `payment_on`.
- Keep the filter wired through `searchcondition`, consistent with the current Next list architecture.
- Ensure the filter composes cleanly with existing text search and select filters.

## Acceptance Criteria

- users can filter payments by payment-on start and end date
- the filtered list reflects the requested date window
- existing search, filter, sort, preview, and refund actions continue to work together with the date filter

## Verification Test Plan

1. Open `/admin/payments`.
2. Apply a payment-on start date and end date that should include a known record.
3. Confirm matching records remain visible and out-of-range records disappear.
4. Combine the date range with user-name search and confirm both conditions are respected.
5. Open preview and refund actions from a filtered result and confirm both still work.
