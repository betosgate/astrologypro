# Close Blog Form Rich Content And Media Parity - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: description editor, image/file/audio/video handling, thumbnail metadata
- Estimate: 1-1.5 days
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/blog-management/02-close-blog-form-rich-content-and-media-parity.md`

## Goal

Close the authoring gap between Angular Blog Management and the current Next blog form so admins can manage the same content and media structure without falling back to the old app.

## Verified Current Code Truth

- Angular add/edit form includes:
  - `title`
  - `priority`
  - rich `description` editor
  - `images`
  - `files`
  - `audios`
  - `videos`
  - `status`
  - `available_for_perennial`
- Angular image uploads support extra metadata field `img_status` to mark thumbnail behavior.
- Angular file/audio/video uploads support per-item title and description metadata fields.
- Next add/edit currently supports:
  - `title`
  - `priority`
  - `images`
  - plain textarea `description`
  - `available_for_perennial`
  - `status`
- Next currently does not expose Angular-equivalent file, audio, or video authoring fields.

## User-Visible Problem

Next can only author a simplified version of a blog post. That risks media loss, incomplete content migration, or forced fallback to Angular for full blog maintenance.

## Required Behavior

1. Replace the plain blog description textarea with a rich-content authoring surface if backend content expects HTML.
2. Support the Angular media model for images, files, audios, and videos.
3. Preserve required metadata for uploaded media where Angular already collects it.
4. Keep add/edit usable on both create and update flows.
5. Avoid collapsing blog media into a single oversimplified upload that cannot round-trip existing records.

## Tasks

1. Introduce a rich editor or equivalent HTML-safe authoring surface for blog description.
2. Add blog file upload support for `files`, `audios`, and `videos`.
3. Support media item metadata where Angular captures title, description, or thumbnail semantics.
4. Review whether the existing generic file field is sufficient or if blog needs a dedicated media field component.
5. Validate create and edit rendering for posts with mixed media types.

## Acceptance Criteria

- blog description can be authored with the required formatting fidelity
- blog add/edit supports images, files, audios, and videos
- required media metadata can be captured and persisted
- existing posts with stored media can be edited without losing data
- basic blog create and update flows remain functional

## Verification Test Plan

1. Open `/admin/blog/add` and verify all required authoring fields are present.
2. Create a post with formatted description content and confirm the stored content round-trips correctly.
3. Upload image, file, audio, and video content and verify metadata can be entered where required.
4. Edit an existing post with preexisting media and confirm values prepopulate correctly.
5. Save an edited post and verify no media collections are dropped unintentionally.

## Implementation Notes (2026-04-02)

Already implemented before this session. Full audit confirmed in `blog/_components/blog-form.tsx`:
- `RichHtmlEditor` (via `Controller`) for `description` — HTML content preserved through edit round-trips.
- `MediaListField` for `images` — per-item URL + title + description + `img_status` boolean (thumbnail flag).
- `MediaListField` for `files`, `audios`, `videos` — per-item URL + title + description metadata.
- `available_for_perennial` inline switch.
- All media sections rendered; add and edit forms prepopulate from fetched record.
- No code changes required.

## Notion Summary

P1 authoring gap: Angular Blog Management supports rich content plus images, files, audios, and videos. Next currently only supports a simplified blog form and needs full media/content parity.
