# Affiliate Phase 1.5 — General-Product Commissions Sprint Plan (2026-04-28)

## Source of truth

The authoritative requirements live in
[`docs/specs/affiliate-commission-system.md`](../../../specs/affiliate-commission-system.md)
**§10 Phase 1.5**. Read that section first — it carries the locked design
decisions (eligibility, rate-setting, default + disabled semantics,
campaign anchoring, scope) and the full schema migration. This folder is
the implementation plan against that spec.

## Scope

Extend the affiliate commission system to cover **general-catalog
products** (`service_templates` rows with `is_general=true`) where
customers book without pre-selecting a diviner. Adds a parallel
commission path that complements (does not replace) the per-diviner
assignment model from Phase 1.

## Out of scope

- Stripe Connect auto-split (still Phase 2).
- `social_advocates` — diviner_affiliates only per spec §10.
- A `service_template_commission_history` table — admin-managed rate
  changes don't need an audit trail per spec §10 decision #4.
- Per-affiliate notifications on admin rate changes — skipped per spec
  §10 decision #4.

## Execution order

01 → 02 → 03/04 (parallelizable) → 05/06/07 (parallelizable) → 08.
Don't start 02 before 01 (the migration must apply or the code won't
compile against the new columns).

| # | Task | Priority | Depends on |
|---|---|---|---|
| 00 | [Master task + ground rules](00-master-task.md) | P0 | — |
| 01 | [Schema migration](01-schema-migration.md) | P0 | — |
| 02 | [Stamp logic + conversion credit](02-stamp-and-credit.md) | P0 | 01 |
| 03 | [Click handler 410 gate](03-click-handler-gate.md) | P0 | 01 |
| 04 | [General-campaigns endpoint](04-general-campaigns-endpoint.md) | P0 | 01 |
| 05 | [Affiliate UI (Marketing Kit + Products + new-campaign)](05-affiliate-ui.md) | P1 | 01, 04 |
| 06 | [Admin UI (template rate config)](06-admin-ui.md) | P1 | 01 |
| 07 | [Reporting display labels](07-reporting-display.md) | P1 | 01 |
| 08 | [Tests + sign-off](08-tests-and-signoff.md) | P1 | 01–07 |

## Estimated effort

Roughly **3–5 days** of focused work. The patterns (SECURITY DEFINER
helpers, RLS migration discipline, smoke + RLS test scaffolding) are
already established by the v2 sprint — most of this is filling in known
shapes against new columns.

## When this sprint completes

The Marketing Kit at `src/components/affiliate/marketing-kit.tsx` stops
being misleading: every share URL there will route through a real
campaign code and credit the affiliate when the customer books.
