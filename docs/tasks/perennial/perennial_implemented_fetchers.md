# Perennial Implemented Fetchers

## Purpose

This file lists the Perennial-related fetchers and API routes that are implemented in the current Next.js project.

Current Perennial area in this project:

- `src/app/community/*`
- `src/app/api/community/*`
- `src/components/community/*`

---

## Implemented Fetcher Count

- Total implemented fetchers/APIs: `13`

---

## Implemented Fetchers

### Family and Member Fetchers

- `/api/community/family`
  - Purpose: fetch family members and create a new family member
  - File: `src/app/api/community/family/route.ts`

- `/api/community/family/[id]`
  - Purpose: update or delete a family member
  - File: `src/app/api/community/family/[id]/route.ts`

### Astrology and Chart Fetchers

- `/api/community/generate-natal`
  - Purpose: generate natal chart data for a family member
  - File: `src/app/api/community/generate-natal/route.ts`

- `/api/community/relationship-charts`
  - Purpose: generate and fetch relationship/synastry charts
  - File: `src/app/api/community/relationship-charts/route.ts`

- `/api/community/astro-charts`
  - Purpose: fetch dashboard chart summary / chart readiness data
  - File: `src/app/api/community/astro-charts/route.ts`

- `/api/cron/monthly-transits`
  - Purpose: generate monthly transit data
  - File: `src/app/api/cron/monthly-transits/route.ts`

### Ritual Fetchers

- `/api/community/rituals`
  - Purpose: fetch ritual list and create a ritual configuration
  - File: `src/app/api/community/rituals/route.ts`

- `/api/community/rituals/[id]`
  - Purpose: fetch single ritual details or delete a ritual
  - File: `src/app/api/community/rituals/[id]/route.ts`

### Subscription and Checkout Fetchers

- `/api/community/checkout`
  - Purpose: create checkout session for community membership or upgrade flow
  - File: `src/app/api/community/checkout/route.ts`

### Horoscope and Study Fetchers

- `/api/community/horoscope`
  - Purpose: proxy horoscope-related astrology requests
  - File: `src/app/api/community/horoscope/route.ts`

- `/api/community/ingress-charts`
  - Purpose: fetch ingress chart list
  - File: `src/app/api/community/ingress-charts/route.ts`

- `/api/community/ingress-charts/[id]`
  - Purpose: fetch single ingress chart details
  - File: `src/app/api/community/ingress-charts/[id]/route.ts`

### Sunday Service Fetchers

- `/api/community/sunday-service`
  - Purpose: fetch Sunday Service current/live/archive data
  - File: `src/app/api/community/sunday-service/route.ts`

---

## Summary

The current project does not keep the old Angular Perennial fetcher names. Instead, the implemented Perennial fetchers are built in the new Next.js style under `/api/community/*` and related cron routes.
