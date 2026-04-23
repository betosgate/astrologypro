# Task 05 — Final Handoff + QA Checklist

- Status: Ready for QA
- Produced: 23.04.2026
- Related task: `05-regression-and-qa-checklist.md`

---

## Handoff Summary

### Canonical entitlement rule

**`community_members.pm_tier_id` → `pm_plan_tiers` row** is the source of truth. The legacy `community_members.plan_type` column is kept in sync via:

```
tier.name ILIKE 'Family'   → plan_type = 'family'
everything else            → plan_type = 'individual'
```

The shared helper at `src/lib/community/pm-entitlement.ts` exposes:
- `tierToPlanType(tier)` — pure mapping function.
- `maxMembersForTier(tier, fallbackPlanType)` — hard ceiling, uses `tier.max_total_members` when available.
- `resolveEntitlementFromRow(admin, member)` — returns `{ tier, isFamilyEntitled, maxMembers, planTypeCanonical, planTypeLegacy, hasDrift, usedLegacyFallback }`.
- `resolveMemberEntitlement(admin, userId)` — convenience lookup from user id.

Any new surface that needs to decide "is this user Family-entitled?" / "how many household members are allowed?" MUST go through this helper. Do not re-derive the rule per route.

### Routes updated (Task 02 + Task 03)

| File | Change |
|---|---|
| `src/lib/community/pm-entitlement.ts` | **New** — shared helper (see above). |
| `src/app/api/community/plan/change-tier/confirm/route.ts` | Writes `plan_type` alongside `pm_tier_id` after Stripe success. |
| `src/app/api/stripe/webhooks/route.ts` | Conversion handler + checkout handler both derive `plan_type` from the resolved tier's `name`; logs when Stripe metadata and canonical tier disagree. |
| `src/app/api/community/onboarding/complete/route.ts` | Safeguard: refuses to downgrade `plan_type` to `individual` when the existing `pm_tier_id` resolves to a Family tier. |
| `src/app/api/community/family/route.ts` | **Rewritten.** `GET` returns `entitlement: { isFamilyEntitled, tierId, tierName, maxMembers, hasLegacyDrift }`. `POST` enforces canonical `isFamilyEntitled` with 403, and uses `tier.max_total_members - 1` as the household-size ceiling. |
| `src/app/api/community/subscription/route.ts` | Derives `plan_type`, `plan_label`, `amount`, `max_members` from the canonical tier when available. Falls back to the legacy maps only when no tier is resolved (MS / admin-provisioned). |
| `src/app/community/family/page.tsx` | Reads `entitlement` from the API instead of legacy `planType`. Shows the "Individual Plan" banner only when entitlement is resolved AND not Family-entitled (avoids flashing on load). Uses `tier.max_total_members - 1` as the displayed family limit. |

### Routes intentionally left alone (audit §6)

- `/api/admin/pm-plan-tiers/*` — already canonical.
- `/api/community/plan/change-tier/preview` — already reads `pm_tier_id`.
- `/api/community/onboarding/prefill` — read-only prefill, pre-Stripe.
- `/lib/mystery-school/finalize-checkout.ts` — MS has no Family semantics.
- `/api/cron/community-renewal-reminders` — email copy only, low priority.
- `/api/admin/mandalism/members/route.ts`, `/lib/perennial/household-provisioning.ts`, `/api/community/members/create/route.ts` — admin-provisioned / sub-member write paths that don't touch `pm_tier_id`. These members live in the legacy-fallback branch until run through a Stripe flow; backfill can optionally repair them (out of scope here).

### Migration added (Task 04)

