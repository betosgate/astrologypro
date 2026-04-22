# Admin Horoscope Tab Input Requirements

This note documents all input details needed by the `/admin/horoscope` route.

Primary source files:

- `src/app/admin/horoscope/page.tsx`
- `src/app/admin/horoscope/types.ts`
- `src/app/admin/horoscope/utils.ts`
- `src/app/admin/horoscope/session/[bookingId]/page.tsx`

## Shared Form Shape

The toolkit uses this shared form structure:

```ts
interface FormState {
  person1: BirthInput;
  person2: BirthInput;
  areaOfInquiry: string;
  question: string;
  futureWeek: string;
  futureMonth: string;
}

interface BirthInput {
  dob: string;
  tob: string;
  city: CityOption | null;
}

interface CityOption {
  label: string;
  lat: number;
  lng: number;
  timezone: {
    name: string;
    offset_string: string;
    utcOffset: string;
  };
}
```

## Common Input Rules

### Single-person tabs

Required:

- `person1.dob`
- `person1.tob`
- `person1.city`

### Two-person tabs

Required:

- `person1.dob`
- `person1.tob`
- `person1.city`
- `person2.dob`
- `person2.tob`
- `person2.city`

### Additional validation

- If a tab includes `question`, `form.question` is required.
- `areaOfInquiry` is optional everywhere it appears.
- `futureWeek` is optional.
- `futureMonth` is optional.

## Shared Birth Data Details

Each person block needs:

- date of birth
- time of birth
- city selected from autocomplete

The selected city must resolve to:

- display label
- latitude
- longitude
- timezone metadata

This matters because `parseBirth()` converts the UI input into:

- `day`
- `month`
- `year`
- `hour`
- `min`
- `lat`
- `lon`
- `tzone`

## Tab-by-Tab Requirements

### 1. Nativity Birth Chart

- Tab slug: `western_horoscope_v2`
- Type: `single`
- Required inputs:
  - `person1.dob`
  - `person1.tob`
  - `person1.city`
- Optional extras:
  - `areaOfInquiry`

### 2. Solar Return

- Tab slug: `solar_return_v2`
- Type: `single`
- Required inputs:
  - `person1.dob`
  - `person1.tob`
  - `person1.city`
- Optional extras:
  - `areaOfInquiry`

### 3. Weekly Transits

- Tab slug: `tropical_transits_weekly_v2`
- Type: `single`
- Required inputs:
  - `person1.dob`
  - `person1.tob`
  - `person1.city`
- Optional extras:
  - `futureWeek`
  - `areaOfInquiry`

### 4. Monthly Transits + Lunar Return

- Tab slug: `tropical_transits_monthly_v3`
- Type: `single`
- Required inputs:
  - `person1.dob`
  - `person1.tob`
  - `person1.city`
- Optional extras:
  - `futureMonth`
  - `areaOfInquiry`

### 5. Romantic Relationships

- Tab slug: `romantic_forecast_report_tropical_v2`
- Type: `two-person`
- Required inputs:
  - `person1.dob`
  - `person1.tob`
  - `person1.city`
  - `person2.dob`
  - `person2.tob`
  - `person2.city`
- Optional extras:
  - `areaOfInquiry`

### 6. Friendship Relationships

- Tab slug: `friendship_report_tropical_v2`
- Type: `two-person`
- Required inputs:
  - `person1.dob`
  - `person1.tob`
  - `person1.city`
  - `person2.dob`
  - `person2.tob`
  - `person2.city`
- Optional extras:
  - `areaOfInquiry`

### 7. Business Relationship

- Tab slug: `business_partner_v2`
- Type: `two-person`
- Required inputs:
  - `person1.dob`
  - `person1.tob`
  - `person1.city`
  - `person2.dob`
  - `person2.tob`
  - `person2.city`
- Optional extras:
  - `areaOfInquiry`

### 8. Predictive Event (Horary)

- Tab slug: `horary_chart_v2`
- Type: `single`
- Required inputs:
  - `person1.dob`
  - `person1.tob`
  - `person1.city`
  - `question`
- Optional extras:
  - none beyond the normal birth block

### 9. Jupiter Return

- Tab slug: `jupiter_return_v2`
- Type: `single`
- Required inputs:
  - `person1.dob`
  - `person1.tob`
  - `person1.city`
- Optional extras:
  - `areaOfInquiry`

### 10. Saturn Return

- Tab slug: `saturn_return_v2`
- Type: `single`
- Required inputs:
  - `person1.dob`
  - `person1.tob`
  - `person1.city`
- Optional extras:
  - `areaOfInquiry`

### 11. Mars Return

- Tab slug: `mars_return_v2`
- Type: `single`
- Required inputs:
  - `person1.dob`
  - `person1.tob`
  - `person1.city`
- Optional extras:
  - `areaOfInquiry`

### 12. Uranus Opposition

- Tab slug: `uranus_return_v2`
- Type: `single`
- Required inputs:
  - `person1.dob`
  - `person1.tob`
  - `person1.city`
- Optional extras:
  - `areaOfInquiry`

## What Each Extra Means

### `areaOfInquiry`

Used by:

- `western_horoscope_v2`
- `solar_return_v2`
- `tropical_transits_weekly_v2`
- `tropical_transits_monthly_v3`
- `romantic_forecast_report_tropical_v2`
- `friendship_report_tropical_v2`
- `business_partner_v2`
- `jupiter_return_v2`
- `saturn_return_v2`
- `mars_return_v2`
- `uranus_return_v2`

Purpose:

- optional context for AI interpretation
- examples:
  - career
  - love
  - purpose
  - timing
  - relationship clarity

### `futureWeek`

Used by:

- `tropical_transits_weekly_v2`

Purpose:

- optionally generate a weekly transit report for a selected future week
- if blank, current week is used

### `futureMonth`

Used by:

- `tropical_transits_monthly_v3`

Purpose:

- optionally generate monthly transit data for a selected future month
- if blank, current month is used

### `question`

Used by:

- `horary_chart_v2`

Purpose:

- required user question for horary analysis

## Booking Prefill Contract

The booking-scoped route:

- `src/app/admin/horoscope/session/[bookingId]/page.tsx`

builds a `FormState`-shaped prefill and redirects to:

- `/admin/horoscope?tab=<slug>&prefill=<encoded-json>`

### Prefill values sent

- `person1`
  - client birth data
- `person2`
  - partner birth data when the selected service needs a second person
- `areaOfInquiry`
  - empty string by default
- `question`
  - empty string by default
- `futureWeek`
  - empty string by default
- `futureMonth`
  - empty string by default

### Client birth data resolution order

For `person1`, the session route prefers:

1. `clients` table birth data
2. fallback `questionnaire_responses`

### Partner birth data

For two-person astrology services, `person2` is built from:

- `booking.partner_birth_data`

### Special fallback for missing birth time

If time of birth is missing in booking-prefill flow:

- fallback is `12:00`

This is used so the horoscope page can still render a usable chart.

## Implementation Summary

If building UI, API, docs, or task breakdowns for `/admin/horoscope`, the minimum required model is:

- every tab needs a valid `person1`
- two-person tabs also need a valid `person2`
- horary additionally requires `question`
- transits may optionally use future date selectors
- most tabs optionally use `areaOfInquiry`
