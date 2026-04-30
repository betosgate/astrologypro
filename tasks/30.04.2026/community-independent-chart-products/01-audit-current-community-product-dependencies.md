# Task 01 - Audit Current Community Product Dependencies

- Status: Planned
- Priority: P0
- Area: Audit / Community Chart Products
- Routes: `/community/transits`, `/community/charts`, `/community/family`

---

## Goal

Identify every community chart/report flow that still depends on saved natal chart state instead of complete birth data.

## Audit Targets

- `/community/transits`
- `/community/transits/detailed`
- `ensureCurrentMonthTransitsForMember(...)`
- `/community/charts`
- `/community/charts/detailed`
- `/api/community/relationship-charts`
- `/api/community/relationship-charts/batch`
- shared CTA state helpers where product access is derived

## Questions To Answer

- Which flows require `natal_status='generated'`?
- Which flows require `natal_chart != null`?
- Which flows require `isValidNatalChart(...)`?
- Which flows can compute directly from stored birth data like the admin Horoscope Toolkit?
- Which legacy lightweight summary flows truly require saved local chart JSON?

## Acceptance Criteria

- [ ] Every saved-natal dependency is listed with file/path and purpose.
- [ ] Each dependency is classified as:
  - remove now
  - keep only for legacy lightweight summary
  - keep because the compute function truly requires saved local chart data
- [ ] No implementation changes are made in this audit task.
