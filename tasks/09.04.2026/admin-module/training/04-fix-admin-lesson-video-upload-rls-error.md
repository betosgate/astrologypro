# Fix Admin Lesson Video Upload RLS Error

- Status: Planned

## Objective
Fix the admin Training Management lesson video upload flow so uploading an MP4 file does not fail with `400` and `new row violates row-level security policy`.

## Why This Task Exists
The current admin lesson edit experience exposes an `Upload` mode for lesson videos, but the actual upload path is broken:
- the admin can choose an MP4 file
- the upload request fails
- the returned error indicates row-level security is blocking the insert/write path

This means the UI currently advertises a capability that does not actually work.

## Current Repo State
- Lesson editing is handled in:
  - `src/app/admin/training/lessons/[id]/edit/page.tsx`
- The lesson edit page already supports multiple video modes:
  - YouTube
  - Direct URL
  - Upload
- The reported failure occurs specifically when using file upload for MP4 video.
- The error message strongly suggests one of these is happening:
  - Supabase Storage upload is being attempted with a client that is subject to RLS
  - a storage/object metadata insert is hitting a protected bucket policy
  - a related table write after upload is using the wrong auth context

## Exact Gap
- Admins cannot successfully upload lesson videos through the intended upload workflow.
- The failure is not a validation error; it is an authorization/policy problem in the upload path.
- The upload flow needs to be aligned with the project’s admin-authorized storage pattern.

## Fixed Behavior Decisions
- Admin lesson video upload must succeed for authorized admins.
- The solution should preserve security rather than bypassing it unsafely.
- Prefer a standard server-mediated admin upload flow or a correctly authorized storage path over direct client writes that collide with RLS.
- The fix should cover the complete upload path:
  - file selection
  - upload request
  - storage/object write
  - persisted lesson video URL/value

## Required Implementation
- Trace the current admin lesson upload path from UI to storage/backend.
- Identify exactly where the RLS violation occurs:
  - storage bucket write
  - related metadata insert
  - subsequent lesson update
- Fix the authorization model for admin uploads using the project’s intended secure pattern.
- Verify that a successful upload results in a usable stored video URL/path on the lesson.
- Preserve existing non-upload video modes.
- Ensure failure handling remains readable if upload still fails for other reasons.

## Files To Read First
- `src/app/admin/training/lessons/[id]/edit/page.tsx`
- any storage upload helpers referenced from that page
- any API route used for admin media/video upload
- Supabase client/admin helpers:
  - `src/lib/supabase/client.ts`
  - `src/lib/supabase/server.ts`
  - `src/lib/supabase/admin.ts`
- any storage policy or bucket-related docs/config in the repo

## Likely Files To Change
- `src/app/admin/training/lessons/[id]/edit/page.tsx`
- one or more upload/storage helper files
- optionally a server/API route for admin-authorized uploads
- optionally storage policy-related configuration or migration files if that is how this repo manages access

## API and Schema Constraints
- Do not disable RLS broadly as a shortcut.
- Do not move admin uploads onto an unsafe public write path.
- Prefer a secure admin-authorized upload path using the correct Supabase context.
- Keep the lesson edit UX intact unless a minor upload-flow adjustment is required.

## Dependencies
- Independent.

## Acceptance Criteria
- An authorized admin can upload an MP4 lesson video without the RLS error.
- The uploaded file is stored successfully and the lesson can reference/play it afterward.
- Existing YouTube and Direct URL flows continue to work.
- Upload failures, if any, show a clear actionable error rather than a raw policy failure.

## Verification Test Plan
- [ ] Open `/admin/training/lessons/[id]/edit`.
- [ ] Choose `Upload` mode and upload a valid MP4 file.
- [ ] Confirm the request no longer fails with `new row violates row-level security policy`.
- [ ] Confirm the uploaded video is persisted and usable in the lesson edit form afterward.
- [ ] Confirm non-upload video modes still behave normally.

## Out Of Scope
- redesigning the lesson editor UI
- changing supported video formats beyond what is necessary for this fix
- broader media-library architecture changes
