# Task 01 - Community Booking Source And Token Propagation

- Status: Proposed
- Priority: P1
- Owner: Frontend / Routing
- Area: Community CTAs, `/services`, service landing, booking handoff
- Created: 2026-05-18

## Objective

Carry an explicit Community booking source marker from Community reading CTAs
through the service selection and booking flow.

## Recommended Source Marker

Use one stable query param:

```text
source=community
```

The existing Community discount token should continue to travel with it:

```text
discount_token=<token>
source=community
```

## Required Handoff Paths

Preserve both params through:

```text
/community CTA
→ /services
→ /services/[slug]
→ /book/template/[slug]
→ /[username]/book/[serviceSlug]
```

Also preserve them through intake/template paths when applicable.

## Requirements

- Community reading CTA should append `source=community`.
- `/services` should preserve `source=community` on service cards.
- `/services/[slug]` should preserve `source=community` on CTAs.
- Template intake and shared calendar handoff should preserve `source=community`.
- Existing `discount_token`, `ref`, `submission`, `date`, `time`, and `template`
  behavior must not regress.

## Acceptance Criteria

- Community-origin booking URL includes both `discount_token` and
  `source=community`.
- Service browsing does not drop either param.
- Non-Community/public traffic continues working without `source=community`.
- Direct public booking links are unaffected.

