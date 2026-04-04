# 02 Build Refund Request Refund Execution Flow

- Status: Done

## Why

Angular allows admins to trigger the actual refund-processing step from the refund-request module itself. The current Next page supports review and status updates, but it does not yet let admins execute the refund from this module.

## Current Verified Gap

- Angular list exposes a dedicated `Refund` action
- Angular refund action first loads refund detail from `refund-processing/fetch-refund-details`
- Angular then submits the actual refund through `payment/payment-refund`
- Next `/admin/refunds` currently has no refund action

## Required Behavior

- Add a refund action to `/admin/refunds`
- Preserve the review-first flow so admins can confirm the refund before submission
- Surface clear success and failure feedback after the payment-refund call
- Refresh the affected list state after completion

## Acceptance Criteria

- admins can launch refund execution from a refund-request row
- the refund flow shows the key refund details needed for confirmation
- refund submission reaches the actual refund-processing endpoint successfully
- success and failure states are visible to the admin
- the list refreshes or otherwise reflects the latest request state after refund completion

## Verification Test Plan

1. Open `/admin/refunds`.
2. Trigger the refund action for a safe test refund request.
3. Confirm the review surface shows the expected order or refund data before submission.
4. Complete the refund.
5. Confirm a success message appears and the list state refreshes.
6. Repeat with a known invalid or blocked test case and confirm the failure state is handled clearly.
