# 01-Fix Storage Limit and Video Visibility in Admin

- Status: Planned
- Date: 2026-04-10

## Objective
Increase the Training School video upload limit to 500MB and fix the issue where uploaded videos are not correctly surfaced or previewed in the admin lesson edit interface.

## Why This Task Exists
A discrepancy between the UI's 500MB label and the database's internal storage limit is causing uploads of ~300MB to fail. Additionally, the admin interface is confusing or buggy when displaying existing Supabase Storage video URLs, making it difficult for coordinators to verify uploads.

## Current Repo State
- `training-videos` bucket has a default file size limit (likely < 300MB).
- `next.config.ts` has `proxyClientMaxBodySize: "500mb"`.
- `/api/admin/training/upload` has `MAX_FILE_SIZE = 500 * 1024 * 1024`.
- `EditLessonPage` uses `detectVideoMode` which segments URLs into `youtube`, `url`, or `upload`.
- `detectVideoMode` never returns `upload`, even for Supabase URLs, causing them to show in the "Direct URL" tab instead of the "Upload" tab.
- Admin edit page lacks a video preview player, unlike the trainee portal.

## Exact Gap
1. `storage.buckets` record for `training-videos` needs its `file_size_limit` increased.
2. `New Lesson` page uses direct client upload instead of the server-mediated admin route.
3. `Edit Lesson` page does not show the "Current" video status if in `url` mode, and doesn't provide a preview player for uploaded videos.
4. `detectVideoMode` doesn't treat Supabase Storage URLs as "Uploaded" content.

## Required Implementation
- [ ] Create a migration to set `file_size_limit = 524288000` for the `training-videos` bucket.
- [ ] Refactor `src/app/admin/training/lessons/new/page.tsx` to use `/api/admin/training/upload`.
- [ ] Update `detectVideoMode` in `EditLessonPage` and `NewLessonPage` to recognize Supabase URLs (e.g. including `storage/v1/object/public/training-videos`) as the `upload` mode target.
- [ ] Add a conditional video preview player in the `EditLessonPage` so coordinators can verify the content.
- [ ] Ensure consistent "Current: [URL]" messaging across both `url` and `upload` modes when a URL exists.

## Files To Read First
- `supabase/migrations/20260403000019_admin_content_tables.sql` (if bucket creation is there)
- `src/app/admin/training/lessons/[id]/edit/page.tsx`
- `src/app/api/admin/training/upload/route.ts`

## Likely Files To Change
- `supabase/migrations/20260410000001_increase_storage_limits.sql` [NEW]
- `src/app/admin/training/lessons/new/page.tsx`
- `src/app/admin/training/lessons/[id]/edit/page.tsx`

## Acceptance Criteria
- 300MB+ videos can be uploaded successfully (up to 500MB).
- After upload or page refresh, the admin page correctly identifies the video as an "Upload" and shows it in the relevant tab.
- A video player preview is visible in the admin edit page for valid video URLs.
- Standardized server-mediated upload is used in both New and Edit flows.

## Verification Test Plan
- [ ] Verify SQL migration increases the limit.
- [ ] Confirm `New Lesson` page calls the API route on file change.
- [ ] Confirm `Edit Lesson` correctly detects a Supabase URL and shows the preview player.
