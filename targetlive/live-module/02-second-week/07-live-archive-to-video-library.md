# Task 07 - Let Diviners Add Old Lives To Their Video Library Cleanly

- Status: Done
- Priority: P1
- Owner: Full-stack

## Objective

Create a clean, low-friction flow that lets a diviner take an old live session and add it to their video library without manual re-entry.

## Why This Task Exists

The current product has two adjacent but disconnected systems:

- live operations are tracked through `live_sessions`
- reusable public-facing library content is tracked through `media_items`

Diviners can already create `video` items in the media gallery, but today that flow is manual. They must retype title, URL, thumbnail, and description instead of selecting a previous live session and converting it into a video-library entry.

## Current Repo State

- `media_items` already supports `type = 'video'`
- diviner media management exists at `src/app/dashboard/media/page.tsx`
- create/edit form exists in `src/components/dashboard/media-item-form.tsx`
- live session operations exist in:
  - `src/app/dashboard/live/page.tsx`
  - `src/app/admin/live-sessions/page.tsx`
  - `src/app/api/admin/live-sessions/route.ts`
  - `src/app/api/admin/live-sessions/[id]/route.ts`
- `live_sessions` currently stores:
  - `platform`
  - `platform_url`
  - `title`
  - lifecycle timestamps
- `media_items` currently stores:
  - `type`
  - `url`
  - `title`
  - `description`
  - `thumbnail_url`
  - publish toggles and review metadata

## Exact Gap

- There is no import or convert flow from `live_sessions` to `media_items`.
- There is no clear way to distinguish a manually added video from a video originating from a past live session.
- The UX likely forces diviners to duplicate data entry and makes archival behavior inconsistent.

## Product Decision To Implement

Diviners should be able to:

1. see past eligible live sessions
2. choose one to add to the library
3. review or edit prefilled metadata before save
4. avoid duplicate imports of the same live
5. manage the resulting item like any other `media_items` video afterward

## Required Implementation Direction

### UI

- Add a dedicated CTA in the media gallery and/or live dashboard such as `Add From Past Live`.
- Provide a focused import picker instead of sending the diviner through the generic manual media form first.
- Prefill title, URL, and any available description/thumbnail fields from the selected live session.
- Make duplicate-state handling obvious:
  - already added
  - draft import
  - available to import

### API

- Add a diviner-authenticated API flow for listing eligible historical live sessions for import.
- Add a conversion/import mutation that creates a `media_items` row from a chosen live session.
- Enforce object-level ownership so diviners can only import their own sessions.
- Prevent duplicate imports for the same session unless product explicitly allows multiple derived items.

### DB / Data Model

- Add source-tracking if needed so a `media_items` video can be traced back to its originating live session.
- If source-tracking is added, make it explicit rather than encoding fragile assumptions in title/URL text.
- Preserve historical live session rows even after import.

## Recommended Data Modeling

The cleanest likely model is:

- keep `live_sessions` as the archive source
- create one `media_items` record for the library item
- store explicit provenance such as:
  - `source_type = 'live_session'`
  - `source_live_session_id = <uuid>`

If the existing `media_items` schema should remain minimal, equivalent provenance may be added through narrowly scoped columns or a companion relation, but the ownership rule must remain explicit.

## Files To Read First

- `src/app/dashboard/media/page.tsx`
- `src/components/dashboard/media-item-form.tsx`
- `src/app/api/dashboard/media/route.ts`
- `src/app/api/dashboard/media/[id]/route.ts`
- `src/app/dashboard/live/page.tsx`
- `src/app/api/admin/live-sessions/route.ts`
- `src/app/api/admin/live-sessions/[id]/route.ts`
- `supabase/migrations/20260406000039_check_in_system.sql`
- `supabase/migrations/20260406000041_media_gallery.sql`

## Likely Files To Change

- `src/app/dashboard/media/page.tsx`
- `src/components/dashboard/media-item-form.tsx` or a new import-specific component
- new dashboard API route for eligible archived lives
- `src/app/api/dashboard/media/route.ts` or a new import endpoint
- one or more Supabase migrations for source-linking metadata

## Constraints

- Do not force diviners to manually re-enter obvious live-session metadata.
- Do not allow importing another diviner's live session.
- Do not silently create duplicate media items from the same live session.
- Do not couple the public library to mutable live-session state after import without an explicit rule.

## Acceptance Criteria

- A diviner can see eligible past live sessions from their dashboard.
- A diviner can convert a selected past live into a video-library item in a small number of steps.
- Imported items appear in the existing media gallery and can be managed like normal videos.
- The system can tell whether a media item came from a past live session.
- Duplicate import attempts are prevented or handled explicitly.

## Verification Test Plan

- [ ] Create or select a completed historical live session for a diviner and confirm it appears in the import picker.
- [ ] Import it once and confirm a new `media_items` row of type `video` is created with the expected metadata.
- [ ] Confirm the imported item is visible in `/dashboard/media`.
- [ ] Attempt to import the same live again and confirm duplicate prevention or clear duplicate handling.
- [ ] Confirm another diviner cannot import a session they do not own.

## Out Of Scope

- automatic AI clipping or highlight generation
- cross-posting to external social platforms
- retrofitting client portal recordings into the public diviner media gallery unless explicitly productized as the same concept

## Completion Notes

- Added `source_type` and `source_live_session_id` provenance fields on `media_items`.
- Added `/api/dashboard/media/live-import` so diviners can list eligible ended sessions and import one safely.
- Added the `Add From Past Live` modal to `/dashboard/media`, including duplicate prevention and editable prefilled metadata.
