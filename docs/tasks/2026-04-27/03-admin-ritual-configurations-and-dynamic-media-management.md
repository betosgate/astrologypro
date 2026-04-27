# Task 03 - Admin Ritual Configurations And Dynamic Media Management - 2026-04-27

- Status: Planned
- Priority: P1
- Area: `admin dashboard`, `ritual configurations`, `community rituals`, `media management`
- Scope: replace hardcoded ritual configuration/media controls with admin-managed records, support upload or URL-based video assets, and rename sidebar `Rituals` to `Ritual Configurations`
- Requested By: user

## Goal

Move ritual configuration control into the admin dashboard for everything except the fixed metaphysical sequencing logic for planet/zodiac ordering.

The admin must be able to manage:

1. ritual metadata
2. non-planet/zodiac asset mapping
3. ritual opening / gate / closing assets
4. labels, descriptions, visibility, playback policy, and publishing state
5. video asset source via either:
   - direct video upload
   - pasted remote video URL
6. final ritual-level override video via either:
   - direct video upload
   - pasted remote video URL

At the same time:

1. rename the admin sidebar item from `Rituals` to `Ritual Configurations`
2. make ritual playback and ritual creation read from admin-managed configuration instead of relying on only hardcoded mappings
3. preserve the existing planet/zodiac sequencing algorithm in code unless explicitly moved later

## Product Direction

### Keep In Code

These rules should remain code-driven for now:

1. elemental order
   `Fire -> Water -> Air -> Earth -> Spirit`
2. within-gate ordering
   `Inner Planets -> Outer Planets -> Zodiacal Signs`
3. zodiac modality ordering
   `Cardinal -> Fixed -> Mutable`
4. planet/zodiac metaphysical identity
   which planet belongs to which element
   which zodiac belongs to which element and modality

### Move To Admin

These must become configurable through admin UI:

1. ritual definitions shown to users
2. static ritual metadata
3. asset library
4. opening/gate/closing asset mapping
5. display labels and descriptions
6. visibility and publish state
7. playback policy flags
8. which video URL a ritual step resolves to
9. optional final override video that replaces the generated playlist

## Admin Use Cases

### A. Admin Manages Ritual Definitions

Admin can create or edit a ritual definition such as:

1. `Standard Banishing Ritual of the Pentagram`
2. `Standard Invocation Ritual of the Pentagram`
3. `Divine Infinite Being Invocation Ritual of the Pentagram`
4. `Planetary Zodiacal Invocation Ritual of the Pentagram`

For each ritual definition, admin can configure:

1. title
2. internal key / slug
3. short description
4. ritual kind
   - `static`
   - `dynamic`
5. ritual mode support
   - `invocation`
   - `banishing`
   - `both`
6. icon / badge label
7. display sort order
8. published / draft
9. visible / hidden
10. optional final override asset or final override video URL

### A1. Admin Can Set A Final Override Video

Admin must be able to configure one final video for a ritual definition that overrides the normal video list.

This applies to:

1. the three static rituals
2. dynamic rituals too, if admin wants one compiled final video instead of step-by-step playback

Behavior:

1. if final override is enabled and a published asset is linked, playback must use that one final video
2. if final override is enabled, the generated video list is ignored for runtime playback
3. if final override is disabled or not set, the normal playlist/tag mapping flow is used
4. admin must be able to switch a ritual between:
   - `final override mode`
   - `generated playlist mode`

### B. Admin Manages Video Assets

Admin can add a video asset in two ways:

1. upload a file
2. paste a direct video URL

Each asset should store:

1. title
2. asset key
3. source type
   - `upload`
   - `external_url`
3. storage path or external URL
4. mime type
5. duration if known
6. poster / thumbnail optional
7. active / inactive
8. published / draft
9. notes

### C. Admin Maps Assets To Ritual Tags

Admin can map non-planet/zodiac tags to assets, such as:

1. `Ritual_Opening`
2. `Ritual_Closing`
3. `Fire_Gate_Invocation_Ritual`
4. `Fire_Gate_Banishing_Ritual`
5. `Water_Gate_Invocation_Ritual`
6. `Water_Gate_Banishing_Ritual`
7. `Air_Gate_Invocation_Ritual`
8. `Air_Gate_Banishing_Ritual`
9. `Earth_Gate_Invocation_Ritual`
10. `Earth_Gate_Banishing_Ritual`
11. `Spirit_Gate_Invocation_Ritual`
12. `Spirit_Gate_Banishing_Ritual`
13. `Pentagram_Invocation_Ritual`
14. `Pentagram_Banishing_Ritual`
15. `DIB_Invocation_Ritual`

