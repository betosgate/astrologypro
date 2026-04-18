# Task VF-03 - Fix Landing Page Dashboard Summary Counts

- Status: Not Started
- Priority: P1
- Owner: Full Stack
- Area: Diviner landing pages API/UI
- Source: Local verification of `docs/tasks/2026-04-17`
- Created: 2026-04-18

## Files

- `src/app/api/dashboard/landing-pages/route.ts`
- `src/app/dashboard/landing-pages/page.tsx`

## Problem

For `diviner1@test.astrologypro.com`, `/api/dashboard/landing-pages` returned enabled services with:

- `is_published = true`
- `publish_status = "published"`

But the summary returned:

- `total_enabled = 2`
- `total_published = 0`

The summary currently counts only `service_landing_pages.status === "published"` and ignores `diviner_services.is_published`.

## Implementation

1. Decide the summary source of truth:
   - If a custom `service_landing_pages` row exists, use its `status`.
   - If no custom landing page exists, use `diviner_services.is_published` / `publish_status`.
2. Update `total_published`, `total_draft`, and status filtering to match that decision.
3. Make the landing pages UI labels match the API.

## Acceptance Criteria

- A diviner with 2 enabled and published service pages sees `total_published = 2`.
- Published filter includes template-backed published pages even when no custom builder row exists.
- Draft filter does not incorrectly include published template-backed pages.

## Verification

```bash
curl http://localhost:3000/api/dashboard/landing-pages
```

Use an authenticated browser session for `diviner1@test.astrologypro.com` and verify:

- `/dashboard/landing-pages` summary counts match returned rows.
- Public URLs for published rows load.
