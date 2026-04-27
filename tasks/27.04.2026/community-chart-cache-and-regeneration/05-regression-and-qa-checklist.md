# Task 05 - Regression And QA Checklist

- Status: Planned
- Priority: P1
- Area: Perennial / Community / QA

---

## Natal Cache QA

- [ ] Generate a self natal chart.
- [ ] Record `community_family_members.chart_updated_at`.
- [ ] Call `POST /api/community/me/generate-chart` with `{ "type": "natal" }`.
- [ ] Confirm the response returns the existing chart.
- [ ] Confirm `chart_updated_at` does not change.
- [ ] Force regeneration only through an explicit force path or changed birth data.

## Monthly Transit QA

- [ ] Ensure a family member has `natal_status = "generated"` and `natal_chart IS NOT NULL`.
- [ ] Generate or seed this month's `monthly_transits` row.
- [ ] Open `/community`.
- [ ] Confirm the monthly transit card shows ready state.
- [ ] Confirm the dashboard API reads by `family_member_id`.
- [ ] Confirm no natal regeneration occurs just to show monthly transit data.

## Single Relationship Chart QA

- [ ] Generate natal charts for two family members.
- [ ] Generate a relationship chart for the pair.
- [ ] Call the same pair endpoint again.
- [ ] Confirm response has `source: "cached"`.
- [ ] Confirm `relationship_charts.generated_at` does not change.

## Relationship Invalidation QA

- [ ] Regenerate one member's natal chart through the governed natal route.
- [ ] Confirm related `relationship_charts.invalidated_at` is set.
- [ ] Run relationship generation again.
- [ ] Confirm invalidated chart regenerates.
- [ ] Confirm `invalidated_at` is cleared after regeneration.

## Batch Relationship QA

- [ ] Run batch generation for a household with multiple generated natal charts.
- [ ] Confirm existing current pairs are skipped.
- [ ] Confirm missing pairs are generated.
- [ ] Confirm invalidated pairs are regenerated.
- [ ] Confirm response counts are accurate.

## Safety QA

- [ ] Cross-household family member ids do not leak data.
- [ ] Inactive community members cannot generate charts.
- [ ] Locked natal profiles remain locked.
- [ ] Missing birth data returns actionable validation errors.
- [ ] Existing RLS and service-role boundaries are not weakened.

## Legacy/Dummy Data QA

- [ ] Seed or identify a `community_family_members.natal_chart` row with old/dummy JSON shape.
- [ ] Confirm cached natal read does not show that row as valid current chart data.
- [ ] Confirm the row is regenerated through the current chart generator or marked stale/failed with a clear status.
- [ ] Seed or identify a `relationship_charts.chart_data` row with old/dummy JSON shape.
- [ ] Confirm relationship chart read regenerates instead of returning the old payload.
- [ ] Confirm monthly transit generation does not build from an invalid legacy natal chart.
