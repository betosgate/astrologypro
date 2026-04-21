# Task 09 — Advocate Campaigns V2 Alignment

- Status: Not Started
- Priority: P1 (High)
- Depends On: Task 06
- Blocks: Coherent affiliate portal experience

## Goal

Align `/api/advocate/campaigns` and `/advocate/campaigns` with the V2 affiliate-owned campaign model. Right now the advocate portal still reads from `campaign_affiliates`, which belongs to the deprecated per-campaign enrollment model. That creates a split-brain product state where:

- `/advocate/assignments` is V2
- campaign creation is intended to be V2
- but `/advocate/campaigns` still shows legacy joined campaigns instead of affiliate-owned campaigns

## Current State

- Route: `src/app/api/advocate/campaigns/route.ts`
- It still:
  - queries `campaign_affiliates`
  - loads linked campaigns from that join table
  - builds summary/earnings from the legacy relationship
- The page at `/advocate/campaigns` consumes that route

## Target State

For the logged-in affiliate identity, campaign list should come from:

```sql
affiliate_campaigns
WHERE owner_type = 'affiliate'
  AND owner_affiliate_id = :affiliate_id
  AND owner_affiliate_type = :affiliate_type
```

Metrics should come from:
- `campaign_clicks` by `campaign_id`
- `campaign_conversions` by `campaign_id`

Any legacy `campaign_affiliates` rows should be treated as migration/backfill compatibility only, not the primary source for V2 pages.

## Implementation Steps

### 1. Replace the primary read model

Refactor `src/app/api/advocate/campaigns/route.ts` to:

1. resolve current affiliate identity
2. load affiliate-owned campaigns by `owner_affiliate_id` + `owner_affiliate_type`
3. aggregate clicks/conversions/commission by those campaign ids
4. join diviner + destination labels

### 2. Remove legacy share-link logic tied to referral codes

The V2 canonical share URL is:

```text
/r/<campaign_code>
```

Do not continue generating generic homepage links off `social_advocates.referral_code` for this page.

### 3. Keep campaign rows destination-aware

Each row should show:
- diviner
- destination type
- destination label
- campaign code
- status
- clicks / unique clicks
- conversions
- commission earned

### 4. Reuse aggregation in `/advocate/earnings` if possible

If Task 05 introduces a dedicated earnings route/helper, use the same V2 source model here so portal screens cannot drift.

## Verification Plan

1. Create one affiliate-owned campaign from a valid assignment.
2. Call:

```http
GET /api/advocate/campaigns?period=30d
```

3. Confirm the new campaign appears even if there is no `campaign_affiliates` row for it.
4. Confirm the share link is `/r/<campaign_code>`.
5. Confirm legacy default referral campaigns do not masquerade as V2 assignment campaigns on this page.

## Edge Cases

- affiliates with both migrated legacy campaigns and new V2 campaigns may need both represented temporarily; if so, label legacy rows clearly
- `diviner_affiliate` and `social_advocate` must both be supported
- campaigns with zero clicks/conversions still appear

## Rollback Plan

Revert the API/page read-model change. Legacy campaign list remains available.
