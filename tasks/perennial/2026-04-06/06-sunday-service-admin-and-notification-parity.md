# Close Sunday Service Admin And Notification Gaps - 2026-04-06

- Status: Completed (2026-04-08, upstream)
- Completion Notes: Admin: `src/app/admin/sunday-service/` + API `src/app/api/admin/sunday-service/`. New-episode email and member filter/detail covered by 10/11.
- Priority: P1
- Owner: Fullstack
- Scope: admin publish flow, book filtering, episode detail parity, new episode notifications
- Estimate: 2-3 days
- Task File: `docs/tasks/perennial/2026-04-06/06-sunday-service-admin-and-notification-parity.md`

## Goal

Close the remaining Sunday Service requirement gaps for publishing workflow, browsing behavior, and member notifications.

## Verified Current Code Truth

- A member-facing Sunday Service page already exists at `src/app/community/sunday-service/page.tsx`.
- A fetch route already exists at `src/app/api/community/sunday-service/route.ts`.
- The requirement document also expects:
  - latest episode featured state
  - archive sorted newest first
  - filter by book
  - episode detail with richer metadata
  - admin upload, publish, edit, and unpublish flow
  - email notification to members when a new episode is published
- The current implementation does not expose a verified end-to-end admin publishing workflow or the required publish-triggered email behavior.

## User-Visible Problem

Members can access Sunday Service content, but operators still lack the requirement-grade publishing workflow and members do not yet have the promised new-episode notification behavior.

## Required Behavior

1. Admins must be able to create, edit, publish, and unpublish Sunday Service entries.
2. Publishing a new episode must trigger the member notification flow.
3. Members must be able to filter archive entries by book.
4. Members must have an episode detail view with the required metadata.

## Tasks

1. Add or complete admin CRUD and publish-state flow for Sunday Service.
2. Add publish-triggered “new episode” email notification path.
3. Add archive filter by book.
4. Add richer episode detail rendering for scripture reference and date-oriented browsing if not already present.
5. Ensure latest-versus-archive ordering matches the requirement.

## Acceptance Criteria

- admins can upload, edit, publish, and unpublish Sunday Service entries
- publishing a new episode triggers the intended member notification
- members can filter by book
- latest episode is featured and archive is ordered newest first
- episode detail exposes the required metadata clearly

## Verification Test Plan

1. Publish a new Sunday Service entry and verify it becomes the featured episode.
2. Verify the archive ordering remains newest first.
3. Filter by book and confirm the archive narrows correctly.
4. Open an episode detail view and confirm metadata is visible.
5. Verify the publish action triggers the new-episode notification flow.

## Notion Summary

P1 content-and-notification gap: Sunday Service already exists for members, but it still needs the admin publish workflow, publish-triggered member email, and the required browse/filter/detail experience.
