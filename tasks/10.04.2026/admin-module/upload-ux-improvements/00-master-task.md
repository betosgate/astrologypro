# Training School Upload UX Improvements - AI Execution Master Task

- Status: Planned (2026-04-10)

## Objective
Enhance the training video upload experience for administrators by replacing the static "Uploading..." message with a real-time completion progress bar.

## Canonical Folder
- Repo path: `tasks/10.04.2026/admin-module/upload-ux-improvements`

## Why This Pack Exists
The current admin interface only shows a static "Uploading..." text when a video is being uploaded. For large files (up to 500MB), this lacks necessary feedback for the user to know if the upload is progressing or hung, leading to poor user experience and potential duplicate uploads.

## Requested Change Set
1. Replace the static loader in `New Lesson` and `Edit Lesson` pages with a functional progress bar.
2. Use `XMLHttpRequest` or a library like `axios` to track upload progress on the client side, since standard `fetch` does not support upload progress.
3. Provide visual cues for upload start, progress, and completion states.

## Execution Order
1. `01-admin-ux/01-implement-video-upload-progress-bar.md`

## Done Definition
- Admin sees a real-time progress bar (e.g., 0% to 100%) during video upload.
- The progress bar is present on both the `New Lesson` and `Edit Lesson` admin pages.
- Standardized UI components (e.g., from Radix or Shadcn) are used for the progress bar.
