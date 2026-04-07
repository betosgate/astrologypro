# Add Holy Books Admin Management - 2026-04-06

- Status: Planned
- Priority: P2
- Owner: Fullstack
- Scope: book CRUD, ordering, active state, file replacement
- Estimate: 1-2 days
- Task File: `docs/tasks/perennial/2026-04-06/08-holy-books-admin-management.md`

## Goal

Add the missing admin management workflow for the sacred texts / holy books library.

## Verified Current Code Truth

- Member-facing library exists at `src/app/community/library/page.tsx`.
- The requirement document expects admin management for PDFs, metadata, ordering, and active state.
- A verified admin CRUD path for holy books is not currently exposed.

## Required Behavior

1. Admins can add, edit, reorder, activate, deactivate, and replace holy books.
2. Member library reflects the managed data.

## Tasks

1. Add holy-book CRUD flow.
2. Add ordering controls.
3. Add active-state toggle.
4. Add PDF and cover replacement handling.

## Acceptance Criteria

- admins can manage holy books without code changes
- member library reflects the managed state

## Verification Test Plan

1. Add and edit a book in admin.
2. Reorder books and verify order in member view.
3. Deactivate a book and verify it disappears for members.

## Notion Summary

P2 content-admin gap: sacred texts are visible to members, but the admin management workflow still needs to be built.
