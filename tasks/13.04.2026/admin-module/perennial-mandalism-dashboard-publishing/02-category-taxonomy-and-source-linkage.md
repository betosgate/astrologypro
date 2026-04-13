# 02 Category Taxonomy and Source Linkage

## Goal

Define the allowed dashboard categories and how each category maps to native content authoring or canonical source records.

## Requested Category Set

The requested user-facing dashboard categories are:

- blogs
- announcements
- calendar events
- system videos
- YouTube videos

The architecture should also leave room for:

- resource documents
- live or replay features

## Recommended Canonical Categories

- `blog`
- `announcement`
- `calendar_event`
- `system_video`
- `youtube_video`
- `document`

These should be stable internal categories even if the display label changes later.

## Category Rules

### `blog`

Recommended mode:

- native first
- source-linked later if a dedicated blog table emerges

Required fields:

- title
- teaser description
- slug or target URL
- cover image
- estimated read time

### `announcement`

Recommended mode:

- native

Reason:

- announcements are dashboard-specific publishing objects and should not require a separate domain table unless volume becomes very high

### `calendar_event`

Recommended mode:

- source-linked to `calendar_events`

Reason:

- event timing should remain canonical in one place
- dashboard should not own event start/end logic

### `system_video`

Recommended mode:

- source-linked where a canonical internal video record exists
- native fallback if the current system lacks a dedicated video domain for this dashboard use case

### `youtube_video`

Recommended mode:

- native with normalized YouTube metadata fields

Reason:

- dashboard publishing often needs teaser control and manual release sequencing even if the video itself is externally hosted

## Required Linkage Fields

For source-linked records the dashboard layer should persist:

- `source_table`
- `source_id`
- `source_snapshot_title`
- `source_snapshot_status`
- `source_snapshot_published_at`

Snapshot fields are important because:

- they provide dashboard auditability
- they let admin see what was linked at the time of publication
- they help diagnose drift if the source record changes later

## Category Governance Standard

Admin should never be allowed to enter arbitrary free-text categories in production.

Instead:

- categories must come from a governed registry
- each category must declare whether it is native-only, source-linked-only, or hybrid
- admin UI should change form fields based on category capability

## Deliverables

- category registry
- category-to-source mapping matrix
- required-field matrix per category
- validation rules for native versus source-linked cards
