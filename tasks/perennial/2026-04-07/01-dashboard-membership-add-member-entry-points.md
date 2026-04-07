# Add Dashboard And Membership Entry Points For Member Creation - 2026-04-07

- Status: Planned
- Priority: P1
- Owner: Frontend
- Scope: dashboard CTA placement, membership block action, navigation into dedicated form screen
- Estimate: 0.5-1 day
- Task File: `tasks/perennial/2026-04-07/01-dashboard-membership-add-member-entry-points.md`

## Goal

Expose a clear add-member action in the Perennial dashboard, including an entry point inside or aligned with the top membership block, so members can easily open the dedicated create-member screen.

## Verified Current UI Truth

- The current dashboard already includes a top membership summary area.
- Existing plan-related actions emphasize billing and upgrade flows.
- The add-member experience is currently tied to lightweight community member/family management flows rather than a dedicated full-screen create experience.

## User-Visible Problem

Members do not currently have the requested legacy-style path where they can launch a full add-member screen directly from the dashboard and top membership block.

## Required Behavior

1. The dashboard must include a specific add-member action/block.
2. The top membership block must also expose add-member creation.
3. Clicking the action must navigate to the dedicated add-member form screen.

## Tasks

1. Review the current Perennial dashboard and membership summary structure.
2. Add a dedicated add-member action in the dashboard flow.
3. Add an add-member action in or aligned with the top membership block.
4. Ensure both entry points route to the same create-member screen.

## Acceptance Criteria

- add-member is discoverable from the dashboard
- add-member is also available from the top membership block
- both entry points open the dedicated create form

## Verification Test Plan

1. Open the Perennial dashboard and verify the dedicated add-member action is visible.
2. Verify the top membership area also includes add-member creation access.
3. Click each entry point and confirm both open the same form screen.

## Notion Summary

P1 dashboard entry gap: Perennial needs a prominent add-member action both in the dashboard flow and in the top membership summary area so the legacy-style member-creation journey is easy to start.
