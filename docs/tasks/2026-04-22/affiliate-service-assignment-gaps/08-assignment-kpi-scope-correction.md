# Task 08 — Assignment KPI Scope Correction

- Status: Not Started
- Priority: P0 (Critical)
- Depends On: 2026-04-21 Task 04
- Blocks: Trustworthy diviner assignment analytics

## Goal

Fix incorrect KPI attribution on the diviner assignments list and detail views. The current implementation scopes conversions too broadly by `affiliate_id`, so if the same affiliate holds multiple assignments with the same diviner, each assignment row can inherit conversions that belong to the other assignment. That makes clicks/conversions/commission appear duplicated or inflated.

## Current State

- Route: `src/app/api/dashboard/affiliate-assignments/route.ts`
- Current list aggregation:
  - clicks are roughly scoped by destination
  - conversions are filtered only by `affiliate_id`
- This means:
  - Profile assignment can absorb service assignment conversions
  - Service A assignment can absorb Service B assignment conversions
  - any affiliate with >1 assignment gets misleading 30d numbers

## Correct Scoping Rule

Assignment KPIs must be derived from campaigns created from that assignment, not merely from the affiliate identity.

Authoritative relationship:

```text
diviner_service_affiliates.id
  -> affiliate_campaigns.source_assignment_id
  -> campaign_clicks.campaign_id
  -> campaign_conversions.campaign_id
```

Use that chain whenever possible.

## Implementation Steps

### 1. Change list-route aggregation to source assignment

In `src/app/api/dashboard/affiliate-assignments/route.ts`:

1. load assignments
2. load affiliate-owned campaigns for this diviner whose `source_assignment_id` is in the assignment id set
3. group campaigns by `source_assignment_id`
4. aggregate clicks/conversions/commission from those campaign ids

This removes cross-assignment bleed entirely.

### 2. Re-check the detail route

Audit `src/app/api/dashboard/affiliate-assignments/[id]/route.ts`.

It already appears closer to correct because it reads campaigns by `source_assignment_id = :id`, then aggregates from those campaign ids. Verify every KPI/table on that route uses the campaign-id scoped set consistently.

### 3. Keep destination labels only for display

Do not use `destination_type/destination_id` as the primary KPI join if `source_assignment_id` is available. Destination matching is a fallback heuristic; assignment id is the exact ownership key.

### 4. Add a regression fixture

Seed:
- one affiliate
- one profile assignment
- one service assignment
- one campaign per assignment
- one conversion per campaign

Assert each assignment row reports exactly its own conversion/commission.

## Verification Plan

1. Create affiliate A with:
   - profile assignment
   - Solar Return assignment
2. Create one campaign under each assignment.
3. Insert one click + one conversion per campaign.
4. Call:

```http
GET /api/dashboard/affiliate-assignments
```

5. Confirm:
   - profile row shows only profile campaign stats
   - service row shows only service campaign stats
   - totals are not duplicated

6. Open `/dashboard/affiliates/assignments/[id]` for each and confirm list/detail numbers align.

## Edge Cases

- revoked assignments with historical campaigns should still show historical totals if the UI includes inactive rows
- affiliates with zero campaigns must still show zero KPIs, not disappear
- migrated legacy campaigns should only count if they were cloned with `source_assignment_id`

## Rollback Plan

Revert the route aggregation changes. No schema rollback required.
