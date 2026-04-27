# Task 01 - Audit Admin Toolkit And Community Rendering Contract

- Status: Planned
- Priority: P0
- Area: Frontend / Community / Horoscope Toolkit
- Files:
  - `src/app/admin/horoscope/page.tsx`
  - `src/app/admin/horoscope/types.ts`
  - `src/app/admin/horoscope/utils.ts`
  - `src/lib/horoscope-toolkit-prefill.ts`
  - `src/app/community/charts/detailed/page.tsx`
  - `src/app/community/horoscope/page.tsx`
  - `src/app/community/family/[id]/page.tsx`
- Related Routes:
  - `/admin/horoscope`
  - `/community/charts/detailed`
  - `/community/horoscope`
  - `/community/family/[id]`

---

## Problem

The community natal chart pages do not currently use the same rendering path as the admin Horoscope Toolkit.

Before changing UI, confirm the exact reusable component contract, required input shape, allowed tab slug, and API calls.

## Required Investigation

### 1. Confirm Shared Component Contract

Inspect:

```txt
src/app/admin/horoscope/page.tsx
```

Confirm `HoroscopeToolkitPage` supports:

- `basePath`
- `allowedSlugs`
- `initialPrefill`

Confirm it can be imported and used outside the admin route.

### 2. Confirm Existing Community Reuse Pattern

Inspect:

```txt
src/app/community/charts/detailed/page.tsx
```

This page is the reference implementation for community-side toolkit reuse.

Document how it:

- authenticates the logged-in user
- verifies active community membership
- loads owned family member birth rows
- builds the prefill payload with `buildToolkitPrefillForm`
- passes `allowedSlugs`
- renders `HoroscopeToolkitPage`

### 3. Confirm Natal Tab Slug And Calls

Confirm Nativity Birth Chart uses:

```txt
western_horoscope_v2
```

Confirm the natal flow calls:

```txt
POST /api/admin/astro/compute
endpoint: western_horoscope
```

```txt
POST /api/admin/astro/compute
endpoint: natal_wheel_chart
```

Confirm whether `/api/admin/astro/natal-wheel` is also called for the alternate wheel.

Also confirm that:

```txt
POST /api/admin/astro/planet-return
steps: astrology_report_monthly
```

is a monthly transit/report call, not the standard Nativity Birth Chart call.

### 4. Identify Temporary Community Renderers

Inspect:

```txt
src/app/community/horoscope/page.tsx
src/app/community/family/[id]/page.tsx
src/components/community/natal-wheel.tsx
```

Document which UI blocks are temporary custom chart renderers and which ones should be replaced by the shared toolkit in later tasks.

## Required Output

Update this task or create a short implementation note in the PR summary that states:

- the confirmed toolkit props
- the exact natal tab slug
- the exact admin API calls used by Nativity Birth Chart
- the community page that already uses the shared toolkit successfully
- the temporary UI blocks to preserve as commented legacy code in Task 03

## Acceptance Criteria

- [ ] `HoroscopeToolkitPage` reusable contract is confirmed.
- [ ] `buildToolkitPrefillForm` input/output expectations are confirmed.
- [ ] `western_horoscope_v2` is confirmed as the Nativity Birth Chart slug.
- [ ] Admin natal API calls are confirmed.
- [ ] `planet-return` is classified correctly as monthly transit/report behavior.
- [ ] Existing relationship detailed page reuse pattern is documented.
- [ ] Temporary community natal/family renderers are identified.

## QA Checklist

- [ ] Open `/admin/horoscope` locally and confirm Nativity Birth Chart still works.
- [ ] Open a relationship detailed route and confirm it still renders the shared toolkit.
- [ ] Confirm no code behavior is changed by this task unless documentation is updated.

## Notes For Junior Developer

This task is mainly a read-and-confirm task.

Do not start replacing UI until this contract is clear. The later tasks depend on knowing the exact prefill shape and tab slug.

