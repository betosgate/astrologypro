# Master Task - Custom Billing & Unsubscribe Modals - 2026-04-07

- Status: Completed (2026-04-08)
- Completion Notes:
  - 10.1: New `POST /api/community/billing/unsubscribe` route + new `UnsubscribeModal` (legacy "Alert!!" orange-header layout) wired into `MembershipCard`.
  - 10.2: Setup-intent route and `UpdatePaymentModal` (Stripe Elements) already shipped upstream.
  - 10.3: `MembershipCard` now exposes `Update Payment` (existing) and `Subscribed` (new) buttons; the legacy unsubscribe path no longer redirects to the Stripe Customer Portal.
- Priority: P2
- Scope: Dashboard UI Modals, Custom Stripe API integration
- Estimate: 3-4 days
- Task File: `tasks/perennial/2026-04-07/10-master-task-legacy-billing-modals.md`

## Objective

Replace the generic "Stripe Customer Portal" redirect in the Community Dashboard with a fully bespoke, on-page modal flow for managing subscriptions and payment methods. This aligns the billing UX precisely with the legacy AngularJS project flow.

## Child Tasks

1. `10.1-unsubscribe-confirmation-modal-and-api.md`
2. `10.2-stripe-elements-payment-method-update-modal.md`
3. `10.3-membership-card-legacy-billing-buttons.md`

## Required Outcome

1. Add a **"Subscribed" / "Unsubscribe"** toggle button back into the Dashboard Membership block.
2. Clicking "Unsubscribe" opens a custom **"Alert!!" Confirmation Modal** warning the user about losing access.
3. Confirming the unsubscribe triggers a direct backend API call to cancel the Stripe subscription without leaving the page.
4. Add a flow to update the payment method via an embedded **Stripe Elements Modal**, replacing the Stripe Portal redirect.
5. Provide a "Payment Method Saved" success screen overlay matching the legacy design.

## Technical Considerations

- The current implementation securely hands off billing management to the Stripe Customer Portal (`/api/community/billing-portal`).
- Implementing this custom on-page flow requires integrating `@stripe/react-stripe-js` directly into the Dashboard.
- We must build custom Next.js API endpoints (`/api/community/billing/unsubscribe` and `/api/community/billing/setup-intent`) to securely pipe these requests to the Stripe Node SDK.

## Done Definition

- The user never leaves the dashboard `page.tsx` to handle cancellations or payment method updates.
- The UI perfectly mimics the provided legacy screenshots (Alert Modal, Payment Elements Modal, Success Screen).
