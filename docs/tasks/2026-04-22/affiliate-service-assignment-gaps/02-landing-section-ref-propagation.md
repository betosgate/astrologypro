# Task 02 — Landing Section Ref Propagation Audit

- Status: Not Started
- Priority: P0 (Critical)
- Depends On: None (pure frontend work)
- Blocks: Attribution chain integrity for all affiliate-owned campaign URLs

## Goal

Guarantee that `?ref=<code>` survives every internal navigation on a public landing page. The parent sprint's Delivery Expectation #2 is: "All internal links on landing pages preserve `?ref=` (verified by test)." Today only ~5 of the 15 landing-page section renderers have been audited, and the remaining ones may render CTAs that drop the ref on click, breaking attribution before the visitor reaches the booking page.

## Current State

- `src/components/landing/sections/` contains 15 renderers.
- `src/app/[username]/services/[slug]/ref-link-preserver.tsx` handles ref preservation for the primary book CTA.
- Sections partially audited per parent Task 02: `booking-cta-section.tsx`, `cta-section.tsx`, `bio-section.tsx`, and a few others — the full list is not confirmed.

## Implementation Steps

### 1. Enumerate every section renderer

```bash
ls src/components/landing/sections/
```

Expected files in the current repo:
1. `bio-section.tsx`
2. `booking-cta-section.tsx`
3. `cta-section.tsx`
4. `expertise-section.tsx`
5. `faq-section.tsx`
6. `gallery-section.tsx`
7. `hero-section.tsx`
8. `image-banner-section.tsx`
9. `pricing-section.tsx`
10. `rich-content-section.tsx`
11. `testimonials-section.tsx`
12. `text-content-section.tsx`
13. `video-embed-section.tsx`
14. `whats-included-section.tsx`
15. `who-its-for-section.tsx`

Audit the real folder contents if this list changes later, but use the list above as the repo-accurate baseline for this sprint.

### 2. Add a shared helper

Create `src/lib/landing/with-ref.ts`:

```ts
export function withRef(path: string, ref: string | null | undefined): string {
  if (!ref) return path;
  try {
    const url = new URL(path, "https://placeholder.local");
    if (!url.searchParams.has("ref")) {
      url.searchParams.set("ref", ref);
    }
    return url.pathname + url.search + url.hash;
  } catch {
    const sep = path.includes("?") ? "&" : "?";
    return `${path}${sep}ref=${encodeURIComponent(ref)}`;
  }
}
```

### 3. Thread `ref` through the SectionRenderer context

If a context doesn't already exist, add one in `src/components/landing/section-renderer.tsx` so each section receives `ref` without drilling props.

### 4. Audit every section file

For each file, grep for outbound internal links:

```
<Link href=
<a href="/
router.push(
window.location.href =
```

For each match where the target is an internal path (starts with `/` and not `mailto:` / `tel:` / absolute external), wrap with `withRef(path, ref)`.

External links (http://, https:// pointing off-domain) must NOT get `?ref=` — it leaks the affiliate code off-site.

### 5. Preserve ref on the profile landing page

File: `src/app/[username]/page.tsx`. Same audit — every service card link, every nav, every CTA.

### 6. Preserve ref on the booking flow entry

File: wherever the "Book Now" flow opens (check `RefLinkPreserver`). Confirm `ref` lands in the request body sent to the booking create API — the conversion hook (parent Task 03) reads `booking.ref_code`, so this link must not break.

## Verification Plan

### A. Automated test

Add `src/components/landing/__tests__/ref-propagation.test.tsx`:

```ts
// For each section, render with ref="cmp_test123", assert every Link/anchor
// whose href starts with '/' includes ref=cmp_test123 in its href.
```

Use React Testing Library. The test must iterate all 15 section renderers with fixture props and assert propagation. A failing renderer fails the build.

### B. End-to-end
1. Open `/r/<affiliate-campaign-code>` — lands on `/<username>` or `/<username>/services/<slug>` with `?ref=cmp_...`.
2. Click every visible CTA, card, nav item. Assert the URL bar still shows `?ref=cmp_...`.
3. Complete a booking. Query:
   ```sql
   SELECT ref_code FROM bookings ORDER BY created_at DESC LIMIT 1;
   ```
   Expect: the campaign code.

### C. External-link negative test

Confirm that a click on an external social-media icon does NOT append `?ref=` (would leak attribution off-platform).

## Edge Cases

- Anchor links (`href="#section"`): don't add `?ref=` — it's a same-page fragment. The `withRef` helper's URL parsing handles this (pathname stays empty).
- `mailto:` / `tel:`: skip.
- Absolute URLs to the same domain: treat as internal, propagate ref.
- Already-present `ref` on an href: leave it alone (don't overwrite — author intent wins).

## Out of Scope

- Ref propagation on non-landing-page routes (dashboard, admin). Those are not entry points for affiliate attribution.
- Rewriting the section renderers' layout or styling.

## Rollback Plan

Revert the per-section edits and remove the `withRef` helper import. Ref preservation regresses to its prior partial state — no data loss, attribution chain weakens for fresh clicks.
