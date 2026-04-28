# Task 08 — Tests + Sign-off

- Status: Not Started
- Priority: P1
- Depends on: 01–07
- Blocks: sprint complete
- Spec: §10 Phase 1.5 — Test coverage

## Goal

Lock in Phase 1.5 with the same shape of test coverage v2 has: a
library smoke test, an RLS isolation test, a unit test if applicable,
plus end-to-end manual verification. Match the conventions established
by tasks `affiliate-commission-v2-smoke.test.ts`,
`affiliate-rls.test.ts`, and `affiliate-commission-math.test.ts`.

## Conventions to follow

The existing test files in this codebase have a settled style — match it
exactly:

- **Per-call namespace**: `function freshNS()` returning
  `'rls-' + Date.now() + '-' + Math.random()...` so each test gets unique
  email + slug values. See `affiliate-rls.test.ts:38-44`.
- **Service-role client only inside setup/teardown**; create a fresh anon
  client per `authAs(email)` for the actual assertions.
- **`setup()` returns a typed Tenancy / Fixture** with all created ids;
  **`teardown(t)` deletes children-first** in FK-safe order.
- **Cleanup with `.catch(() => {})` on auth.admin.deleteUser** — failure
  to delete one fixture user shouldn't break the next test.
- **Email patterns** must match the existing cleanup script's
  `EMAIL_PATTERNS` allow-list at
  `scripts/cleanup-affiliate-test-data.ts:46-50`. If a new prefix is
  introduced (e.g. `phase15-`), add it to that file's patterns too.

## Part A — Smoke test extension

**File:** `tests/integration/affiliate-phase-1-5-general-smoke.test.ts`
(new) — OR extend
`tests/integration/affiliate-commission-v2-smoke.test.ts` with general-
path cases. Pick whichever keeps each file under ~600 lines.

Cases to cover:

1. **Schema sanity** — assert all new columns exist:
   - `service_templates.{commission_type, commission_value, affiliate_program_enabled}`
   - `affiliate_campaigns.owner_affiliate_account_id`
   - `bookings.commission_source_template_id`
   - `campaign_conversions.affiliate_account_id`

2. **`resolveStampForBooking` general happy path** — campaign with
   `owner_affiliate_type='general'` + enabled template + active account
   → `reason='stamped'`, `source_template_id` set, rate from template.

3. **Default 10% rate** — same setup but
   `service_templates.commission_value = NULL` AND
   `affiliate_program_enabled=true` → stamp uses 10%.

4. **Disabled program → program_disabled** — same but
   `affiliate_program_enabled=false` → `reason='program_disabled'`,
   no stamp.

5. **Blocked account → account_not_active** — happy setup, then flip
   `affiliate_accounts.status='blocked'` → `reason='account_not_active'`.

6. **`creditAffiliateConversion` general path** — booking with
   `commission_source_template_id` set, no assignment id → writes a
   `campaign_conversions` row with `affiliate_type='general'`,
   `affiliate_account_id` populated, `affiliate_id=NULL`.

7. **Rate-stamp invariant for general** — admin edits
   `service_templates.commission_value` AFTER a booking is stamped →
   the booking's eventual conversion uses the stamped rate, not the new
   value.

8. **Per-diviner rows backfilled** — `creditAffiliateConversion` on a
   per-diviner credit also populates `affiliate_account_id` (resolved
   via the junction → account chain).

## Part B — RLS test extension

