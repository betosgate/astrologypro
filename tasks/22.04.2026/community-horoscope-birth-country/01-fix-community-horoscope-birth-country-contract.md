# Frontend/Backend Task - Fix Community Horoscope Birth Country Contract

- Status: Planned
- Priority: P0
- Area: Perennial / Community Profile / Community Horoscope
- Page Route: `/community/horoscope`
- Profile Route: `/community/profile`
- Resolver: `src/lib/community/birth-data-resolver.ts`
- Profile Form: `src/components/community/profile-form.tsx`

---

## Problem

The `/community/horoscope` page shows:

- `Add your birth details to generate a chart`
- Missing field: `Birth country`

This happens even when the member appears to have already completed the visible birth data fields on `/community/profile`.

The user-facing problem is that the page tells the member to click **Complete Profile**, but the current profile form does not expose or save a Birth Country field. So the user cannot fix the missing field from the destination the UI sends them to.

## Root Cause

The horoscope page, profile page, and birth-data resolver do not share the same birth-country data contract.

### `/community/horoscope`

The horoscope page correctly requires `birthCountry` before rendering the shared Horoscope Toolkit.

Relevant source:

```txt
src/app/community/horoscope/page.tsx
```

Current check:

```ts
if (!resolved.birthCountry) missingForChart.push("birthCountry");
```

### Birth data resolver

Relevant source:

```txt
src/lib/community/birth-data-resolver.ts
```

Problems:

- The `community_members` fallback selects `full_name, date_of_birth, birth_time, birth_city`.
- It does not select `birth_country`.
- It returns `birthCountry: null` for the `member_profile` source.
- `computeMissing()` does not currently include `birthCountry`, even though `/community/horoscope` requires it.

This means users whose birth data source is `community_members` can still be treated as missing Birth Country even if the database column has a value.

### `/community/profile`

Relevant source:

```txt
src/app/community/profile/page.tsx
src/components/community/profile-form.tsx
```

Problems:

- The profile page query does not select `birth_country`.
- `CommunityMember` type does not include `birth_country`.
- The form has `birthCity` state, but no `birthCountry` state.
- The Birth Data section has Date of Birth, Birth Time, and Birth City only.
- The save payload sends `birth_city`, but not `birth_country`.

### Save API already supports birth country

Relevant source:

```txt
src/app/api/community/onboarding/complete/route.ts
```

The API already reads and writes `birth_country` if the frontend sends it:

```ts
birth_country: trimStr(birth_country)
```

So the primary issue is frontend/resolver contract mismatch, not missing API support.

## Required Fix

### 1. Verify active database schema

Confirm the active database has:

```sql
community_members.birth_country
```

Local migration exists:

```txt
supabase/migrations/20260413000198_add_birth_country_to_community_members.sql
```

Do not remove the birth-country requirement from `/community/horoscope` as a workaround.

### 2. Load birth country on `/community/profile`

Update:

```txt
src/app/community/profile/page.tsx
```

Add `birth_country` to the `community_members` select list.

### 3. Add birth country to `CommunityProfileForm`

Update:

```txt
src/components/community/profile-form.tsx
```

Required changes:

- Add `birth_country: string | null` to the `CommunityMember` interface.
- Add `birthCountry` state initialized from `member.birth_country`.
- Add a Birth Country input/control in the Birth Data section.
- Include `birth_country: birthCountry.trim() || null` in the profile save payload.
- Keep existing Birth City behavior intact.

Recommended UX:

- Keep `BirthCityAutocomplete` for city.
- Add a dedicated Birth Country field next to Birth City.
- If a selected city label includes a clear final country segment, use it to prefill Birth Country only when the country field is currently empty.
- Still let the user manually edit Birth Country.

### 4. Update birth-data resolver

Update:

```txt
src/lib/community/birth-data-resolver.ts
```

Required changes:

- Include `birthCountry` in `emptyResult().missing`.
- Include `birthCountry` in `computeMissing()`.
- Select `birth_country` in the `community_members` fallback.
- Return `birthCountry: member.birth_country`.
- Update resolver comments so they do not imply birth city alone is the full location record.

### 5. Check source priority edge case

The resolver priority is:

1. `community_family_members` self-row
2. past booking client row
3. `community_members` profile

If a stale family self-row exists with date/time/city/coordinates but `birth_country = null`, `/community/horoscope` may still stop at that row and show missing Birth Country before it reaches `community_members`.

Handle this carefully:

- Do not overwrite existing family data with null.
- If implementing a fallback merge, only fill missing country from `community_members.birth_country` when the self-row country is empty.
- Document the chosen behavior in code or task notes.

## Files To Inspect

- `src/app/community/horoscope/page.tsx`
- `src/lib/community/birth-data-resolver.ts`
- `src/app/community/profile/page.tsx`
- `src/components/community/profile-form.tsx`
- `src/components/community/birth-city-autocomplete.tsx`
- `src/app/api/community/onboarding/complete/route.ts`
- `src/app/api/community/onboarding/prefill/route.ts`
- `src/app/community/onboarding/page.tsx`
- `src/app/community/family/page.tsx`
- `src/app/community/family/new/page.tsx`
- `src/app/community/family/[id]/edit/page.tsx`

## Constraints

- Scope this task to the Community / Perennial profile and horoscope birth-country contract.
- Do not remove `birthCountry` validation from `/community/horoscope`.
- Do not change the astrology calculation API.
- Do not make destructive schema changes.
- Do not refactor the whole profile form.
- Do not regress existing family member birth-country create/edit flows.
- Do not make Mystery School behavior part of this task unless the same shared component is directly affected.

## Acceptance Criteria

- [ ] Active DB has `community_members.birth_country`.
- [ ] `/community/profile` selects `birth_country`.
- [ ] `CommunityProfileForm` displays Birth Country.
- [ ] Profile save sends `birth_country`.
- [ ] Existing API persists `birth_country` to `community_members`.
- [ ] `resolveUserBirthData()` returns `birthCountry` from `community_members.birth_country`.
- [ ] Missing-data logic includes `birthCountry` consistently.
- [ ] A user with complete date, time, city, country, and coordinates no longer sees missing `Birth country` on `/community/horoscope`.
- [ ] Existing family birth-country forms still work.

## QA Checklist

- [ ] Log in as an active Perennial Mandalism member.
- [ ] Navigate to `/community/profile`.
- [ ] Confirm Birth Country appears in the Birth Data section.
- [ ] Set Date of Birth, Birth Time, Birth City, and Birth Country.
- [ ] Save the profile.
- [ ] Refresh `/community/profile` and confirm Birth Country persists.
- [ ] Open `/api/community/me/birth-data` in the same session.
- [ ] Confirm the response includes non-empty `birthCountry`.
- [ ] Navigate to `/community/horoscope`.
- [ ] Confirm the missing `Birth country` card no longer appears when all required chart data is present.
- [ ] Test a user with Birth Country cleared and confirm `/community/horoscope` still names `Birth country` as missing.
- [ ] Test family member add/edit birth-country flow to confirm no regression.

## Notes For Junior Developer

- The visible card is not the bug by itself. It is showing what the current data resolver returns.
- Do not “fix” this by hiding Birth Country from the missing list.
- The API already accepts `birth_country`; the profile form simply does not send it.
- The resolver must read the same field that the profile form saves.
- Watch for the self-row priority edge case: a stale `community_family_members` self-row can override complete `community_members` data.
