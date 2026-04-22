# Task 03 - Render Family Member Natal Chart With Shared Horoscope Toolkit

- Status: Planned
- Priority: P0
- Area: Frontend / Community Family / Natal Chart Rendering
- Primary Page: `/community/family/[id]`
- Files:
  - `src/app/community/family/[id]/page.tsx`
  - `src/components/community/natal-wheel.tsx`
  - `src/app/admin/horoscope/page.tsx`
  - `src/lib/horoscope-toolkit-prefill.ts`
  - `src/lib/supabase/server.ts`
  - `src/lib/supabase/admin.ts`
- Related Endpoint:
  - `POST /api/community/generate-natal`
- Related Admin APIs:
  - `POST /api/admin/astro/compute`
  - `POST /api/admin/astro/natal-wheel`

---

## Problem

The family member detail page currently renders a temporary custom natal chart view when a chart exists.

Observed UI includes:

- `Natal Chart Wheel`
- custom `NatalWheel`
- Rising Sign card
- Midheaven card
- planet/aspect summary blocks

This should be replaced with the same shared Horoscope Toolkit rendering used by the admin Horoscope Toolkit.

## Required Implementation

### 1. Keep Existing Ownership Checks

The page must still verify:

- user is authenticated
- user has active community membership
- requested family member belongs to the logged-in member

Do not weaken ownership or leak another user's family member data.

### 2. Build Toolkit Prefill For Selected Family Member

Load the selected family member fields:

- `full_name`
- `date_of_birth`
- `birth_time`
- `birth_city`
- `birth_country`
- `birth_lat`
- `birth_lng`

Build:

```ts
const prefill = await buildToolkitPrefillForm({
  person1: {
    fullName: familyMember.full_name,
    dateOfBirth: familyMember.date_of_birth,
    birthTime: familyMember.birth_time,
    birthCity: familyMember.birth_city,
    birthCountry: familyMember.birth_country,
    birthLat: familyMember.birth_lat,
    birthLng: familyMember.birth_lng,
  },
});
```

Render:

```tsx
<HoroscopeToolkitPage
  basePath={`/community/family/${familyMember.id}`}
  allowedSlugs={["western_horoscope_v2"]}
  initialPrefill={encodeURIComponent(JSON.stringify(prefill))}
/>
```

### 3. Preserve Old Temporary UI As Commented Legacy Code

Do not delete the existing custom natal chart JSX/code block.

Comment it out with a clear note similar to:

```tsx
{/* LEGACY TEMPORARY NATAL CHART UI
    Kept for reference while replacing this page with the shared HoroscopeToolkitPage renderer.
    Do not delete until toolkit-based community natal rendering is fully accepted.
*/}
```

This requirement is important. The old code should remain visible in the file for review/rollback context during this task.

### 4. Missing Birth Data Behavior

If the family member is missing required birth fields, do not show the shared toolkit as chart-ready.

Required chart-ready fields:

- `date_of_birth`
- `birth_city`
- `birth_country`
- finite `birth_lat`
- finite `birth_lng`
- `birth_time` if the toolkit requires time

Show a clear message and link to:

```txt
/community/family/[id]/edit
```

### 5. Generate Chart Button Compatibility

The existing `POST /api/community/generate-natal` endpoint may still be useful for saving natal chart data into `community_family_members`.

This task is about rendering through the shared toolkit. Do not remove generation lifecycle behavior unless a separate task says so.

If both saved chart generation and toolkit rendering remain on the page, make the UX clear:

- missing saved chart can still offer Generate Chart if birth data is complete
- shared toolkit rendering should not claim chart-ready if coordinates are missing

## Constraints

- Do not delete old temporary family chart UI; comment it out.
- Do not change chart-generation business logic.
- Do not change database migrations.
- Do not weaken RLS or ownership checks.
- Do not expose non-natal toolkit tabs for family member detail in this task.
- Do not change relationship detailed chart behavior.

## Acceptance Criteria

- [ ] `/community/family/[id]` uses `HoroscopeToolkitPage` for natal chart rendering.
- [ ] Only `western_horoscope_v2` is available for the family member toolkit view.
- [ ] Toolkit form is prefilled from that family member's saved birth data.
- [ ] Existing ownership checks still protect the route.
- [ ] Missing birth coordinates show a clear edit-details path.
- [ ] Old temporary natal chart UI code is commented out with a clear legacy note.
- [ ] Existing Generate Chart lifecycle is not broken.
- [ ] Existing relationship detailed toolkit route still works.

## QA Checklist

- [ ] Log in as an active Perennial community member.
- [ ] Open a family member with complete birth data.
- [ ] Confirm `/community/family/[id]` renders the shared toolkit Nativity Birth Chart view.
- [ ] Confirm the toolkit form is prefilled with the selected family member's data.
- [ ] Generate/render the chart and confirm admin toolkit API calls occur.
- [ ] Open a family member missing lat/lng and confirm the page links to Edit Details instead of showing a false chart-ready state.
- [ ] Try another account's family member ID and confirm access is denied or redirected safely.
- [ ] Confirm old temporary chart UI is present as commented legacy code in the file.

## Notes For Junior Developer

The family detail page may currently be a client component. If server-side data loading is needed for `buildToolkitPrefillForm`, follow the server-component wrapper pattern from `src/app/community/charts/detailed/page.tsx`.

Keep the edit small and readable. The goal is reuse, not a new chart renderer.

For Codex / AI agents: complete only the family member detail route in this task. Do not also modify dashboard chart cards here; that belongs to Task 04.
