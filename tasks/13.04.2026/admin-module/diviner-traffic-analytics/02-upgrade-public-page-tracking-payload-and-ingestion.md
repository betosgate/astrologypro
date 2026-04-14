# Task 02 - Upgrade Public Page Tracking Payload and Ingestion

- Status: Done

## Completion Notes

- The client tracker now submits `search` alongside `divinerId`, `path`, and `referrer` from [src/components/landing/page-tracker.tsx](/Users/debasiskarm4/Documents/projects.nosync/divine/AstrologyPro/src/components/landing/page-tracker.tsx:1).
- Ingestion now enriches analytics at write time in [src/app/api/analytics/track/route.ts](/Users/debasiskarm4/Documents/projects.nosync/divine/AstrologyPro/src/app/api/analytics/track/route.ts:1) using [src/lib/diviner-analytics.ts](/Users/debasiskarm4/Documents/projects.nosync/divine/AstrologyPro/src/lib/diviner-analytics.ts:1).
- Priority: P0
- Owner: Backend / Full-stack

## Objective

Update the public tracking flow so the analytics ingestion route records partner attribution, geo context, and source classification at write time.

## Why This Task Exists

Schema alone does not improve analytics quality. The capture path must actively stamp the additional dimensions.

Today:

- `PageTracker` sends a minimal payload
- `/api/analytics/track` hashes IP and stores a thin row

That is the correct place to enrich the event.

## Current Repo State

- Client tracker: `src/components/landing/page-tracker.tsx`
- Ingestion route: `src/app/api/analytics/track/route.ts`

## Exact Gap

- The tracker does not pass query-string context needed for UTM or `ref` attribution.
- The ingestion route does not derive:
  - source host
  - traffic bucket
  - partner attribution kind
  - location metadata from trusted headers

## Required Implementation

### Client-side payload

The tracker should send:

- `divinerId`
- `path`
- `referrer`
- `window.location.search`

Do **not** send raw IP from the client.

### Server-side enrichment

The route should:

- hash the visitor IP as it already does
- read geo headers such as Vercel IP headers when available
- parse `utm_source`, `utm_medium`, `utm_campaign`
- parse `ref`
- resolve whether `ref` belongs to:
  - a social advocate
  - a legacy affiliate code
  - a diviner affiliate referral link
- derive canonical `traffic_source`
- stamp `affiliate_related`, `advocate_related`, and `attribution_kind`

## Attribution Rules

### Direct match wins

If a referral code matches a known partner entity:
- prefer that explicit match
- do not downgrade it to a generic social/referral source

### UTM-only fallback

If no partner code exists but `utm_medium` implies a partner channel:
- set `attribution_kind` from UTM
- mark the relevant boolean

### Unknown partner signal

If a `ref` code is present but does not resolve:
- set `attribution_kind = unknown`
- do not pretend it is organic

## Files To Read First

- `src/components/landing/page-tracker.tsx`
- `src/app/api/analytics/track/route.ts`
- `src/app/advocate/page.tsx`
- `src/lib/affiliate-commissions.ts`

## Acceptance Criteria

- A public diviner page hit can capture query-string and referrer context robustly.
- The ingestion route writes enriched analytics rows without requiring a second pass.
- Known affiliate and advocate codes are distinguishable in stored analytics rows.

## Verification Test Plan

- [ ] Load a diviner page with `?ref=<known-advocate-code>` and confirm the row is marked advocate-related.
- [ ] Load a diviner page with `?ref=<known-affiliate-code>` and confirm the row is marked affiliate-related.
- [ ] Load a diviner page with a generic Google referrer and confirm `traffic_source = organic_search`.
- [ ] Load a diviner page with no referrer and no UTM and confirm `traffic_source = direct`.
