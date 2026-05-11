# Incomplete Tasks - Community Monthly Transit Summary And Family Chips

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / Monthly Transits
- Routes:
  - `/community`
  - `/community/transits`
  - `/community/transits/detailed`
- Related Files:
  - `src/app/community/page.tsx`
  - `src/app/community/transits/page.tsx`
  - `src/app/community/transits/TransitCardExpander.tsx`
  - `src/app/community/transits/detailed/page.tsx`
  - `src/lib/community/monthly-transit-report-summary.ts`
  - `tests/unit/monthly-transit-report-summary.test.ts`

---

## Context

Recent implementation added report-derived monthly transit summary display without touching chart/report generation logic.

The dashboard family-chip dedupe was also adjusted so same-name spouse/child rows are not hidden as duplicate self rows.

Regenerate CTAs were commented out, not deleted.

## Completed In This Pass

- [x] Added isolated helper to extract summary items from saved monthly report payloads.
- [x] Loaded linked `astro_ai_responses` rows from `monthly_transits.full_report_id`.
- [x] Rendered report-derived summary items in the expanded monthly transit card.
- [x] Fixed header/Snapshot mismatch when report-derived summary items exist.
- [x] Commented out visible Regenerate CTAs on the transit card and detailed report page.
- [x] Fixed dashboard top-card family chip dedupe for same-name non-self family members.
- [x] Added parser unit tests for common monthly AI payload shapes.

## Remaining Work

### 1. Live QA With Real Saved Monthly Report Payloads

Verify the summary parser against production-like saved report rows, especially payloads under:

```txt
astro_ai_responses.ai_response.ai_interpretations.tropical_transits_monthly
astro_ai_responses.ai_response.tropical_transits_monthly
```

Acceptance:

- [ ] A saved monthly report shows 1-3 report-derived highlights in `/community/transits`.
- [ ] The collapsed subtitle and expanded Snapshot box do not say "Summary not available yet" when highlights render.
- [ ] Long interpretations are trimmed cleanly and do not break mobile layout.
- [ ] Payloads with title-only and interpretation-only adjacent objects render with the correct title.

### 2. Decide Final Regenerate Product Rule

Visible Regenerate CTAs are currently commented out, but the underlying `?regenerate=1` branch still exists in the detailed route.

Acceptance:

- [ ] Confirm whether regenerate should be permanently disabled or only hidden temporarily.
- [ ] If permanently disabled, remove or guard the route-level regenerate behavior in a separate task.
- [ ] If temporarily hidden, keep the commented CTA blocks and document the condition for restoring them.

### 3. Dashboard Family Chip Regression QA

The top dashboard card now dedupes by name only when the family row is explicitly `self` or `primary`.

Acceptance:

- [ ] Same-name spouse/partner row appears in the top card.
- [ ] Same-name child row appears in the top card.
- [ ] Legacy duplicate self row is still hidden.
- [ ] `/community` top-card chips and `/community/family` count no longer appear contradictory for the tested household.

### 4. Full Project Typecheck Cleanup

Focused lint/tests pass for touched files, but full `tsc --noEmit` currently fails on unrelated pre-existing project errors.

Observed unrelated failures include:

- Next route handler validator errors for mundane dynamic API routes.
- Existing admin/Chime/debug route typing issues.
- Existing dashboard settings payout typing issues.
- Existing script/admin utility missing type symbols.

Acceptance:

- [ ] Triage unrelated TypeScript failures into their own cleanup task.
- [ ] Re-run full project typecheck after those are resolved.
- [ ] Confirm the monthly transit summary and dashboard chip changes are included in a clean typecheck.

## QA Checklist

- [ ] Login as a Perennial Mandalism family-plan user with at least two household rows.
- [ ] Confirm `/community` top card shows all non-self family chips, including same-name spouse/child rows.
- [ ] Open `/community/transits` with a saved full report.
- [ ] Expand the monthly transit card and confirm the report-derived summary list appears.
- [ ] Confirm no visible Regenerate CTA appears on `/community/transits`.
- [ ] Open `/community/transits/detailed` for a saved report and confirm no visible Regenerate CTA appears.

## Out Of Scope

- No report generation prompt changes.
- No chart calculation changes.
- No database migration.
- No deletion of commented Regenerate CTA code.
- No broad TypeScript cleanup in this task.
