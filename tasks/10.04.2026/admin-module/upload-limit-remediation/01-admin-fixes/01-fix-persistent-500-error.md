# 01-Fix Persistent 500 Error on Large Video Uploads

- Status: Planned
- Date: 2026-04-10

## Objective
Update the Supabase Storage bucket `file_size_limit` to 500MB to resolve the `"The object exceeded the maximum allowed size"` rejection.

## Why This Task Exists
A 500 status code is returned by the `/api/admin/training/upload` endpoint when the Supabase storage backend rejects a file for being too large. Research confirms this rejection bypasses frontend and API-level checks, meaning it is a hard limit at the database/storage configuration level.

## Current Repo State
- `src/app/api/admin/training/upload/route.ts` has `MAX_FILE_SIZE = 500MB`.
- `next.config.ts` has `proxyClientMaxBodySize: "500mb"`.
- The storage rejection occurs despite these settings.

## Exact Gap
1. The Supabase `storage.buckets` entry for `training-videos` is likely set to the default (typically 100MB) or an insufficient value.
2. We need an idempotent SQL migration to force this value to 500MB.

## Required Implementation
- [ ] Create a migration file `supabase/migrations/20260410000000_fix_training_videos_bucket_limit.sql` with:
  ```sql
  UPDATE storage.buckets
  SET file_size_limit = 524288000
  WHERE id = 'training-videos';
  ```
- [ ] Execute or paste the migration to the environment.
- [ ] Verify that a 300MB+ file now uploads successfully without a 500 error.

## Files To Read First
- `src/app/api/admin/training/upload/route.ts`

## Likely Files To Change
- `supabase/migrations/20260410000000_fix_training_videos_bucket_limit.sql` [NEW]

## Acceptance Criteria
- 300MB+ videos can be uploaded successfully.
- API response returns 200 OK with the public URL.
- No `500 Internal Server Error` is triggered by the storage backend size limit.

## Verification Test Plan
- [ ] Apply the migration.
- [ ] Attempt to upload a video larger than 200MB.
- [ ] Confirm receipt of `publicUrl` from the API.
