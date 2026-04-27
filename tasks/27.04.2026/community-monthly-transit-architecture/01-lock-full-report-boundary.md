# Task 01 - Lock Full Monthly Report Boundary

- Status: Planned
- Priority: P0
- Area: Perennial / Community / Monthly Transits
- Route: `/community/transits/detailed`

---

## Goal

Preserve `/community/transits/detailed` as the full monthly report source of truth.

This route already uses the shared admin Astro Toolkit implementation and should not be rebuilt or replaced.

## Current Implementation

File:

- `src/app/community/transits/detailed/page.tsx`

Current behavior:

- authenticates the user
- requires active Perennial membership
- resolves birth data through `resolveUserBirthData`
- builds toolkit prefill through `buildToolkitPrefillForm`
- passes the current month as `futureMonth`
- renders `HoroscopeToolkitPage`
- restricts the visible toolkit tab to `tropical_transits_monthly_v3`
- sets `readOnlyBirthData={true}`

## Required Implementation Rule

Do not create a duplicate full monthly transit generation API for community.

The full report must continue to flow through:

- `HoroscopeToolkitPage`
- `allowedSlugs={["tropical_transits_monthly_v3"]}`
- existing admin toolkit compute/AI architecture

## Why

The detailed route is already aligned with the production Astro Toolkit monthly report. Duplicating this would create inconsistent reports, higher maintenance cost, and higher risk of old/dummy/internal logic being mistaken for the real monthly report.

## Acceptance Criteria

- [ ] `/community/transits/detailed` remains the only community full monthly report route.
- [ ] The page continues to use `HoroscopeToolkitPage`.
- [ ] The page remains locked to `tropical_transits_monthly_v3`.
- [ ] Birth data remains prefilled and read-only for community users.
- [ ] No new duplicate full-report API is introduced.
