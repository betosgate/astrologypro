# 04 Admin Dashboard Content Management Surface

## Goal

Design an admin surface that makes mixed dashboard publishing easy instead of forcing admins to learn separate workflows for every content type.

## Current Repo Grounding

There are existing admin pages for:

- `src/app/admin/perennial-content/page.tsx`
- `src/app/admin/mandalism/page.tsx`

Those pages already prove the repo can support admin CRUD, but they are still content-library management views rather than a full dashboard editorial desk.

## Required Admin Capabilities

Admin must be able to:

- create dashboard items
- choose category
- choose native or source-linked mode
- set title and description
- set active or inactive
- set publish date
- set expiration date
- preview release timing
- filter by state, category, and date
- reorder or pin items
- inspect future scheduled items

## Recommended Admin Views

### Dashboard feed list

Primary list with:

- title
- category
- source mode
- publish date
- active status
- publication state
- audience scope
- last updated by

### Scheduled queue

Dedicated operational view for:

- items publishing soon
- overdue items with bad data
- expired items
- inactive items that were previously published

### Create and edit form

Form should dynamically adapt by category.

Examples:

- `calendar_event` asks the admin to select an existing event
- `youtube_video` asks for YouTube URL and preview metadata
- `announcement` opens a richer authoring interface

### Preview mode

Preview should show:

- card thumbnail
- title
- description
- publish window
- audience visibility
- where the CTA lands

## Operational Requirement

The admin UI must make scheduled release obvious.

This means the form should show plain-language labels such as:

- publishes immediately
- publishes on scheduled date
- expired
- hidden because inactive

## Deliverables

- admin information architecture
- filter and list specification
- create and edit form specification by category
- scheduled queue operational requirements
