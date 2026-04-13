# 03 Publish Date Release and Active Inactive Lifecycle

## Goal

Design the publishing pipeline so admin can create unlimited dashboard items in advance, but the user dashboard only releases them at the correct time.

## Current Gap

The repo currently uses mixed lifecycle concepts:

- `status`
- `is_published`
- `display_start_at`
- `display_end_at`

That is not yet a clean editorial publishing model.

## Recommended Lifecycle Fields

- `is_active`
- `publish_at`
- `expire_at`
- `publication_state`
  - `draft`
  - `scheduled`
  - `published`
  - `expired`
  - `archived`

## Visibility Rule

A dashboard item is visible only when all of the following are true:

1. `is_active = true`
2. `publication_state` is effectively publishable
3. `publish_at <= now()`
4. `expire_at is null OR expire_at > now()`
5. audience and permission checks pass

## Why `publish_at` Must Be First-Class

The user explicitly wants:

- admin can add as many items as desired
- the system releases them on publish date

That means `publish_at` cannot be inferred from `created_at` and should not be buried inside optional display-window logic.

## Editorial State Rules

### Draft

- not visible
- not release-eligible

### Scheduled

- not yet visible
- visible automatically once `publish_at` arrives

### Published

- visible if active and not expired

### Expired

- no longer visible in dashboard
- retained for audit and reporting

### Archived

- manually retired
- not visible regardless of date

## Active vs Inactive Rule

Use `is_active` as an operational kill switch.

This is separate from editorial state because admin may need to:

- temporarily hide a published item
- disable a bad link
- pause an asset during moderation

without rewriting publish history.

## Ordering Rule

The requested behavior says “order by publish date.”

The gold-standard rule should be:

1. pinned items first
2. newest `publish_at` first
3. higher `manual_sort_weight` as a tie-breaker where explicitly used
4. `created_at` and `id` for deterministic final ordering

This avoids nondeterministic feeds while preserving editorial control.

## Deliverables

- lifecycle state machine
- publish eligibility rules
- expiration rules
- final ordering policy for the dashboard feed
