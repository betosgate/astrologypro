# Task 02 — URL Attribution Pipeline

- Status: Not Started
- Priority: P0
- Depends On: Task 01 (schema)
- Blocks: Tasks 03, 05

## Goal

Make the URL the single source of truth for affiliate attribution. No cookies, no localStorage, no browser-side state. Every click on an affiliate-owned campaign logs the affiliate to `campaign_clicks.affiliate_id`, and every internal link on a landing page or booking flow preserves `?ref=` so the attribution chain survives to the booking row.

## Current State

- `/r/[code]` (at `src/app/r/[code]/route.ts`) reads the campaign, validates active state, resolves destination URL via `resolveCampaignDestination`, inserts a `campaign_clicks` row with device/geo/referrer/UA data, redirects 307.
- Public service page at `src/app/[username]/services/[slug]/page.tsx` reads `searchParams.ref` and uses `RefLinkPreserver` + `refParam` to thread `ref` through the book CTA.
- Public profile at `src/app/[username]/page.tsx` — check whether `ref` is preserved. Likely partial.
- `page-tracker.tsx` logs page views to `page_views` but doesn't capture affiliate attribution.
- Booking form(s) — need audit to confirm `ref` reaches the booking creation API.

## Implementation Steps

### 1. Extend `/r/[code]` to enrich click with affiliate context

In `src/app/r/[code]/route.ts`, after loading the campaign:

```ts
// Already loaded: const campaign = await admin.from("affiliate_campaigns").select(...)

const isAffiliateOwned = campaign.owner_type === "affiliate";
const affiliateId = isAffiliateOwned ? campaign.owner_affiliate_id : null;
const affiliateType = isAffiliateOwned ? campaign.owner_affiliate_type : null;
const commissionSnapshot = isAffiliateOwned ? campaign.commission_value_snapshot : null;
```

When inserting into `campaign_clicks`, include:
```ts
{
  ...existingFields,
  affiliate_id: affiliateId,
  affiliate_type: affiliateType,
  commission_value_snapshot: commissionSnapshot,
  ref_code: code,
}
```

Append the campaign code to the redirect URL so the landing page has `?ref=` in the URL bar:
```ts
const redirectUrl = new URL(destinationUrl, request.url);
if (!redirectUrl.searchParams.has("ref")) {
  redirectUrl.searchParams.set("ref", code);
}
return NextResponse.redirect(redirectUrl, 307);
```

### 2. Extend public service landing page

File: `src/app/[username]/services/[slug]/page.tsx`

- Already reads `ref`. Audit every internal link and thread `ref` through:
  - Book CTA (✅ already handled by `refParam` + `RefLinkPreserver`)
  - "View Services" button
  - Breadcrumb `/{username}/services`
  - Any nav from rendered builder sections

For every internal `<Link>` or `<a href="/...">`, replace with a helper that appends `ref` if present:
```ts
const withRef = (path: string) => ref ? `${path}?ref=${encodeURIComponent(ref)}` : path;
```

### 3. Audit landing-page builder section renderers

Files under `src/components/landing/sections/`. The shared `SectionRenderer` context passes `ref` down to all 15 sections; each renderer threads it onto every outbound link.

Complete enumeration of section files — each must be audited:

1. `bio-section.tsx`
2. `booking-cta-section.tsx` ← primary booking CTA, critical
3. `cta-section.tsx` ← generic CTA, critical
4. `expertise-section.tsx`
5. `faq-section.tsx`
6. `gallery-section.tsx`
7. `hero-section.tsx` ← may render "Book Now" button
8. `image-banner-section.tsx`
9. `pricing-section.tsx` ← has "Book This Reading" button, critical
10. `rich-content-section.tsx`
11. `testimonials-section.tsx`
12. `text-content-section.tsx` ← may contain HTML with links; sanitize and rewrite
13. `video-embed-section.tsx`
14. `whats-included-section.tsx`
15. `who-its-for-section.tsx`

