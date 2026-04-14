# Service Landing Page Dual Model Pack

## Objective

Define the platform architecture for two types of service landing pages:

1. `service + specific diviner`
2. `service only`

Required behavior:

- on `service + specific diviner` pages, the page is already tied to one diviner, so the customer does not need to choose a diviner
- on `service only` pages, the page is tied only to the service, so the customer must choose which diviner they want either:
  - by availability
  - by profile
- all services should have landing pages
- service landing pages should include a strong diviner-specific block where appropriate

This pack is architecture and task writing only. It does not implement the feature.

## Current Repo Grounding

### Existing diviner-specific service pages

The repo already has diviner-tied public service and booking surfaces:

- `src/app/[username]/services/page.tsx`
- `src/app/[username]/services/[slug]/page.tsx`
- `src/app/[username]/book/[serviceSlug]/page.tsx`

These already support the current `service + specific diviner` pattern.

### Existing service-scoped booking behavior

The booking flow already supports service-scoped availability via:

- `src/components/booking/booking-wizard.tsx`
- `src/app/api/availability/[ownerId]/route.ts`
- `src/app/api/availability/[ownerId]/month/route.ts`

This is important because the service-only landing type will still need service-aware availability while letting the user choose a diviner.

### Existing public service categorization

The repo already groups services publicly by category and diviner, which proves service discovery exists but is not yet formalized as a dual landing model.

## Product Direction

The correct architecture is:

1. service canonical page model
2. diviner-specific landing overlay
3. service-only discovery and diviner selection flow
4. shared booking and conversion rules
5. scalable landing coverage for all services

## Workstreams

1. `01-define-two-canonical-service-landing-types.md`
2. `02-service-only-landing-with-diviner-selection-flow.md`
3. `03-diviner-specific-service-landing-rules.md`
4. `04-diviner-block-content-and-selection-ux.md`
5. `05-all-services-landing-coverage-and-admin-governance.md`
6. `06-seo-routing-and-indexation-strategy-for-dual-landings.md`

## Acceptance Standard

This feature set is complete only when:

- the platform has a canonical model for both landing types
- service-only pages can route the customer into diviner selection by availability or profile
- diviner-specific pages remain direct-conversion pages with no diviner selector
- all services can be represented by landing pages
- diviner-specific blocks are intentionally designed rather than bolted on

## Status

- `01-define-two-canonical-service-landing-types.md` — Done
- `02-service-only-landing-with-diviner-selection-flow.md` — Done
- `03-diviner-specific-service-landing-rules.md` — Done
- `04-diviner-block-content-and-selection-ux.md` — Done
- `05-all-services-landing-coverage-and-admin-governance.md` — Done
- `06-seo-routing-and-indexation-strategy-for-dual-landings.md` — Done
