# 07 Seed Fixtures Rollout and Ops Monitoring

## Goal

Define the seed and rollout plan for Perennial Mandalism astrology entitlements so the system can be validated before wide release.

## Seed Principle

In this thread, “seed” means tasking and rollout design, not executing DB seeds.

The seed plan should create enough sample states to validate:

- automatic natal generation
- relationship coverage
- monthly transit generation
- retry exhaustion
- support escalation

## Recommended Seed Scenarios

### Scenario 1: Healthy member family

- active member
- 3 eligible family profiles
- all natal charts generated
- all pairwise relationship charts generated
- current month transit present

### Scenario 2: Missing birth data

- active member
- one family profile missing birth time or location quality
- natal not yet generated
- admin visibility into blocked reason

### Scenario 3: Retry exhaustion

- one profile with `3` used correction attempts
- self-service regeneration disabled
- support ticket CTA required

### Scenario 4: Monthly transit failure

- monthly generation failed for one profile
- admin can see the failure
- user can open support issue if needed

### Scenario 5: Relationship matrix partial coverage

- 4 family profiles
- some natal charts generated, one missing
- only valid pairs present
- dashboard explains incomplete family dynamics

## Admin Monitoring Requirements

Admin should be able to see:

- total eligible profiles
- charts generated
- charts blocked by missing data
- failed generations
- exhausted retry counts
- monthly transit failures
- open chart-related support tickets

## Rollout Recommendation

1. reuse existing astrology generators first
2. add governance and tracking
3. pilot with seeded QA members
4. monitor failures before broad release

## Deliverables

- seed fixture matrix
- rollout stages
- admin monitoring requirements
- QA checklist for entitlement and generation flows

---

## Implementation — 2026-04-13

### Admin monitoring API
`src/app/api/admin/charts/stats/route.ts`

**GET /api/admin/charts/stats** — returns:
```json
{
  "natal": {
    "total_eligible": 42,
    "not_started": 3,
    "queued": 1,
    "generated": 35,
    "failed": 2,
    "locked_for_review": 1
  },
  "transits": {
    "month": "2026-04",
    "total": 35,
    "pending": 0,
    "generated": 8,
    "notified": 25,
    "failed": 2,
    "suppressed": 0,
    "notification_failures": 2
  },
  "relationships": {
    "total": 120,
    "current": 118,
    "needs_regeneration": 2
  },
  "retries": {
    "profiles_with_retries_used": 5,
    "profiles_at_limit": 2,
    "profiles_locked": 1
  },
  "tickets": {
    "open_chart_tickets": 3,
    "by_category": {
      "natal_chart_issue": 2,
      "monthly_transit_issue": 1,
      "family_relationship_chart_issue": 0
    }
  }
}
```
- Admin-only (requires `admin_users` row)
- All sub-queries run in parallel via `Promise.all` for performance
- Covers all 5 seed scenarios from the spec

### Seed scenarios (QA reference)
The 5 seed scenarios from the spec map to these observable states:
| Scenario | How to verify |
|----------|---------------|
| 1 - Healthy family | stats.natal.generated > 0, stats.relationships.current > 0, stats.transits.notified > 0 |
| 2 - Missing birth data | natal_status = 'not_started' for that profile |
| 3 - Retry exhaustion | natal_status = 'locked_for_review', natal_retry_count = 3 |
| 4 - Monthly transit failure | generation_status = 'failed' in monthly_transits for that month |
| 5 - Partial relationship matrix | relationship_charts missing for pairs where one natal is absent |
