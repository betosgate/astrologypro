# 07 Seed Plan and Launch Fixtures

## Goal

Define a realistic seed set so the new Perennial Mandalism dashboard can be tested with meaningful editorial content from day one.

## Seed Principle

The user asked for seeded data. In this thread that should be treated as architecture and rollout planning, not executing migrations.

The correct deliverable here is:

- a canonical seed dataset design
- seed counts by category
- publish-date sequencing rules
- QA-ready examples

## Recommended Seed Set

### Blogs

Seed `4` items:

- `Understanding Perennial Mandalism`
- `How to Use the Dashboard Each Week`
- `Spiritual Practice and Daily Rhythm`
- `Where to Start in the Resource Library`

Recommended release model:

- 1 immediately published
- 2 scheduled over the next 14 days
- 1 inactive draft for admin testing

### Announcements

Seed `5` items:

- welcome announcement
- membership reminder
- live session reminder
- new library release
- calendar update notice

Recommended release model:

- mix of published, scheduled, and expired samples for QA

### Calendar Events

Seed `4` dashboard cards linked to `calendar_events`:

- weekly mandalism gathering
- live Q and A session
- guided practice session
- monthly orientation event

### System Videos

Seed `4` items:

- platform walkthrough
- how to navigate the library
- member onboarding video
- dashboard tutorial

### YouTube Videos

Seed `4` items:

- featured teaching video
- introductory mandalism video
- event replay highlight
- curated weekly recommendation

## Required Seed Coverage

The seed set must intentionally cover:

- each supported category
- active and inactive records
- past, present, and future `publish_at` values
- cards with and without thumbnails
- pinned and non-pinned states
- both native and source-linked items

## QA Scenarios the Seed Must Support

- item should not appear before publish date
- item appears when publish date is reached
- inactive item never appears
- expired item disappears from feed
- event card opens canonical event destination
- mixed feed ordering stays stable

## Deliverables

- seed migration specification
- sample fixture matrix
- release schedule examples
- QA checklist tied to seeded records
