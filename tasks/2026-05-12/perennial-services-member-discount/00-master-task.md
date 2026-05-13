# Master - Perennial Services Member Discount Handoff

- Status: Completed
- Priority: P1
- Owner: Full Stack
- Area: Perennial community / services booking flow
- Source: Product request to wire Perennial reading CTAs into `/services`
- Created: 2026-05-12
- Commit: `863df042` - `Wire Perennial reading CTAs to services with member discount`

## Purpose

Route Perennial community reading CTAs through the `/services` hub and silently
preserve the existing 5% community member discount token through service
selection, booking, and payment setup.

## Task Breakdown

1. `01-community-reading-cta-entrypoints.md`
   - Reusable Perennial reading CTA.
   - Dashboard, transits, transit-card, and library CTA wiring.
2. `02-services-hub-and-landing-token-propagation.md`
   - `/services` and `/services/[slug]` token propagation.
   - Service landing CTA and intake handoff.
3. `03-booking-flow-token-propagation.md`
   - Shared calendar, discover, diviner booking page, and payment request handoff.
4. `04-verification-and-regression.md`
   - Lint, manual QA, and non-regression checks.

## Non-Goals

- No new discount model.
- No service-page discount banner.
- No backend change to `booking-payment` discount semantics.

## Completion Gate

- Perennial CTAs land on `/services`.
- Active members carry `discount_token` silently to checkout.
- Non-members continue through `/services` without token.
- Existing `ref`, `submission`, `date`, `time`, and `template` query behavior remains intact.