Planet/zodiac tag mapping can remain code-backed for now, but the asset URL it resolves to should come from admin-managed asset records when available.

### D. Admin Controls Playback Policy

Admin can configure per ritual definition:

1. autoplay enabled
2. sequential lock enabled
3. allow backward replay
4. show playlist
5. completion requires video end
6. allow republish after update
7. missing asset behavior
   - `show warning and block`
   - `show warning and allow skip`
8. final override mode enabled or disabled

## Required Admin UI

### 1. Sidebar Update

Change admin sidebar label:

- from `Rituals`
- to `Ritual Configurations`

This should be updated consistently in:

1. sidebar label
2. route/page headings
3. breadcrumb labels
4. walkthrough/help copy if present

### 2. Ritual Configurations Index Page

Create an admin index page for ritual configuration management.

Suggested sections:

1. search bar
2. filter by:
   - type
   - published state
   - visibility
   - source mode
3. table or cards listing ritual definitions
4. actions:
   - create
   - edit
   - duplicate
   - publish/unpublish
   - archive

Each row/card should show:

1. ritual title
2. ritual type
3. published status
4. visibility
5. source mapping summary
6. updated at

### 3. Ritual Definition Editor

Provide a multi-section editor with:

#### Section A - Basic Info

1. title
2. internal key
3. description
4. icon / badge label
5. sort order
6. draft/published
7. visible/hidden

#### Section B - Ritual Behavior

1. ritual type
2. supported mode
3. static single-video or dynamic playlist
4. playback policy toggles
5. final override playback toggle

When final override playback is enabled:

1. admin can select an uploaded video asset
2. admin can select an external URL video asset
3. runtime should use one final video instead of the generated playlist

#### Section C - Step Source Configuration

For each applicable step source:

1. opening asset
2. closing asset
3. gate assets
4. special fixed assets
5. optional asset fallback
6. final override asset

This section should clearly indicate:

1. code-managed logic vs admin-managed logic
2. which mappings are fixed
3. which mappings are overridable
4. whether final override is replacing the generated playlist

#### Section D - User-Facing Labels

Admin should be able to configure:

1. ritual card label
2. playlist title override
3. pill label override
4. completion message
5. empty-state/missing-asset message

### 4. Video Asset Library Page

Provide a dedicated asset library page.

Required UI:

1. asset list
2. upload asset button
3. add external URL button
4. preview player
5. duration
6. usage count
7. active/inactive toggle
8. publish/draft status
9. final override usage indicator

### 5. Video Asset Create/Edit Form

Fields:

1. asset title
2. asset key
3. source type
4. upload file input when `upload`
5. URL input when `external_url`
6. poster input optional
7. duration optional/manual
8. notes
9. active status
10. publish status

Validation:

1. uploaded file must be video
2. external URL must be valid
3. asset key must be unique
4. prevent saving incomplete records

## Required Community/User UI Changes

### A. Create Ritual Page

The ritual creation screen should read ritual definition metadata from admin configuration for:

1. title
2. description
3. card badge label
4. visibility
5. sort order

The first three static rituals and the planetary/zodiacal custom ritual should no longer depend only on hardcoded presentation content.

### B. Ritual Detail Page

The ritual detail page should read:

1. ritual display metadata
2. playback policy
3. missing-asset messaging
4. final override playback state if configured

### C. Playback Page

The playlist should resolve video URLs from admin-managed asset mappings.

Resolution order should be:

1. ritual-level final override video if present and published
2. admin-managed mapping if present and published
3. existing hardcoded fallback only where necessary during migration
4. explicit missing-asset state if neither exists

When final override is active:

1. playback uses one video
2. the generated video list does not control runtime playback
3. progress/completion is based on the one final override video

## Required API Work

### 1. Admin Ritual Definitions API

Create endpoints for:

1. list ritual definitions
2. get single ritual definition
3. create ritual definition
4. update ritual definition
5. publish/unpublish ritual definition
6. archive ritual definition

Suggested routes:

1. `GET /api/admin/ritual-configurations`
2. `POST /api/admin/ritual-configurations`
3. `GET /api/admin/ritual-configurations/:id`
4. `PATCH /api/admin/ritual-configurations/:id`

### 2. Admin Asset Library API

Create endpoints for:

1. list assets
2. create asset
3. update asset
4. upload asset file
5. validate external URL asset
6. deactivate/archive asset

Suggested routes:

