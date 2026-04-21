# Frontend Task - Family Birth Location Form Contract

- Status: Implemented locally - pending backend 03A for persistence
- Priority: P0
- Area: Frontend / Community Family / Birth Location
- Files:
  - `src/app/community/family/new/page.tsx`
  - `src/app/community/family/[id]/edit/page.tsx`
  - `src/app/community/family/page.tsx`
  - `src/components/community/birth-city-autocomplete.tsx`
- Related Endpoint: `POST /api/community/family`
- Related Endpoint: `PATCH /api/community/family/[id]`
- Depends On: `03a-backend-family-birth-location-save-contract.md`

---

## Problem

The UI can show a complete location label such as:

```txt
Miami, FL, United States of America
```

but still submit `birthCountry` as empty/null.

That creates rows like:

```json
{
  "birth_city": "Miami, FL, United States of America",
  "birth_country": null
}
```

The detail page then shows `Missing: Birth country` even though the visible city string includes a country.

## Required Frontend Fix

### 1. Submit Structured Location Fields

When adding or editing a family member, the form must submit:

- `birthCity`
- `birthCountry`
- `birthLat`
- `birthLng`

### 2. Use Autocomplete Selection Correctly

When a user selects a city autocomplete option, store all available structured values:

- display label / city value
- latitude
- longitude
- timezone if needed
- country if the component can provide it

If the autocomplete API only provides a label, implement a conservative country extraction strategy or require the separate Birth Country select/input to be filled.

The country extraction must not use a narrow hardcoded country alias map. Any country returned by the autocomplete provider should remain supported.

Manual city typing will not reliably infer country; in that case the UI must keep Birth Country visibly editable and clearly show when it is missing.

### 3. Prevent Silent Incomplete Submit

If the selected location does not populate `birthCountry`, the UI should make that missing requirement clear before save.

Do not let the user think a complete location was saved when `birth_country` is still null.

## Acceptance Criteria

- [ ] Add family form submits `birthCountry` when a complete location is selected.
- [ ] Add family form submits `birthLat`.
- [ ] Add family form submits `birthLng`.
- [ ] Edit family form submits updated country/lat/lng when location changes.
- [ ] UI clearly indicates when Birth Country is still missing.
- [ ] No fixed USA/UK-only country alias logic is introduced.
- [ ] Profile completion no longer says `Missing: Birth country` after selecting/saving a complete location.

## QA Checklist

- [ ] Add a family member with `Miami, FL, United States of America`.
- [ ] Confirm request payload includes `birthCountry`, `birthLat`, and `birthLng`.
- [ ] Save and open the member detail page.
- [ ] Confirm Profile Status does not show missing birth country.
- [ ] Edit the member location and save.
- [ ] Confirm updated request payload includes the new structured location fields.

## Important Constraints

- Do not change backend persistence in this task except if required to match Task 03A.
- Do not repair historical data in this task.
- Do not hide the Birth Country requirement by removing it from completion logic.
