# Master Task - Order Management Parity - 2026-04-02

- Module: Admin -> Miscellaneous -> Orders
- Status: Planned
- Owner: Frontend
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/order-management`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/order-management`
- Primary Next Route:
  - `/admin/orders`

## Objective

Close the remaining Angular-to-Next parity gaps for the admin Orders module while preserving the current correct list foundation.

## Current Product Truth

- The Next admin Orders page already uses the correct list and count endpoints.
- The remaining verified gaps are:
  - order-number and payment-date search parity
  - row preview
  - invoice download
  - invoice email resend

## Child Tasks

1. `01-close-order-list-search-and-date-filter-parity.md`
2. `02-build-order-preview-and-invoice-download-parity.md`
3. `03-build-order-invoice-email-resend-parity.md`

## Done Definition

- `/admin/orders` supports the working order search and payment-date filter behavior.
- admins can open order preview from the list.
- admins can download the invoice from the list when it exists.
- admins can resend the invoice email from the list.
- existing list sorting and navigation continue to work.

## Verification Gate

1. Validate order-number search returns expected orders.
2. Validate payment-date filtering returns the expected result window.
3. Validate preview opens and shows the order details, addresses, and product list.
4. Validate invoice download works when an invoice URL is present.
5. Validate invoice email resend succeeds and shows clear feedback.

## Notion Ready Summary

Title: Order Management parity

Summary:
The Next admin Orders page already has the correct list foundation, but it is still missing the working admin operations Angular exposes from the shared order list: order-number and payment-date filtering, order preview, invoice download, and invoice email resend.
