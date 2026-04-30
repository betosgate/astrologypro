---
name: Affiliate Phase 1.5 — general-product commissions
description: Designed 2026-04-28, not implemented. All design decisions locked. Read spec §10 Phase 1.5 + the changelog entry before starting any work in this area.
type: project
originSessionId: 8152c810-0d94-40d1-82fe-a2f0d3778714
---
**Status:** Designed 2026-04-28, not yet implemented.

**Where:** `docs/specs/affiliate-commission-system.md` §10 Phase 1.5 (the contract) + the 2026-04-28 changelog entry in §12.

**Why it exists:** Phase 1's commission model is per-diviner-assignment
only (`diviner_service_affiliates`). General-catalog products (rows in
`service_templates` with slugs prefixed `general-` per migration
`20260421000002_add_general_service_templates.sql`) let customers book
without pre-selecting a diviner. Phase 1.5 fills the commission gap.

**Locked design decisions** (do NOT relitigate without explicit user OK):
1. All `affiliate_accounts.status='active'` rows are auto-eligible. No
   opt-in table.
2. Admin-only writes on `service_templates.commission_*`. Single global
   rate per template, no per-affiliate override.
3. `commission_value IS NULL AND affiliate_program_enabled=true` →
   default 10%. `affiliate_program_enabled=false` → `/r/<code>` returns
   410.
4. **No notification** fires on admin rate edits. **No history table**
   for general-template rate changes. Affiliates see current rate on
   `/affiliate/products`.
5. Campaign anchoring uses a NEW column
   `affiliate_campaigns.owner_affiliate_account_id` (UUID → affiliate_accounts).
   `owner_affiliate_type` enum gets a third value `'general'`. Avoids
   the misleading admin views from anchoring general campaigns on an
   arbitrarily-picked junction.
6. Scope is `diviner_affiliates` only. `social_advocates` are out (per
   `project_affiliate_vs_advocate_identity.md`).

**Schema migration shape** (one migration):
- `service_templates`: + `commission_type`, `commission_value`,
  `affiliate_program_enabled`
- `affiliate_campaigns`: + `owner_affiliate_account_id`; extend
  `owner_affiliate_type` enum with `'general'`; tighten
  `owner_consistency` CHECK
- `bookings`: + `commission_source_template_id`
- `campaign_conversions`: + `affiliate_account_id` (always populated)
- RLS: extend `affiliate_sees_own_campaigns` with the
  `current_affiliate_account_id()` clause

**Code paths to update:**
- `src/lib/affiliate-stamp.ts::resolveStampForBooking` — new general
  branch (program_disabled / account_not_active / stamps from template)
- `src/lib/affiliate-attribution.ts::creditAffiliateConversion` — always
  set `affiliate_account_id`
- New endpoint: `POST /api/affiliate/general-campaigns`
- `/r/<code>` handler — new gate for `affiliate_program_enabled=false`
- `src/components/affiliate/marketing-kit.tsx` — rewrite to source from
  enabled general templates and use real campaign codes
- `/affiliate/products` — gain general products section
- `/affiliate/campaigns/new` — two-mode picker (per-diviner vs general)
- `/admin/service-templates/[id]` — gain commission config fields
- Reporting endpoints — display label change ("General: <name>" vs
  "Diviner: <name>")

**Don't fix the Marketing Kit alone.** It's currently misleading
(`?ref=<junctionId>` UUIDs that never match a campaign code). Patching
the UI without the underlying schema + stamp + endpoints would just
hide the absence of the feature. Build the schema and stamp first;
Marketing Kit rewrite comes last.

**Effort:** ~3-5 days of focused work. Spec is the contract.
