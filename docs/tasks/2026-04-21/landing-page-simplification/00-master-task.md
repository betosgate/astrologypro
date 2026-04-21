# Master Task — Landing Page Simplification — 2026-04-21

- Status: Not Started
- Priority: P1
- Owner: Full Stack
- Module: Diviner Service Landing Pages
- PMS Type: Master Task
- Folder Path: `docs/tasks/2026-04-21/landing-page-simplification`
- Task File: `docs/tasks/2026-04-21/landing-page-simplification/00-master-task.md`
- Depends On: Sprint `2026-04-17` Feature B (landing-page builder) — this task supersedes its "builder replaces the whole page" model.

## Goal

Replace the current "landing-page builder replaces the whole page" model with a simpler "legacy template is always the base, builder adds optional blocks" model. Split flag ownership cleanly between admin and diviner so the two roles can never write to each other's flags.

## Why This Exists

A live production incident on 2026-04-21 surfaced a cluster of related design problems:

1. The public route 404'd for a service whose dashboard badge said "Published" — the two tables (`diviner_services` and `service_landing_pages`) had drifted out of sync because the publish workflow writes to both sequentially without a transaction and without checking errors.
2. The root cause was a CHECK-constraint violation (`publish_status = "live"` not in the allowed enum) that `supabase-js` returned as an `{ error }` object. The code never checked `.error`, so the failure was silently swallowed and the UI reported success.
3. Beyond the specific bug, the design itself entangles two separate concerns (admin approval vs diviner content) in overlapping flags (`services.is_active`, `diviner_services.is_enabled`, `diviner_services.is_published`, `diviner_services.publish_status`, `service_landing_pages.status`). The builder's Publish button silently writes admin-owned flags, and the admin UI can toggle fields that are conceptually the diviner's.
4. When a diviner publishes a builder page with only the 3 auto-inserted system sections (hero / pricing / booking_cta) + one bio section, the resulting live page looks dramatically sparser than the rich hardcoded legacy template it replaces. Product direction (2026-04-21) is that the legacy template should be the universal default — the builder should only add optional blocks on top of it.

## Final Design (Confirmed by Product, 2026-04-21)

### Flag Ownership

| Flag | Owner | Meaning |
|---|---|---|
| `services.is_active` | Admin | Service exists on the platform |
| `diviner_services.is_enabled` | Admin | This diviner is allowed to offer this service |
| `diviner_services.is_published` | Diviner | "My page is live" switch |

- Admin UI and admin APIs write only the admin-owned flags.
- Diviner UI (builder + dashboard) writes only the diviner-owned flag plus the block content.
- Neither side crosses the boundary.

### Public URL Flow — `/<username>/services/<slug>`

```
Step 1 — Admin gate
  services.is_active = true  AND  diviner_services.is_enabled = true
    → either false → 404

Step 2 — Diviner gate
  diviner_services.is_published = true
    → false → 404

Step 3 — Always render the legacy template
  (hero · what's included · who this is for · about diviner ·
   how it works · testimonials · FAQ · final CTA · sticky CTA)

Step 4 — Render diviner's custom blocks in two fixed slots
  - Inside the "About Your Diviner" section
  - In an "Extra" slot positioned before the final CTA
```

### Owner Preview Flow — `/<username>/services/<slug>?preview=true`

```
Step 1 — Auth check
  Logged in AND owning diviner (diviners.user_id == session.user_id)?
    → No  → ignore ?preview=true, fall through to normal public flow
    → Yes → continue

Step 2 — Admin gate (same as public)
  services.is_active = true  AND  diviner_services.is_enabled = true
    → either false → 404
    (Admin-disabled services are invisible even to their owner.)

Step 3 — Diviner gate BYPASSED
  is_published may be false; preview renders anyway.

Step 4 — Render exactly what public would see when Live
  Same legacy template, same block rendering, same styling.
  A minimal banner at the top reads: "Preview — this is what
  your page will look like." No other visual difference.
```

Key properties:

- Same rendering code path as public — no separate renderer, no separate template.
- No draft/published split on blocks. What the diviner saves is what preview shows and what public will show when Live.
- Preview cannot be shared with non-owners: the auth check strips the bypass if the viewer isn't the owning diviner; the URL degrades to the normal public flow.
- Admin cannot preview someone else's page (same reason). Future admin-moderation preview, if needed, is a separate task.
- For "hide a block while working", the diviner uses the existing per-block `is_enabled` toggle — no new draft concept needed.

