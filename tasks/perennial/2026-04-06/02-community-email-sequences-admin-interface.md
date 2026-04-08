# Add Community Email Sequences Admin Interface - 2026-04-06

- Status: Completed (2026-04-08, upstream)
- Completion Notes: Admin UI at `src/app/admin/email-sequences/` with API at `src/app/api/admin/email-sequences/`.
- Priority: P1
- Owner: Fullstack
- Scope: sequence visibility, control tools, template preview, per-user send history
- Estimate: 1.5-3 days
- Task File: `docs/tasks/perennial/2026-04-06/02-community-email-sequences-admin-interface.md`

## Goal

Add the missing admin tooling for requirement-driven community email sequences.

## Verified Current Code Truth

- The requirement document expects community-related email operations for:
  - membership welcome
  - Mystery School enrollment confirmation
  - monthly transit ready
  - Sunday Service new episode
- The current project does not expose a verified admin interface where operators can:
  - view all email sequences and subscriber counts
  - pause or resume a sequence
  - inspect send history per user
  - preview templates

## User-Visible Problem

Operators do not have a validated admin workflow for monitoring or controlling Perennial email automation.

## Required Behavior

1. Admins must be able to see all relevant community email sequences.
2. Admins must be able to see current subscriber counts per sequence.
3. Admins must be able to pause and resume a sequence.
4. Admins must be able to inspect send history for a specific user.
5. Admins must be able to preview the underlying templates.

## Tasks

1. Define the sequence types that belong to the community / Perennial area.
2. Add admin list view for sequence overview and subscriber counts.
3. Add pause and resume controls with audit-safe status updates.
4. Add per-user send-history view.
5. Add email template preview workflow.

## Acceptance Criteria

- admins can see the supported community email sequences
- subscriber counts are visible per sequence
- pause and resume controls work
- per-user send history is inspectable
- templates can be previewed without sending an email

## Verification Test Plan

1. Open the admin email-sequence area and confirm all intended community sequences are listed.
2. Pause a sequence and verify new sends are blocked.
3. Resume the sequence and verify sending eligibility is restored.
4. Open a user send-history view and verify past sends are visible.
5. Preview a template and verify the correct content renders.

## Notion Summary

P1 operations gap: community email automation needs an admin control surface so operators can monitor subscriber counts, pause sequences safely, inspect per-user history, and preview templates.
