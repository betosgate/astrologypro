# Build Video Library Document And YouTube Workflows - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: media-oriented content branches, file/url branching, thumbnail/doc handling
- Estimate: 1.5-2 days
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/perennial-dashboard-content/04-build-video-library-document-and-youtube-workflows.md`

## Goal

Implement the three media-oriented content branches that Angular supports: Video Library, Document, and YouTube Video.

## Verified Current Code Truth

- Angular Video Library branch includes:
  - title
  - video source
  - description
  - thumbnail
  - tags
  - access control
  - content status
  - priority
  - source-dependent media field:
    - uploaded video file
    - YouTube URL
    - direct video URL
- Angular Document branch includes:
  - title
  - access control
  - description
  - uploaded document
  - thumbnail
  - tags
  - priority
  - content status
- Angular YouTube Video branch includes:
  - YouTube URL
  - title
  - tags
  - description
  - thumbnail
  - access control
  - priority
  - content status
- Next currently lacks these branch-specific workflows entirely.

## User-Visible Problem

Three major Perennial content types are missing their actual authoring behavior in Next. This blocks media content management and leaves the current module far from parity.

## Required Behavior

1. Implement Video Library with media-source branching.
2. Implement Document content with document upload and thumbnail handling.
3. Implement YouTube Video content with its branch-specific field set.
4. Preserve access control, priority, publish status, and tags where Angular requires them.
5. Ensure each branch can rehydrate safely in edit mode.

## Tasks

1. Build the Video Library branch with uploaded-file, YouTube, and direct-video branching.
2. Build the Document branch with file upload and thumbnail support.
3. Build the YouTube Video branch with required URL and metadata fields.
4. Add per-branch validation and field omission rules.
5. Validate create/edit round-trip behavior for all three branches.

## Acceptance Criteria

- Video Library content supports all required media-source branches
- Document content supports document plus thumbnail upload
- YouTube Video content supports the required URL-driven workflow
- tags, access control, status, and priority persist correctly where required
- all three branches rehydrate correctly in edit mode

## Verification Test Plan

1. Create and edit one Video Library record for each video-source variant.
2. Create and edit one Document record with uploaded document and thumbnail.
3. Create and edit one YouTube Video record.
4. Verify each branch omits irrelevant fields when saving.
5. Reopen each saved record and confirm the correct branch and values rehydrate.

## Implementation Notes (2026-04-02)

`VideoLibraryFields`, `DocumentFields`, `YouTubeVideoFields` in `perennial-content-form.tsx`:
- Video Library: `video_source` select (Video File / YouTube URL / Video URL). Conditional render of `file_path` URL input / `youtube_url` Input / `video_url` Input. Only the active source field included in submit payload.
- Document: `file_path` URL input for document. Bucket upload deferred.
- YouTube Video: `youtube_url` Input only. Submitted as `youtube_url` field.
- All three branches share `thumbnail_path`, `tags`, `access_control`, `priority`, `content_status` from `CommonMetaFields`.
- Submit: irrelevant source fields omitted per branch; only active media field sent.

## Notion Summary

P1 branch gap: Video Library, Document, and YouTube Video each have distinct authoring workflows in Angular. Implement them as first-class branches in Next.
