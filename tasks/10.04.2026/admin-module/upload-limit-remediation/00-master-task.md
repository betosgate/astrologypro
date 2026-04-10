# Training School Upload Limit Remediation - AI Execution Master Task

- Status: Planned (2026-04-10)

## Objective
Investigate and resolve the persistent `500 Internal Server Error` occurring during training video uploads of ~300MB, where the error message is `"Storage upload failed: The object exceeded the maximum allowed size"`.

## Canonical Folder
- Repo path: `tasks/10.04.2026/admin-module/upload-limit-remediation`

## Why This Pack Exists
Despite the UI and API configurations indicating a 500MB limit, uploads are still failing at the storage backend level with a size rejection error. This indicates that the Supabase Storage bucket `file_size_limit` has not been correctly updated in the current environment's database.

## Requested Change Set
1. Create and apply a targeted migration to update the `file_size_limit` for the `training-videos` bucket in the `storage.buckets` table.
2. Verify the fix by attempting to upload a 300MB+ video file.
3. Standardize the error detection to provide more descriptive feedback if the rejection persists.

## Execution Order
1. `01-admin-fixes/01-fix-persistent-500-error.md`

## Done Definition
- Coordinator can successfully upload videos up to 500MB via the admin API.
- The "object exceeded maximum allowed size" error is resolved.
- Database `storage.buckets` limit is confirmed to be 524,288,000 bytes.
