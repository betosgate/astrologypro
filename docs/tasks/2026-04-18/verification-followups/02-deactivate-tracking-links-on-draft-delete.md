# Task VF-02 - Deactivate or Delete Tracking Links When Draft Campaigns Are Deleted

- Status: Not Started
- Priority: P0
- Owner: Full Stack
- Area: Campaign destination tracking
- Source: Local verification of `docs/tasks/2026-04-17`
- Created: 2026-04-18

## Files

- `src/app/api/dashboard/campaigns/route.ts`
- `src/app/api/dashboard/campaigns/[id]/route.ts`
- `src/app/r/[code]/route.ts`

## Problem

Creating a draft campaign with a service destination creates a `tracking_links` row. Deleting the draft campaign deletes the campaign but leaves the tracking link active:

- `campaign_id = null`
- `is_active = true`
- `/r/cmp_...` still resolves as a legacy tracking link

This creates orphaned active campaign URLs.

## Implementation

1. In `DELETE /api/dashboard/campaigns/[id]`, load `tracking_link_id` and/or `campaign_code`.
2. When deleting the draft campaign, either:
   - delete the associated `tracking_links` row, or
   - set `tracking_links.is_active = false`.
3. Ensure cleanup is scoped to the authenticated diviner's campaign only.
4. Confirm `/r/[code]` redirects inactive/deleted campaign links to `/`.

## Acceptance Criteria

- Deleting a draft campaign disables or removes its campaign tracking link.
- No active `tracking_links` row remains for the deleted campaign code.
- Existing non-campaign tracking links still work.

## Verification

1. Log in as `diviner1@test.astrologypro.com`.
2. Create a draft campaign with `destination_type = SERVICE`.
3. Confirm campaign has `campaign_code`, `share_url`, and `tracking_link_id`.
4. Delete the draft campaign.
5. Query `tracking_links` by the campaign code.
6. Confirm the row is gone or `is_active = false`.
