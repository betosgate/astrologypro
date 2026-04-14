# 05 User Dashboard Feed Assembly and Ordering

## Goal

Define how the Perennial Mandalism user dashboard composes and renders the final feed so the user sees a coherent experience instead of a random merge of unrelated datasets.

## Feed Principles

The dashboard should feel curated, timely, and deterministic.

That means:

- only release-eligible items appear
- feed ordering must be predictable
- different categories must still render in one coherent feed
- category-specific cards can vary in presentation without changing the core feed rules

## Recommended Feed Assembly Rules

The dashboard feed query should work from the dashboard publishing table, not by directly merging many domain tables in the page layer.

The feed service should:

1. load eligible dashboard items
2. join or hydrate source-linked records as needed
3. apply audience rules
4. apply ordering rules
5. return a normalized card model to the frontend

## Normalized Card Contract

The frontend should receive something like:

- `id`
- `category`
- `title`
- `description`
- `thumbnail_url`
- `badge_label`
- `publish_at`
- `cta_label`
- `cta_url`
- `card_variant`
- `is_new`
- `source_metadata`

This keeps the UI simple and prevents the page from needing table-specific branching logic.

## Recommended Ordering

1. pinned cards
2. newest `publish_at`
3. `manual_sort_weight`
4. stable tie-breaker by `id`

## Category Rendering Rules

### Blog

- image-led editorial card
- CTA to article

### Announcement

- concise message card
- optional CTA

### Calendar event

- date-forward card
- event start time visible at a glance

### System video

- thumbnail plus duration
- CTA to internal player or resource page

### YouTube video

- thumbnail plus watch CTA
- optional embed support later if product wants it

## Audience Scope

The dashboard model should support at least:

- all eligible users
- members only
- future segment-based audiences if needed

This matters because the current repo already distinguishes public versus members access in community content.

## Deliverables

- feed assembly service contract
- normalized frontend card schema
- category rendering matrix
- ordering and eligibility rules

## Status

Done
