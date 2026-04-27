# Task 10 - Regression And QA Checklist

- Status: Planned
- Priority: P0
- Area: QA / Community Saved Chart Reports

---

## Natal QA

- [ ] Family member with no saved chart shows Generate Chart.
- [ ] Generate saves full `western_horoscope_v2` report.
- [ ] Generate links saved report to family member.
- [ ] Family list changes to View Chart after save.
- [ ] View Chart loads saved DB report without re-generation.
- [ ] Viewed report matches generated report.
- [ ] Regenerate updates saved report and timestamps.
- [ ] Existing valid legacy `natal_chart` rows remain viewable.
- [ ] Dummy/invalid `natal_chart` rows do not unlock View.

## Monthly QA

- [ ] No saved monthly full report shows Generate/Open flow appropriately.
- [ ] Full monthly report saves to `astro_ai_responses`.
- [ ] Saved full monthly report is linked to month/context.
- [ ] Reopening View does not call external compute/AI APIs.
- [ ] Regenerate refreshes the monthly full report.
- [ ] Lightweight `monthly_transits` summary remains separate.
- [ ] Mid-month subscriber catch-up summary still works.

## Relationship QA

- [ ] Friendship report saves and views correctly.
- [ ] Romantic/love report saves and views correctly.
- [ ] Partnership/business report saves and views correctly.
- [ ] Same pair can have separate saved reports by type.
- [ ] Regenerate one type does not overwrite another type.
- [ ] Natal update invalidates affected pair/type reports.
- [ ] Dummy/invalid relationship rows do not unlock View.

## Security QA

- [ ] Cross-household family member ids cannot fetch reports.
- [ ] Inactive members cannot generate or view protected reports.
- [ ] Saved report fetch respects ownership/share rules.
- [ ] Domain record links cannot be overwritten by another user.
- [ ] RLS remains intact.

## Performance QA

- [ ] Saved View does not call expensive astrology compute APIs.
- [ ] Saved View does not call AI interpretation APIs.
- [ ] Generate still shows progress.
- [ ] Large saved reports render acceptably.

## UX QA

- [ ] CTA states are clear: Generate, View, Regenerate, Retry, Generating, Locked.
- [ ] Vinnie-style case is fixed.
- [ ] Users cannot confuse live toolkit generation with saved chart completion.
- [ ] Error states are actionable.
