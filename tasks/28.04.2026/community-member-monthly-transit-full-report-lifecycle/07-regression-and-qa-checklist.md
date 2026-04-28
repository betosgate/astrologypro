# Task 07 - Regression And QA Checklist

- Status: Planned
- Priority: P0
- Area: QA / Monthly Transits

---

## List Page QA

- [ ] `/community/transits` shows current-month cards for eligible members.
- [ ] Each member card has a member-specific full-report CTA.
- [ ] Global `Open Full Monthly Report` CTA is removed or not primary.
- [ ] Member CTA includes correct `familyMemberId` and month.
- [ ] Lightweight summary data still renders from `monthly_transits.transit_data`.

## Detailed Page QA

- [ ] Opening member A pre-fills member A birth data.
- [ ] Opening member B pre-fills member B birth data.
- [ ] Birth fields are disabled/read-only.
- [ ] Missing birth data shows a blocking missing-data card.
- [ ] Foreign household ids cannot open a report.

## Save/View QA

- [ ] First full report generation saves `tropical_transits_monthly_v3` to `astro_ai_responses`.
- [ ] `monthly_transits.full_report_id` is populated.
- [ ] Reopening the same member/month loads saved full report.
- [ ] Saved View does not call live compute APIs.
- [ ] Saved View does not call AI interpretation APIs.
- [ ] Regenerate explicitly refreshes only selected member/month.

## Monthly Business Logic QA

- [ ] First-of-month automatic summary generation still works.
- [ ] Mid-month subscriber catch-up still creates current-month summary.
- [ ] Newly eligible family member mid-month gets current-month summary.
- [ ] Previous month report does not appear as current report.
- [ ] Current-month identity is `family_member_id + YYYY-MM`.

## Regression QA

- [ ] Natal saved chart lifecycle remains unchanged.
- [ ] Relationship saved report lifecycle remains unchanged.
- [ ] Dashboard monthly card still loads current-month transit summary.
- [ ] Admin horoscope toolkit monthly tab remains unchanged outside community saved flow.
- [ ] Any dummy/demo monthly chart/report path that does not call the legitimate production external API/toolkit flow is commented out or removed from active production flow.
- [ ] Monthly full reports use the same save/fetch artifact APIs/foundation as natal saved reports.
