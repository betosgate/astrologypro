# Task 02 — Public Route Rewrite

- Status: Not Started
- Priority: P1
- Depends On: Task 01 (schema additive)
- Blocks: Task 05 (dashboard UI depends on the new route contract)
- Feature flag: `LANDING_PAGE_V2`

## Goal

Rewrite [src/app/[username]/services/[slug]/page.tsx](../../../../src/app/%5Busername%5D/services/%5Bslug%5D/page.tsx) so that the public URL always renders the legacy hardcoded template, augmented by the diviner's blocks in two fixed slots. Remove the builder-replaces-page branch. Keep (and simplify) the owner preview via `?preview=true`. Behind `LANDING_PAGE_V2` for safe rollback.

## Current State

The route has three render paths (in order of precedence):

1. `preview=true` + owner → draft builder page via `getDraftLandingPage()`
2. Published builder page via `getPublishedLandingPage()` — wins whenever it has any sections
3. Fallback: legacy hardcoded template (the rich design)

Path 2 is what sidelined the rich template for `test-diviner-1/services/nativity-birth-chart` and produced the minimalist page the user complained about. Path 1 (preview) also renders a separate "draft" builder page and is used by the builder's "Preview" button today.

## Target State

Two render paths after the flag is flipped — public and owner preview. Both use the same renderer; only the gates differ.

### Public path

```
Step 1 — Admin gate
  services.is_active = true  AND  diviner_services.is_enabled = true
    → either false → 404

Step 2 — Diviner gate
  diviner_services.is_published = true
    → false → 404

Step 3 — Render legacy template with diviner blocks injected in two slots
  - about_diviner blocks render after the existing "About Your Diviner" card
  - extra blocks render between "FAQ" and "Final CTA"
```

### Owner preview path — `?preview=true`

```
Step 1 — Auth check
  Logged-in user AND diviner.user_id matches session user?
    → No  → ignore ?preview=true, fall through to public path above
            (ensures shared preview URLs degrade safely and leak nothing)
    → Yes → continue

Step 2 — Admin gate (same query as public)
  services.is_active = true  AND  diviner_services.is_enabled = true
    → either false → 404
    (Admin-disabled services are invisible even to their owner.)

Step 3 — Diviner gate bypassed
  Bypass is_published; render regardless.

Step 4 — Render legacy template + blocks, same as public
  Prepend a minimal preview banner:
    "Preview — this is what your page will look like"
  No other visual or structural difference.
```

No builder-replaces-page branch. No separate draft renderer. No auto-creation of anything.

## Files Touched

| File | Change |
|---|---|
| `src/app/[username]/services/[slug]/page.tsx` | Rewrite. Feature-flagged fork of old vs new code paths during rollout. Keeps `?preview=true` branch (simplified). |
| `src/lib/diviner-service-blocks.ts` | New file — single `getDivinerBlocks(supabase, diviner_id, template_id)` helper that queries `diviner_service_blocks` view grouped by slot |
| `src/components/landing/block-renderer.tsx` | New component — renders one block based on `section_type` (`text | image | html`), with HTML sanitization for the `html` type. |
| `src/components/landing/section-renderer.tsx` | Delete (old builder-page renderer). |
| `src/components/landing/preview-banner.tsx` | **Keep but simplify.** New copy: "Preview — this is what your page will look like". Keep a discreet link back to `/dashboard/landing-pages/:templateId/builder` so the diviner can return to the editor in one click. |
| `src/app/[username]/services/[slug]/ref-link-preserver.tsx` | Keep, unchanged. |
| `src/lib/config/flags.ts` (or existing flags module) | Add `LANDING_PAGE_V2` boolean reading from env / DB config |

## Gate Implementation

