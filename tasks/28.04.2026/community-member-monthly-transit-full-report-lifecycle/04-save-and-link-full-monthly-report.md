# Task 04 - Save And Link Full Monthly Report

- Status: Planned
- Priority: P0
- Area: API / Saved Monthly Full Reports

---

## Goal

Persist generated full monthly report payloads and link them to the correct `monthly_transits` row.

This flow must use the same saved-report foundation used by natal charts:

- full artifact saved in `astro_ai_responses`
- same field shape accepted by `POST /api/astro-ai/save-astro-ai-response`
- fetch/hydration from the saved artifact, not from dummy or lightweight summary data

## Required Save Path

When `HoroscopeToolkitPage` successfully generates `tropical_transits_monthly_v3` for community monthly flow:

- Build full payload from generated toolkit state:
  - `toolname`
  - `ai_response`
  - `formData`
  - `astro_api_data`
  - chart SVG/image fields
  - target month
- Call server-side logic that uses existing:

```ts
saveAndLinkMonthlyReport({
  userId,
  familyMemberId,
  monthKey,
  payload,
})
```

## Endpoint

If a server endpoint is needed, add only a thin authenticated wrapper:

```txt
POST /api/community/saved-reports/monthly/link
```

This endpoint must only validate auth/ownership and call `saveAndLinkMonthlyReport(...)`.

## Validation

- Auth required.
- Active community membership required.
- `familyMemberId` must belong to current user's household.
- `monthKey` must be `YYYY-MM`.
- `payload.toolname` must be `tropical_transits_monthly_v3`.

## Acceptance Criteria

- [ ] Full monthly report is saved to `astro_ai_responses`.
- [ ] Matching `monthly_transits` row gets `full_report_id`.
- [ ] `full_report_generated_at` is set.
- [ ] `full_report_status` becomes `generated`.
- [ ] Save/link failure does not silently pretend View is available.
- [ ] Full payload shape matches the existing natal saved-report artifact pattern.
