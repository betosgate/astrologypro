# Task 02 - Align Toolkit Report Persistence

- Status: Planned
- Priority: P0
- Area: Astro Toolkit / Saved AI Reports / Monthly Transits
- Routes: `/community/transits/detailed`, `/admin/horoscope`
- APIs: `/api/astro-ai/save-astro-ai-response`, `/api/astro-ai/fetch-save-astro-ai-response`

---

## Goal

Save and reuse generated `tropical_transits_monthly_v3` full monthly report output through the DB-backed `astro_ai_responses` APIs.

## Current Issue

The shared toolkit monthly report flow still contains save calls to the legacy CloudFront-fronted NestJS endpoint:

- `https://d36fwfwo4vnk9h.cloudfront.net/astro-ai/save-astro-AI-Response`

The new local DB-backed APIs already exist:

- `POST /api/astro-ai/save-astro-ai-response`
- `POST /api/astro-ai/fetch-save-astro-ai-response`

The full report should move toward the local APIs so repeated report opens do not repeatedly spend external API/AI cost.

## Required Behavior

For `tropical_transits_monthly_v3`:

- build a deterministic report identity from toolname, user/member, birth data, and target month
- check for a saved report before running expensive generation
- return the saved report if it matches the current expected shape/version
- generate only when missing, stale, invalid, or explicitly forced
- save generated AI response and raw astrology API data after successful generation

## Storage Boundary

Use `astro_ai_responses` for full toolkit report artifacts.

Do not store the full detailed monthly report in `monthly_transits`.

`monthly_transits` remains the lightweight family/member summary cache.

## Suggested Identity Fields

The implementation should be able to distinguish:

- `toolname`: `tropical_transits_monthly_v3`
- authenticated `user_id`
- target month, for example `2026-04`
- birth date
- birth time
- birth city/country or coordinates
- toolkit schema/source version

If the current `astro_ai_responses` schema does not have explicit identity columns, use a structured JSON payload first and add schema columns later only if needed.

## Acceptance Criteria

- [ ] `tropical_transits_monthly_v3` can save generated output to local `astro_ai_responses`.
- [ ] The toolkit can fetch a matching saved full monthly report before regeneration.
- [ ] Legacy CloudFront save dependency is removed or isolated behind a fallback plan.
- [ ] Saved full reports are not confused with `monthly_transits` summary rows.
- [ ] Cache reuse is guarded by target month and birth-data identity.
- [ ] Invalid or old saved report shapes trigger regeneration.
