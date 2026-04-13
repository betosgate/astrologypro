# Task 06 - Admin Governance for Service Commerce Config

- Status: Open
- Priority: P1
- Owner: Admin UX / Architecture

## Objective

Define the admin configuration and validation rules needed so public service commerce cannot drift into an invalid state.

## Why This Task Exists

Even a clean runtime architecture will fail if admin tooling allows:

- services with no valid pricing source
- paid services without payout readiness
- broken primary/fallback booking selection
- ambiguous purchase behavior for non-session products

## Governance Requirements

### Service config must validate

For any public active purchasable service:

- valid slug
- active state
- duration if session-like
- clear `product_kind`
- valid pricing linkage or fallback price rule

### Pricing linkage must validate

If `pricing_item_key` is present:

- it must refer to an active pricing item
- the runtime price-selection rule must be unambiguous

### Payout readiness exposure rule

If a diviner is not payout-ready:

- admin should be able to see that paid public selling is blocked
- the system should not quietly expose broken purchase CTAs

### Product kind governance

If the platform supports non-session product kinds:

- admin UI must make their purchase semantics explicit
- do not let every product kind masquerade as a session booking

## Files To Read First

- `src/app/admin/service-config/page.tsx`
- `src/app/admin/pricing/page.tsx`
- `src/app/dashboard/settings/page.tsx`
- `src/lib/service-purchase.ts`

## Acceptance Criteria

- Admin tooling prevents or clearly warns on invalid public service-commerce states.
- Public catalog behavior can be predicted from admin config alone.
- The Luna Brightwell QA profile becomes a reliable test case for the generalized rule set.

## Verification Test Plan

- [ ] Attempt to configure a paid active service with no valid pricing or payout readiness and confirm the admin system flags it.
- [ ] Confirm a fully configured service appears publicly and routes into the expected booking flow.
- [ ] Confirm service edits preserve pricing and purchase semantics on re-open/edit.

