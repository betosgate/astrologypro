# Book Without Diviner — Implementation Note

Produced: 23.04.2026. Handoff for the implementation pass.

## Reuse points

| Existing | Reuse role |
|---|---|
| `getTemplateMatchedDiviners(templateSlug)` in `discover/page.tsx` | Same compatibility rule (template → active published diviner_services + publicly sellable). Extract the core into a shared resolver. |
| `GET /api/availability/<ownerId>` | Canonical per-diviner slots-for-date endpoint. Loop server-side across compatible diviners to build the shared view. |
| `GET /api/availability/<ownerId>/month` | Canonical per-diviner month view. Union across compatible diviners to derive the shared month. |
| `BookingWizard` + `/[username]/book/[serviceSlug]/page.tsx` | Final booking flow. Our new route hands off here with `?submission=...` preserved. |
| `canPubliclySellService` | Public sellability gate. Already used in discover. |
| `getBaseServiceTemplateSlug` | `general-*` → canonical base slug mapping. |

## Missing contracts

1. **Shared month availability** — no single endpoint returns "dates available across all compatible diviners for this template." Built as `GET /api/services/[slug]/template-availability/month`.
2. **Shared date resolver** — no endpoint returns "which compatible diviners have a slot on `date`, with each diviner's matched service + earliest slot + ranking fields." Built as `GET /api/services/[slug]/template-availability`.
3. **Booking page submission pass-through** — the existing `/[username]/book/[serviceSlug]` page doesn't accept `submission` in `searchParams`. Adding pass-through without breaking existing callers.

## New route + API surface

- **Page**: `/book/template/[slug]?submission=<uuid>` — server component, loads compatible services, renders the shared calendar client component.
- **API (month)**: `GET /api/services/[slug]/template-availability/month?month=YYYY-MM&submission=<uuid>` — union of available dates.
- **API (date)**: `GET /api/services/[slug]/template-availability?date=YYYY-MM-DD&submission=<uuid>` — ranked list of available diviners + matched service + earliest-slot for each.
- **Handoff**: client redirects to `/{divinerUsername}/book/{serviceSlug}?submission=<uuid>&date=<YYYY-MM-DD>` after date+diviner resolution.

## Data resolution algorithm

```
base = getBaseServiceTemplateSlug(inputSlug)
template = service_templates WHERE slug = base AND is_active
services = services WHERE template_id = template.id AND is_active
published_diviners = diviner_services WHERE template_id = template.id AND is_enabled AND is_published
keep = services INNER JOIN diviners WHERE
         diviner active / onboarding complete / charges enabled
         AND canPubliclySellService(service, diviner)
         AND service.diviner_id IN published_diviners
```

## Submission validation

`submission=<uuid>` is required. The route reads `service_template_intake_submissions`:
- must exist
- `template_slug` must equal the input slug (either the literal or the canonical base slug)
- invalid submission → 404 so we don't leak existence

## Risks to avoid

1. **Parallel fetches across N diviners** — for large N (>20), month availability can slow. Cap at 20 compatible diviners, log + trim when we exceed.
2. **`canPubliclySellService` is the security gate.** Don't drop it when moving services through the new flow — only compatible + publicly sellable services should surface.
3. **Tier/service visibility drift.** If a diviner unpublishes a service between the date-picker load and the handoff, the booking page's own gate handles it. We don't re-check.
4. **Submission reuse.** We don't invalidate the submission after a successful booking — the same submission id can theoretically be used in two flows. Acceptable for now (also a limitation of the current discover flow).

## Files to add/modify

**New:**
- `src/lib/booking/template-matched-services.ts` — shared resolver (extracted from discover).
- `src/app/book/template/[slug]/page.tsx` — server entry.
- `src/components/booking/shared-template-calendar.tsx` — client UI.
- `src/app/api/services/[slug]/template-availability/month/route.ts`
- `src/app/api/services/[slug]/template-availability/route.ts`

**Modify:**
- `src/app/api/services/[slug]/intake/route.ts` — new `next_url`.
- `src/components/services/template-intake-form.tsx` — drop `/book/demo` fallback.
- `src/app/[username]/book/[serviceSlug]/page.tsx` — accept `submission` + `date` in `searchParams`, pass through to wizard / preserve in handoff.

**Leave alone:**
- `src/app/book/demo/page.tsx` — not deleting (non-goal per master task "don't remove the direct diviner booking route"). Marked stale in commit message.
- `BookingWizard` internals — no prefill in this pass. Submission id survives as a URL param; future toolkit code can read it.

## Ranking rule (per task 04)

`1. earliest slot available on that date (ASC)` — users pick dates, so the slot they'd actually get is most decisive.
`2. isCertified (certified first)`
`3. averageRating (DESC)`
`4. completedSessions (DESC)`
`5. startingPrice (ASC)` — cheaper first for Individual users.

Implemented server-side in the shared date resolver so the UI renders a sorted list.
