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
