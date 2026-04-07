# Add Community Email Sequence Overview And Controls - 2026-04-06

- Status: Planned
- Priority: P1
- Owner: Fullstack
- Scope: sequence list, subscriber counts, pause, resume
- Estimate: 1-2 days
- Task File: `docs/tasks/perennial/2026-04-06/04-community-email-sequence-overview-and-controls.md`

## Goal

Add the admin sequence-overview and pause/resume controls required for community email operations.

## Verified Current Code Truth

- The requirement document expects admins to:
  - view all email sequences
  - view current subscriber counts
  - pause a sequence
  - resume a sequence
- A verified admin surface for these community email controls is not currently exposed.

## Required Behavior

1. Admins can view the supported community email sequences.
2. Admins can see current subscriber counts per sequence.
3. Admins can pause a sequence.
4. Admins can resume a sequence.

## Tasks

1. Define the community-relevant sequence types.
2. Add admin sequence overview page.
3. Add subscriber count visibility.
4. Add pause and resume state handling.

## Acceptance Criteria

- sequence list is visible to admins
- subscriber counts are visible
- pause works
- resume works

## Verification Test Plan

1. Open the admin sequence list and verify expected sequences are present.
2. Pause a sequence and verify it becomes inactive.
3. Resume the sequence and verify it becomes active again.

## Notion Summary

P1 operations gap: admins still need a basic control surface for community email sequences, especially overview plus pause and resume.
