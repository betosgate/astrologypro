# Task 03 — Builder Simplification + HTML Sanitization

- Status: Not Started
- Priority: P1
- Depends On: Task 01 (schema), Task 02 (public route contract)
- Blocks: Task 05 (dashboard UI)
- Feature flag: `LANDING_PAGE_V2` (shares the toggle with Task 02)

## Goal

Strip the landing-page builder down to the simplest form that serves the new model:

- Only three block types — `text`, `image`, `html`.
- Two fixed slots — `about_diviner`, `extra`.
- No publish / unpublish concept at the builder level (publish state lives on `diviner_services.is_published` and is toggled from the dashboard, not the builder).
- **Owner preview via `?preview=true`** — reuses the public renderer, bypasses only `is_published` for the owning diviner. No separate draft renderer. See Task 02 for route-level logic.
- No auto-creation of container rows or system sections on first visit.
- Every `html` block is sanitized server-side before being persisted. No client-trusted HTML ever reaches the DB.

## Files Deleted

| File | Reason |
|---|---|
| `src/app/api/dashboard/landing-pages/[templateId]/unpublish/route.ts` | No unpublish endpoint — toggle-live handles both directions |
| `src/app/api/dashboard/landing-pages/[templateId]/preview/route.ts` | Preview is handled by the public route with `?preview=true`; no separate preview API |
| `src/app/api/admin/landing-pages/[landingPageId]/publish/route.ts` | Admin doesn't publish |
| `src/components/landing/section-renderer.tsx` | Only used by deleted builder-replaces-page render path |

## Files Renamed

| File | Change |
|---|---|
| `src/app/api/dashboard/landing-pages/[templateId]/publish/route.ts` | Renamed to `.../toggle-live/route.ts`. Accepts `{ is_published: boolean }`, returns 409 when admin-disabled. Full contract in Task 05. Same diviner-owns-only authorization. |

### Files Kept (reworked)

| File | Change |
|---|---|
| `src/components/landing/preview-banner.tsx` | Kept. Simplified copy: "Preview — this is what your page will look like." Adds a discreet "Back to builder" link pointing at `/dashboard/landing-pages/:templateId/builder`. Rendered by the public route when `?preview=true` + owner. |

## Files Rewritten

| File | Change |
|---|---|
| `src/lib/landing-page-builder.ts` | Renamed to `src/lib/diviner-service-blocks.ts`. Only block CRUD helpers. `publishLandingPage`, `unpublishLandingPage`, `getPublishedLandingPage`, `getDraftLandingPage`, `getOrCreateLandingPage` all deleted. |
| `src/lib/landing-page-section-types.ts` | Replace registry with three entries: `text`, `image`, `html`. Remove `is_system` concept. Each entry carries `max_per_slot` (default 10). |
| `src/app/api/dashboard/landing-pages/route.ts` | Response shape changes — see "Dashboard contract" below. |
| `src/app/api/dashboard/landing-pages/[templateId]/sections/route.ts` | Replaces path with `.../blocks/route.ts` eventually (kept under old path in Deploy 1 for flag compatibility). Accepts only `section_type ∈ {text, image, html}` and `slot ∈ {about_diviner, extra}`. Returns 422 on any other value per RFC 9457. |
| `src/app/api/dashboard/landing-pages/[templateId]/sections/[sectionId]/route.ts` | PATCH body limited to: `title`, `content_json`, `body_html`, `primary_image_url`, `is_enabled`. Any other field — including `is_draft`, `is_system`, `moderation_*`, `draft_*`, `published_*`, `display_order` (use reorder route), or any admin-owned flag — is rejected with 422 per RFC 9457. Server-side sanitization on every `body_html` write — see "HTML sanitization" below. |
| `src/app/api/dashboard/landing-pages/[templateId]/sections/reorder/route.ts` | Unchanged logic; validates that reorder is within a single slot (no cross-slot moves). |
| `src/app/api/dashboard/landing-pages/[templateId]/sections/[sectionId]/toggle/route.ts` | Unchanged — toggles `is_enabled`. |
| `src/app/api/dashboard/landing-pages/[templateId]/upload/route.ts` | Kept. Reused by `image` block type. |
| `src/app/api/admin/landing-pages/**` (moderation routes) | **Kept operational in Deploy 1.** Re-point from `landing_page_id` foreign key to `(diviner_id, template_id)` parent key only in Deploy 2, when `service_landing_pages` container is dropped. Do not delete any admin moderation endpoint during this task. |
| `src/types/landing-page-builder.ts` | Trim to the shape used by the simplified API. Delete unused fields. |

