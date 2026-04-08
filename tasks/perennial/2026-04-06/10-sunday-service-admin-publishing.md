# Add Sunday Service Admin Publishing - 2026-04-06

- Status: Completed (2026-04-08, upstream)
- Completion Notes: Admin Sunday Service publishing flow: `src/app/admin/sunday-service/` + `src/app/api/admin/sunday-service/`.
- Priority: P1
- Owner: Fullstack
- Scope: create, edit, publish, unpublish Sunday Service entries
- Estimate: 1-2 days
- Task File: `docs/tasks/perennial/2026-04-06/10-sunday-service-admin-publishing.md`

## Goal

Add the missing admin publishing workflow for Sunday Service content.

## Verified Current Code Truth

- Member-facing Sunday Service exists.
- The requirement document expects admins to upload, edit, publish, and unpublish entries.
- A verified admin publishing surface is not currently exposed in the reviewed code.

## Required Behavior

1. Admins can create or upload Sunday Service entries.
2. Admins can edit entries.
3. Admins can publish and unpublish entries.
4. Featured/latest and archive ordering use the published data correctly.

## Tasks

1. Add Sunday Service admin CRUD interface.
2. Add publish and unpublish state handling.
3. Ensure featured and archive behavior reads from publishing state.

## Acceptance Criteria

- admins can publish and unpublish entries
- published content appears correctly in the member-facing experience

## Verification Test Plan

1. Create and publish an entry.
2. Verify it appears in the member-facing Sunday Service area.
3. Unpublish it and verify it is removed from the public member-facing listing.

## Notion Summary

P1 publishing gap: Sunday Service needs the missing admin workflow for creating, editing, publishing, and unpublishing entries.
