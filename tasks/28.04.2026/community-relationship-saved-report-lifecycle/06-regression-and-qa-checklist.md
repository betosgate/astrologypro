# Task 06 - Regression And QA Checklist

- Status: Planned
- Priority: P0
- Area: QA / Relationship Saved Reports

---

## Relationship Type QA

- [ ] Romantic report generates, saves, links, and views from DB.
- [ ] Friendship report generates, saves, links, and views from DB.
- [ ] Partnership/business report generates, saves, links, and views from DB.
- [ ] Same pair supports separate saved reports by type.
- [ ] Regenerate one type does not overwrite another type.

## No-Live-Call QA

On saved View:

- [ ] No synastry compute call.
- [ ] No composite compute call.
- [ ] No natal wheel/chart compute calls.
- [ ] No base AI interpretation calls.
- [ ] Only explicit Show More may call live AI, if that feature is intentionally live.

## Ownership / Security QA

- [ ] User cannot open saved report for pair ids outside their household.
- [ ] User cannot save/link report to another household's pair.
- [ ] Inactive membership cannot generate, save, or view protected relationship reports.
- [ ] Mismatched `reportType` and `toolname` is rejected.

## UI QA

- [ ] Missing report opens Generate flow.
- [ ] Existing saved report opens View flow.
- [ ] View renders same data that was originally generated.
- [ ] Regenerate is explicit and visible.
- [ ] If regeneration fails, previous saved report remains viewable.

## Regression QA

- [ ] Admin horoscope relationship tabs still generate normally.
- [ ] Natal chart saved lifecycle remains unchanged.
- [ ] Monthly transit saved lifecycle remains unchanged.
- [ ] Old `relationship_charts` summaries remain usable where currently displayed, but do not count as full saved reports.
