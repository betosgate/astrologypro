# Master Task - Video Upload Direct Bypass (Vercel Limit) - 2026-04-17

- Status: Planned
- Priority: P0
- Owner: Fullstack
- Scope: Training video upload flow, Supabase Storage `training-videos` bucket, signed upload URLs, Vercel payload limit mitigation.
- Task File: `tasks/17.04.2026/video-upload-direct-bypass/00-master-task.md`

---

## Problem

Admins are encountering `413 Request Entity Too Large` (Vercel error `FUNCTION_PAYLOAD_TOO_LARGE`) when uploading training videos larger than 15MB. This is because the upload currently goes through a Next.js API route (`/api/admin/training/upload`), which is subject to Vercel's serverless function body size limit.

Additionally, the Supabase Storage bucket `training-videos` has its own limit (likely 100MB), which needs to be increased to 500MB to support high-quality lesson videos.

## Proposed Solution

Implement a **Two-Step Direct Upload** flow to bypass the middleware server:
1.  **Presign**: Client requests a signed upload URL from a new admin-only API endpoint.
2.  **Direct Upload**: Client `PUT`s the file directly to Supabase Storage using the signed URL.

## Goal

- Enable reliable upload of videos up to 500MB on Vercel-hosted environments.
- Maintain admin-only security for uploads.
- Keep real-time progress tracking in the UI.

## Implementation Tasks

| # | File | What to do | Status |
|---|---|---|---|
| 01.1 | `01.1-implement-presign-endpoint.md` | Create `/api/admin/training/upload/presign` endpoint for signed URLs. | Planned |
| 01.2 | `01.2-refactor-upload-video-frontend.md` | Update `upload-video.ts` to use the two-step direct upload flow. | Planned |
| 01.3 | `01.3-verify-with-large-upload.md` | Test with a video > 100MB to ensure both Vercel and Supabase limits are resolved. | Planned |
| 01.4 | `01.4-regression-and-handoff-checklist.md` | Verify PDF uploads still work and document the storage limit requirements. | Planned |

## Execution Order

1.  **Backend Fix**: Implement the presign endpoint first to provide the signed URL infrastructure.
2.  **Frontend Update**: Refactor the upload utility to use the new flow.
3.  **Migration**: Guide the admin to run the existing bucket limit migration.
4.  **Verification**: Perform a real-world test with a large video file.

## Acceptance Criteria

- [ ] `/api/admin/training/upload/presign` returns a valid signed URL for authenticated admins.
- [ ] Training video upload bypasses the Next.js API body parser.
- [ ] A 143MB video can be successfully uploaded and previewed in a lesson.
- [ ] Progress bar correctly reflects the direct-to-storage upload state.
- [ ] PDF uploads continue to function correctly (can share the same presign logic or stick to standard flow).
