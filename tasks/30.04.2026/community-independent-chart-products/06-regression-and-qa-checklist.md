# Task 06 - Regression And QA Checklist

- Status: Planned
- Priority: P0
- Area: QA / Community Chart Products

---

## Monthly Transits

- [ ] Member with complete birth data and no natal chart appears in `/community/transits`.
- [ ] Member with complete birth data and no natal chart can generate/open monthly transit report.
- [ ] Member with complete birth data and saved natal chart still works unchanged.
- [ ] Member with incomplete birth data appears with `Complete Birth Details`.
- [ ] Existing valid monthly summary rows still render.
- [ ] Existing saved monthly full reports still hydrate without regeneration.
- [ ] Explicit Regenerate still works for monthly full reports.

## Natal CTA Independence

- [ ] Natal CTA shows `Generate Natal Chart` when natal chart is missing.
- [ ] Natal CTA shows `View Natal Chart` when natal chart exists.
- [ ] Natal CTA does not decide whether transit product appears.

## Relationship Reports

- [ ] Relationship detailed report can open for two members with complete birth data.
- [ ] Saved relationship report still hydrates without compute / AI calls.
- [ ] Incomplete birth data blocks generation with a clear correction path.
- [ ] Pair visibility is not tied to generated natal chart product state.

## Security / Ownership

- [ ] Cross-household family member ids cannot generate, save, link, or view reports.
- [ ] Community product pages do not call admin-only APIs.
- [ ] Admin Horoscope Toolkit behavior remains unchanged.

## Data Integrity

- [ ] Monthly transit generation does not create or overwrite natal chart products.
- [ ] Monthly summary output remains compatible with `isValidMonthlyTransit(...)`.
- [ ] Saved report link fields continue to update only after successful save.
