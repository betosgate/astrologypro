# Implementation Guide — 2026-04-23 Sprint (Affiliate Identity Refactor)

## READ THIS FIRST

**App location:** `/home/this-pc/Documents/Indra/Beto Project/astrologypro/`
**Stack:** Next.js 13 App Router, Supabase (PostgreSQL), TypeScript, Tailwind, shadcn/ui
**Project rules:** See `CLAUDE.md` at the repo root. Non-negotiable.

> **Terminology note.** Throughout this sprint, "affiliate" means specifically a **diviner-scoped affiliate** (`affiliate_type = 'diviner_affiliate'` in the shipped polymorphic V2 model). It does **NOT** mean `social_advocate`. Social advocates are a separate identity type with their own shipped system (`social_advocates` table + `/advocate/*` portal + `/join/advocate`) and are **entirely out of scope** for this sprint.

---

## Purpose

Today a diviner-scoped affiliate is represented by a single row in `diviner_affiliates`, which conflates:

- The **identity** of the person (name, email, phone, user_id).
- The **partnership** with a single diviner (status, commission, notes).

This causes three concrete problems the user cannot tolerate:

1. **Profile is per-row, not canonical** — if Jane updates her avatar under Diviner A, Diviner B still shows the old avatar.
2. **Email duplicates** — same person affiliated with 3 diviners = 3 copies of her email.
3. **No affiliate-wide block** — blocking a bad actor requires updating N rows, one per partnership.

Plus: `diviner_affiliates` has a dead `user_id` column (0/14 populated in prod), so the intended "affiliate portal login" never worked. The `/affiliate/*` route tree exists in the codebase but is broken scaffolding — its joins always return null.

## Refactor outcome

One canonical identity per person (`affiliate_accounts`) + `diviner_affiliates` reshaped as a junction referencing that identity. Invite-only (no direct add). Explicit accept click to link `auth.users` → `affiliate_accounts`. One login, one profile, one platform-wide block switch, many diviner partnerships.

**Nothing shipped changes structurally.** The refactor is additive — new tables + new columns on `diviner_affiliates`, no dropped tables, no FK rewiring. All downstream readers (commissions, payouts, referral links, `diviner_service_affiliates`, `affiliate_campaigns`) keep pointing at `diviner_affiliates.id` exactly as they do today.

---

## Locked Decisions (product)

Agreed on 2026-04-23. Do not re-litigate during implementation.

| # | Decision | Rationale |
|---|---|---|
| D1 | **Per-diviner payouts.** `affiliate_payouts` stays keyed by the junction, not by canonical account. | Matches current bookkeeping; no schema churn on the payouts module. |
| D2 | **New `affiliate` role + dedicated `/affiliate/*` portal.** | Rehab the existing broken scaffolding at `src/app/affiliate/*`. Add to `getUserPortals()`. |
| D3 | **Grandfather the 14 existing `diviner_affiliates` rows as-is.** Backfill into the new canonical model without forcing re-accept. | Zero user-visible disruption. `affiliate_accounts.user_id` is left NULL for unclaimed rows; auto-linked on next deliberate invite-accept. |
| D4 | **Drop the direct-add `POST /api/dashboard/affiliates` path. Invite-only going forward.** | Every relationship is explicit, traceable, GDPR-friendly. |
| D5 | **Email collision on independent signup: require explicit invite-click.** No auto-link by email alone. | Safer against speculative / malicious invites. No silent role escalation. |
| D6 | **`diviner_affiliate` and `social_advocate` are distinct identities forever.** | Product rule. Do not merge, migrate, or collapse between them. Saved in project memory. |
| D7 | **Canonical table name: `affiliate_accounts`.** Portal path: `/affiliate/*`. | Confirmed 2026-04-23. |

---

## What's already shipped and must be preserved

The 2026-04-17, 2026-04-18, 2026-04-21, and 2026-04-22 sprints are **all live in production** (despite the stale `Status: Not Started` headers inside their task files). This refactor must not regress any of their guarantees:

