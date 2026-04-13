# Task 02 - Standardize Public Service and Purchase Entry Routes

- Status: Open
- Priority: P1
- Owner: Frontend / Full-stack

## Objective

Make all public purchase entry points deterministic so every “book” or “purchase” CTA routes into the correct service-specific calendar flow.

## Why This Task Exists

The repo already has:

- `/{username}/services`
- `/{username}/services/{slug}`
- `/{username}/book`
- `/{username}/book/{serviceSlug}`

But the product rule must be explicit:

- service cards should route to service detail or service booking intentionally
- generic booking should only exist for an explicitly defined primary or fallback-booking mode

## Current Repo State

- services index links:
  - detail page
  - `/{username}/book/{service.slug}`
- generic booking page chooses a primary/fallback service
- service-specific booking page uses the selected service directly

## Exact Gap

The route structure exists, but the system-level product rule is not yet fully documented or enforced:

- when should the customer land on generic booking?
- when should the customer land on service booking?
- when should a service purchase behave like “book a session” vs “buy a digital/report/subscription product”?

## Required Routing Rule

### Session-like services

If `product_kind = session`, purchase CTA must route to:

- `/{username}/book/{serviceSlug}`

### Generic booking

`/{username}/book` should only be used when the business intentionally wants:

- “book with this diviner” as a primary CTA
- and the system chooses the primary public service or fallback booking mode

### Non-session products

If `product_kind` later supports report, subscription, or digital items with different purchase semantics, those should not be forced through a session-booking route without an explicit rule.

## Files To Read First

- `src/app/[username]/services/page.tsx`
- `src/app/[username]/services/[slug]/page.tsx`
- `src/app/[username]/book/page.tsx`
- `src/app/[username]/book/[serviceSlug]/page.tsx`

## Acceptance Criteria

- Public CTAs no longer have ambiguous purchase entry behavior.
- Service-specific purchases always preserve service context.
- Generic booking remains available only where intentionally appropriate.

## Verification Test Plan

- [ ] Click a service card CTA and confirm it lands in the correct service booking route.
- [ ] Click a generic “book with diviner” CTA and confirm it selects the intended primary/fallback service.
- [ ] Confirm the route behavior still preserves `ref` attribution where applicable.

