# Add Holy Books Admin CMS - 2026-04-06

- Status: Planned
- Priority: P2
- Owner: Fullstack
- Scope: book metadata admin, file replacement, ordering, active state
- Estimate: 1.5-2.5 days
- Task File: `docs/tasks/perennial/2026-04-06/04-holy-books-admin-cms.md`

## Goal

Close the requirement gap between the current member-facing holy books library and the missing admin management workflow.

## Verified Current Code Truth

- A member-facing library page already exists at `src/app/community/library/page.tsx`.
- The current library exposes sacred texts to members.
- The requirement document also expects admin workflows for:
  - upload or replace PDFs
  - edit title, description, and cover image
  - reorder books
  - toggle active or inactive state
- A verified admin CMS path for holy books is not currently exposed.

## User-Visible Problem

The library exists for members, but operators cannot manage the sacred text catalog through a proper admin workflow.

## Required Behavior

1. Admins must be able to add, edit, replace, reorder, and toggle holy books.
2. Member-facing library output must respect active state and ordering.
3. Book metadata must be editable without code deploy.

## Tasks

1. Add persistence model and admin CRUD flow for holy books if not already present.
2. Add file replacement/upload handling for PDFs and cover images.
3. Add ordering controls.
4. Add active-state toggle.
5. Wire the member-facing library to the managed data source.

## Acceptance Criteria

- admins can manage book metadata and files
- admins can reorder books
- admins can hide inactive books
- member library reflects admin-managed content

## Verification Test Plan

1. Add a book in admin and verify it appears in the library.
2. Edit title or description and verify the change appears for members.
3. Reorder books and verify the order changes in the member view.
4. Deactivate a book and verify it no longer appears to members.

## Notion Summary

P2 content-admin gap: the sacred texts library is already member-facing, but it still needs the admin CMS required to manage PDFs, metadata, ordering, and active state safely.
