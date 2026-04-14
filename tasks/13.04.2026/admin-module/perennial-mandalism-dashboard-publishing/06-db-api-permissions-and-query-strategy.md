# 06 DB API Permissions and Query Strategy

## Goal

Define the backend foundation for admin-managed scheduled dashboard content with correct permissions and predictable query behavior.

## Current Repo Grounding

The repo already has:

- `perennial_content` for admin-managed dashboard-like assets
- `mandalism_content` for community portal content
- `calendar_events` for event records

The current architecture is enough to prove demand but not enough to serve as the long-term governed dashboard backend.

## Recommended Backend Shape

Introduce a dedicated dashboard publishing table rather than overloading existing tables with more and more mixed concerns.

Reason:

- `perennial_content` is too generic and lacks category-source orchestration
- `mandalism_content` is library-oriented and not a true scheduled dashboard feed
- `calendar_events` should remain a source domain, not the dashboard table

## Proposed Backend Surfaces

### Tables

- `dashboard_content_items`
- optional `dashboard_content_categories`
- optional `dashboard_content_audiences`

### APIs

- admin list API
- admin create API
- admin update API
- admin preview API
- admin scheduled queue API
- user dashboard feed API

## Permission Model

### Admin

- full CRUD
- can see draft, scheduled, published, expired, archived

### End user

- read only
- only receives release-eligible items
- never sees inactive, future, or expired cards unless product explicitly adds archive mode later

## Query Strategy

### Admin list query

Supports filters for:

- category
- state
- active or inactive
- publish date window
- source mode

### User feed query

Must be optimized for:

- `is_active`
- `publish_at`
- `expire_at`
- audience scope
- deterministic ordering

### Recommended indexes

- `is_active, publish_at desc`
- `publication_state, publish_at desc`
- `category, publish_at desc`
- partial index for active publishable rows

## Migration Strategy

Do not try to immediately delete existing `perennial_content` or `mandalism_content`.

Safer approach:

1. introduce dashboard publishing model
2. seed and test there
3. selectively backfill from old content where useful
4. gradually retire overlapping dashboard use cases

## Deliverables

- table proposal
- API surface proposal
- permission and RLS plan
- query and index strategy
- staged migration plan

## Status

Done
