# Perennial Mandalism User Dashboard Publishing Pack

## Objective

Define a gold-standard admin-managed dashboard content system for Perennial Mandalism users where admin can schedule and publish mixed content blocks such as:

- blogs
- announcements
- calendar events
- system videos
- YouTube videos
- documents or resource items

Each dashboard item must support:

- title
- description
- category
- active or inactive lifecycle
- publish date governance
- ordering rules
- future scheduling

Admin must be able to create as many items as needed, but the user dashboard must only release items when their publish date becomes eligible.

This pack is architecture and task writing only. It does not implement the feature.

## Current Repo Grounding

### Existing Perennial admin content model

The repo already has a `perennial_content` admin module via:

- `src/app/admin/perennial-content/page.tsx`
- `src/app/api/admin/perennial-content/route.ts`
- `supabase/migrations/20260404000022_new_admin_modules.sql`

Current `perennial_content` supports:

- `title`
- `content_type`
- `description`
- media URLs
- `display_start_at`
- `display_end_at`
- `status`
- `priority`

Current limitation:

- it is not a dashboard feed model
- it does not have a category taxonomy aligned to the requested content classes
- it does not treat `publish_at` as the primary release control
- it is not designed as a mixed personalized dashboard stream

### Existing Mandalism content model

The repo also has a separate `mandalism_content` system via:

- `src/app/admin/mandalism/page.tsx`
- `src/app/api/admin/mandalism/route.ts`
- `src/app/api/community/mandalism-content/route.ts`
- `supabase/migrations/20260403000020_community_stripe.sql`
- `supabase/migrations/20260406000019_mandalism_content_fields.sql`

Current `mandalism_content` supports:

- `live_stream`
- `video`
- `document`
- `youtube`
- `announcement`
- `is_published`
- `priority`
- `access_control`

Current limitation:

- it is closer to a library than a governed dashboard feed
- it does not cover blog or calendar-event orchestration cleanly
- release timing is not modeled as a first-class admin publishing pipeline

### Existing calendar events model

There is already a `calendar_events` table in:

- `supabase/migrations/20260403000020_community_stripe.sql`

This is important because the requested dashboard needs calendar-event cards, but those should not become disconnected duplicates if they already exist as canonical event records.

## Product Direction

The correct architecture is not “another standalone content table.” It is:

1. a dashboard feed domain
2. a category and source-of-truth model
3. a scheduled publish pipeline
4. an admin control surface
5. deterministic user feed assembly
6. seed content for launch and QA

## Recommended Model

The dashboard should support both:

- native dashboard items authored directly by admin
- references to existing source records such as `calendar_events` or managed video assets

That avoids duplicating canonical data while still allowing the dashboard to act as the curated release surface.

## Workstreams

1. `01-unify-dashboard-content-domain-model.md`
2. `02-category-taxonomy-and-source-linkage.md`
3. `03-publish-date-release-and-active-inactive-lifecycle.md`
4. `04-admin-dashboard-content-management-surface.md`
5. `05-user-dashboard-feed-assembly-and-ordering.md`
6. `06-db-api-permissions-and-query-strategy.md`
7. `07-seed-plan-and-launch-fixtures.md`

## Acceptance Standard

This feature set is complete only when:

- admin can manage dashboard entries across all requested content categories
- content can be scheduled for future release by publish date
- inactive items never leak into the user dashboard
- dashboard cards can either store native content or point to canonical source records
- ordering rules are deterministic and explainable
- the launch includes a realistic seed set for testing and rollout

## Status

- `01-unify-dashboard-content-domain-model.md` — Done
- `02-category-taxonomy-and-source-linkage.md` — Done
- `03-publish-date-release-and-active-inactive-lifecycle.md` — Done
- `04-admin-dashboard-content-management-surface.md` — Done
- `05-user-dashboard-feed-assembly-and-ordering.md` — Done
- `06-db-api-permissions-and-query-strategy.md` — Done
- `07-seed-plan-and-launch-fixtures.md` — Done
