# Master Task - Perennial Post-Login Birth Location Field + Autocomplete (Planning Only) - 2026-04-09

- Status: Planned
- Priority: P0
- Owner: Frontend + API
- Scope: add `birth_location` to post-login completion forms, autocomplete integration, payload mapping, validation, QA
- Task File: `tasks/perennial/2026-04-09/13-master-task-signup-birth-location-autocomplete-2026-04-09.md`

## Objective

Define the implementation plan to add `birth_location` input on the Perennial post-login completion form and make it autocomplete-based.

## Requirements

1. Field must exist in the post-login completion form (Single/Couple/Family members where birth data is completed).
2. Field must use autocomplete suggestions, not free-text only.
3. Selected option must persist:
   - `birth_location_label`
   - `birth_lat`
   - `birth_lng`
   - `birth_tzone`
4. Validate selection before allowing completion-form save/progression.

## API Contract

- Endpoint: `https://astrologypro.com/api/admin/astro/city-search`
- Method: `POST`
- Request:
```json
{ "q": "kolk" }
```
- Response map:
1. `results[].label`
2. `results[].lat`
3. `results[].lng`
4. `results[].timezone.offset_string`

## Child Tasks

1. `13.1-signup-birth-location-ui-and-autocomplete-behavior-2026-04-09.md`
2. `13.2-signup-validation-and-payload-contract-birth-location-2026-04-09.md`
3. `13.3-backend-checkout-validation-for-birth-location-2026-04-09.md`
4. `13.4-acceptance-qa-checklist-birth-location-signup-2026-04-09.md`

## Done Definition

1. Birth location appears in the post-login completion form.
2. Autocomplete selection required.
3. Payload stores label/lat/lng/timezone.
4. Backend rejects invalid or missing location payload.
