# 01 Unify Dashboard Content Domain Model

## Goal

Create a single architecture for Perennial Mandalism user dashboard cards so the dashboard can mix multiple content types without hardcoding separate rendering and publishing rules for each source.

## Current Problem

The repo currently has three partial domains:

- `perennial_content`
- `mandalism_content`
- `calendar_events`

They overlap conceptually but not operationally. That creates:

- duplicated publishing concepts
- inconsistent lifecycle rules
- unclear ownership of event and media data
- no single dashboard feed abstraction

## Target Architecture

Introduce a dedicated dashboard feed model, conceptually something like:

- `dashboard_content_items`

Each record represents one publishable dashboard card and must answer:

- what the card is
- what category it belongs to
- whether it is native or references another source record
- when it becomes visible
- when it expires
- whether it is active
- where it should appear in ordering

## Recommended Core Fields

- `id`
- `dashboard_scope`
  - initially `perennial_mandalism`
- `item_type`
  - `native`
  - `source_linked`
- `category`
  - `blog`
  - `announcement`
  - `calendar_event`
  - `system_video`
  - `youtube_video`
  - `resource_document`
- `title`
- `description`
- `thumbnail_url`
- `cta_label`
- `cta_url`
- `source_table`
- `source_id`
- `publish_at`
- `expire_at`
- `is_active`
- `is_pinned`
- `manual_sort_weight`
- `audience_scope`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

## Native vs Source-Linked Rule

Use two publishing modes:

### Native item

Admin fully authors the dashboard card inside the dashboard system.

Use this for:

- blog previews
- announcements
- manually curated YouTube features
- internal content blocks

### Source-linked item

The dashboard card references a canonical record elsewhere.

Use this for:

- `calendar_events`
- platform-managed system videos
- future product types that already have their own table

This avoids duplicate records drifting apart.

## Architectural Rule

The dashboard item is the publish surface.

The source record remains the domain source of truth for the underlying asset or event.

That means:

- event dates stay canonical in `calendar_events`
- video metadata stays canonical in its owning system if such a system exists
- dashboard-specific title override, teaser description, thumbnail override, and release timing belong to the dashboard feed model

## Why This Matters

Without this split, admin ends up editing the same concept in multiple places and the user dashboard becomes a brittle merge of unrelated queries.

## Deliverables

- dashboard content domain proposal
- field-level ownership matrix
- native vs source-linked decision rules
- migration strategy from existing `perennial_content` and `mandalism_content`

## Status

Done