1. `GET /api/admin/ritual-assets`
2. `POST /api/admin/ritual-assets`
3. `PATCH /api/admin/ritual-assets/:id`
4. `POST /api/admin/ritual-assets/upload`

### 3. Admin Mapping API

Create endpoints for managing tag/step mappings:

1. list mappings
2. create mapping
3. update mapping
4. delete mapping

Suggested routes:

1. `GET /api/admin/ritual-asset-mappings`
2. `POST /api/admin/ritual-asset-mappings`
3. `PATCH /api/admin/ritual-asset-mappings/:id`
4. `DELETE /api/admin/ritual-asset-mappings/:id`

### 4. Runtime Resolution API/Service Layer

Create a shared server-side resolver used by:

1. ritual creation page
2. ritual detail page
3. ritual playback page
4. playlist generation logic

Responsibilities:

1. load published ritual definition metadata
2. load active asset mappings
3. resolve ritual-level final override if present
4. resolve step tag -> asset URL
5. merge admin-managed data with remaining code-managed rules

Important:

- Do not scatter mapping queries across pages.
- Use a single service layer to keep behavior consistent.

## Required Database Design

### 1. `ritual_definitions`

Purpose:

- stores ritual metadata and runtime behavior config

Suggested columns:

1. `id`
2. `key`
3. `title`
4. `description`
5. `ritual_type`
6. `supported_mode`
7. `badge_label`
8. `icon_key`
9. `sort_order`
10. `is_visible`
11. `is_published`
12. `playback_policy_json`
13. `final_override_asset_id` nullable
14. `final_override_enabled`
15. `created_at`
16. `updated_at`
17. `archived_at`

### 2. `ritual_media_assets`

Purpose:

- stores upload-backed or URL-backed video assets

Suggested columns:

1. `id`
2. `asset_key`
3. `title`
4. `source_type`
5. `storage_path`
6. `external_url`
7. `mime_type`
8. `duration_seconds`
9. `poster_url`
10. `notes`
11. `is_active`
12. `is_published`
13. `created_at`
14. `updated_at`
15. `archived_at`

### 3. `ritual_asset_mappings`

Purpose:

- maps runtime ritual step tags or step roles to asset records

Suggested columns:

1. `id`
2. `ritual_definition_id` nullable
3. `mapping_scope`
   - `global`
   - `ritual_definition`
4. `tag_key`
5. `step_role`
6. `asset_id`
7. `label_override`
8. `sort_order`
9. `is_active`
10. `created_at`
11. `updated_at`

## Final Override Runtime Rules

1. a ritual definition may optionally have one final override asset
2. if `final_override_enabled = true` and the linked asset is active and published:
   - use that asset as the entire ritual playback
   - ignore step-by-step playback mapping for runtime playback
3. if `final_override_enabled = false` or no valid override asset is present:
   - use the normal generated playlist
4. static rituals will commonly use final override mode
5. dynamic rituals may use either:
   - final override mode
   - generated playlist mode
6. admin should be able to switch between these modes without code changes

### 4. Optional `ritual_definition_cards`

If card display needs separate content/versioning:

1. `ritual_definition_id`
2. `card_title`
3. `card_description`
4. `card_cta_label`
5. `card_badge`

This can also be folded into `ritual_definitions` if the scope stays simple.

## Storage Requirements

If using uploaded files:

1. choose a storage bucket for ritual media
2. generate stable public or signed URLs
3. persist canonical asset path
4. support replacing an asset without breaking references

If using pasted URLs:

1. validate URL format
2. optionally confirm file type with HEAD/request metadata
3. store canonical URL
4. show warning if remote URL is unreachable

## Migration Strategy

### Phase 1 - Add Admin Data Model

1. create DB tables
2. backfill initial ritual definitions
3. backfill current known asset URLs into `ritual_media_assets`
4. backfill current tag mappings into `ritual_asset_mappings`
5. seed final override assets for the current three static rituals if desired

### Phase 2 - Add Admin UI

1. rename sidebar to `Ritual Configurations`
2. build configuration index page
3. build asset library page
4. build definition editor
5. build mapping editor
6. build final override selector

### Phase 3 - Wire Runtime To Admin Config

1. add shared resolver service
2. update ritual creation UI
3. update ritual detail UI
4. update playback mapping
5. preserve fallback behavior while testing

### Phase 4 - Remove Legacy Hardcoding

1. move display labels/descriptions to DB reads
2. move opening/closing/gate mappings to DB reads
3. keep planet/zodiac ordering logic in code
4. remove old hardcoded asset map only after admin-backed parity is verified

## Step-By-Step Implementation Plan

### Step 1 - Sidebar And Admin Route Framing

