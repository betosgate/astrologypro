# Implementation Guide — 2026-04-22 Sprint (Affiliate Attribution Gap Closure)

## READ THIS FIRST

**App location:** `/home/this-pc/Documents/Indra/Beto Project/astrologypro/`
**Stack:** Next.js 16.2.1 (App Router in this repo; do not assume stock Next.js behavior), Supabase (PostgreSQL), TypeScript, Tailwind, shadcn/ui
**Project rules:** See `CLAUDE.md` at the repo root. Non-negotiable.

---

## Purpose

This sprint closes the gaps identified during the 2026-04-21 audit of the **affiliate-service-assignment** workstream plus the live flow test run on 2026-04-21. The core schema, many APIs, diviner/affiliate UIs, and the basic conversion hook are in place, but several runtime blockers and attribution-contract violations remain. These follow-up tasks plug holes that would otherwise break the URL-only attribution promise, mis-credit commissions, or leave admin visibility incomplete.

Refer back to the parent sprint for context: [`../2026-04-21/affiliate-service-assignment/00-master-task.md`](../../2026-04-21/affiliate-service-assignment/00-master-task.md).

---

## Gaps Being Closed

| # | Task | Severity | Why it matters |
|---|---|---|---|
| 01 | `01-page-tracker-affiliate-capture.md` | Critical | `page_views.ref_code/affiliate_id/affiliate_type` columns were added but nothing writes to them — funnel analytics at the view layer are empty |
| 02 | `02-landing-section-ref-propagation.md` | Critical | Only ~5 of 15 landing-page section renderers thread `?ref=` through CTAs; dropped ref breaks the URL-only attribution contract |
| 03 | `03-admin-campaign-leaderboard.md` | Critical | No cross-owner-type campaign leaderboard exists at `/admin/analytics/campaigns`; admins cannot rank campaigns across the platform |
| 04 | `04-admin-analytics-csv-exports.md` | Critical | Admin analytics surfaces reference exports but no streaming endpoints exist |
| 05 | `05-feature-flag-and-minor-polish.md` | Minor | V2 feature flag is only partially enforced in UI, `/advocate/earnings` still reads the legacy model, and the affiliate deep-dive red-flag panel is still too shallow |
| 06 | `06-affiliate-campaign-create-runtime-fix.md` | Critical | Live flow test proved `POST /api/advocate/assignments/[id]/campaigns` fails with `affiliate_campaigns_commission_type_check`; affiliates cannot create V2 campaigns at all |
| 07 | `07-conversion-commission-snapshot-fix.md` | Critical | Conversion hook recomputes from the live assignment row instead of the frozen campaign snapshot; post-assignment edits can change future payouts incorrectly |
| 08 | `08-assignment-kpi-scope-correction.md` | Critical | Diviner assignment list scopes conversions only by affiliate_id, so affiliates with multiple assignments get duplicated / inflated KPI rows |
| 09 | `09-advocate-campaigns-v2-alignment.md` | High | `/api/advocate/campaigns` and `/advocate/campaigns` still read the legacy `campaign_affiliates` model instead of affiliate-owned V2 campaigns |

---

## Execution Order

```
STEP  TASK FILE                                       WHAT IT DOES
────  ──────────────────────────────────────────      ──────────────────────────────────────────
 1    01-page-tracker-affiliate-capture.md
      → Extend page-tracker.tsx to read ?ref= from URL and persist ref_code / affiliate_id / affiliate_type on page_views rows

 2    02-landing-section-ref-propagation.md
      → Audit all 15 landing-page section renderers; thread ref through every outbound internal link; add a test asserting propagation

 3    03-admin-campaign-leaderboard.md
      → New /admin/analytics/campaigns page + API: cross-owner-type leaderboard with clicks, conversions, commission, CTR, CVR

 4    04-admin-analytics-csv-exports.md
      → Streaming CSV export endpoints for affiliate leaderboard, affiliate deep-dive, campaign leaderboard, commission financial view

 5    05-feature-flag-and-minor-polish.md
      → Tighten page/nav gating behind isAffiliateAssignmentV2Enabled, align `/advocate/earnings` with V2 data, and improve the affiliate deep-dive anomaly panel

 6    06-affiliate-campaign-create-runtime-fix.md
      → Fix the runtime constraint mismatch blocking affiliate-owned campaign creation from a valid assignment

 7    07-conversion-commission-snapshot-fix.md
      → Make the conversion hook credit from the frozen campaign snapshot (while still checking assignment active-state) so later edits don't mutate payout semantics

 8    08-assignment-kpi-scope-correction.md
      → Scope assignment KPIs by assignment/campaign/destination instead of just affiliate_id

 9    09-advocate-campaigns-v2-alignment.md
      → Replace legacy advocate campaigns reads with V2 affiliate-owned campaign reads so campaign/earnings screens match the new model
```

Recommended order:

1. Tasks 01-02 — attribution integrity
2. Task 06 — unblock runtime campaign creation
3. Task 07 — fix commission-credit semantics
4. Task 08 — fix diviner KPI correctness
5. Task 09 — align affiliate portal campaign reads
6. Tasks 03-04 — admin analytics completeness
7. Task 05 — rollout polish

---

## Critical Rules (Carried Over)

All rules from [`../2026-04-21/README.md`](../../2026-04-21/README.md) still apply. In particular:

1. **URL-only attribution — no cookies.** No `ap_aff` cookie, no localStorage.
2. **Commission lives on the assignment, not the campaign.** Do not recompute commission in analytics — read the snapshot.
3. **Attribution logged everywhere.** No silent drops on page views, clicks, or conversions.
4. **Frozen commercial terms stay frozen.** Campaign creation snapshots are authoritative for future conversions unless product explicitly chooses otherwise.
5. **No DROPs this sprint either.** Any schema change stays additive.

---

## Success Criteria

1. Every landing-page view with `?ref=` writes `ref_code` and resolved `affiliate_id/affiliate_type` to `page_views`.
2. Every internal `<Link>` / `<a>` rendered by any of the 15 landing-page sections preserves `?ref=` when present.
3. `/admin/analytics/campaigns` lists all campaigns (both `diviner` and `affiliate` owner types) with performance metrics and sort/filter.
4. Each admin analytics page has a working CSV export button that streams the full filtered dataset.
5. With `isAffiliateAssignmentV2Enabled=false`, the new UIs are hidden and the legacy affiliate flow is intact.
6. Affiliate deep-dive page surfaces red-flag signals (abnormal CTR, conversion spikes, IP concentration).
7. Affiliate can create a campaign from an active assignment with a 2xx response in the live app.
8. Conversion credit uses the frozen campaign snapshot and remains stable even if the assignment commission is later edited.
9. Diviner assignment KPIs do not duplicate conversions across multiple assignments held by the same affiliate.
10. `/advocate/campaigns` and related earnings/campaign summaries read V2 affiliate-owned campaigns instead of `campaign_affiliates`.

---

## Out of Scope

- Backfill of historical `page_views` with affiliate attribution — forward traffic only.
- Materialized views for analytics performance (separate sprint if scale demands).
- Payout disbursement (still tracked separately).

---

## Start Here

1. Read this README completely.
2. Read `CLAUDE.md` at the repo root.
3. Execute tasks in order (01 → 09).
4. After each task, run its verification plan before advancing.
