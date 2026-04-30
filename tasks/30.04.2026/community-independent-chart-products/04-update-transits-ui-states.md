# Task 04 - Update Transits UI States

- Status: Planned
- Priority: P0
- Area: UI / Monthly Transits
- Route: `/community/transits`

---

## Goal

Show the correct community product states now that monthly transits are independent from natal chart generation.

## Required UI States

Complete birth data + no natal chart + no transit row:

```txt
Generate Natal Chart
Generate Transit Report
```

Complete birth data + natal chart exists + no transit row:

```txt
View Natal Chart
Generate Transit Report
```

Complete birth data + saved transit report:

```txt
Generate/View Natal Chart based on natal state
View Transit Report
```

Incomplete birth data:

```txt
Complete Birth Details
```

## Implementation Notes

- Do not hide incomplete members completely.
- Keep the existing monthly saved-report lifecycle and CTA labels.
- Natal CTA is secondary and independent.
- Transit CTA is product-specific and must not depend on natal status.

## Acceptance Criteria

- [ ] `/community/transits` member count reflects all visible transit-workflow members, not only generated-natal members.
- [ ] Incomplete members show clear action to edit birth details.
- [ ] Members without natal charts can still access the transit product path when birth data is complete.
- [ ] Existing saved monthly reports still display `View Transit Report`.
