# Training School Storage and Admin visibility - AI Execution Master Task

- Status: Planned (2026-04-10)

## Objective
Address critical issues in the admin module for Training School lesson management:
- Fix the discrepancy between the UI's 500MB upload limit and the actual storage bucket limit (currently around 100MB-200MB).
- Resolve the issue where uploaded videos show correctly in the trainee portal but are invisible in the admin lesson edit page.

## Canonical Folder
- Repo path: `tasks/10.04.2026/admin-module/training-school`

## Why This Pack Exists
The Training School admin tools are currently preventing coordinators from uploading large lesson videos (nearly 300MB), which fails with a "Storage upload failed: The object exceeded the maximum allowed size" message despite the UI stating a 500MB limit. Additionally, a regressions or missing logic in the admin lesson editing interface prevents already-uploaded videos from being displayed or previewed correctly, creating an opaque editing experience.

## Requested Change Set
1. Increase the Supabase Storage bucket (`training-videos`) file size limit to 500MB via database migration.
2. Standardize the upload mechanism in `New Lesson` and `Edit Lesson` pages to use the server-mediated admin upload route.
3. Fix the admin lesson edit page so it correctly identifies and displays the "Current" video if it is a Supabase Storage URL, and ideally provide a preview.

## Execution Order
1. `01-admin-fixes/01-fix-storage-limit-and-video-visibility.md`

## Done Definition
- Coordinator can successfully upload videos up to 500MB.
- Uploaded videos are correctly recognized and displayed in the admin lesson edit interface.
- Standardized upload patterns are used across the admin training module.
