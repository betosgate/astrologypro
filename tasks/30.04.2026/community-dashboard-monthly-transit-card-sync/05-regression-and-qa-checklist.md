# 05 - Regression And QA Checklist

- Status: Planned
- Priority: P0
- Area: QA / Community Dashboard Monthly Transit

---

## Scenarios

- [ ] Household has 4 members, 2 current-month generated transits, 2 missing summaries.
- [ ] Dashboard Monthly Transit shows the 2 generated/current rows.
- [ ] `/community/transits` still shows all eligible members.
- [ ] Dashboard CTA for each transit opens the correct selected member:

```txt
/community/transits/detailed?familyMemberId=<id>&month=YYYY-MM
```

- [ ] Existing Natal Charts carousel still shows generated natal charts.
- [ ] Dashboard does not require a natal chart before showing a member's transit state.
- [ ] A member with complete birth data but no full report shows `Generate Transit Report`.
- [ ] A member with `full_report_id` shows `View Transit Report`.
- [ ] A member with `full_report_status='failed'` shows retry language.
- [ ] No current-month transits renders the existing empty/check-transits state.
- [ ] API 401/403 still fails safely for unauthenticated/inactive users.
- [ ] One invalid transit row does not produce global `Could not load chart data` if other valid rows exist.
