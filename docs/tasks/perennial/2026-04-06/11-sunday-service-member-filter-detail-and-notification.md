# Close Sunday Service Member Filter, Detail, And Notification Gaps - 2026-04-06

- Status: Planned
- Priority: P1
- Owner: Fullstack
- Scope: archive filter by book, richer detail, new-episode email
- Estimate: 1-2 days
- Task File: `docs/tasks/perennial/2026-04-06/11-sunday-service-member-filter-detail-and-notification.md`

## Goal

Close the remaining member-facing and notification gaps for Sunday Service.

## Verified Current Code Truth

- Member-facing Sunday Service page already exists.
- The requirement document still expects:
  - archive filter by book
  - richer episode detail metadata
  - new episode email notification on publish
- These behaviors are not fully verified in the current implementation.

## Required Behavior

1. Members can filter Sunday Service archive entries by book.
2. Members can inspect richer episode detail metadata.
3. Publishing a new episode triggers the new-episode email notification.

## Tasks

1. Add archive filter by book.
2. Add richer detail rendering where required.
3. Trigger member notification when a new episode is published.

## Acceptance Criteria

- book filter works
- episode detail shows the required metadata
- new episode email fires on publish

## Verification Test Plan

1. Filter archive by book and verify the result set narrows correctly.
2. Open episode detail and verify required metadata is visible.
3. Publish a new episode and verify the email notification path runs.

## Notion Summary

P1 member-experience gap: Sunday Service still needs book filtering, richer detail behavior, and publish-triggered notification for members.