1. rename admin sidebar `Rituals` to `Ritual Configurations`
2. confirm target admin route structure
3. update page headings and nav labels

### Step 2 - Schema And Migration

1. create `ritual_definitions`
2. create `ritual_media_assets`
3. create `ritual_asset_mappings`
4. add indexes for:
   - `key`
   - `asset_key`
   - `tag_key`
   - `is_published`
   - `is_active`

### Step 3 - Seed Existing Data

1. insert the current four ritual definitions
2. insert all currently known video URLs as assets
3. insert mappings for:
   - static rituals
   - opening/closing
   - gate assets
   - current known non-planet/zodiac mappings

### Step 4 - Build Admin Asset Library

1. asset list page
2. asset create/edit page
3. upload flow
4. external URL flow
5. preview support

### Step 5 - Build Ritual Configuration UI

1. configuration list page
2. create/edit ritual definition page
3. playback policy controls
4. user-facing content controls
5. final override selector:
   - choose uploaded asset
   - choose external URL asset
   - enable/disable override

### Step 6 - Build Mapping UI

1. select ritual definition
2. select mapping scope
3. choose tag key
4. assign asset
5. optional label override

### Step 7 - Shared Resolver Layer

1. build server utility to fetch active published ritual definitions
2. resolve final override asset first
3. resolve tag -> asset
4. resolve definition metadata for create/detail/playback pages
5. add fallback strategy for unmigrated mappings

### Step 8 - Update Community Runtime

1. `/community/rituals/new`
   load ritual metadata from admin config
2. `/community/rituals/[id]`
   load ritual display data and behavior from admin config
3. playback
   load final override asset first, otherwise load asset URLs via admin mapping resolver

### Step 9 - Permissions And Validation

1. restrict admin APIs to admin users only
2. validate upload file types
3. validate external URLs
4. prevent use of unpublished/inactive assets in live user flows unless explicitly allowed

### Step 10 - QA And Regression Testing

1. static ritual create -> playback
2. dynamic ritual create -> playback
3. missing asset warning flow
4. hidden ritual not shown to users
5. published ritual visible to users
6. upload asset works
7. external URL asset works
8. sidebar rename consistent

## Acceptance Criteria

1. Admin sidebar shows `Ritual Configurations`.
2. Admin can create and edit ritual definitions without code changes.
3. Admin can upload a ritual video or paste a direct video URL.
4. Admin can map opening/gate/closing and other non-planet/zodiac ritual tags to video assets.
5. Community ritual creation page reads ritual card metadata from admin-managed configuration.
6. Admin can set one final override video per ritual definition using either upload or URL.
7. If final override is active, ritual playback uses that one video instead of the generated playlist.
8. Ritual playback reads video sources from admin-managed mappings when final override is not active.
9. Existing ritual playback still works after migration.
10. Planet/zodiac ordering logic remains correct and unchanged.
11. Draft/unpublished assets or ritual definitions are not exposed to normal users.
12. There is a clear fallback or missing-asset UI when a mapping is absent.

## Risks And Decisions To Confirm During Implementation

1. Whether uploaded ritual videos should use public URLs or signed URLs.
2. Whether asset publishing is global or environment-specific.
3. Whether label overrides should be global or per ritual definition.
4. Whether future work will also move planet/zodiac mapping into admin.
5. Whether asset replacement should preserve old versions for audit/history.
6. Whether final override should show a single-item playlist or hide the playlist UI entirely.

## Recommended Initial UI Structure

### Admin Sidebar

1. `Ritual Configurations`
2. `Video Assets`
3. `Tag Mappings`

### Ritual Configuration Detail Tabs

1. `Overview`
2. `Display`
3. `Playback`
4. `Mappings`
5. `Publish`

### Video Asset Detail Tabs

1. `Source`
2. `Preview`
3. `Usage`
4. `Publish`

## Verification Plan

1. Create a ritual definition in admin and confirm it appears in `/community/rituals/new`.
2. Update a ritual description in admin and confirm the community card updates.
3. Upload a video asset and map it to a tag.
4. Paste an external video URL and map it to a different tag.
5. Set a final override asset for a static ritual and confirm playback uses one final video.
6. Set a final override asset for a dynamic ritual and confirm generated step playback is bypassed.
7. Disable final override and confirm playback returns to generated playlist mode.
8. Start a ritual and confirm playback resolves the admin-managed asset URL.
9. Unpublish an asset and confirm the user flow shows missing-asset behavior or fallback behavior as designed.
10. Hide a ritual definition and confirm it no longer appears in the community create page.