For Codex / AI agents: stop after completing this audit and report the findings. Do not continue into Task 02 in the same run unless the user explicitly asks you to proceed.

---

## Audit Findings (22.04.2026)

### 1. Shared component contract — CONFIRMED

`src/app/admin/horoscope/page.tsx` starts with `"use client"` and exports both:

```ts
export interface HoroscopeToolkitPageProps {
  basePath?: string;
  allowedSlugs?: string[];
  initialPrefill?: string | null;
}

export function HoroscopeToolkitPage({
  basePath = "/admin/horoscope",
  allowedSlugs,
  initialPrefill = null,
}: HoroscopeToolkitPageProps = {}) { /* ... */ }

export default function AdminHoroscopePage() {
  return <HoroscopeToolkitPage />;
}
```

Notes:

- The component is a client component, so any route that renders it must either be a client page or import it from a server page (which is allowed — Next will serialize the element boundary).
- `allowedSlugs` is filtered against the internal `TABS` list; any slug not in `TABS` is silently dropped and the first remaining tab becomes the fallback.
- `basePath` is only used to rewrite the URL when tabs change — it does not need to end with a trailing slash.
- `initialPrefill` is a **URL-encoded JSON string** of `FormState`, not a plain object. Pass `encodeURIComponent(JSON.stringify(prefill))`.
- Switching the tab query param causes a `useEffect` to reset the form via `defaultForm()`, so a prefill applies on mount but not across tab swaps — which is fine for single-tab community usage.

### 2. `buildToolkitPrefillForm` contract — CONFIRMED

Source: `src/lib/horoscope-toolkit-prefill.ts`.

Input seed per person (`ToolkitBirthSeed`):

```ts
{
  fullName?, dateOfBirth?, birthTime?, birthCity?,
  birthCountry?, birthLat?, birthLng?, birthTimezone?,
}
```

Output (`ToolkitPrefillForm`):

```ts
{
  person1: { dob: "YYYY-MM-DD", tob: "HH:mm", city: ToolkitCityOption | null },
  person2: { dob, tob, city },
  areaOfInquiry, question, futureWeek, futureMonth,
}
```

Behavior notes that matter for community reuse:

- If `birthLat` / `birthLng` / `birthTimezone` are missing, the helper calls Geoapify (`GEOAPIFY_API_KEY`) server-side to resolve them, then computes a concrete offset string via `getUTCOffset`. If resolution fails, `city` is set to `null` and the toolkit will refuse to submit until the user picks a city.
- For single-person flows (self natal, family-member natal) pass `person2: null` — the helper returns an empty `ToolkitBirthInput` for `person2` automatically.
- `tob` defaults to `"12:00"` if `birthTime` is empty.

### 3. Nativity tab slug and admin API calls — CONFIRMED

Slug: **`western_horoscope_v2`** (defined at `src/app/admin/horoscope/page.tsx:75`).

When `HoroscopeToolkitPage` runs the Nativity flow it uses the helpers in `src/app/admin/horoscope/api.ts` and triggers these calls:

- `POST /api/admin/astro/compute` with `{ endpoint: "western_horoscope", payload: birth1 }` — primary natal planets/houses/aspects payload (`page.tsx:2776-2779`).
- `POST /api/admin/astro/compute` with `{ endpoint: "natal_wheel_chart", payload: birth1 }` — wheel SVG via compute pipeline (`page.tsx:2790`).
- `POST /api/admin/astro/natal-wheel` with `freeWheelBody(person1)` — alternate/free natal wheel SVG (`page.tsx:2800-2810`).

AI interpretation happens over `POST /api/admin/astro/ai-interpret` via `callAI` (not required to fire for chart rendering — it is triggered per section).

`POST /api/admin/astro/planet-return` with `steps: "astrology_report_monthly"` is invoked **only** from the `tropical_transits_monthly_v3` tab when the user picks a future month (`page.tsx:2919-2924`). Analogously, `steps: "astrology_report_weekly"` is only invoked from `tropical_transits_weekly_v2` for future weeks. Neither path is touched by the Nativity Birth Chart flow, so the community natal reuse will not hit `planet-return`.

