# Module 03 - Lesson Content, Assets, and Delivery Model

## Objective
Align lesson authoring and learner rendering with the required media/source combinations while preserving current schema names.

## Current Repo State
- `training_lessons` includes `video_url`, `pdf_url`, `content`, and duration fields.
- `lesson_videos` supports multiple videos.
- `lesson_assets` supports multiple lesson assets.
- Current admin authoring supports some video modes but is still partly centered around top-level lesson fields.

## Exact Gap
- The requirement expects a lesson to support:
  - uploaded video
  - YouTube video
  - file URL
  - multiple downloadable/previewable files
- The repo has the underlying structures, but the authoring and rendering rules are not standardized enough for consistent implementation.

## Required Implementation
- Standardize lesson media storage as follows:
  - use `lesson_videos` for multiple or explicit lesson video sources
  - keep `training_lessons.video_url` as backward-compatible primary/default legacy video support
  - use `lesson_assets` for downloadable or previewable lesson files, including remote file URLs when they are file-like resources
  - keep `training_lessons.pdf_url` as backward-compatible legacy support
- Update admin authoring so a lesson can add:
  - uploaded video
  - YouTube video
  - direct remote video/file URL
  - multiple assets with title, type, priority, and downloadability
- Update learner lesson rendering so all lesson media is returned and presented in a unified source-aware structure.
- Preserve backward compatibility for older lessons using only `video_url` or `pdf_url`.

## Likely Affected Files
- `src/app/admin/training/lessons/new/page.tsx`
- `src/app/admin/training/lessons/[id]/edit/page.tsx`
- `src/app/api/admin/training/lessons/route.ts`
- `src/app/api/admin/training/lessons/[id]/videos/route.ts`
- `src/app/api/admin/training/lessons/[id]/assets/route.ts`
- `src/app/api/trainee/training/lessons/[id]/route.ts`
- learner lesson UI component(s)

## API and Schema Constraints
- Keep `training_lessons.video_url` and `training_lessons.pdf_url` for backward compatibility.
- Keep `lesson_videos` and `lesson_assets` as the normalized extension model.
- Do not introduce a new lesson-media table unless current tables prove insufficient.

## Dependencies
- Execute after Module 02.

## Acceptance Criteria
- Admins can configure the required lesson media combinations.
- Learners can preview/download assets appropriately.
- Older lessons still render correctly.

## Verification Test Plan
- [ ] Create a lesson with a YouTube video and verify playback.
- [ ] Create a lesson with an uploaded video and verify playback.
- [ ] Add multiple assets and verify preview/download behavior by type.
- [ ] Add a remote file URL through the asset model and verify rendering.
- [ ] Verify a legacy lesson using only top-level `video_url` or `pdf_url` still works.

## Out Of Scope
- trigger-based quiz logic
- progress semantics
