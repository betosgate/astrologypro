# Master Task - Payment Management Parity - 2026-04-02

- Module: Admin -> Miscellaneous -> Payment
- Status: Done
- Owner: Frontend
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/payment-management`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/payment-management`
- Primary Next Route:
  - `/admin/payments`

## Objective

Close the remaining Angular-to-Next parity gaps for the Payment admin module without reopening flows that Next already handles correctly.

## Current Product Truth

- The Next payment module already supports the main list, preview, and refund workflows.
- The remaining verified gaps are:
  - payment date-range filtering on `payment_on`
  - preview hydration against the real `payment/payment-fetch` response shape
  - preview name-source compatibility when payer name comes from nested billing data

## Child Tasks

1. `01-close-payment-list-date-filter-parity.md`
2. `02-align-payment-preview-hydration-and-name-source.md`

## Done Definition

- `/admin/payments` supports date-range filtering on `payment_on`.
- preview opens reliably for real payment records returned by `payment/payment-fetch`.
- preview shows the payer name even when the detail payload provides it through nested billing data.
- preview continues to show payment status and existing useful Next-only fields.

## Verification Gate

1. Validate payment list date filtering returns the expected result window.
2. Validate preview opens for an existing payment record without empty-state fallback caused by response-shape mismatch.
3. Validate preview shows payer name for records that only expose the name through billing details.
4. Validate refund action still works after preview changes.

## Notion Ready Summary

Title: Payment Management parity

Summary:
The Next Payment module is already close to parity and even exceeds Angular by implementing the refund action. The remaining work is narrow: add payment-on date filtering and make the preview robust against the real payment detail response shape and payer-name source used by Angular.
