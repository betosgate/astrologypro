# Master — Affiliate Phase 1.5 — General-Product Commissions (2026-04-28)

- Status: Not Started
- Priority: P1 (extension to v2; v2 itself remains in production)
- Sprint window: open
- Spec: `docs/specs/affiliate-commission-system.md` §10 Phase 1.5

## Purpose

Make general-catalog products (rows in `service_templates` with
`is_general=true`) a first-class commission surface for affiliates.
Today the Marketing Kit at
`src/components/affiliate/marketing-kit.tsx` shows 19 such products
with `?ref=<junctionId>` URLs that **don't credit anything** — clicks
land on the reading page but the booking flow has no path to stamp the
booking, so no `campaign_conversions` row ever lands.

This sprint adds the schema, stamp logic, endpoints, and UI to close
that gap. After it ships, every share URL the Marketing Kit generates
routes through a real campaign code and credits the affiliate when the
customer books.

## Locked design decisions (from spec §10 Phase 1.5)

These were settled on 2026-04-28. Do not relitigate without explicit
approval:

1. **Auto-eligibility** — every `affiliate_accounts.status='active'` row
   is eligible. No opt-in table, no enrollment UI.
2. **Admin-only rate setting** — single global rate per general
   `service_templates` row. No per-affiliate override.
3. **Default + disabled** — `commission_value IS NULL` defaults to 10%;
   `affiliate_program_enabled=false` returns 410 from `/r/<code>`.
4. **No notifications, no history table** — admin rate edits are silent;
   affiliates see the current rate on `/affiliate/products`.
5. **Campaign anchoring** — new column
   `affiliate_campaigns.owner_affiliate_account_id` (UUID →
   `affiliate_accounts.id`). General campaigns use it; per-diviner
   campaigns continue to use `owner_affiliate_id` (junction).
   `owner_affiliate_type` enum gains the value `'general'`.
6. **Scope** — diviner-affiliates only. `social_advocates` are a
   separate identity and out of scope.

## Non-goals (explicit)

- Stripe Connect auto-split for affiliate payouts (Phase 2).
- `social_advocates` integration with general products.
- Per-template rate audit history (`service_template_commission_history`
  table).
- Per-affiliate notifications on admin rate edits.
- Per-affiliate rate overrides for general products.

## Deliverables (high-level)

| Area | Output |
|---|---|
| **Schema** | One additive migration covering `service_templates` columns + `affiliate_campaigns.owner_affiliate_account_id` + extended enum + tightened CHECK + `bookings.commission_source_template_id` + `campaign_conversions.affiliate_account_id` + RLS extension |
| **Library** | `resolveStampForBooking` general-path branch; `creditAffiliateConversion` always populates `affiliate_account_id` |
| **API** | New `POST /api/affiliate/general-campaigns` endpoint; `/r/<code>` handler 410 gate for disabled programs |
| **Affiliate UI** | Marketing Kit rewrite (real campaign codes); `/affiliate/products` general section; `/affiliate/campaigns/new` two-mode picker |
| **Admin UI** | `/admin/service-templates/[id]` commission config fields; bulk-edit helper |
| **Reporting** | Conversion log + earnings display label updates ("General: <name>" vs "Diviner: <name>") |
| **Tests** | Integration test for general-path stamp; new RLS test cases; smoke test extension |

## Acceptance gate

Sprint is done when:
- [ ] Migration applies cleanly (idempotent, sanity-checked).
- [ ] Per-diviner stamping path is unchanged (regression test passes).
- [ ] General-program click → book → pay → conversion E2E credits the
      affiliate's account.
- [ ] Admin can toggle a template's `affiliate_program_enabled` flag and
      `/r/<code>` immediately returns 410 for that template's share URLs.
- [ ] Marketing Kit shows only enabled general templates and uses real
      campaign codes (no `?ref=<UUID>` anywhere).
- [ ] Reports correctly label general vs per-diviner credits.
- [ ] RLS test proves an affiliate sees their own general campaigns and
      not another affiliate's; a diviner does NOT see general campaigns
      in their per-affiliate detail view.
- [ ] Spec §12 changelog entry recorded with the implementation date.

## Reading order for engineers picking this up

1. `docs/specs/affiliate-commission-system.md` §3 (data model) +
   §3.8 (stamp model) + §5 Flow E (booking stamp) + §5 Flow F (webhook
   credit) + §10 Phase 1.5 (this sprint's design)
2. `00-master-task.md` (this file)
3. `01-schema-migration.md` first; the rest can be picked up in
   parallel after that lands.
