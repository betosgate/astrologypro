# Add Doctrine Links Admin Management - 2026-04-06

- Status: Planned
- Priority: P2
- Owner: Fullstack
- Scope: doctrine-link CRUD, ordering, active state
- Estimate: 1 day
- Task File: `docs/tasks/perennial/2026-04-06/09-doctrine-links-admin-management.md`

## Goal

Add the missing admin-managed doctrine-links system required for the Perennial study area.

## Verified Current Code Truth

- The requirement document expects DB-backed doctrine links and admin control over URLs and ordering.
- A verified admin CRUD path for doctrine links is not currently exposed.

## Required Behavior

1. Admins can add, edit, reorder, activate, and deactivate doctrine links.
2. Member-facing study/doctrine area renders from managed data.

## Tasks

1. Add doctrine-link CRUD flow.
2. Add ordering support.
3. Add active-state toggle.
4. Wire the member-facing view to managed data.

## Acceptance Criteria

- admins can manage doctrine links without code deploy
- members see the latest managed links in the expected order

## Verification Test Plan

1. Add or edit a doctrine link.
2. Reorder it and verify member-facing order updates.
3. Deactivate it and verify it is hidden.

## Notion Summary

P2 content-ops gap: doctrine links still need a proper admin-managed data source and management workflow.
