# Task 03 - Enforce Service-Scoped Calendar-First Booking

- Status: Done
- Priority: P0
- Owner: Booking / Full-stack

## Objective

Ensure the calendar-first booking flow remains correctly scoped to the chosen service so slot selection, intake behavior, and payment context cannot become detached from the service being purchased.

## Why This Task Exists

The business requirement is clear:

> purchase link will take me to calendar with product manage then full purchase

This means the calendar is not a separate step from the product. The selected product/service must control the calendar flow.

## Current Repo State

- `BookingWizard` fetches availability by diviner and optional `serviceId`
- booking pages already pass `availabilityServiceId`
- service purchase config is derived from service metadata via `getServicePurchaseConfig`

## Exact Gap

The overall system still needs an explicit invariant:

- the selected service determines:
  - which availability can be shown
  - what booking label is displayed
  - what intake fields are required
  - what amount is charged

The customer must never unknowingly select a slot for one service and pay for another.

## Required Implementation Rule

### Service-specific booking route

If the customer starts at `/{username}/book/{serviceSlug}`:

- availability must remain scoped to that service where service-scoped availability exists
- selected slot metadata must remain linked to the service
- payment request must resolve the same service ID on the backend

### Generic booking route

If the customer starts at `/{username}/book`:

- the chosen booking service must be determined once
- downstream steps must remain consistent with that resolved service

## Files To Read First

- `src/components/booking/booking-wizard.tsx`
- `src/app/api/availability/[divinerId]/route.ts`
- `src/app/api/stripe/booking-payment/route.ts`
- `src/lib/service-purchase.ts`

## Acceptance Criteria

- Calendar slot selection is service-aware.
- Slot selection, booking creation, and charge creation all reference the same resolved service.
- The booking flow remains calendar-first without sacrificing service fidelity.

## Verification Test Plan

- [x] Open a service-specific booking route and confirm availability is scoped as expected.
- [x] Complete a booking and confirm the saved booking references the same service shown in the UI.
- [x] Repeat from the generic booking route and confirm the selected primary/fallback service remains consistent end to end.

## Completion Notes

Implemented and verified in the current repo:

- `src/app/[username]/book/[serviceSlug]/page.tsx`
  - resolves one active service from DB and passes `availabilityServiceId={service.id}` into `BookingWizard`
- `src/app/[username]/book/page.tsx`
  - resolves a single booking service server-side and keeps that service fixed for the generic flow
- `src/components/booking/booking-wizard.tsx`
  - fetches availability with the resolved `serviceId`
  - posts the same `service.id` to `/api/stripe/booking-payment`
  - renders service-aware slot metadata and effective price
- `src/app/api/availability/[ownerId]/route.ts`
  - filters availability templates by `serviceId` while still allowing generic templates when appropriate
  - returns slot metadata carrying `availabilityServiceId`
- `src/app/api/stripe/booking-payment/route.ts`
  - resolves the booking against the same requested `serviceId`
  - prefers matching availability templates by `service_id` when deriving booking context

Result:

- service-specific booking stays bound to the chosen service
- generic booking resolves one concrete service and uses that same service through availability and payment
- slot selection, booking creation, and charge creation all remain anchored to one service ID
