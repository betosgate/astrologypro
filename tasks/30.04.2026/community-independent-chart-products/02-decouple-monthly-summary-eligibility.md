# Task 02 - Decouple Monthly Summary Eligibility

- Status: Planned
- Priority: P0
- Area: Monthly Transits / Eligibility
- Routes: `/community/transits`

---

## Goal

Make monthly transit summary eligibility depend on complete birth data, not on saved natal chart generation.

## Required Behavior

Eligible for monthly transit workflow:

```txt
date_of_birth present
birth_time present
birth_city present
birth_country present
birth_lat finite
birth_lng finite
```

Not eligible for generation, but still visible:

```txt
missing one or more required birth fields
```

## Implementation Notes

- Replace checks like:

```txt
natal_status === "generated"
natal_chart != null
isValidNatalChart(natal_chart)
```

with a shared birth-data readiness check for monthly transit eligibility.

- Keep `isValidMonthlyTransit(row.transit_data, currentMonth)` for validating existing saved monthly rows.
- Keep natal chart CTA logic, but do not use it to decide whether a transit card/member appears.

## Acceptance Criteria

- [ ] Members with complete birth data appear in `/community/transits` even if `natal_chart` is null.
- [ ] Members with incomplete birth data are not silently hidden.
- [ ] The lazy catch-up path counts complete-birth-data members, not generated-natal members.
- [ ] Existing valid monthly rows still render normally.