1. **URL-only attribution** via `?ref=`. No cookies, no localStorage, ever.
2. **Commission snapshots frozen at campaign creation** (`commission_value_snapshot`, `commission_type_snapshot` on `affiliate_campaigns` and `campaign_conversions`). Never recomputed, even if a junction's commission is edited later.
3. **Entity-based destinations** (`destination_profile_id`, `destination_service_template_id` on `affiliate_campaigns`). Not URL strings.
4. **`affiliate_type` discriminator is load-bearing** on `diviner_service_affiliates`, `affiliate_campaigns`, `campaign_conversions`, `page_views`. Stays `'diviner_affiliate' | 'social_advocate'`.
5. **Auto-pause on service disable** (`diviner_services.is_enabled = false` cascades to campaign `auto_paused_at`).
6. **`/r/[code]` redirect + `?ref=` propagation through all 15 landing section renderers**. The refactor must not drop the ref chain.
7. **Feature flag `isAffiliateAssignmentV2Enabled` is ON in prod.** Does not need a new flag for this refactor; use a separate flag (`AFFILIATE_IDENTITY_V2`) to gate rollout.

---

## Sub-module Task Matrix

| # | Task | Priority | Depends on | Delivers |
|---|---|---|---|---|
| 01 | [01-schema-and-migration.md](01-schema-and-migration.md) | P0 | — | `affiliate_accounts` + `affiliate_invites` tables, additive columns on `diviner_affiliates`, backfill 14 rows, RLS. |
| 02 | [02-invite-flow-refactor.md](02-invite-flow-refactor.md) | P0 | 01 | Rewrite `POST /invite` to upsert canonical + junction; issue signed single-use token; delete direct-add POST; add resend/revoke. |
| 03 | [03-accept-flow.md](03-accept-flow.md) | P0 | 01, 02 | `/affiliate/accept/[token]` page + API; handles sign-in / sign-up / session / email-mismatch branches; links `user_id` atomically. |
| 04 | [04-diviner-ui-updates.md](04-diviner-ui-updates.md) | P1 | 02 | Remove Add Affiliate UI, polish Invite dialog, resend/revoke actions, identity card sourced from canonical. |
| 05 | [05-affiliate-portal.md](05-affiliate-portal.md) | P0 | 01, 03, 06 | **Rehab** the broken `/affiliate/*` portal. Add to `getUserPortals()`. Profile, partnerships, per-diviner earnings, payouts. |
| 06 | [06-downstream-api-audit.md](06-downstream-api-audit.md) | P1 | 01 | Audit every file that reads `diviner_affiliates`; migrate identity reads to JOIN `affiliate_accounts`. Covers `/dashboard/*`, `/admin/*`, shared libs, shared components. |
| 07 | [07-seeds-fixtures-and-tests.md](07-seeds-fixtures-and-tests.md) | P1 | 01–06 | Seed canonical accounts + multi-diviner affiliate fixture; unit + integration + Playwright E2E. |

---

## Global Execution Order (follow exactly)

```
STEP  TASK FILE                               WHAT IT DOES
────  ─────────────────────────────────────   ──────────────────────────────────────────
 1    01-schema-and-migration.md
      → Additive migration. NEW affiliate_accounts + affiliate_invites. ALTER
        diviner_affiliates to add affiliate_account_id + invited_at + accepted_at.
        Backfill 14 rows. RLS. No drops.

 2    02-invite-flow-refactor.md
      → Rewrite POST /invite for new model. Delete POST /affiliates (direct-add).
        Issue hashed single-use tokens with 14d expiry.

 3    03-accept-flow.md
      → Build /affiliate/accept/[token] (page) + POST /api/affiliate/accept.
        Sign-up / sign-in / session / email-mismatch branches.
        Trigger guards affiliate_accounts.user_id against non-accept mutations.

 4    06-downstream-api-audit.md
      → Walk every reader of diviner_affiliates. Switch identity-reads to JOIN
        affiliate_accounts. Preserve flat API response shapes for UI compatibility.
        Includes /admin/affiliates/*, /dashboard/affiliate-commission/*, etc.

 5    04-diviner-ui-updates.md
      → Remove Add Affiliate sheet. Polish Invite dialog. Surface accept state.
        Identity card shows canonical name/avatar/email.

 6    05-affiliate-portal.md
      → Rehab /affiliate/* — was broken scaffolding, now wired to affiliate_accounts.
        Add Profile, Partnerships, Payouts, Notifications pages. Add role to
        getUserPortals() and src/proxy.ts.

 7    07-seeds-fixtures-and-tests.md
      → Seed canonical accounts + multi-diviner test affiliate. Unit + integration +
        Playwright E2E for invite → accept → portal.
```