**File:** `tests/integration/affiliate-rls.test.ts` — extend with new
cases (don't fork into a new file).

Cases:

1. **Affiliate sees own general campaign** — Affiliate 1 creates a
   general campaign, the auth-as-Affiliate1 query on
   `affiliate_campaigns` returns the row.

2. **Affiliate doesn't see another affiliate's general campaign** —
   Affiliate 1 creates one, auth-as-Affiliate2 query returns 0 rows.

3. **Diviner doesn't see general campaigns** — auth-as-Diviner-A query
   on `affiliate_campaigns` excludes general rows even though Sarah
   (Affiliate 1) is partnered with Diviner A. (Tests the
   anti-leakage guarantee from §10 decision #5.)

4. **Affiliate INSERT for own account works; for another's fails** —
   auth-as-Affiliate1 trying to INSERT a general campaign with
   `owner_affiliate_account_id = Affiliate2.account_id` → 0 rows
   affected by RLS WITH CHECK.

5. **Affiliate sees own general conversion** — seed a
   `campaign_conversions` row with `affiliate_type='general'` +
   `affiliate_account_id=Affiliate1` → auth-as-Affiliate1 sees it.

6. **Affiliate doesn't see another affiliate's general conversion** —
   auth-as-Affiliate2 doesn't see the row from case 5.

## Part C — Unit tests

If `computeCommissionCents` already covers percent + flat math (it
does — 23 cases in `tests/unit/affiliate-commission-math.test.ts`),
no new unit tests are required for Phase 1.5. The default-10% logic
lives in `resolveStampForBooking` (the `?? 10` line) — covered by the
Part A smoke case #3.

## Part D — `package.json` scripts

```json
"test:affiliate-phase-1-5-smoke": "tsx --env-file=.env.local --test tests/integration/affiliate-phase-1-5-general-smoke.test.ts",
"test:affiliate-commission": "npm run test:affiliate-commission-math && npm run test:affiliate-commission-v2-smoke && npm run test:affiliate-phase-1-5-smoke && npm run test:affiliate-rls"
```

## Part E — Manual E2E sign-off

One real run through the deployed preview:

1. Admin enables affiliate program on a general template at e.g. 15%.
2. Affiliate 1 logs in → `/affiliate/products` → sees the template in
   "General products" with "Commission: 15%".
3. Clicks "Create campaign" → `/affiliate/campaigns/new?template=<id>`
   pre-fills → submits.
4. Copies share URL from `/affiliate/campaigns/<id>`.
5. Anonymous browser visits share URL → 307 redirect with
   `?ref=<code>` → `campaign_clicks` row appears in admin clicks log
   labeled "General".
6. Anonymous user signs up + books the general product → completes
   Stripe test card.
7. Webhook fires → `campaign_conversions` row appears with
   `affiliate_type='general'` + `commission_amount_cents` matching
   15% of order amount.
8. Affiliate 1's `/affiliate/notifications` shows in-app
   `affiliate.conversion`.
9. Affiliate 1's `/affiliate/earnings` shows the new credit with source
   label "General: <template name>".
10. Admin's `/admin/reports/affiliates/conversions` shows the row with
    "General: <template name>" and the affiliate's name.
11. Diviner A's `/dashboard/affiliates/<sarah-junction-id>` does NOT
    show the campaign or conversion.
12. Admin disables the template → re-clicking the share URL returns 410.

## Sign-off checklist

Before declaring the sprint done, tick every box:

- [ ] Migration applied on dev Supabase, idempotent on re-run.
- [ ] `npm run test:affiliate-commission` green (smoke + RLS + math +
      Phase 1.5 smoke all pass).
- [ ] `git grep -wE "READING_PAGES" -- 'src/'` returns 0 (Marketing
      Kit fully rewritten — no hardcoded list).
- [ ] `git grep -E "ref=\\\$\\{affiliateId\\}" -- 'src/'` returns 0
      (no junction-UUID refs anywhere).
- [ ] Admin can toggle `affiliate_program_enabled` and the change is
      visible in the affiliate Marketing Kit + `/r/<code>` gating
      within the next page render.
- [ ] Manual E2E flow above completes top to bottom on preview.
- [ ] Spec §12 changelog entry recorded with the implementation date
      (see template below — drop into §12 above the existing
      "2026-04-28 (Phase 1.5 design)" entry).
- [ ] Memory file
      `.claude/projects/.../memory/project_affiliate_phase_1_5_general.md`
      status flipped from "Designed, not yet implemented" to "Shipped
      <YYYY-MM-DD>".

### Spec changelog template (drop-in)

```markdown
- **<YYYY-MM-DD> (Phase 1.5 shipped)** — General-product affiliate
  commissions live in production. Migration
  `<YYYYMMDD>0001_affiliate_phase_1_5_general.sql` applied (adds
  `service_templates.{commission_type, commission_value, affiliate_program_enabled}`,
  `affiliate_campaigns.owner_affiliate_account_id`, extended
  `owner_affiliate_type` enum with `'general'`, tightened
  `owner_consistency` CHECK, `bookings.commission_source_template_id`,
  `campaign_conversions.affiliate_account_id`; backfilled existing
  per-diviner conversions; extended affiliate-side RLS for general
  campaigns and conversions). Stamp logic in
  `src/lib/affiliate-stamp.ts` gained the general-path branch with
  10% default for NULL commission_value and `program_disabled` reason
  for `affiliate_program_enabled=false`. New endpoint
  `POST /api/affiliate/general-campaigns`. `/r/<code>` handler returns
  410 for disabled programs (Flow D step 3b). Marketing Kit at
  `src/components/affiliate/marketing-kit.tsx` rewritten to source
  from `service_templates` and use real campaign codes (no more
  `?ref=<UUID>` URLs). Admin can configure rates per-template at
  `/admin/service-templates/[id]` plus a bulk-set helper. Reporting
  endpoints display `General: <template name>` vs `Diviner: <name>`
  per row. Tests: new
  `tests/integration/affiliate-phase-1-5-general-smoke.test.ts`
  (<N> cases), RLS suite extended with <M> cases for general-path
  isolation. Manual E2E walked once on preview <DATE>.
```

## Acceptance

- All scripts in Part D exist in `package.json`.
- Running `npm run test:affiliate-commission` returns 0 failures.
- RLS tests prove cross-account isolation at the DB layer.
- Manual E2E walked at least once on preview.
- Spec + memory file reflect "shipped" status.
