# 02 Align Payment Preview Hydration And Name Source

- Status: Done

## Why

Next already has a preview dialog, but the current detail parser does not include the response shape Angular actually reads. That creates a real risk that preview opens into an empty state even though the API call succeeds.

## Current Verified Gap

- Angular preview fetches `payment/payment-fetch` and reads the detail record from `response.res`.
- Next preview currently resolves the detail record from:
  - `data.result`
  - `data.results`
  - `data.data`
- Next preview does not currently include `data.res`.
- Angular preview uses `billingAddress.name` as the payer display name source.
- Next preview currently prefers top-level `user_name`, which may be insufficient for some real records.

## Required Behavior

- Align the preview parser with the actual payment detail response shape used by the working Angular module.
- Support payer-name fallback from nested billing data when top-level `user_name` is missing or incomplete.
- Preserve the existing useful Next preview content, including payment status and other non-breaking detail fields.

## Acceptance Criteria

- preview opens with record data when `payment/payment-fetch` returns the payment under `res`
- preview shows payer name when only `billingAddress.name` is available
- preview still shows payment status when available
- refund behavior is unaffected by the preview changes

## Verification Test Plan

1. Open `/admin/payments`.
2. Launch preview for a known payment record.
3. Confirm the dialog renders real payment data rather than the no-data state.
4. Test with a record whose payer name is available through billing details and confirm the name is shown.
5. Confirm payment status still appears in preview when present.
6. Trigger the refund action for a safe test record and confirm the refund flow still functions.
