# Luna Brightwell QA Service Commerce — Architect Task Pack

- Date: 2026-04-13
- Status: Open
- Priority: P0
- Owner: Architecture / Full-stack

---

## Business Intent

For `https://astrologypro.com/luna-brightwell-qa`:

1. all products and services must be configured from API-backed database data
2. the purchase link must take the customer into the calendar-first purchase flow
3. calendar selection must be tied to the chosen product/service
4. the full purchase flow must be linked to Stripe
5. the diviner’s connected Stripe account must receive funds correctly

This pack defines the system architecture needed to make that flow authoritative, repeatable, and safe for all diviners, not just the `luna-brightwell-qa` profile.

---

## Current Repo Reality

The repo is already partially aligned with this goal:

### Already present

- public services page reads from `services`
  - `src/app/[username]/services/page.tsx`
- public booking pages read service records from `services`
  - `src/app/[username]/book/page.tsx`
  - `src/app/[username]/book/[serviceSlug]/page.tsx`
- booking flow is already calendar-first
  - `src/components/booking/booking-wizard.tsx`
- booking payment route already resolves the service and diviner from DB
  - `src/app/api/stripe/booking-payment/route.ts`
- Stripe Connect payout plumbing already exists
  - `src/lib/stripe/connect.ts`
  - `src/app/api/stripe/connect/onboard/route.ts`
  - `src/app/api/stripe/connect/status/route.ts`

### But still architecturally incomplete

- service pricing is still mixed:
  - public pages read `services.base_price`
  - broader platform pricing also uses `global_pricing` + `pricing_plans`
- service purchase path does not yet enforce a clean single source of truth for all purchasable service metadata
- purchase CTA rules are not yet clearly standardized across profile, service detail, and generic booking entry points
- connected-account readiness exists, but the business rule “diviner must be payout-ready before selling” is not yet clearly enforced as a product invariant

---

## Architectural Objective

Unify the service commerce model so that:

1. service definitions live in the database and are rendered through API/DB reads only
2. public purchase CTAs always route into the correct calendar-first flow
3. the selected service controls availability scope, intake requirements, and payment behavior
4. booking payment creates a charge linked to the correct connected Stripe account
5. a diviner cannot expose purchasable services publicly if payout readiness is broken

---

## Source of Truth Decisions

### 1. Product and service content source of truth

`services` is the runtime source of truth for diviner-specific offerings.

This includes:

- name
- slug
- description
- duration
- category
- service-level purchase metadata
- active/inactive state
- display ordering

The public profile must not depend on hardcoded service cards or static fallback content for actual purchasable offerings.

### 2. Pricing source of truth

There are two layers in this repo:

- `services`
- `global_pricing` / `pricing_plans`

Architecturally, the platform should adopt this rule:

- `global_pricing` / `pricing_plans` define canonical pricing products and plans
- `services` reference pricing products via `pricing_item_key`
- the public purchase experience should not rely on stale duplicated numeric values when a canonical pricing item exists

If a service is intended to be purchasable, its display price and its charged price must resolve from the same pricing authority.

### 3. Purchase-entry source of truth

The correct public purchase entry for a service is:

- service page → book route for that service
- generic “book now” only when the platform intentionally selects the primary service or fallback booking mode

### 4. Availability source of truth

Calendar and availability are availability-template driven, scoped by diviner and optionally scoped by service.

If a service-specific booking flow is selected, the availability query must remain scoped to that service where supported.

### 5. Payout source of truth

The diviner’s Stripe Connect account on `diviners.stripe_account_id`, plus live account capability state from Stripe, is the payout readiness source of truth.

Do not treat presence of a stored account ID alone as sufficient proof that the diviner can currently receive funds.

---

## Core Business Rules

1. A service that is visible and purchasable on a public profile must be fully defined in DB-backed config.
2. A purchase CTA for a service must land the customer in that service’s booking flow, not a generic ambiguous checkout path.
3. A calendar slot selected in the booking flow must remain linked to the intended service context.
4. Payment capture must route funds to the correct connected account when the service is paid.
5. A diviner who is not payout-ready must not silently accept public paid bookings.
6. Zero-dollar or free booking cases may bypass charge creation, but only as an explicit service rule.

---

## Execution Order

```
01 → 02 → 03 → 04 → 05 → 06
```

This ordering matters because:

- pricing and service authority must be settled before public CTA cleanup
- purchase entry normalization must happen before enforcing payout readiness
- payment and payout invariants must be defined before public exposure rules are tightened

---

## Sub-Tasks

| # | File | Objective | Depends on | Status |
|---|---|---|---|---|
| 01 | `01-unify-service-and-pricing-source-of-truth.md` | Define how `services` and `pricing_plans` cooperate so display and charge price cannot drift | — | Open |
| 02 | `02-standardize-public-service-and-purchase-entry-routes.md` | Make every public purchase CTA route deterministically into the correct calendar-first flow | 01 | Open |
| 03 | `03-enforce-service-scoped-calendar-first-booking.md` | Ensure selected product/service controls the calendar scope, slot selection, and booking context | 01, 02 | Open |
| 04 | `04-enforce-diviner-stripe-connect-payout-readiness.md` | Prevent paid public selling when the diviner cannot actually receive payouts | 01, 03 | Open |
| 05 | `05-harden-booking-payment-and-order-linkage.md` | Ensure charge creation, booking creation, order creation, and Stripe payout metadata are coherent end to end | 03, 04 | Open |
| 06 | `06-admin-governance-for-service-commerce-config.md` | Define the admin controls and validation rules needed so misconfigured services never leak publicly | 01, 02, 04, 05 | Open |

---

## Non-Negotiable Constraints

1. Do not hardcode Luna Brightwell service cards or prices in the public UI.
2. Do not let the displayed price come from one source and the charged price come from another.
3. Do not let “Book Now” links bypass service context when a service-specific flow is intended.
4. Do not allow public paid checkout when Stripe Connect readiness is incomplete.
5. Do not silently route money to the platform account when the business rule says the diviner should get paid.

---

## Expected Outcome

After this pack is implemented:

- `luna-brightwell-qa` and all diviner profiles will expose only DB-configured purchasable services
- each purchase link will open the correct calendar-first booking flow
- the selected service will remain authoritative through slot selection and payment
- Stripe Connect payouts will route correctly to the diviner when the booking is paid
- broken payout configuration will block selling instead of failing late