Recommended timeline:

- **Week 1** — Tasks 01 + 06: ship behind `AFFILIATE_IDENTITY_V2` flag (OFF). Downstream readers are dual-safe (flat response shapes unchanged). Confirm no regressions.
- **Week 2** — Tasks 02 + 03: invite/accept wired. Flag still OFF for end users; QA flips ON internally.
- **Week 3** — Tasks 04 + 05: diviner UI + affiliate portal. Flag ON in staging.
- **Week 4** — Task 07 + prod flip + soak.

---

## Critical Rules (non-negotiable)

1. **Additive-first schema.** No `DROP COLUMN` / `DROP TABLE` in this sprint. Legacy columns (`diviner_affiliates.name`, `email`, `phone`, `user_id`) stay for at least one release after Task 06 stops writing to them.
2. **Explicit consent** — `affiliate_accounts.user_id` is only set via an accept-link click. No auto-link by email match alone (D5).
3. **Object-level authorization** on every new endpoint. A diviner can only see/touch junctions where `diviner_id = their diviner record`. An affiliate can only see junctions where `affiliate_account_id = their canonical record`.
4. **`social_advocates` / `/advocate/*` / `/join/advocate` are untouched.** Not part of this sprint. Do not migrate between them and `affiliate_accounts`.
5. **The polymorphic V2 model is untouched.** `diviner_service_affiliates.affiliate_type`, `affiliate_campaigns.owner_affiliate_type`, `campaign_conversions.affiliate_type`, `page_views.affiliate_type` all keep their `'diviner_affiliate' | 'social_advocate'` shape. FKs on these tables still point at `diviner_affiliates.id` when type = `'diviner_affiliate'`. Zero FK rewiring.
6. **Commission snapshots stay frozen.** Do not recompute `commission_value_snapshot` / `commission_type_snapshot` for any reason.
7. **URL-only attribution.** No cookies. No localStorage. Not in invite links, not in accept flow, not in portal nav.
8. **Legacy `affiliates` table is untouched.** It has 5 live callers (`src/lib/affiliate-commissions.ts`, `src/app/affiliate/[code]/page.tsx`, `src/app/api/cron/mundane-shares/route.ts`, `src/lib/diviner-analytics.ts`, `src/app/api/admin/reports/payouts/route.ts`). Retiring it is a separate future sprint.
9. **Invite tokens are single-use, signed (SHA-256 hash stored server-side), and short-lived (14 days).** Raw token exists only in the email link.
10. **Per CLAUDE.md §§ 1, 3, 11–14, 22, 25:** WCAG 2.2 from the start, OWASP ASVS baseline, RFC 9457 Problem+JSON errors, input validation at the server boundary, CSRF on state-changing routes.

---

## Out of Scope (explicit non-goals)

