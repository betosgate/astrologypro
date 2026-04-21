# Task 01 — Page Tracker Affiliate Capture

- Status: Not Started
- Priority: P0 (Critical)
- Depends On: 2026-04-21 Task 01 (schema — `page_views.ref_code/affiliate_id/affiliate_type` already added)
- Blocks: Funnel analytics that join click → view → book on affiliate attribution

## Goal

Make every page view on a landing page record its `?ref=` attribution. The `page_views` table already has `ref_code`, `affiliate_id`, and `affiliate_type` columns (added in migration `20260421000001_affiliate_service_assignments.sql`), but nothing writes to them today. Without this, the click → view → book funnel cannot be joined at the view layer, and any per-view affiliate analytics will be empty.

## Current State

- `src/components/landing/page-tracker.tsx` writes to `page_views` with referrer, device, geo, UA data.
- No read of `?ref=` from `window.location.search`.
- `page_views.ref_code`, `page_views.affiliate_id`, `page_views.affiliate_type` are nullable and currently always NULL on new rows.
- `src/lib/affiliate-attribution.ts::resolveAffiliateFromRef(admin, refCode)` already resolves `ref_code → active affiliate-owned campaign context` — reuse this server-side.

## Implementation Steps

### 1. Read `?ref=` on the client

In `src/components/landing/page-tracker.tsx`, inside the effect that fires on mount / route change:

```ts
const refCode = typeof window !== "undefined"
  ? new URLSearchParams(window.location.search).get("ref")
  : null;
```

Pass `refCode` through to the tracking payload posted to `/api/analytics/track`.

### 2. Resolve affiliate on the server, not the client

Do NOT expose `resolveAffiliateFromRef` to the browser. Instead, send `ref_code` in the request body and resolve it server-side before inserting into `page_views`.

In the server route that handles the page-view insert:

```ts
import { resolveAffiliateFromRef } from "@/lib/affiliate-attribution";

const { refCode, ...rest } = await request.json();
let affiliate_id = null;
let affiliate_type = null;
if (refCode) {
  const resolved = await resolveAffiliateFromRef(admin, refCode);
  if (resolved) {
    affiliate_id = resolved.owner_affiliate_id;
    affiliate_type = resolved.owner_affiliate_type;
  }
}

await admin.from("page_views").insert({
  ...existingFields,
  ref_code: refCode ?? null,
  affiliate_id,
  affiliate_type,
});
```

### 3. Reject malformed ref codes quietly

- `refCode` that doesn't match the canonical campaign-code shape should still be stored as `ref_code` verbatim (for debugging) but `affiliate_id` / `affiliate_type` stay NULL.
- In the current repo the canonical shape is enforced by `sanitizeRefCode()` / `isValidRefCode()` in `src/lib/affiliate-attribution.ts`, and the exact regex is `^cmp_[A-Za-z0-9]{8}$`.
- Unknown / expired codes: same — persist the raw code, leave affiliate fields NULL.
- Never throw from the tracker path. Page-view failures must never break the page.

### 4. Do NOT set cookies

Critical rule from the parent sprint. The tracker must NOT read from or write to `document.cookie` or `localStorage`. URL is the only source.

## Verification Plan

### A. Unit / integration
1. POST to `/api/analytics/track` with a real affiliate-owned `refCode` such as `cmp_Ab12Cd34`. Assert the resulting `page_views` row has `ref_code`, `affiliate_id`, and `affiliate_type` populated.
2. POST with `refCode: "bogus"`. Assert `ref_code = 'bogus'`, `affiliate_id IS NULL`, `affiliate_type IS NULL`.
3. POST with no ref. Assert all three columns are NULL.

### B. End-to-end
1. Create an affiliate-owned campaign. Open the share URL `/r/<code>`.
2. After redirect, confirm the landing page URL has `?ref=<code>`.
3. Wait for tracker to fire, then query:
   ```sql
   SELECT ref_code, affiliate_id, affiliate_type, created_at
   FROM page_views
   ORDER BY created_at DESC LIMIT 1;
   ```
4. Expect: all three fields populated and matching the campaign's owner.

### C. Funnel join
```sql
SELECT
  cc.ref_code,
  COUNT(DISTINCT cc.id) AS clicks,
  COUNT(DISTINCT pv.id) AS views,
  COUNT(DISTINCT b.id) AS bookings
FROM campaign_clicks cc
LEFT JOIN page_views pv ON pv.ref_code = cc.ref_code
LEFT JOIN bookings b ON b.ref_code = cc.ref_code
WHERE cc.ref_code IS NOT NULL
GROUP BY cc.ref_code
ORDER BY clicks DESC;
```
Expect: non-zero `views` column for recent test traffic.

## Edge Cases

- SPA route changes within the landing page: tracker must re-evaluate `?ref=` on every route change (not only first mount), because the propagation work in Task 02 keeps `?ref=` on every internal navigation.
- Bot traffic: reuse the existing bot filter in `src/proxy.ts` if the tracker path doesn't already exclude bots.
- `ref_code` longer than expected: column is TEXT, no length guard needed, but cap at 256 chars client-side to avoid abuse.

## Out of Scope

- Backfilling historical `page_views`. Forward traffic only.
- Writing affiliate attribution to analytics event streams other than `page_views`.

## Rollback Plan

Revert the client + server edits to `page-tracker.tsx` and the page-view insert route. No schema change in this task — columns stay, they just stop being populated.
