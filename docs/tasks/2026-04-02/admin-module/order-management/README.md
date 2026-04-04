# Order Management Parity Task Index - 2026-04-02

- Module: Admin -> Miscellaneous -> Orders
- Angular Source Route:
  - `admin-dashboard/orders`
- Next Route:
  - `/admin/orders`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/order-management`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/order-management`

## Scope Of This Review

This folder contains the validated parity tasks for the Miscellaneous nav review of `Orders`.

The Angular admin Orders route is mostly a wrapper around the shared order-list component. The current Next admin orders page already points at the correct list endpoint, but it is still missing several working admin operations that Angular exposes from that shared order workflow.

## Verified Current Comparison Summary

### Already Implemented In Next

- admin orders route at `/admin/orders`
- list uses:
  - `cart_management/order-list`
  - `cart_management/order-list-count`
- list already supports:
  - customer search
  - order-id search
  - status filtering
  - sorting

### Implemented In Angular But Not Yet Fully Closed In Next

- Angular admin orders support date-range filtering on `created_on`
- Angular admin orders support order-number search explicitly on `order_number`
- Angular admin orders expose a Preview action
- Angular admin orders expose an Email Resend action through `cart_management/Resend-mail-invoice-pdf-by-orderid`
- Angular admin orders expose an Invoice Download action using the stored invoice URL

## Recommended Execution Order

1. `01-close-order-list-search-and-date-filter-parity.md`
2. `02-build-order-preview-and-invoice-download-parity.md`
3. `03-build-order-invoice-email-resend-parity.md`

## Source Files Reviewed

### Angular

- `src/app/admin-dashboard/orders/orders-routing.module.ts`
- `src/app/admin-dashboard/orders/admin-order-list/admin-order-list.component.ts`
- `src/app/common-components/order-list/order-list.component.ts`
- `src/app/common-components/order-list/order-review/order-review.component.ts`
- `src/app/common-components/order-list/order-review/order-review.component.html`

### Next

- `src/app/(admin)/admin/orders/page.tsx`

## Notes

- This folder is the canonical task set for this module.
- I did not create refund-request parity work here because the refund button in the shared Angular order component is for non-admin flows, not the admin Orders screen.
- I did not create delete or status-toggle tasks because the working Angular admin Orders flow does not expose those operations.