- **Any change to `social_advocates` or `/advocate/*` or `/join/advocate`.** Different identity, different portal, different sprint.
- **Retiring or renaming the legacy `affiliates` table.** Separate future sprint; 5 live callers must be migrated first.
- **Retiring the dead commission schema** (`commission_ledger_entries`, `affiliate_payout_records`, `affiliate_payout_allocations`). Empty in prod; ignore.
- **Changing payout model.** D1 pins per-diviner payouts.
- **Consolidated payouts across diviners.** Explicitly deferred.
- **Affiliate-to-affiliate referrals (sub-affiliates).**
- **New email provider.** Reuse `sendAffiliateInvitation()` from `src/lib/email.ts`.
- **OAuth / magic-link / 2FA for affiliate login.** Password only for now.
- **Migrating legacy Angular affiliates** (MongoDB `divine_infinity`). Different system.
- **Changing commission math or the URL-attribution pipeline.** Shipped invariants.
- **Replacing `diviner_affiliates.id` as the downstream FK target.** Would require rewriting shipped commission/payout/campaign code — deliberately avoided.
- **Affiliate-owned campaign UI inside the refactored portal.** The existing `/affiliate/campaigns` page stays as-is for this sprint; only its identity lookup changes (Task 06).

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Downstream API response shape drift breaks diviner UI | Med | High | Task 06 preserves flat response shapes (join server-side, flatten in route before returning). |
| Backfill misjoins the 14 rows | Low | High | Transactional migration with end-of-migration assertion; `_backfill_audit` table for debugging. |
| RLS policy on `affiliate_accounts` is wrong → data leak | Low | Critical | Task 01 ships explicit per-role policies; Task 07 has an RLS test that attempts cross-tenant reads and expects 0 rows. |
| Accept token leaked (forwarded email) | Low | High | Single-use, 14d expiry, bound to frozen email, rate-limited; accept flow re-verifies logged-in user's email = token email. |
| Someone wires up a new code path reading `diviner_affiliates.name/email` directly | Med | Med | Lint rule / PR check added in Task 06 greps for `diviner_affiliates\s*').select.*(name|email|phone|user_id)`. |
| The 2026-04-21/22 shipped commission paths break mid-refactor | Low | Critical | Task 06's audit list is exhaustive; downstream FKs to `diviner_affiliates.id` are untouched; commission tables aren't structurally changed. |
| `/affiliate/*` rehab conflicts with in-flight commits from another contributor | Low | Med | Search `git log src/app/affiliate/` for recent activity before starting Task 05; coordinate in the team channel. |
| A diviner's `/dashboard/affiliates` edit workflow regresses due to identity-card change | Med | Med | Task 04 Playwright covers the edit → save → reload loop. |

---

## Rollout Plan

1. Ship Tasks 01 + 06 first, flag `AFFILIATE_IDENTITY_V2 = OFF`. Schema additive. All shipped code paths work identically because reads use joins transparently.
2. Flip flag ON in staging. Run seed + E2E (Task 07).
3. Ship Tasks 02 + 03 + 04 + 05. Flag still OFF in prod; staging has it ON.
4. Manually invite two friendly affiliates in staging; verify full happy path.
5. Flip flag ON in production. Monitor:
   - Invite acceptance rate (expect >50% in 72h).
   - Error rate on `/affiliate/accept/*` (< 1%).
   - Commission write latency (no regression vs. baseline).
   - `/dashboard/affiliates` and `/admin/affiliates` p95 response time.
6. ≈2 weeks after prod flip, open a follow-up cleanup story: drop legacy `diviner_affiliates.name/email/phone/user_id` columns, remove the feature flag. **Out of scope for this sprint.**

---

## Rollback Plan

- **Schema rollback:** legacy columns on `diviner_affiliates` were untouched, so flipping flag OFF restores identical behavior. No data loss.
- **Accept flow rollback:** disable `/affiliate/accept/[token]` route; `affiliate_invites` rows remain for audit; resend manually where needed.
- **Portal rollback:** revert `/affiliate/*` to its broken pre-rehab state (or hide the nav entry in `getUserPortals()`). Affiliate accounts remain in DB; no user-facing disruption since the portal was already broken.
- **Downstream audit rollback:** each Task 06 file edit is a git revert.

---

## Start Here

1. Read this README completely.
2. Read `CLAUDE.md` at the repo root (especially §§ 1, 3, 11–14, 22, 25).
3. Scan the "What's already shipped and must be preserved" section of the 2026-04-21/22 sprint READMEs to absorb the URL-only attribution + commission-snapshot invariants.
4. Read [supabase/migrations/20260407000063_affiliate_commission.sql](../../../../supabase/migrations/20260407000063_affiliate_commission.sql) for the current `diviner_affiliates` shape.
5. Read [supabase/migrations/20260421000001_affiliate_service_assignments.sql](../../../../supabase/migrations/20260421000001_affiliate_service_assignments.sql) to internalize the polymorphic V2 model.
6. Execute tasks in the order above. Each task has its own Verification Plan; run it before advancing.
