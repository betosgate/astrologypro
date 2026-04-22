# Task 02 - Render Self Natal Chart With Shared Horoscope Toolkit

- Status: Planned
- Priority: P0
- Area: Frontend / Community / Horoscope
- Primary Page: `/community/horoscope`
- Files:
  - `src/app/community/horoscope/page.tsx`
  - `src/app/admin/horoscope/page.tsx`
  - `src/lib/horoscope-toolkit-prefill.ts`
  - `src/lib/supabase/server.ts`
  - `src/lib/supabase/admin.ts`
- Related APIs:
  - `POST /api/admin/astro/compute`
  - `POST /api/admin/astro/natal-wheel`

---

## Problem

`/community/horoscope` currently has a separate custom natal chart implementation instead of rendering the shared admin Horoscope Toolkit component.

The user expectation is:

- Community members should see their own natal chart using the same rich toolkit renderer as admin.
- The form should already be populated from their saved birth data.
- The community route should only expose the Nativity Birth Chart tab unless another task expands the scope.

## Required Implementation

### 1. Use Shared Toolkit Component

Render:

```tsx
<HoroscopeToolkitPage
  basePath="/community/horoscope"
  allowedSlugs={["western_horoscope_v2"]}
  initialPrefill={encodeURIComponent(JSON.stringify(prefill))}
/>
```

Use the same import pattern as:

```txt
src/app/community/charts/detailed/page.tsx
```

### 2. Load The Logged-In Member

Authenticate the user with the existing server Supabase client.

Then verify:

- user is logged in
- user has a `community_members` row
- membership type/status allows toolkit access according to existing project rules

Do not weaken existing access checks.

### 3. Resolve The Member's Own Birth Data

Find the best source for the logged-in member's own birth details.

Preferred order:

1. Existing self row in `community_family_members` if that is how the project stores the member's natal chart.
2. Existing community member/profile birth fields if they are the canonical source.

The selected source must provide:

- full name
- date of birth
- birth time
- birth city
- birth country
- birth latitude
- birth longitude

If the data source is ambiguous, follow the relationship detailed page pattern where possible and document the choice in the PR.

### 4. Build Prefill Payload

Use:

```ts
buildToolkitPrefillForm({
  person1: {
    fullName,
    dateOfBirth,
    birthTime,
    birthCity,
    birthCountry,
    birthLat,
    birthLng,
  },
})
```

Then pass the encoded JSON as `initialPrefill`.

### 5. Missing Birth Data Behavior

If required birth details are missing, show a clear page state instead of a broken toolkit.

Required fields for chart-ready state:

- date of birth
- birth time if toolkit requires it
- birth city
- birth country
- finite birth latitude
- finite birth longitude

Provide a direct link to the correct profile/family edit route where the user can complete the missing data.

## Constraints

- Do not change the admin Horoscope Toolkit behavior for admin users.
- Do not expose non-natal tabs on `/community/horoscope` in this task.
- Do not create a new chart calculation implementation.
- Do not call old `/api/community/nativity-chart` from the new shared toolkit route.
- Do not remove existing code unless it is replaced in a controlled way and remains available in git history.

## Acceptance Criteria

- [ ] `/community/horoscope` uses `HoroscopeToolkitPage`.
- [ ] Only `western_horoscope_v2` is available on `/community/horoscope`.
- [ ] The toolkit form is prefilled from saved birth data.
- [ ] Submitting/running the toolkit uses the admin toolkit API path.
- [ ] The rich admin-style natal result renders on the community route.
- [ ] Missing birth data shows a clear corrective state.
- [ ] Existing `/admin/horoscope` behavior is unchanged.
- [ ] Existing relationship detailed chart behavior is unchanged.

## QA Checklist

- [ ] Log in as an active Perennial community member with complete birth data.
- [ ] Open `/community/horoscope`.
- [ ] Confirm the toolkit loads with the Nativity Birth Chart tab.
- [ ] Confirm the form is prefilled.
- [ ] Generate/render the chart.
- [ ] Confirm network includes `/api/admin/astro/compute` with `western_horoscope`.
- [ ] Confirm network includes `/api/admin/astro/compute` with `natal_wheel_chart`.
- [ ] Confirm the route does not show relationship, horary, return, or transit tabs.
- [ ] Test a user with missing birth coordinates and confirm a clear missing-data state appears.

## Notes For Junior Developer

The easiest safe reference is `src/app/community/charts/detailed/page.tsx`.

Do not manually recreate the admin result UI. The goal is to reuse `HoroscopeToolkitPage`.

For Codex / AI agents: complete only the `/community/horoscope` self-natal route in this task. After QA, stop and report results before starting the family-member route task.
