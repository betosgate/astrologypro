# Task 03 - Discount CTA Visibility

- Status: Proposed
- Priority: P1
- Owner: Frontend
- Area: Community CTAs / services booking entry
- Created: 2026-05-18

## Objective

Make the 5% Community member discount clear before checkout, especially on
Community booking CTAs and redirect areas.

The current payment step can show the breakdown, but users should understand
the benefit before they reach the final payment page.

## Recommended Work

- Review Community reading CTAs that route into `/services?source=community`.
- Ensure CTA text or supporting copy mentions:

```text
5% Community member discount
```

- Ensure `/services?source=community` and service detail pages preserve discount messaging.
- Keep discount messaging conditional to Community source/token where possible.
- Avoid changing public `/services` copy for guests unless a valid discount token/source exists.

## Acceptance Criteria

- Community user sees discount messaging before choosing a service.
- Service cards or service detail pages keep the discount context visible.
- Booking payment summary still shows the actual breakdown.
- Public users do not see misleading Community-only discount copy.