### 4. Existing community reuse pattern — CONFIRMED

Reference impl: `src/app/community/charts/detailed/page.tsx`.

Flow:

1. Server page (`export const dynamic = "force-dynamic"`, no `"use client"`).
2. Auth via `await createClient().auth.getUser()`; redirect to `/login` if absent.
3. Membership gate on `community_members`: `maybeSingle()`, require `membership_type === "perennial_mandalism"` and `membership_status === "active"` (redirects to `/community` or `/join/community/resubscribe` otherwise).
4. Data fetch via `createAdminClient()` on `community_family_members`, scoped by `.eq("member_id", member.id)` and `.in("id", [personAId, personBId])` — this keeps RLS-equivalent ownership enforced at the query level even though the admin client bypasses RLS.
5. `buildToolkitPrefillForm({ person1, person2 })` builds the prefill.
6. Renders:

   ```tsx
   <HoroscopeToolkitPage
     basePath={`/community/charts/detailed?personAId=...&personBId=...`}
     allowedSlugs={allowedSlugs}                        // ordered, default first
     initialPrefill={encodeURIComponent(JSON.stringify(prefill))}
   />
   ```

Task 02 (self natal) and Task 03 (family natal) should clone this exact pattern with `allowedSlugs = ["western_horoscope_v2"]` and `person1` sourced from the member / family member row.

### 5. Temporary community renderers to preserve as legacy in Task 03 — IDENTIFIED

- `src/app/community/horoscope/page.tsx` (client page, 790 lines). Entire page is a bespoke renderer: custom `BirthInput` state, `/api/community/nativity-chart/city-search` autocomplete, `/api/community/nativity-chart` POST, per-section `AiInterpretationButton` calling `/api/community/nativity-chart/ai-section`, plus saved-chart history via `/api/community/nativity-chart/history`. This is NOT the admin toolkit. Task 02 replaces this page with `HoroscopeToolkitPage`; the old JSX/state should be commented out, not deleted.
- `src/app/community/family/[id]/page.tsx` (client page, 683 lines). The "Natal Chart Wheel" `Card` + Ascendant/MC cards + Planet Placements grid (lines ~559-680) and the `generateChart()` call against `/api/community/generate-natal` form the temporary chart block. The profile/birth-details cards and invite status above can stay — they are not chart renderers. Task 03 replaces only the chart block with the shared toolkit.
- `src/components/community/natal-wheel.tsx` (228 lines). Lightweight in-repo SVG wheel used only by the family page above. Once Task 03 lands it is no longer rendered, but keep the file and its import commented rather than deleted until legacy review.

No other community route renders `NatalWheel` — safe to retire after Tasks 02/03.

### 6. Summary table

| Item | Value |
|---|---|
| Shared component | `HoroscopeToolkitPage` from `@/app/admin/horoscope/page` |
| Prefill helper | `buildToolkitPrefillForm` from `@/lib/horoscope-toolkit-prefill` |
| Nativity tab slug | `western_horoscope_v2` |
| Admin compute endpoint 1 | `POST /api/admin/astro/compute` `{ endpoint: "western_horoscope" }` |
| Admin compute endpoint 2 | `POST /api/admin/astro/compute` `{ endpoint: "natal_wheel_chart" }` |
| Admin wheel endpoint | `POST /api/admin/astro/natal-wheel` |
| Not used by natal | `POST /api/admin/astro/planet-return` (monthly/weekly transit only) |
| Reference reuse page | `src/app/community/charts/detailed/page.tsx` |
| Legacy block for Task 03 | `NatalWheel` + Planet Placements block in `family/[id]/page.tsx`, entire `community/horoscope/page.tsx`, and `components/community/natal-wheel.tsx` |

No code behavior was changed by this audit.
