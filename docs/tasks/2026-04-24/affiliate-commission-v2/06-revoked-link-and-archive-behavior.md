# Task 06 — Revoked-Link + Archive Behavior

- Status: Done (2026-04-24)
- Priority: P1
- Depends on: 01 (additive)
- Blocks: —

## Goal

When a campaign's underlying assignment is revoked, or the affiliate has
archived the campaign, the public share link must stop working AND the
visitor must see a "link no longer active" page — not a 404, not a silent
redirect.

## Part A — `/r/[code]` handler

File: `src/app/r/[code]/route.ts`

### Current behavior
Looks up `tracking_links` by code, resolves destination, 307-redirects
with `?ref=<code>` appended.

### New behavior (insert between steps 2 and 3)

After loading the tracking link and resolving the campaign:

1. Load the campaign's `status` and `source_assignment_id`.
2. If `campaign.status !== 'active'` → render the "link no longer active"
   page (Part B) with HTTP 410.
3. If `campaign.source_assignment_id` is set, load the assignment. If
   `!assignment.is_active` → render the "link no longer active" page with
   HTTP 410.
4. Otherwise proceed to click log + redirect (existing behavior).

Do NOT log a `campaign_clicks` row when the link is dead — the click
event isn't attributable to anything real.

## Part B — "Link no longer active" page

File: `src/app/(public)/link-not-active/page.tsx` (new)

- Static server component, branded like the rest of the public site.
- Minimal copy: "This tracking link is no longer active." + CTA button
  linking to the homepage (or the associated diviner's profile if the
  handler can safely pass it as a query param).
- Return HTTP 410 Gone from the `/r/[code]` handler via
  `NextResponse.rewrite(new URL("/link-not-active", request.url), { status: 410 })`.

## Part C — Campaign archive

### Affiliate-owned campaign: `PATCH /api/affiliate/campaigns/[id]`

File: `src/app/api/affiliate/campaigns/[id]/route.ts` (new)

Body: `{ status: 'archived' }`.

Steps:
1. Auth + ownership: caller owns `affiliate_campaigns WHERE id = :id AND
   owner_affiliate_id IN caller.junction_ids`. Else 403.
2. Only accept `status='archived'` in this endpoint. Any other value →
   422.
3. UPDATE `affiliate_campaigns` set `status='archived'`.
4. Leave `tracking_links.is_active` alone — the handler checks campaign
   status, not tracking_link status.

### Diviner-owned campaign: already partially handled

`DELETE /api/dashboard/campaigns/[id]` currently only allows deleting
`status='draft'`. Keep that. Add a separate archive path (PATCH with
`status='archived'`) for diviners who want to archive active campaigns
— mirror the affiliate endpoint logic.

### No hard-delete endpoint for affiliates

The spec forbids it (§5 Flow H). Do not add one.

## Part D — FK hardening

Already covered in task 01 (the `ON DELETE RESTRICT` migration). Mention
here so the reviewer understands why soft-delete is safe: hard deletes
would now error at the DB rather than cascade-wipe history.

## Acceptance

- Clicking a link whose campaign is `status='active'` and assignment is
  `is_active=true` → redirect works, click logged.
- Clicking a link whose campaign is `status='archived'` → 410, static
  page rendered, no click logged.
- Clicking a link whose assignment is revoked → 410, static page, no
  click logged.
- `PATCH /api/affiliate/campaigns/[id]` archives the caller's own
  campaign. Foreign affiliate gets 403.

## Suggested files

- `src/app/r/[code]/route.ts` (extend)
- `src/app/(public)/link-not-active/page.tsx` (new)
- `src/app/api/affiliate/campaigns/[id]/route.ts` (new)
- `src/app/api/dashboard/campaigns/[id]/route.ts` (add PATCH archive
  support if it isn't there)
- Spec: update §5 Flows D, G, H with any handler deviations; Changelog
