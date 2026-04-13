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