## HTML Sanitization (Security Hard Requirement)

Per [CLAUDE.md §11](../../../../CLAUDE.md), raw HTML from user input must be sanitized server-side, on write.

**Library:** [`sanitize-html`](https://www.npmjs.com/package/sanitize-html) — mature, battle-tested, allowlist-based. Already acceptable per CLAUDE.md §10 (maintained, recent major version).

**Allowlist (exact):**

```ts
// src/lib/html-sanitizer.ts
import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  'p', 'br',
  'strong', 'em', 'u',
  'ul', 'ol', 'li',
  'h3', 'h4',
  'blockquote',
  'a',
];

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ['href', 'title'],
};

const ALLOWED_SCHEMES = ['http', 'https', 'mailto'];

export function sanitizeDivinerHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRS,
    allowedSchemes: ALLOWED_SCHEMES,
    disallowedTagsMode: 'discard',
    allowedSchemesByTag: { a: ALLOWED_SCHEMES },
    allowProtocolRelative: false,
    enforceHtmlBoundary: true,
  });
}
```

**Disallowed (by construction):** `<script>`, `<iframe>`, `<style>`, `<link>`, `<meta>`, `<form>`, `<input>`, `<object>`, `<embed>`, `<svg>` (images go through the `image` block type), all event handlers (`onclick`, `onerror`, etc.), `javascript:` URIs, `data:` URIs, inline `style` attributes.

**Pipeline — every PATCH/POST handler for a block with `section_type = 'html'`:**

Strict mode (chosen — the safer, clearer option for diviners):

1. Read raw `body_html` from request.
2. Run through `sanitizeDivinerHtml()`.
3. If the sanitizer changed the input at all (string inequality after a normalizing whitespace trim), reject with **422** per RFC 9457:
   ```json
   {
     "type": "about:blank",
     "title": "Invalid HTML",
     "status": 422,
     "detail": "Your HTML contains tags or attributes we don't allow. Remove them and resubmit.",
     "stripped_example": "<script>"
   }
   ```
   Include `stripped_example` (the first disallowed token detected) so the diviner can find the offending content quickly.
4. Only when input == sanitized output → persist. The value in the DB is therefore always identical to a clean-allowlist string, and the public-route renderer at Task 02 trusts it.

Strict mode is preferred over silent-sanitize because it surfaces the issue to the diviner instead of silently deleting parts of their content.

**CSP:** verify the project's CSP header (should be in Next.js middleware or config) sets `default-src 'self'` and `script-src 'self'`. Any inline `<script>` would be blocked even if it slipped past sanitization. If CSP is not set today, add it as a sub-task here.

**Moderation gate stays:** block-level `moderation_status` continues to be set by admin review. Blocks with `moderation_status IN ('flagged', 'rejected')` are filtered out at render (Task 02's `getDivinerBlocks`). Moderation and sanitization are complementary — sanitization is automated pre-persist; moderation is human post-persist.

## Builder UI

| Current | New |
|---|---|
| Rich section-type picker (hero/pricing/about/testimonials/faq/cta/…) | Three-option picker: Text, Image, HTML |
| Two slots rendered as "the page" | Two distinct editor sections: **About Your Diviner** and **Extra** |
| "Publish" / "Unpublish" buttons | Gone — status shown read-only from `diviner_services.is_published`, toggled from the dashboard list page |
| "Preview" button opening `?preview=true` | Kept. Opens the public URL with `?preview=true` in a new tab. Public route renders via the owner-preview flow (same renderer, `is_published` bypassed, banner shown). |
| Preview banner | Kept, simplified copy (see `PreviewBanner` above) |
| Moderation status badges | Kept at the block level |

`max_per_slot` defaults to 10 text/image/html combined per slot. Configurable per-slot if needed later.

## Bootstrapping (first builder visit)

First visit to the builder for a `(diviner, template)` pair shows an empty list per slot with "+ Add block" buttons. No automatic writes on page load. The first click on "+ Add block" triggers the block-create flow.

**Schema reality in Deploy 1:** `service_landing_page_sections.landing_page_id` is NOT NULL and FK-referenced to `service_landing_pages`. To satisfy the FK without surfacing the container to the diviner, the block-create handler performs this atomically inside one Postgres transaction:

1. `INSERT ... ON CONFLICT DO NOTHING` into `service_landing_pages` for the `(diviner_id, service_template_id)` pair. Every deprecated column stays at its default (`status='draft'`, no custom SEO, etc.). Under V2 the row's fields are never read — only its `id` matters as an FK target.
2. `SELECT id FROM service_landing_pages WHERE (diviner_id, service_template_id) = (...)` to get the container id.
3. `INSERT INTO service_landing_page_sections (landing_page_id, diviner_id, section_type, slot, ...)` with the new block.
4. All three wrapped in a single transaction — any failure rolls back all writes.

First-visit GET endpoints (list blocks) must **not** trigger any INSERT — they return `{ about_diviner: [], extra: [] }` if no rows exist yet. Write-on-read is explicitly forbidden.

In Deploy 2 the parent table and FK are dropped and the `landing_page_id` column goes with them. The lazy-create step above disappears in that migration.

## API Contract (new)

### `GET /api/dashboard/landing-pages`

Response shape — see `05-dashboard-simplification.md` for full contract.

### `GET /api/dashboard/landing-pages/:templateId/blocks`

Response:
```json
{
  "about_diviner": [ <Block>, ... ],
  "extra": [ <Block>, ... ],
  "limits": { "max_per_slot": 10 }
}
```

### `POST /api/dashboard/landing-pages/:templateId/blocks`

Request:
```json
{
  "section_type": "text" | "image" | "html",
  "slot": "about_diviner" | "extra",
  "title": string | null,
  "content_json": {} | null,
  "body_html": string | null,
  "primary_image_url": string | null
}
```

Validation (server-side):
- `section_type` and `slot` must be from the enum above → 422 otherwise.
- If `section_type = 'html'`, `body_html` runs through sanitizer.
- `title.length ≤ 140`.
- Block count in the target slot must be `< max_per_slot` → 422 with retry-after style message otherwise.

### `PATCH /api/dashboard/landing-pages/:templateId/blocks/:blockId`

Same validation. Only the owning diviner (checked via `diviner_services`) can patch. Admin cannot — admin touches only moderation.

### Error shape (all endpoints)

RFC 9457 Problem Details per [CLAUDE.md §14](../../../../CLAUDE.md):
```json
{
  "type": "about:blank",
  "title": "Invalid HTML",
  "status": 422,
  "detail": "Disallowed tags or attributes were stripped. Review and resubmit."
}
```

## Acceptance Criteria

- [ ] `publishLandingPage`, `unpublishLandingPage`, `getPublishedLandingPage`, `getDraftLandingPage`, `getOrCreateLandingPage` are all deleted. `grep -r "publishLandingPage"` returns zero hits.
- [ ] The four files in "Files Deleted" are gone; `publish/route.ts` is renamed to `toggle-live/route.ts` per Task 05.
- [ ] `src/lib/landing-page-section-types.ts` exports exactly three entries: `text`, `image`, `html`.
- [ ] `POST /api/dashboard/landing-pages/:templateId/blocks` with `section_type='hero'` returns 422.
- [ ] POSTing a block with `body_html: '<script>alert(1)</script>Hello'` returns **422** (strict mode). The DB row is not created.
- [ ] POSTing a block with clean `body_html: '<p>Hello <strong>world</strong></p>'` succeeds. The DB row contains the exact input.
- [ ] PATCH on a block with `{ is_draft: true }`, `{ moderation_status: 'approved' }`, or any other disallowed field returns 422.
- [ ] Every write in the new helpers uses `.throwOnError()` or explicit `{ error }` check. No silent failures. Unit test for the error-surfacing path.
- [ ] Builder UI loads and lets the user add/edit/reorder/delete blocks in both slots. No "publish" button anywhere in the builder.
- [ ] First-time builder visit (GET blocks) does **not** create a `service_landing_pages` row. First block-create POST lazy-creates the container in the same transaction.
- [ ] Admin moderation routes under `src/app/api/admin/landing-pages/**` still respond 200 for valid requests (they are **kept** in Deploy 1).
- [ ] CSP header verified on service detail page (manual browser check: `curl -I` for `Content-Security-Policy`).
- [ ] Type-check and lint pass. All existing tests pass; new tests cover: sanitizer strict-mode rejection, slot validation, max-per-slot limit, cross-boundary write rejection (diviner cannot patch `is_enabled` on `diviner_services`).

## Rollback

Flip `LANDING_PAGE_V2` off. Old builder and routes resume. The deleted files would need to be restored if you need full old-path recovery — keep the Deploy 1 PR small so `git revert` is one-click.

## Out of Scope

- Dashboard list UI (Task 05).
- Admin moderation UI (Task 04 touches it lightly; real rework is its own future task).
- New block types beyond text/image/html.
- Rich-text toolbar inside the HTML block (diviner pastes HTML; we sanitize; that's it).
