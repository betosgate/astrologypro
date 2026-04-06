# Add Community Email History And Template Preview - 2026-04-06

- Status: Planned
- Priority: P1
- Owner: Fullstack
- Scope: per-user send history, template preview
- Estimate: 1-2 days
- Task File: `docs/tasks/perennial/2026-04-06/05-community-email-history-and-template-preview.md`

## Goal

Add the missing admin workflows for community email send history and template preview.

## Verified Current Code Truth

- The requirement document expects admins to:
  - view send history per user
  - preview all email templates
- A verified admin workflow for either item is not currently exposed in the reviewed Perennial area.

## Required Behavior

1. Admins can inspect send history for a user.
2. Admins can preview the supported community templates without sending an email.

## Tasks

1. Add per-user send-history view.
2. Add template preview view for community-related email templates.
3. Ensure both workflows are accessible from the admin email operations surface.

## Acceptance Criteria

- send history can be viewed for a user
- templates can be previewed safely

## Verification Test Plan

1. Open a user's email history and verify prior sends are visible.
2. Open template preview and verify the correct content renders.

## Notion Summary

P1 operations gap: community email tooling still needs per-user send history and safe template preview for admin review.