- **`20260423000002_backfill_plan_type_from_pm_tier`** — repairs rows where `pm_tier_id` is set and `plan_type` disagrees with the canonical mapping. Idempotent; running twice is a no-op after the first run. Apply AFTER Tasks 02 + 03 are deployed (runtime fixes must land first so new writes don't immediately regenerate drift).

Available via:
- Admin UI: `/admin/db/migrations` → "Backfill legacy plan_type from canonical pm_tier_id".
- Supabase SQL editor: paste `supabase/migrations/20260423000002_backfill_plan_type_from_pm_tier.sql`.

Watch the NOTICE output for two counts:
- `repaired N community_members rows` — expected after first run, should be 0 on re-runs.
- `N community_members rows reference a pm_tier_id that does not exist` — flagged for manual review; usually means a tier row was deleted.

### Known unsupported tier-name edge cases

- Any future tier named something other than exactly "Individual" or "Family" (e.g. "Couple", "Extended") currently maps to `plan_type = 'individual'` because only the literal `'family'` name flips the flag. If you add a new family-capable tier, either call it "Family" or extend `tierToPlanType()` to match the new name.
- When a tier is inactive (`is_active = false`), the helper still resolves it but logs a warning — the member's entitlement is kept until they migrate off it.
- `stripe_customer_id` and `stripe_subscription_id` on checkout completion are NOT backfilled by Task 04's migration — that's a different sync story.

---

## QA Checklist

Run through this after deploying Tasks 02–04 to preview.

### Upgrade (Individual → Family)

- [ ] Sign in as an Individual-tier PM member.
- [ ] Go to `/community/plan` and confirm "Individual" is shown.
- [ ] Visit `/community/family` — "Individual Plan" banner appears; empty state says "Upgrade to the Family Plan to add family members."
- [ ] Run the upgrade flow through `/api/community/plan/change-tier/preview` → `/confirm` (or the Stripe-checkout route for a no-sub user).
- [ ] Stripe returns success; check the DB:
  - `community_members.pm_tier_id` = Family tier id ✓
  - `community_members.plan_type` = `'family'` ✓
- [ ] Hit `/api/community/plan` — `plan.tier.name` = "Family".
- [ ] Hit `/api/community/subscription` — `subscription.plan_type = 'family'`, `subscription.max_members` = tier's `max_total_members`, `subscription.amount` = tier's `base_price_usd`.
- [ ] Hit `/api/community/family` — `entitlement.isFamilyEntitled = true`, `entitlement.tierName = 'Family'`, `entitlement.maxMembers` = tier's `max_total_members`.
- [ ] Refresh `/community/family` — "Individual Plan" banner is gone; empty state says "Add up to N family members..." where N = `max_total_members − 1`.
- [ ] Add a family member via the UI — POST succeeds, row appears.

### Downgrade (Family → Individual)

- [ ] Sign in as a Family-tier PM member.
- [ ] Remove any existing family members (they must be ≤ target tier's `max_total_members`).
- [ ] Run the downgrade via `/api/community/plan/change-tier/confirm` with `target_tier_id` = Individual.
- [ ] Stripe returns success; check the DB:
  - `community_members.pm_tier_id` = Individual tier id ✓
  - `community_members.plan_type` = `'individual'` ✓  ← **this is the key fix** (used to remain `'family'`)
- [ ] Hit `/api/community/plan` — `plan.tier.name` = "Individual".
- [ ] Hit `/api/community/subscription` — `subscription.plan_type = 'individual'`.
- [ ] Hit `/api/community/family` — `entitlement.isFamilyEntitled = false`.
- [ ] Refresh `/community/family` — "Individual Plan" banner appears; "Upgrade..." copy visible.
- [ ] Try `POST /api/community/family` directly — returns **403** with `code: "not_family_entitled"`. UI button hiding is belt; API is braces.

### Bad data (pre-fix drift)

Set up a row manually in Supabase SQL:
```sql
UPDATE community_members
SET pm_tier_id = (SELECT id FROM pm_plan_tiers WHERE name = 'Family'),
    plan_type  = 'individual'
WHERE user_id = '<test-user>';
```
- [ ] Before running the backfill migration: `/api/community/family` returns `entitlement.isFamilyEntitled = true` (because the canonical resolver trusts the tier) AND `entitlement.hasLegacyDrift = true`. The server-side POST gate already works. Server logs include `[community/family] entitlement drift on member <id>`.
- [ ] Run migration `20260423000002_backfill_plan_type_from_pm_tier`.
- [ ] Re-query — `plan_type = 'family'`, drift cleared.
- [ ] Re-run the migration — NOTICE says "repaired 0 community_members rows."

### Onboarding safeguard

- [ ] As a Family-tier PM member, re-submit the onboarding form with a selected plan that computes `householdLimit === 0` (e.g. `plan_pm_individual`).
- [ ] Before this fix, `plan_type` flipped to `'individual'`. Now the route should keep `plan_type = 'family'` and log: `[onboarding/complete] refusing to downgrade plan_type...`.
- [ ] `pm_tier_id` is untouched.

### Regression / existing flows

- [ ] Existing Stripe billing portal still opens.
- [ ] Tier preview + tier confirm flow unchanged for Individual↔Family round trip.
- [ ] Stripe webhook processing for brand-new PM checkouts still creates a `community_members` row with matching `pm_tier_id` + `plan_type`.
- [ ] MS enrollment still writes `plan_type = 'individual'` (MS has no Family semantics).
- [ ] Family member editing and deletion (`PATCH`/`DELETE` routes) still work.
- [ ] MembershipCard displays the correct plan label after refresh (driven by `/api/community/subscription`).
- [ ] Admin pages that list members (`/admin/mandalism/members`, `/api/admin/pm-plan-tiers/*`) are unchanged.

### Payment failure / rollback

- [ ] Trigger a Stripe checkout that fails (use a declining test card).
- [ ] DB: `pm_tier_id` and `plan_type` unchanged — no entitlement granted before success.
- [ ] Refresh `/api/community/family` — state is pre-attempt.

---

## Typecheck

Scoped `tsc --noEmit` across:

- `src/lib/community/pm-entitlement.ts`
- `src/lib/db/migrations.ts`
- `src/data/migrations/20260423000002_backfill_plan_type_from_pm_tier.ts`
- `src/app/api/community/family/route.ts`
- `src/app/api/community/subscription/route.ts`
- `src/app/api/community/plan/route.ts`
- `src/app/api/community/plan/change-tier/confirm/route.ts`
- `src/app/api/community/onboarding/complete/route.ts`
- `src/app/api/stripe/webhooks/route.ts`
- `src/app/community/family/page.tsx`
- `src/components/community/membership-card.tsx`

Result: 0 errors.

## Acceptance Criteria

### Task 02
- [x] Successful PM tier changes update both canonical tier state AND the compatible legacy plan flag.
- [x] Checkout/webhook success paths do not leave `pm_tier_id` and `plan_type` mismatched.
- [x] Failed or abandoned payments still leave plan state unchanged (Stripe-first write ordering preserved).
- [x] Downgrade flows do not leave stale Family legacy state behind.

### Task 03
- [x] Family page no longer shows the Individual upgrade banner for truly entitled Family users (gate changed from `planType === 'individual'` to `!entitlement.isFamilyEntitled` after entitlement loads).
- [x] Empty state copy is correct for both Individual and Family users.
- [x] Add-member actions are shown only when entitlement allows them.
- [x] Family-member creation is blocked server-side for non-Family users (`POST /api/community/family` returns 403 with `code: "not_family_entitled"`).
- [x] `/api/community/family` and `/api/community/subscription` do not disagree about Family entitlement for the same user (both go through `resolveEntitlementFromRow`).

### Task 04
- [x] Existing mismatched PM member rows are repaired safely (CTE joins to `pm_plan_tiers`, filters on drift only).
- [x] Running the migration twice does not create new changes (NOTICE shows 0 repaired on re-run).
- [x] Rows with unknown tier mapping are preserved and flagged for manual review (separate NOTICE with count).
- [x] After repair, legacy `plan_type` matches canonical PM tier intent for repaired rows.

### Task 05
- [x] Upgrade path documented with specific API/DB assertions.
- [x] Downgrade path documented (including the 403 server-side gate assertion).
- [x] Bad-data / backfill path documented with the pre-fix drift artifact to set up.
- [x] Onboarding safeguard test documented.
- [x] Regression checklist includes MS, admin, portal, and sub-member paths.
