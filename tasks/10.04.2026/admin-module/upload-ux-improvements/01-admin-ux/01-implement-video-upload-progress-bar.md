# 01-Implement Video Upload Progress Bar

- Status: Planned
- Date: 2026-04-10

## Objective
Replace the static "Uploading..." text in the Training School admin lesson editor with a dynamic progress bar that reflects real-time upload status.

## Why This Task Exists
A static loader is insufficient for large video uploads (up to 500MB). Without a progress bar, administrators cannot tell how much of the file has been uploaded or if the process is moving at all.

## Current Repo State
- `handleVideoFileChange` in `NewLessonPage` and `EditLessonPage` uses `fetch` to POST to `/api/admin/training/upload`.
- A simple `uploadProgress` (boolean) state is used to show/hide the "Uploading..." text.
- The project uses `shadcn/ui` which likely includes a `Progress` component.

## Exact Gap
1. The `fetch` API does not provide a way to track **upload** progress (unlike download progress).
2. The UI lacks a `Progress` component or equivalent indicator.
3. The upload logic needs to transition from `fetch` to `XMLHttpRequest` or a client-side wrapper that supports progress events.

## Required Implementation
- [ ] Add a numeric `uploadPercent` state to the lesson edit/new pages.
- [ ] Implement an upload utility or refactor the inline `fetch` call to use `XMLHttpRequest`.
- [ ] Integrate a UI progress bar component (e.g., `<Progress value={uploadPercent} />`) into the `upload` section of the lesson form.
- [ ] Test with large files to ensure the percentage updates smoothly and reaches 100% before completion.
- [ ] Ensure the progress bar resets or disappears gracefully upon success or failure.

## Files To Read First
- `src/app/admin/training/lessons/new/page.tsx`
- `src/app/admin/training/lessons/[id]/edit/page.tsx`
- `src/components/ui/progress.tsx` (if it exists)

## Likely Files To Change
- `src/app/admin/training/lessons/new/page.tsx`
- `src/app/admin/training/lessons/[id]/edit/page.tsx`

## Acceptance Criteria
- Admin sees a progress bar during video upload that increments from 0 to 100.
- The UI remains responsive during the upload process.
- Errors are still handled correctly and clear the progress state.

## Verification Test Plan
- [ ] Select a large video file for upload.
- [ ] Observe the progress bar and confirm it reflects the upload status.
- [ ] Confirm the toast message appears only after the server confirms receipt (100% progress).
