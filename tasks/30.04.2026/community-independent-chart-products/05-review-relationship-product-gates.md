# Task 05 - Review Relationship Product Gates

- Status: Planned
- Priority: P1
- Area: Relationship Reports / Eligibility
- Routes: `/community/charts`, `/community/charts/detailed`

---

## Goal

Align community relationship reports with the independent product model wherever the detailed toolkit can compute directly from birth data.

## Required Behavior

Relationship detailed reports should be gated by:

```txt
person A complete birth data
person B complete birth data
```

They should not require both people to have pre-generated natal chart products unless the specific legacy lightweight summary endpoint being used truly depends on saved local natal chart JSON.

## Review Points

- `/community/charts` pair visibility
- `/community/charts/detailed` prefill readiness
- `/api/community/relationship-charts`
- `/api/community/relationship-charts/batch`
- saved relationship report lifecycle

## Acceptance Criteria

- [ ] Full detailed relationship reports can be generated from both people’s stored birth data.
- [ ] Pair visibility does not depend on generated natal chart products.
- [ ] Any legacy lightweight summary path that still needs saved natal chart data is clearly isolated and does not block the detailed full-report product.
- [ ] Existing saved relationship reports still hydrate from DB without live generation.
