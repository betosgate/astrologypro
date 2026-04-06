# Add Doctrine Links Admin CMS - 2026-04-06

- Status: Planned
- Priority: P2
- Owner: Fullstack
- Scope: doctrine link model, admin CRUD, member rendering
- Estimate: 1-2 days
- Task File: `docs/tasks/perennial/2026-04-06/05-doctrine-links-admin-cms.md`

## Goal

Replace any static or hard-coded doctrine-link behavior with the requirement-driven admin-managed doctrine links system.

## Verified Current Code Truth

- The current community experience includes library and study-oriented content.
- The requirement document expects a `doctrine_links` data model and admin-managed URLs for:
  - Central Doctrine YouTube
  - Central Doctrine website pages
  - Five-fold Creed video
  - Astrological Therapy intro
  - Become a Certified Diviner
- A verified admin CRUD workflow for doctrine links is not currently exposed.

## User-Visible Problem

Doctrine and study links cannot be managed reliably without code changes, which makes content operations slow and brittle.

## Required Behavior

1. Admins must be able to add, edit, reorder, and toggle doctrine links.
2. Member-facing doctrine links must render from managed data.
3. Each link must support label, description, URL, type, icon, order, and active state.

## Tasks

1. Add doctrine-links persistence model and admin CRUD interface.
2. Add ordering and active-state controls.
3. Wire the community study/doctrine surface to the managed links.
4. Preserve open-in-new-tab behavior and visible metadata for members.

## Acceptance Criteria

- admins can manage doctrine links without code deploy
- member-facing doctrine links render from the managed source
- order and active state are respected

## Verification Test Plan

1. Add or edit a doctrine link in admin.
2. Verify it appears correctly in the member-facing experience.
3. Reorder links and verify the rendered order updates.
4. Deactivate a link and verify it no longer appears.

## Notion Summary

P2 content-ops gap: doctrine links need a DB-backed admin CMS so operators can manage study links without code changes while members continue to see clear, curated doctrine entry points.