Replace `getService()` in the current file ([page.tsx:54-97](../../../../src/app/%5Busername%5D/services/%5Bslug%5D/page.tsx#L54-L97)) with explicit gates and a preview bypass:

```ts
// Resolve ownership if ?preview=true was requested
const wantsPreview = searchParams.preview === "true";
let isOwner = false;
if (wantsPreview) {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (user) {
    const { data: ownerRow } = await admin
      .from("diviners")
      .select("id")
      .eq("id", diviner.id)
      .eq("user_id", user.id)
      .maybeSingle();
    isOwner = !!ownerRow;
  }
}

// Admin gate — enforced in the SQL query
const { data: service } = await admin
  .from("services")
  .select("*, template_id")
  .eq("diviner_id", diviner.id)
  .eq("slug", slug)
  .eq("is_active", true)
  .maybeSingle();
if (!service) return notFound();

if (service.template_id) {
  const { data: ds } = await admin
    .from("diviner_services")
    .select("is_enabled, is_published")
    .eq("diviner_id", diviner.id)
    .eq("template_id", service.template_id)
    .maybeSingle();
  if (!ds || !ds.is_enabled) return notFound(); // admin gate — always enforced
  // Diviner gate — bypassed only when viewer is the owning diviner in preview mode
  if (!ds.is_published && !(wantsPreview && isOwner)) return notFound();
}

const inPreview = wantsPreview && isOwner;
```

Freestyle services (no `template_id`) skip the diviner-services gate — they're gated only by `services.is_active`, which matches current behavior for freestyle. `?preview=true` has no effect on freestyle services (no `is_published` gate to bypass).

When `inPreview` is true, render the `<PreviewBanner />` at the top of the page. Otherwise render nothing extra. The rest of the page is identical in both modes.

### Behavior of internal links in preview

The preview page contains "Book Now" buttons, the service listing link, the diviner-profile link, and sticky CTAs — all pointing at other internal routes. Under preview:

- **"Book Now" buttons** — remain clickable. The destination `/{username}/book/{slug}` has its own gates and will succeed only if the service is also live there (admin flags + `is_published`). If the diviner is previewing an Offline service, Book Now leads to a 404, which is acceptable and self-consistent (no separate preview flow for booking).
- **Other internal links** (profile, services index) — behave normally, not tagged as preview.
- **`?preview=true` does NOT propagate** through internal links. Each route decides its own preview semantics.
- If the diviner wants to end-to-end test a booking in preview, they should toggle the service Live in the dashboard first, then preview + book.

Document this in release notes so diviners aren't surprised by Book Now failing from a preview of an Offline service.

## Block Injection

In the legacy template JSX:

- **About Your Diviner section** ([page.tsx:709-777](../../../../src/app/%5Busername%5D/services/%5Bslug%5D/page.tsx#L709-L777)) — after the existing avatar/bio/specialties card, map `blocks.about_diviner` through `<BlockRenderer />`.
- **Extra slot** — between FAQ ([page.tsx:885-907](../../../../src/app/%5Busername%5D/services/%5Bslug%5D/page.tsx#L885-L907)) and Final CTA ([page.tsx:909-935](../../../../src/app/%5Busername%5D/services/%5Bslug%5D/page.tsx#L909-L935)), map `blocks.extra`.

Blocks with `is_enabled = false` or `moderation_status IN ('flagged', 'rejected')` are filtered out at the query layer in `getDivinerBlocks`.

## BlockRenderer contract

```ts
interface Block {
  id: string;
  section_type: 'text' | 'image' | 'html';
  slot: 'about_diviner' | 'extra';
  title: string | null;
  content_json: Record<string, unknown> | null;
  body_html: string | null;
  primary_image_url: string | null;
  display_order: number;
}

function BlockRenderer({ block }: { block: Block }) { ... }
```

- `text` — renders `title` (if any) + paragraphs from `content_json.paragraphs: string[]`. JSX-escaped; never dangerous.
- `image` — renders `primary_image_url` with `title` as alt text, responsive `<Image>` with fixed aspect ratio.
- `html` — renders `body_html` via `dangerouslySetInnerHTML` **after** server-side sanitization (see Task 03 for sanitizer spec). At render time, the `body_html` column value is already sanitized; this component trusts it.

Styling: reuse existing `glass-card` and spacing tokens from the legacy template so blocks visually belong.

## Feature Flag

```ts
// src/lib/config/flags.ts
export const LANDING_PAGE_V2 = process.env.LANDING_PAGE_V2 === 'true';
```

In [page.tsx](../../../../src/app/%5Busername%5D/services/%5Bslug%5D/page.tsx):

```ts
if (LANDING_PAGE_V2) {
  return renderV2(...); // new code
}
return renderLegacy(...); // existing code, unchanged
```

Both paths live side-by-side during rollout. Task 03's cleanup removes the legacy path after the flag has been at 100% for the cooling period.

## SEO

No change. `generateMetadata()` ([page.tsx:140-180](../../../../src/app/%5Busername%5D/services/%5Bslug%5D/page.tsx#L140-L180)) already derives title/description from the service row and OG image from the diviner's cover image. The deprecated `custom_page_title` / `custom_seo_*` / `custom_og_image_url` fields on `service_landing_pages` are ignored under V2 — they were already rarely set.

## Analytics

`PageTracker` ([page.tsx:972-978](../../../../src/app/%5Busername%5D/services/%5Bslug%5D/page.tsx#L972-L978)) stays with the same props. Analytics continue to work untouched.

## Acceptance Criteria

- [ ] With `LANDING_PAGE_V2=false` (default), no behavior change — old tests pass.
- [ ] With `LANDING_PAGE_V2=true`:
  - [ ] Opening the URL when `is_active AND is_enabled AND is_published` are all true → renders legacy template with any configured blocks in the two slots.
  - [ ] Opening with `is_active=false` → 404 (for both public and preview).
  - [ ] Opening with `is_enabled=false` → 404 (for both public and preview — admin-disabled services are invisible even to their owner).
  - [ ] Opening with `is_published=false` as an anonymous user → 404.
  - [ ] Opening with `is_published=false` as the owning diviner with `?preview=true` → renders page with preview banner.
  - [ ] Opening with `is_published=false` as a different logged-in diviner with `?preview=true` → 404 (bypass does not apply to non-owners).
  - [ ] Opening with `?preview=true` while logged out → 404 when `is_published=false` (no silent info leak).
  - [ ] `?preview=true` when `is_published=true` → renders the same content as without the param, but with the preview banner on top.
  - [ ] A diviner with zero blocks gets exactly the rich legacy template (no empty slots, no dead divs).
  - [ ] A diviner with 1 text + 1 image block in `about_diviner` and 2 html blocks in `extra` sees all four render in the right positions.
  - [ ] Blocks with `is_enabled=false` are not rendered in either mode.
- [ ] E2E test covering all four flag-gate combinations passes.
- [ ] Type-check and lint pass.

## Rollback

Flip `LANDING_PAGE_V2` to false. Old code path resumes in the next request. Zero downtime.

## Out of Scope

- Builder UI changes (Task 03).
- Admin UI changes (Task 04).
- Dashboard UI changes (Task 05).
- Adding new block types beyond text/image/html.
- Per-block preview workflows.
