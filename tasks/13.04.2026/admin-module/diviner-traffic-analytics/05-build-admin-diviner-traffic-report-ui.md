# Task 05 - Build Admin Diviner Traffic Report UI

- Status: Done

## Completion Notes

- Implemented in [src/app/admin/reports/diviner-traffic/page.tsx](/Users/debasiskarm4/Documents/projects.nosync/divine/AstrologyPro/src/app/admin/reports/diviner-traffic/page.tsx:1) with the corresponding sidebar navigation entry in [src/components/admin/admin-sidebar.tsx](/Users/debasiskarm4/Documents/projects.nosync/divine/AstrologyPro/src/components/admin/admin-sidebar.tsx:253).
- Priority: P1
- Owner: Frontend

## Objective

Create a first-class admin report page that visualizes top diviner traffic clearly and fits the existing admin reports UX.

## Why This Task Exists

The backend report is necessary but not sufficient. Admins need a page that lets them:

- switch date periods
- understand top-hit diviners quickly
- scan partner attribution
- inspect geographic and hourly slices without raw SQL

## Current Repo Pattern

Existing report pages already establish conventions for:

- period toggles
- summary KPI cards
- tables
- breakdown cards
- route-based fetch from `/api/admin/reports/...`

This new page should follow those patterns rather than inventing a separate analytics UI style.

## Required UI Sections

### 1. Header

- report title
- one-line explanation of what is being measured
- period selector

### 2. KPI row

- total hits
- unique visitors
- affiliate-related hit total
- advocate-related hit total
- organic/non-partner total

### 3. Top diviners table

Columns:

- diviner
- hits
- unique visitors
- affiliate hits
- advocate hits
- top country
- top location
- top source
- latest hit

### 4. Breakdown cards

- top countries
- top locations
- top sources

### 5. Hourly section

- simple hour-of-day hit distribution
- partner annotations for affiliate/advocate counts

## Admin Navigation Requirement

Add a sidebar link inside the existing Reports group.

## Files To Read First

- `src/components/admin/admin-sidebar.tsx`
- `src/app/admin/reports/funnel/page.tsx`
- `src/app/admin/reports/affiliates/page.tsx`

## Acceptance Criteria

- The page is accessible from the admin sidebar.
- The page renders correctly for seeded data and real data.
- Period changes re-fetch the report cleanly.
- The UI makes partner-vs-organic traffic obvious without needing tooltip-only explanations.

## Verification Test Plan

- [ ] Open the page from the sidebar and confirm navigation works.
- [ ] Switch periods and confirm the data refreshes.
- [ ] Confirm the top diviner table and supporting cards populate from the API.
