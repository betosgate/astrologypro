# Task 04 - Build Admin Diviner Traffic Report API

- Status: Open
- Priority: P0
- Owner: Backend API

## Objective

Add a dedicated admin report route that aggregates enriched `page_views` into a report answering the business question: which diviners are getting the most hits, from where, when, and from which partner channel.

## Why This Task Exists

The current admin funnel report focuses on:

- views
- unique visitors
- bookings
- completions

It does **not** focus on:

- top diviners by raw hit volume
- source attribution slices
- geography
- partner relevance by hit

This is a separate report, not just a funnel extension.

## Report Response Requirements

The response should provide:

### Summary

- total hits
- total unique visitors
- affiliate-related hits
- advocate-related hits
- organic/non-partner hits

### Top diviners table

For each top diviner:

- diviner ID
- display name
- username
- hit count
- unique visitor count
- affiliate hit count
- advocate hit count
- non-partner hit count
- top country
- top location
- top source
- latest hit timestamp

### Supporting breakdowns

- top countries
- top locations
- top sources
- hourly hit distribution

## Aggregation Design

### Unique visitors

Count unique visitors by `ip_hash`.

### Country and location

Use the normalized stored values from `page_views`, not runtime geolocation.

### Partner buckets

Use:

- `affiliate_related`
- `advocate_related`
- `attribution_kind`

Do not derive these from booking tables in the report query.

### Time slices

For the first version, local-server hour extraction is acceptable if timezone handling is explicitly documented.

If the business later needs timezone-aware per-diviner hour charts, that should be a separate follow-up task using diviner timezone metadata.

## Route Contract

Recommended route:

- `GET /api/admin/reports/diviner-traffic?period=30d|90d|1y|all`

## Files To Read First

- `src/app/api/admin/reports/funnel/route.ts`
- `src/app/api/admin/reports/affiliates/route.ts`
- `src/app/api/analytics/track/route.ts`

## Acceptance Criteria

- The route returns top diviners by hits for the chosen period.
- Partner hits are clearly broken out.
- Country/location/source/hourly breakdowns are present in one coherent response.
- The route fits current admin report route conventions.

## Verification Test Plan

- [ ] Call the route for each period and confirm it returns structured JSON.
- [ ] Validate that seeded partner traffic is reflected in affiliate/advocate totals.
- [ ] Validate that top diviners are correctly sorted by hit count.

