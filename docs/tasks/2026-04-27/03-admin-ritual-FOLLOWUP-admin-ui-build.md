# Follow-Up — Admin UI Build For Ritual Configurations

> Foundation already shipped 2026-04-27.
> Source spec: `docs/tasks/2026-04-27/03-admin-ritual-configurations-and-dynamic-media-management.md`

The schema, seed data, and runtime resolver are in place. The remaining
work is the admin UI surface for curating ritual definitions, media
assets, and tag mappings. Each phase below ships independently as its
own focused PR.

## What's Already Shipped

| Layer | Module | Result |
|---|---|---|
| Schema | `supabase/migrations/20260427000002_ritual_admin_config.sql` (+ TS mirror, registered) | Three new tables, RLS, indexes, seed data for the four current rituals + 37 known asset URLs + matching global tag mappings |
| Resolver | `src/lib/community/ritual-asset-resolver.ts` | Pure server module: `resolveAssetForTag`, `resolveAssetsForTags`, `resolveFinalOverrideForRitual`, `loadRitualDefinitionByKey`, `listPublishedRitualDefinitions`. Per-ritual override → global mapping → code-map fallback. |
| Sidebar rename | `src/components/admin/admin-sidebar.tsx` + back-links + page heading | "Rituals" → "Ritual Configurations" |
| Runtime wiring | `src/app/community/rituals/[id]/playback/page.tsx` | Playlist URLs now flow through the resolver. Code-map fallback preserved → existing UX unchanged when no admin curation exists. |

The resolver writes nothing. Every existing ritual playback flow keeps
working byte-for-byte until an admin curates a ritual.

## Phased UI Build

### Phase 1 — Admin asset library
**Routes:** `/admin/ritual-assets`, `/admin/ritual-assets/new`, `/admin/ritual-assets/[id]/edit`

Build a basic CRUD over `ritual_media_assets`:
- list with filters (active/published/source_type)
- create form with two source-type tabs:
  - **Upload** → POST file to a Supabase storage bucket (e.g. `ritual-media`), persist `storage_path`
  - **External URL** → paste + validate URL format, persist `external_url`
- edit form, archive action
- inline preview player for both source types

API surface (admin-only — protect via `requireAdminUser` middleware):
- `GET    /api/admin/ritual-assets`
- `POST   /api/admin/ritual-assets`
- `PATCH  /api/admin/ritual-assets/:id`
- `POST   /api/admin/ritual-assets/upload` (multipart)
- `DELETE /api/admin/ritual-assets/:id` (soft archive)

Storage decision (open question from the spec):
- Recommend a private Supabase bucket + signed URLs that the resolver
  refreshes on demand. Keeps assets behind auth without hardcoding
  public ACLs.

### Phase 2 — Ritual configuration index + editor
**Routes:** `/admin/ritual-configurations` (replaces or coexists with `/admin/rituals`),
`/admin/ritual-configurations/[id]/edit`

CRUD over `ritual_definitions`. Tabbed editor:
- **Overview** — title / key / description / sort_order / visible / published / archive
- **Display** — badge, icon, card label/description/CTA overrides, completion message, missing-asset message
- **Playback** — toggles in `playback_policy_json` (autoplay, sequential lock, allow backward replay, show playlist, completion requires video end, missing asset behavior)
- **Final Override** — enable/disable + asset picker (search the ritual_media_assets library)
- **Mappings** — see Phase 3

API surface:
- `GET    /api/admin/ritual-configurations`
- `POST   /api/admin/ritual-configurations`
- `GET    /api/admin/ritual-configurations/:id`
- `PATCH  /api/admin/ritual-configurations/:id`

### Phase 3 — Tag mapping editor
**Route:** Embedded inside the ritual definition editor's "Mappings" tab.

CRUD over `ritual_asset_mappings`:
- list global mappings (read-only context — show what's currently
  resolving)
- list per-ritual mappings for the open definition
- form to add a per-ritual override: choose tag_key + asset
- delete clears the override and falls back to global

API surface:
- `GET    /api/admin/ritual-asset-mappings`
- `POST   /api/admin/ritual-asset-mappings`
- `PATCH  /api/admin/ritual-asset-mappings/:id`
- `DELETE /api/admin/ritual-asset-mappings/:id`

The resolver already supports per-ritual scope, so this UI is a pure
write surface.

### Phase 4 — Community-side dynamic metadata reads

**Files to update:**
- `src/app/community/rituals/new/page.tsx` — load `listPublishedRitualDefinitions()` and render cards from DB metadata instead of hardcoded constants.
- `src/app/community/rituals/[id]/page.tsx` — when the configuration's key matches a known ritual, prefer admin-managed labels for title / description / badge.
- `src/components/community/ritual-playlist-player.tsx` — read `playback_policy_json` to decide autoplay/sequential-lock/etc. (current behavior matches the seed default already).

Carry the `ritual_definition_id` through the data flow so playback can
call `resolveFinalOverrideForRitual(ritualDefinitionId)` and
`resolveAssetsForTags(tags, ritualDefinitionId)` to honor per-ritual
overrides.

### Phase 5 — Final-override playback path

When a ritual definition has `final_override_enabled=true` + a published
asset:
- the playback page renders a single-item playlist
- the playlist sidebar collapses (or hides) per the open question in
  the spec
- the player otherwise behaves identically (timer, hangup, etc.)

The resolver already has `resolveFinalOverrideForRitual` ready; the
player component just needs a `finalOverride?: ResolvedFinalOverride`
prop and an early-return render branch.

### Phase 6 — Permissions + validation hardening

- All `/api/admin/*` routes wrapped in admin-role middleware.
- Upload validates MIME type via `file.type` AND a small magic-number
  sniff (don't trust the client header alone).
- External URL validator runs a HEAD request to confirm reachability
  and content-type.
- Archive blocks "in use" assets unless force-confirmed (the resolver
  filters them anyway, but the UX should warn).

## QA Coverage Map

| Spec acceptance criterion | Phase |
|---|---|
| Admin sidebar shows `Ritual Configurations` | ✓ done now |
| Admin can create/edit ritual definitions without code changes | Phase 2 |
| Admin can upload OR paste a URL | Phase 1 |
| Admin can map opening/gate/closing/etc. | Phase 3 |
| Community pages read card metadata from admin config | Phase 4 |
| Final override video setting | Phase 2 (UI) + Phase 5 (runtime) |
| Final override active → one video plays | Phase 5 |
| Playback reads admin-managed mappings when override off | ✓ done now (resolver wired) |
| Existing ritual playback still works after migration | ✓ done now (code fallback preserved) |
| Planet/zodiac ordering remains correct | ✓ unchanged |
| Draft/unpublished not exposed to users | ✓ done at SQL layer (RLS filters) |
| Clear fallback / missing-asset UI | partially done (resolver returns null → existing player shows missing-asset state); Phase 4 wires the configurable message |

## Why Foundation-First Is The Safer Path

- The migration is additive and shippable independently. Even with all
  six phases pending, the migration alone can sit applied for weeks
  without affecting any user flow.
- The resolver maintains the existing code-map fallback at its tail, so
  the runtime is provably no-worse than before.
- Each phase's PR is small and reviewable with its own QA: an admin-UI
  bug never has the chance to take down the community playback page
  because that page already works without the admin UI.
- Storage decisions (signed vs public URLs, bucket policies) are best
  made when the upload UI is being implemented, not pre-emptively in
  schema.
