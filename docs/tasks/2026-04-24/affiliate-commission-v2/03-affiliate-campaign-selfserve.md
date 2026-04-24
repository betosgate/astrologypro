# Task 03 — Affiliate Self-Serve Campaign Creation

- Status: Backend done (2026-04-24); UI deferred to Task 07
- Priority: P0
- Depends on: 01 (additive)
- Blocks: —

## Goal

Let a `diviner_affiliate` create tracking campaigns against an assignment
the diviner has given them, without involving the diviner or admin.

## Endpoint

**`POST /api/affiliate/assignments/[id]/campaigns`**

Request body:
```json
{
  "name": "string, required",
  "description": "string, optional",
  "channel": "string, optional",
  "utm_source": "string, optional",
  "utm_medium": "string, optional",
  "utm_campaign": "string, optional"
}
```

Response: 201 with `{ data: { campaign_id, campaign_code, share_url, created_at } }`.

### Handler steps

1. Auth: caller must be signed in; resolve their `affiliate_accounts.id`
   via `user_id`. If none → 403 Problem+JSON.
2. Resolve their junction ids from `diviner_affiliates WHERE
   affiliate_account_id = <account_id>`. If empty → 403.
3. Look up `diviner_service_affiliates` by `id = [params.id]`. Require:
   - `affiliate_id IN junction_ids`
   - `affiliate_type = 'diviner_affiliate'`
   - `is_active = true`
   Else → 404 (hide whether the assignment exists but belongs to someone else).
4. Validate body (`name` non-empty ≤ 120 chars; channel / utms sanitized).
5. Generate a unique `campaign_code` (reuse the helper used by
   `/api/advocate/assignments/[id]/campaigns` — but do NOT import from
   the advocate route; promote the helper to `src/lib/campaign-code.ts`
   if it isn't already there).
6. Resolve the share URL based on the assignment's destination
   (reuse/promote the advocate's resolver into shared lib).
7. INSERT into `affiliate_campaigns`:
   - `owner_type = 'affiliate'`
   - `owner_affiliate_id = <junction id>`
   - `owner_affiliate_type = 'diviner_affiliate'`
   - `source_assignment_id = <assignment.id>`
   - `diviner_id = <assignment.diviner_id>`
   - `destination_type` / `destination_service_template_id` copied
   - `status = 'active'`
   - `campaign_code` from step 5
   - `utm_*`, `channel` from body
   - `created_by = auth.uid()`
8. INSERT corresponding `tracking_links` row linking the campaign to
   the resolved URL.
9. Return 201 with IDs + share URL.

### Rate limit

`aff_campaign_create:<affiliate_account_id>` — 20 per hour per affiliate
(matches the spirit of the invite rate limit).

## Secondary endpoints (needed for UI in task 07)

**`GET /api/affiliate/assignments`** — list active assignments for caller.
**`GET /api/affiliate/campaigns`** — already exists; enhance to include
`status`, `created_at`, click + conversion aggregates for last 30 days.

## Acceptance

- Happy path returns 201 with valid share URL.
- Posting to another affiliate's assignment id → 404.
- Posting to a revoked assignment → 403.
- Campaign appears in `GET /api/affiliate/campaigns` list immediately.
- Clicking the share URL hits `/r/<code>` and logs to `campaign_clicks`.
- Making a paid booking through the link writes a `campaign_conversions`
  row (happy path — full flow tested in task 08).

## Suggested files

- `src/app/api/affiliate/assignments/[id]/campaigns/route.ts` (new)
- `src/app/api/affiliate/assignments/route.ts` (new — list assignments)
- `src/lib/campaign-code.ts` (promote from advocate route if needed)
- `src/lib/campaign-destination-resolver.ts` (already exists; reuse)
- Spec: update §5 Flow C with any handler deviations; Changelog line
