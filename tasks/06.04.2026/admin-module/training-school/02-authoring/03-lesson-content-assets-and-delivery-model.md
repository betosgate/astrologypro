# Module 03 - Lesson Content, Assets, and Delivery Model

## Objective
Support the required lesson content model without renaming existing lesson, video, and asset structures.

## Current State In Repo
- `training_lessons` includes `video_url`, `pdf_url`, `content`, and duration fields.
- `lesson_videos` supports multiple videos per lesson.
- `lesson_assets` supports multiple assets per lesson.
- Admin lesson authoring already supports YouTube URLs, direct video URLs, uploads, and a single PDF URL field.

## Required Outcome
- Lessons can be configured with:
  - video upload
  - file upload, multiple, previewable and downloadable
  - YouTube video
  - file URL
- The admin authoring UI and learner UI should treat these as supported delivery modes of the current lesson model, not separate lesson types.

## Detailed Tasks
- [ ] Audit whether the current lesson authoring UX fully exposes `lesson_videos` and `lesson_assets`, or if it still over-relies on `video_url` and `pdf_url`.
- [ ] Define the canonical storage rule between:
  - `training_lessons.video_url`
  - `lesson_videos.video_url`
  - `training_lessons.pdf_url`
  - `lesson_assets.url`
- [ ] Ensure admins can upload multiple files and set meaningful titles, priorities, and download/preview behavior using the existing asset model.
- [ ] Ensure learner lesson detail API returns a unified structure that is easy for the frontend to render by source type.
- [ ] Decide whether file URLs and uploaded files should both live in `lesson_assets` for consistency.
- [ ] Validate file-type handling for preview vs download, especially for documents and images.
- [ ] Keep backward compatibility for existing lessons already using top-level `video_url` and `pdf_url`.

## Acceptance Criteria
- A lesson can contain the media combinations required by the architect.
- Existing asset/video tables remain the source of truth where appropriate.
- Learner lesson pages can render and distinguish uploaded files, remote files, and videos without special-case drift.

## Verification Test Plan
- [ ] Create a lesson using a YouTube video and confirm playback on the learner page.
- [ ] Create a lesson using an uploaded video and confirm the stored URL is retrievable and playable.
- [ ] Attach multiple lesson assets and confirm preview/download behavior matches file type.
- [ ] Add a remote file URL and confirm it renders alongside uploaded files.
- [ ] Validate an older lesson using only `video_url` or `pdf_url` still renders correctly.
