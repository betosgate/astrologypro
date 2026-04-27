# Task 01 - Audit Community Chart Entrypoints

- Status: Planned
- Priority: P0
- Area: Perennial / Community / Saved Chart Reports

---

## Goal

Inventory every PM/community chart/report entrypoint before changing schema or lifecycle behavior.

## Routes To Audit

- `/community/family`
- `/community/family/[id]`
- `/community/horoscope`
- `/community/transits`
- `/community/transits/detailed`
- `/community/charts`
- `/community/charts/detailed`

## APIs To Audit

- `POST /api/community/generate-natal`
- `POST /api/community/me/generate-chart`
- `GET /api/community/family`
- `GET /api/community/astro-charts`
- `GET/POST /api/community/relationship-charts`
- `POST /api/community/relationship-charts/batch`
- `GET /api/cron/monthly-transits`
- `POST /api/astro-ai/save-astro-ai-response`
- `POST /api/astro-ai/fetch-save-astro-ai-response`
- Admin toolkit APIs used through `HoroscopeToolkitPage`

## Questions To Answer

For each route:

- What CTA does the user see?
- What condition changes Generate to View?
- What API does Generate call?
- What table/column is written?
- What does View read?
- Does View re-call external compute/AI APIs?
- Does Regenerate exist?
- Does Regenerate update the same saved artifact?
- What happens if the saved artifact is old/dummy/invalid?

## Required Output

Create an audit table with columns:

```txt
Route
Report type
Tool slug
Generate API
Saved artifact table
Domain lifecycle table
View source
Regenerate source
Known gap
```

## Acceptance Criteria

- [ ] Every PM/community chart/report entrypoint is listed.
- [ ] Every Generate/View/Regenerate path is mapped.
- [ ] All currently separate storage layers are identified.
- [ ] The Vinnie-style failure mode is documented.
- [ ] The audit clearly separates lightweight domain chart data from full toolkit report artifacts.