For the critical sections (#2, #3, #7, #9) the outbound Book URL is passed in via the renderer's `context.bookUrl`. Update the code path that constructs `bookUrl` to always append `?ref=` when present.

For sections that render user-authored HTML (#12, `rich-content`, and any FAQ answer with a link), the HTML sanitizer in `src/lib/html-sanitizer.ts` must preserve URLs but NOT rewrite internal links — document this as a known limitation; those links do not carry `ref`.

### 4. Profile page ref propagation

File: `src/app/[username]/page.tsx`

- Read `ref` from searchParams.
- Every service card's "Book Now" or "View Details" link must preserve `ref`.
- Any "Share" / "Subscribe" CTA must preserve `ref` where booking could follow.

### 5. Booking creation API captures `ref`

Bookings are created in the checkout flow, not through a single public endpoint. Touch both:

- `src/app/api/dashboard/bookings/route.ts` — if/when a POST path here inserts a booking, accept `ref_code` in the body and pass it through.
- `src/app/api/stripe/booking-payment/route.ts` — the Stripe Connect checkout session creator. The booking row gets created either here or in the webhook confirmation step. Include `ref_code` in the session metadata so the webhook can copy it onto the booking row on confirmation.
- `src/app/api/stripe/webhooks/route.ts` — when the webhook confirms a booking (see the `supabase.from("bookings").update({ status: "confirmed" })` at the charge/session-completed handler), write `ref_code` from the session metadata onto the booking row at the same update.

Validation rule: if provided, `ref_code` must match `^cmp_[A-Za-z0-9]{8}$` (the campaign code format). Reject other formats silently (drop to null) so random URL params don't pollute the column.

### 6. Page tracker captures affiliate per view

File: `src/components/landing/page-tracker.tsx`.

- Accept `ref` as a prop from the server-rendered page.
- In the beacon payload, include `ref_code` so `page_views` can optionally record it (new column if needed, or keep separate).
- Even without extra storage, logging the affiliate attribution in view events helps debugging.

### 7. Helper: `resolveAffiliateFromRef`

New: `src/lib/affiliate-attribution.ts`:

```ts
export async function resolveAffiliateFromRef(admin, refCode: string | null) {
  if (!refCode) return null;
  const { data: campaign } = await admin
    .from("affiliate_campaigns")
    .select("id, owner_type, owner_affiliate_id, owner_affiliate_type, commission_value_snapshot, commission_type_snapshot, source_assignment_id, destination_type, destination_service_template_id, diviner_id")
    .eq("code", refCode)
    .eq("status", "active")
    .eq("owner_type", "affiliate")
    .maybeSingle();
  return campaign ?? null;
}
```

This is used by the conversion hook in Task 03.

## Verification Plan

1. Create an affiliate-owned campaign via SQL:
   ```sql
   INSERT INTO diviner_service_affiliates (diviner_id, destination_type, destination_id, affiliate_id, affiliate_type, commission_type, commission_value)
     VALUES ('<D>', 'SERVICE', '<TPL>', '<A>', 'social_advocate', 'percent', 20)
     RETURNING id \gset assignment_id
   INSERT INTO affiliate_campaigns (diviner_id, name, status, owner_type, owner_affiliate_id, owner_affiliate_type, commission_value_snapshot, commission_type_snapshot, source_assignment_id, destination_type, destination_service_template_id, code)
     VALUES ('<D>', 'Test', 'active', 'affiliate', '<A>', 'social_advocate', 20, 'percent', :assignment_id, 'SERVICE', '<TPL>', 'cmp_TESTCODE')
     RETURNING id;
   ```

2. Hit `/r/cmp_TESTCODE` in incognito. Verify browser lands on the destination URL with `?ref=cmp_TESTCODE` appended.

3. Assert the click was logged with affiliate attribution:
   ```sql
   SELECT affiliate_id, affiliate_type, commission_value_snapshot, commission_type_snapshot, ref_code
     FROM campaign_clicks
     WHERE ref_code = 'cmp_TESTCODE'
     ORDER BY clicked_at DESC LIMIT 1;
   -- expect: affiliate_id='<A>', affiliate_type='social_advocate', commission_value_snapshot=20, commission_type_snapshot='percent', ref_code='cmp_TESTCODE'
   ```

4. On the landing page, open DevTools → inspect every link — all `<a>` href attributes pointing to an internal path should contain `ref=cmp_TESTCODE`. Use this console snippet:
   ```js
   [...document.querySelectorAll('a[href^="/"]')].filter(a => !new URL(a.href, location.origin).searchParams.has('ref')).map(a => a.href);
   // expect: empty array (no internal links without ref)
   ```

5. Click the book CTA → URL in the new page carries `?ref=cmp_TESTCODE`.

6. Submit the booking. Then:
   ```sql
   SELECT ref_code FROM bookings WHERE id = '<new-booking-id>';
   -- expect: 'cmp_TESTCODE'
   ```

7. Negative test — visit the landing page directly without `?ref=`:
   ```sql
   SELECT COUNT(*) FROM campaign_clicks WHERE ref_code IS NULL AND clicked_at > now() - interval '1 minute';
   -- expect: 0 (click was not through /r/ so campaign_clicks is not touched; page_view will exist but with ref_code IS NULL)
   SELECT ref_code FROM page_views WHERE path LIKE '/test-diviner-1/services/%' ORDER BY created_at DESC LIMIT 1;
   -- expect: NULL
   ```

8. `page_views` affiliate capture for a tagged direct visit:
   ```sql
   SELECT affiliate_id, ref_code FROM page_views WHERE ref_code = 'cmp_TESTCODE' ORDER BY created_at DESC LIMIT 1;
   -- expect: affiliate_id='<A>', ref_code='cmp_TESTCODE'
   ```

## Edge Cases

- Visitor pastes a custom URL with a bogus `?ref=notreal` — schema doesn't enforce existence, but conversion hook in Task 03 will return null on lookup. Booking just gets an orphan ref_code. Acceptable.
- Visitor arrives via `/r/cmp_XXX?utm_source=...` — preserve UTM params alongside `ref` on the destination URL.
- Visitor opens a tab with a tagged link, then navigates to another diviner's profile via the site nav — the new diviner's page should NOT carry the foreign `ref`. Ensure cross-diviner internal nav strips `ref`.
- Booking fails and is retried — `ref_code` carries through to the retry.

## Rollback Plan

- Revert the code changes; the schema stays intact.
- Data already written to `campaign_clicks.affiliate_id` and `bookings.ref_code` remains but becomes inert.
