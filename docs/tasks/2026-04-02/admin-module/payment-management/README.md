# Payment Management Parity Task Index - 2026-04-02

- Module: Admin -> Miscellaneous -> Payment
- Angular Source Route:
  - `admin-dashboard/payment`
- Next Route:
  - `/admin/payments`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/payment-management`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/payment-management`

## Scope Of This Review

This folder contains the validated parity tasks for the Miscellaneous nav review of `Payment`.

The Next payment module already covers the main list flow and even goes beyond Angular by implementing an actual refund action. The remaining work is small and should stay tightly focused on the two behaviors that still have trustworthy parity risk.

## Verified Current Comparison Summary

### Already Implemented In Next

- payment list route at `/admin/payments`
- list uses:
  - `payment/payment-list`
  - `payment/payment-list-count`
- list supports:
  - user name search
  - amount search
  - status filtering
  - purchase type filtering
  - sorting
- list already exposes:
  - preview action
  - refund action
- refund action already calls `payment/payment-refund`
- preview already attempts to load record details from `payment/payment-fetch`

### Implemented In Angular But Not Yet Fully Closed In Next

- Angular list supports date-range filtering on `payment_on`
- Angular preview reads the fetched detail payload from `response.res`
- Angular preview uses the payer name from `billingAddress.name`
- Angular preview explicitly shows `payment_status`

## Recommended Execution Order

1. `01-close-payment-list-date-filter-parity.md`
2. `02-align-payment-preview-hydration-and-name-source.md`

## Source Files Reviewed

### Angular

- `src/app/admin-dashboard/payment/payment-routing.module.ts`
- `src/app/admin-dashboard/payment/payment-listing/payment-listing.component.ts`
- `src/app/admin-dashboard/payment/payment-listing/paymentpreview.html`
- `src/app/admin-dashboard/payment/payment-listing/refundpreview.html`

### Next

- `src/app/(admin)/admin/payments/page.tsx`

## Notes

- This folder is the canonical task set for this module.
- No refund implementation task is included because the current Next flow already exceeds the working Angular behavior.
- No add or edit task is included because this module is list-only in the current admin flow.