### Diviner-Customizable Regions

Two slots, three block types:

| Slot | Position in legacy template | Block types allowed |
|---|---|---|
| `about_diviner` | Inside/below the "About Your Diviner" section | `text`, `image`, `html` |
| `extra` | Between "FAQ" and "Final CTA" | `text`, `image`, `html` |

- Each block has `is_enabled`, `display_order`, content, and moderation status.
- No publish/unpublish lifecycle for individual blocks — if enabled and not flagged by moderation, it renders.
- Owner preview is the one concession to "see before going live" (see the Owner Preview Flow section above). Beyond that, whatever the diviner saves is what shows.

### What Gets Deleted

- The entire "builder replaces the whole page" branch in the public route
- Auto-inserted system sections (`hero`, `pricing`, `booking_cta`, `bio`) on first builder access
- `publishLandingPage` / `unpublishLandingPage` helpers (no more page-level lifecycle)
- `getPublishedLandingPage` / `getDraftLandingPage` split (one function is enough; content has no draft/published distinction)
- Dashboard "Publish / Unpublish" buttons for the builder page
- "Published / Draft / Unpublished" badges in the landing-pages dashboard (replaced by "Live / Offline" tied to `diviner_services.is_published`)
- The entire `service_landing_pages` table (container becomes unnecessary; blocks link directly to `(diviner_id, service_template_id)`)
- Dead columns listed below

### What Stays (contrary to earlier drafts)

- **Owner preview route via `?preview=true`** — reworked, not deleted. Uses the same renderer as public; only the `is_published` gate is bypassed, and only for the owning diviner. The `PreviewBanner` component is reused with simplified copy. Builder "View preview" links to this route.

### Columns to Drop (Deploy 2 — after cooling period)

`diviner_services`:
- `publish_status` — redundant with `is_published`; source of the 2026-04-21 incident

`service_landing_pages` (whole table dropped; these columns go with it):
- `slug`, `custom_page_title`, `custom_seo_title`, `custom_seo_description`, `custom_og_image_url`, `accent_color`, `font_style`, `status`, `published_at`, `unpublished_at`, `draft_version`, `published_version`, `moderation_status`, `moderation_note`, `moderated_by`, `moderated_at`

`service_landing_page_sections` (renamed to `diviner_service_blocks`):
- `is_system`, `is_draft`, `draft_content_json`, `draft_body_html`, `published_content_json`, `published_body_html` (merged into single `content_json` and `body_html`)
- `instance_key`, `subtitle`, `images` — confirmed unused; drop

### Columns to Add

`diviner_service_blocks` (the renamed sections table):
- `slot` enum (`'about_diviner' | 'extra'`) — which region the block renders in

### Columns Kept

All other existing columns remain untouched. Full audit is in `01-schema-additive.md`.

## Migration Strategy

Per [CLAUDE.md §7](../../../../CLAUDE.md) (*"Schema changes must be backward-safe — additive first, never destructive in the same deploy"*) and the project's migration workflow at [/admin/db/migrations](../../../../src/app/admin/db/migrations/page.tsx) (full guide: [docs/db-migrations.md](../../../../docs/db-migrations.md)), the work splits into two deployments with a hotfix in front.

### Project Migration Workflow Rules (must follow for every SQL change)

Every migration in this task ships as three coordinated files:

1. `supabase/migrations/<YYYYMMDDHHMMSS>_<name>.sql` — canonical SQL
2. `src/data/migrations/<id>.ts` — bundled TS mirror (generated via the Python helper in the admin page walkthrough)
3. Entry added to [src/lib/db/migrations.ts](../../../../src/lib/db/migrations.ts) allowlist

Execution path: commit all three files → deploy to Vercel → open `/admin/db/migrations` → click **Run migration**. Executes via Supabase Management API against project `wyluvclvtvwptsvvtgkv`.

**Hard rules for every SQL file in this task:**

