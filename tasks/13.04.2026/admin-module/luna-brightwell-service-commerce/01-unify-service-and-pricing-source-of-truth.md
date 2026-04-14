# Task 01 - Unify Service and Pricing Source of Truth

- Status: Done
- Priority: P0
- Owner: Architecture / Backend

## Objective

Define and implement one coherent pricing authority for public diviner services so the customer-facing displayed price and the backend charged price cannot drift.

## Why This Task Exists

The repo currently mixes:

- `services.base_price`
- `services.pricing_item_key`
- `global_pricing`
- `pricing_plans`

That means the platform is close to a normalized pricing model, but not yet fully consistent for public service commerce.

## Current Repo State

### Public runtime usage

- service index page renders price from `service.base_price`
- booking pages pass service data containing `base_price`
- booking payment route resolves the service from `services`

### Platform pricing usage

- public pricing APIs exist:
  - `/api/pricing`
  - `/api/pricing/[itemKey]`
- admin pricing management exists
- `services.pricing_item_key` already exists as a bridge to canonical pricing items

## Exact Architectural Gap

The system does not yet clearly enforce this invariant:

> if a service is tied to a pricing item, both public display price and charged price must resolve from the same canonical pricing plan, not from stale copied numeric fields.

## Completion Notes

- Added a shared runtime pricing resolver in [src/lib/runtime-service-pricing.ts](/Users/debasiskarm4/Documents/projects.nosync/divine/AstrologyPro/src/lib/runtime-service-pricing.ts:1) that derives service pricing from the first active canonical plan linked by `pricing_item_key`.
- Wired the public diviner service surfaces through that resolver in:
  - [src/app/[username]/page.tsx](/Users/debasiskarm4/Documents/projects.nosync/divine/AstrologyPro/src/app/[username]/page.tsx:1)
  - [src/app/[username]/services/page.tsx](/Users/debasiskarm4/Documents/projects.nosync/divine/AstrologyPro/src/app/[username]/services/page.tsx:1)
  - [src/app/[username]/services/[slug]/page.tsx](/Users/debasiskarm4/Documents/projects.nosync/divine/AstrologyPro/src/app/[username]/services/[slug]/page.tsx:1)
  - [src/app/[username]/book/page.tsx](/Users/debasiskarm4/Documents/projects.nosync/divine/AstrologyPro/src/app/[username]/book/page.tsx:1)
  - [src/app/[username]/book/[serviceSlug]/page.tsx](/Users/debasiskarm4/Documents/projects.nosync/divine/AstrologyPro/src/app/[username]/book/[serviceSlug]/page.tsx:1)
- Updated [src/app/api/stripe/booking-payment/route.ts](/Users/debasiskarm4/Documents/projects.nosync/divine/AstrologyPro/src/app/api/stripe/booking-payment/route.ts:1) so booking charges resolve through the same runtime pricing authority before payment intent creation.

## Recommended Model

### For diviner-specific service runtime

Use `services` as the service catalog row, but treat `pricing_item_key` as the pricing bridge.

### Canonical rule

- `services` defines the purchasable service identity
- `pricing_item_key` links the service to canonical pricing data
- the active plan for that pricing item defines actual price semantics
- `services.base_price` should become either:
  - a derived compatibility/cache field, or
  - a fallback only when no pricing item is linked

## Required Decisions

1. Define whether `base_price` remains authoritative for legacy services or becomes derived display-only data.
2. Define how a service chooses an active plan when multiple active plans exist under one pricing item.
3. Define whether public service purchase flows support:
   - one plan per service only
   - or plan selection per service

For the first stabilization phase, one active runtime plan per service is the safest rule.

## Files To Read First

- `src/app/[username]/services/page.tsx`
- `src/app/[username]/book/page.tsx`
- `src/app/[username]/book/[serviceSlug]/page.tsx`
- `src/app/api/stripe/booking-payment/route.ts`
- `src/app/api/pricing/[itemKey]/route.ts`
- `src/app/admin/service-config/page.tsx`

## Acceptance Criteria

- A service has one clearly defined charge source.
- Public price display and payment amount derive from the same pricing authority.
- Service purchase behavior no longer depends on implicit duplication across tables.

## Verification Test Plan

- [ ] Inspect a service with `pricing_item_key` and confirm the public display price matches the charged price source.
- [ ] Inspect a legacy service without `pricing_item_key` and confirm fallback rules are explicit.
- [ ] Confirm admin editing does not create ambiguous multi-price behavior for one public service.