- Idempotent (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`) — re-running must be safe
- Additive only in Deploy 1 (no `DROP` statements)
- RLS enabled on every new table
- Indexes designed for actual query patterns from the new public route
- `COMMENT ON TABLE` / `COMMENT ON COLUMN` for anything non-obvious
- RLS policy creation wrapped in `DO $$ IF NOT EXISTS (SELECT 1 FROM pg_policies ...) $$`
- Functions use `CREATE OR REPLACE FUNCTION`

**Runner constraints to plan around:**

- 60-second timeout per migration invocation. The backfill that sets `slot` on existing `service_landing_page_sections` rows must be either (a) small enough to complete under 60s, or (b) split into a background cron route. Row count audit in `01-schema-additive.md` will settle which.
- Destructive migrations (Deploy 2) can run through the admin runner, but only after the additive migration has soaked for the cooling period AND a DB backup has been taken. The admin page explicitly warns against using the runner for destructive changes without additive-first staging plus backup — Deploy 2's PR description must show both.
- Local development does not use this runner; reset via `supabase db reset` per project convention.

### Deploy 0 — Hotfix (Immediate, Standalone SQL)

The Nativity Birth Chart page is live-broken in production right now — the page 404s despite the dashboard showing "Published". This does not wait for the refactor. Run a one-shot SQL repair first, independent of any code change:

```sql
-- Resync any row where service_landing_pages.status = 'published' but
-- diviner_services.is_published is false. See 06-data-repair.md for the
-- full audit query and reasoning.
```

- **Effort:** minutes
- **Risk:** low (pure data write, affects only affected rows)
- **Rollback:** snapshot affected row values before write; re-apply prior values if needed
- **Owner:** on-call / whoever runs prod SQL

See `06-data-repair.md` for the exact queries and the list of drifted rows.

### Deploy 1 — Additive + Code Cutover

Feature-flagged rollout — new rendering path behind `LANDING_PAGE_V2` flag in config. Old path remains live until the flag is flipped, letting us roll back in seconds without a redeploy.

1. **Schema additive migration** — add `slot` column to `service_landing_page_sections` (default `'extra'` for new rows). Create `diviner_service_blocks` as a view over the existing table or as a rename target — see `01-schema-additive.md` for the chosen approach. Keep all deprecated columns in place; no drops.
2. **Backfill migration** — for every existing `service_landing_page_sections` row, set `slot` based on rules in `01-schema-additive.md`. System sections (`hero`, `pricing`, `booking_cta`, `bio`) are marked `is_enabled = false` rather than deleted, so rollback can restore them. Diviner-authored blocks are mapped to `about_diviner` or `extra` based on `section_type`.
3. **Code simplification (feature-flagged)** — rewrite the public route with a `if (LANDING_PAGE_V2)` switch between old and new rendering. Simplify the builder behind the same flag. Remove cross-boundary writes in publish/unpublish helpers. All new code checks `.error` on every supabase-js write — no silent failures permitted.
4. **Canary rollout** — flip the flag for internal test diviners first (e.g., `test-diviner-1`). Verify the rich legacy template renders, blocks slot correctly, booking still works. Then ramp to 100%.
5. **Monitor** — watch 404 rate on `/[username]/services/[slug]`, booking conversion rate, and error logs for `.throwOnError()` surfaces from the new code for at least 72 hours before declaring Deploy 1 stable.

Cooling period: at least one week of production traffic with the V2 flag fully on and zero regressions before Deploy 2 is considered.

**Rollback plan (Deploy 1):** flip the feature flag off. Old code path resumes immediately. Data is intact because Deploy 1 is additive only. If the flag infra itself has an issue, revert the code PR — still safe because no columns or tables were dropped.

### Deploy 2 — Destructive Cleanup

Only runs after Deploy 1 is stable for at least one week with the V2 flag at 100%.

1. Drop the deprecated columns listed in the "Columns to Drop" section above.
2. Drop the `service_landing_pages` table entirely.
3. Rename `service_landing_page_sections` to `diviner_service_blocks` if not already done via view aliasing in Deploy 1.
4. Tighten the `section_type` CHECK constraint to only allow `'text' | 'image' | 'html'`.
5. Remove the `LANDING_PAGE_V2` feature flag (dead code).

**Rollback plan (Deploy 2):** destructive migration has no safe rollback path after commit. Pre-requisites:

- A full DB backup taken immediately before the migration runs
- A verified restore procedure tested in staging against a copy of prod data within the last 7 days
- An explicit go/no-go by eng owner + product owner recorded in the PR

If a P0 regression surfaces post-Deploy 2, the rollback is a restore from backup with any writes since the migration re-applied manually — expensive. This is why the one-week cooling period matters.

## Security — HTML Block Sanitization

The `html` block type is the only path by which diviner-authored content becomes raw HTML rendered on a public page. This is an XSS vector by construction. Per [CLAUDE.md §11](../../../../CLAUDE.md) (*"Sanitize all raw HTML output. Add CSP and security headers to every response."*):

- **Server-side sanitization on write** — every `html` block's `body_html` is run through an allowlist sanitizer (e.g., `sanitize-html` or DOMPurify server-side) before persisting. Disallowed tags/attributes are stripped or rejected with a 422 at the API.
- **Allowlist, not blocklist** — permit a narrow set: `p`, `a` (href only, http/https, no `javascript:`), `strong`, `em`, `ul`, `ol`, `li`, `br`, `h3`, `h4`, `blockquote`. No `<script>`, `<iframe>`, `<style>`, event handlers, inline styles, or data URIs.
- **CSP header** — the service detail route already emits a CSP via Next.js middleware. Verify it blocks inline scripts. If it doesn't today, add it as part of this task.
- **Moderation gate** — the existing block-level `moderation_status` flow stays. A block flagged by automated or manual moderation does not render.
- **Render-time escape for text blocks** — text blocks are plain text only, JSX-escaped on render. They never go through the HTML sanitizer because they never produce HTML in the first place.

`03-builder-simplification.md` must specify the exact sanitizer library, allowlist, and the server-side validation pipeline.

## Known Callers of Deleted Helpers

The following files import helpers scheduled for deletion. Every one must be addressed in Deploy 1 or the code won't compile:

| Caller | Helper used | Resolution |
|---|---|---|
| `src/app/[username]/services/[slug]/page.tsx` | `getDraftLandingPage`, `getPublishedLandingPage` | Replace both calls with a single `getDivinerBlocks(diviner_id, template_id)` that returns blocks grouped by slot |
| `src/app/api/dashboard/landing-pages/[templateId]/publish/route.ts` | `publishLandingPage` | **Rename** to `.../toggle-live/route.ts`. New contract accepts `{ is_published: boolean }`, handles both directions. Stops calling `publishLandingPage`. See Tasks 03 and 05. |
| `src/app/api/dashboard/landing-pages/[templateId]/unpublish/route.ts` | `unpublishLandingPage` | Delete the entire route file — the renamed `toggle-live/route.ts` handles unpublish too. |
| `src/app/api/dashboard/landing-pages/[templateId]/preview/route.ts` | Uses the builder-page model | Delete — editor becomes WYSIWYG; no separate preview route |
| `src/app/api/dashboard/landing-pages/[templateId]/sections/route.ts` | `getOrCreateLandingPage` | Rework to directly read/write blocks keyed by `(diviner_id, template_id, slot)`. No auto-create of container rows. |
| `src/app/api/admin/landing-pages/[landingPageId]/publish/route.ts` | Admin-side publish | Delete — admin no longer touches `is_published` |
| `src/lib/landing-page-builder.ts` | Defines all the above | Rewrite as `src/lib/diviner-service-blocks.ts` with only block CRUD helpers; the publish/sections orchestration functions go away |

Additional routes and components touched but not using the deleted helpers directly:

- `src/app/api/admin/landing-pages/[landingPageId]/sections/**` — admin moderation routes. Re-point from `landing_page_id` key to `(diviner_id, template_id)` after the container table is dropped.
- `src/app/api/admin/landing-pages/moderation/route.ts` — admin moderation queue. Same re-pointing.
- `src/app/api/admin/landing-pages/section-types/route.ts` — admin config for allowed section types and their `max_per_page`. Reduce the registry to `text | image | html` entries.
- `src/app/api/dashboard/landing-pages/[templateId]/upload/route.ts` — image upload endpoint. Keep; reused by the `image` block type.
- `src/app/api/dashboard/landing-pages/[templateId]/sections/[sectionId]/route.ts`, `.../toggle/route.ts`, `.../reorder/route.ts` — block CRUD. Keep but rename path and tighten type validation.
- `src/app/api/dashboard/landing-pages/route.ts` — dashboard list query. Rewrite to return per-service `{ admin_active, diviner_published, block_count }` instead of the current Published/Draft/Unpublished shape.
- `src/app/dashboard/landing-pages/page.tsx` — dashboard UI. See `05-dashboard-simplification.md`.
- `src/components/landing/section-renderer.tsx` — used only by the builder-replaces-page path. Delete.
- `src/components/landing/preview-banner.tsx` — kept under V2. Simplified copy, reused by the public route when `?preview=true` + owner. See Task 02.
- `src/lib/landing-page-section-types.ts` — type registry. Reduce to three entries.
- `src/types/landing-page-builder.ts` — TS types. Trim to match.

## Child Tasks

### Phase 1 — Deploy 1 (Additive)

1. `01-schema-additive.md` — Additive DB migration: add `slot` column, set up `diviner_service_blocks` alias/rename, backfill existing rows. Does NOT drop anything yet.
2. `02-public-route-rewrite.md` — Rewrite [src/app/[username]/services/[slug]/page.tsx](../../../../src/app/%5Busername%5D/services/%5Bslug%5D/page.tsx) to the new flow. Always render legacy template; slot-render diviner blocks. Remove the builder-replaces-page path. Keep and simplify the owner `?preview=true` branch.
3. `03-builder-simplification.md` — Strip [src/lib/landing-page-builder.ts](../../../../src/lib/landing-page-builder.ts) and related API routes. Delete publish/unpublish helpers. Reduce block types to `text | image | html`. Scope builder UI to the two slots.
4. `04-admin-ui-cleanup.md` — Ensure admin service-assignment writes only `services.is_active` and `diviner_services.is_enabled`. Remove any admin-side "publish" controls that touch `is_published`.
5. `05-dashboard-simplification.md` — Rebuild [src/app/dashboard/landing-pages/page.tsx](../../../../src/app/dashboard/landing-pages/page.tsx): one "Live / Offline" toggle per service (writes `is_published`), plus a "Customize About + Extra sections" link. Remove the Publish/Unpublish buttons and the "Published/Draft/Unpublished" status badges. Preview remains as a button inside the builder (not the dashboard) — see Task 03.
6. `06-data-repair.md` — SQL script to repair currently-drifted rows (including `test-diviner-1/services/nativity-birth-chart`).

### Phase 2 — Deploy 2 (Destructive)

7. `07-destructive-migration.md` — Drop deprecated columns, drop `service_landing_pages` table, tighten `section_type` enum. Runs at least one week after Deploy 1.

## Acceptance Criteria

- [ ] Opening `/<username>/services/<slug>` renders the legacy template whenever both admin flags and `is_published` are true.
- [ ] If any of the three flags is false, the page returns 404.
- [ ] A diviner can add up to N `text`/`image`/`html` blocks to the `about_diviner` slot and up to N to the `extra` slot. The blocks render in the correct position inside the legacy template.
- [ ] Blocks can be reordered, enabled/disabled, and deleted. There is no draft/published split on a block.
- [ ] The diviner has exactly one "Live / Offline" switch in their dashboard per service. Flipping it writes `diviner_services.is_published`.
- [ ] Admin has zero controls that touch `diviner_services.is_published`.
- [ ] No publish/unpublish action writes across the admin/diviner boundary.
- [ ] Every `supabase-js` write in the publish/block-save paths checks `.error` and throws; no silent failures.
- [ ] The 2026-04-21 regression (Nativity Birth Chart 404 despite "Published" badge) cannot recur because the underlying flag + the offending code path are both gone.

## Known Risks

| Risk | Mitigation |
|---|---|
| Existing diviners with richly customized builder pages lose their content on cutover | Backfill migration preserves their blocks under the `extra` slot. Communicate the model change in release notes. |
| Admin may have been using the publish flag as a "hide this service" lever | Admin still has `is_enabled` for that exact purpose — no capability is lost. |
| Moderation currently lives on both landing page and sections | Consolidate to block-level moderation only. Drop page-level moderation columns in Deploy 2. |
| Admin moderation routes under `src/app/api/admin/landing-pages/**` could be deleted by mistake when Task 03 removes other admin publish endpoints | Deploy 1 **keeps** all admin moderation endpoints operational and reading from `service_landing_page_sections`. They only get re-pointed to `(diviner_id, template_id)` keys in Deploy 2 when the container table is dropped. Do **not** delete them in Deploy 1. |

## Out of Scope

- Rebuilding the `testimonials` section to be diviner-editable (stays DB-driven).
- New block types (video, embed, etc.) — add only `text | image | html` for now.
- Audit log table for state transitions — keep per-row audit timestamps on `diviner_services`; a proper audit log is a separate future task.
- Customizing the order, colors, or typography of the legacy template.
- Per-block preview or draft workflow.
