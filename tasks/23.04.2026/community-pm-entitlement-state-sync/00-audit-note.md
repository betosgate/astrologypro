# Task 01 — Audit Note: Canonical PM Entitlement Source

- Status: Complete
- Produced: 23.04.2026
- Related task: `01-audit-canonical-pm-entitlement-source.md`

This note is the handoff contract for Tasks 02–04. Don't re-decide the canonical rule; follow this.

---

## 1. Canonical source

**`community_members.pm_tier_id` → `pm_plan_tiers` row is the canonical source of PM entitlement.**

Reasons:
- It is the only column that links a member to the real tier data (base price, base_member_limit, max_total_members, stripe_price_id, stripe_extra_price_id). `plan_type` is a flat string that cannot carry that.
- Every money-critical write (`change-tier/confirm`, Stripe webhook conversion handler) already writes `pm_tier_id` after Stripe returns success. The `plan_type` field is written in some places but is never gated on a Stripe result as cleanly.
- Admin-configurable tiers (`/admin/pm-plan-tiers/*`) are only meaningful through `pm_tier_id`. Anything reading `plan_type` misses admin-configured tiers entirely.

## 2. Legacy compatibility field

**`community_members.plan_type` ∈ {"individual", "family"}** — keep reading it from surfaces listed in §4 until Task 04 backfills have run. Do not remove the column in this bundle.

### Mapping rule (tier → plan_type)

Derived from the current `pm_plan_tiers` seed (`supabase/migrations/20260406000009_pm_plan_tiers.sql`):

```
tier.name ILIKE 'Family'   → plan_type = 'family'
everything else            → plan_type = 'individual'
```

Any future tier whose `name` is neither "Individual" nor "Family" (e.g. a hypothetical "Couple" or "Extended") must map to `plan_type = 'family'` if its `base_member_limit > 1`, otherwise `individual`. Log at write time when an unrecognized tier name is encountered so we can spot it.

## 3. Entitlement derivation rules (code this rule in Task 02/03 exactly)

Given the canonical `pm_tier_id` → `pm_plan_tiers` row:

```
tier              := SELECT * FROM pm_plan_tiers WHERE id = community_members.pm_tier_id AND is_active = true
isFamilyEntitled  := tier IS NOT NULL AND tier.base_member_limit > 1
maxMembers        := COALESCE(tier.max_total_members, planType === 'family' ? 5 : 1)
basePriceUsd      := COALESCE(tier.base_price_usd, legacy PLAN_AMOUNTS map)
extraMemberPrice  := COALESCE(tier.extra_per_member_usd, 0)
```

Fallback (tier row not found / pm_tier_id NULL):
- `isFamilyEntitled := plan_type === 'family'`
- `maxMembers := plan_type === 'family' ? 5 : 1`
- Log a warning (already done in `/api/community/plan/route.ts:123`). Task 04 backfill will shrink this fallback path over time.

### UI copy rules derived from the above

- Individual entitlement (`!isFamilyEntitled`): upgrade-to-Family banner is allowed.
- Family entitlement AND zero members: hide upgrade banner; show "add your first member" guidance.
- Family entitlement AND members present: no upgrade banner; show member list.
- Server-side must re-enforce entitlement on any family-member write (see Task 03).

## 4. Every known read site

### Reads `pm_tier_id` (already canonical-aware — leave alone or light refactor only)

| File | Line | Purpose |
|---|---|---|
| `src/app/api/community/plan/route.ts` | 49, 118 | Resolves member's tier, derives UI pricing. Logs when `pm_tier_id` is invalid. Already canonical. |
| `src/app/api/community/plan/change-tier/preview/route.ts` | 72 | Tier-change preview. Canonical. |
| `src/app/api/community/plan/change-tier/confirm/route.ts` | 62, 225 | Tier-change commit. Canonical write. |
| `src/app/api/community/plan/change-tier/checkout/route.ts` | 51 | Checkout for one-time → recurring conversion. Canonical. |
| `src/app/api/admin/pm-plan-tiers/route.ts` | 30 | Admin count per tier. |
| `src/app/api/admin/pm-plan-tiers/[id]/route.ts` | 125 | Admin count per tier on delete. |
| `src/app/community/page.tsx` | 184, 291, 295 | Loads `pm_tier_id` and joins to `pm_plan_tiers` for membership card. Mostly canonical but also falls back to `plan_type` (line 208, 429). |
| `src/app/community/plan/page.tsx` | 340 | Comment only. |

### Reads `plan_type` (must be updated in Task 03 to derive from canonical source)

| File | Line | Purpose | Action |
|---|---|---|---|
| `src/app/api/community/family/route.ts` | 19, 46 | `getMember()` selects `plan_type`, returns `planType` in payload. **Gate for family-member create/list messaging is 100% `plan_type`.** | **Rewrite to use canonical derivation. Enforce `isFamilyEntitled` server-side before `POST`.** |
| `src/app/api/community/subscription/route.ts` | 66, 79, 123 | Returns `plan_type`, `plan_label`, `amount`, `max_members` to the MembershipCard. | **Rewrite to derive `isFamilyEntitled`, `maxMembers`, `plan_label` from `pm_tier_id` and fall back to `plan_type` only if tier is unresolved.** |
| `src/app/community/family/page.tsx` | 66, 82, 148, 173, 372, 389 | Frontend gate on `planType === 'family'` and `planType === 'individual'` banner. | **Change the fetched field to `isFamilyEntitled` from the rewritten `/api/community/family`. Do not compute entitlement from member count.** |
| `src/components/community/membership-card.tsx` | 17, 75 | Displays plan label + badge from `subscription.plan_type`. | Becomes correct automatically once `/api/community/subscription` returns the right `plan_type` (derived from canonical). No direct change required, but verify with Task 05. |
| `src/app/community/page.tsx` | 208, 426–441, 451, 898 | Derives `membershipSubscription` payload and `maxMembers`. Already partially canonical (uses `pmTier` when present) — **keep the tier-first derivation, fall back to `plan_type` when tier is null**. | Nudge to use the same `deriveEntitlement()` helper from Task 03 for consistency. |
| `src/app/community/onboarding/page.tsx` | 224, 313 | Onboarding prefills `plan_type === 'family'` to pick a default plan card. | Leave as-is; onboarding is before Stripe commit so canonical tier doesn't exist yet. |
| `src/app/api/community/onboarding/prefill/route.ts` | 27 | Selects `plan_type` for the onboarding form prefill. | Leave as-is — prefill only. |

### Writes `pm_tier_id`

| File | Line | Timing | Notes |
|---|---|---|---|
| `src/app/api/stripe/webhooks/route.ts` | 198 | After Stripe conversion success | Canonical. |
| `src/app/api/stripe/webhooks/route.ts` | 283 | After Stripe checkout success | Canonical; resolves via `pm_plan_tiers ILIKE name` when `target_tier_id` metadata is missing. |
| `src/app/api/community/plan/change-tier/confirm/route.ts` | 225 | After `stripe.subscriptionItems.update` success | Canonical. |

### Writes `plan_type` (Task 02 must keep these in sync with the tier write)

| File | Line | Timing | Notes |
|---|---|---|---|
| `src/app/api/stripe/webhooks/route.ts` | 280 | PM checkout upsert | Gets `planType` from Stripe metadata. **Task 02: after this write, `plan_type` must equal the mapping rule in §2 for the resolved tier. If the tier resolution and the metadata disagree, log and trust the tier.** |
| `src/app/api/stripe/webhooks/route.ts` | 328, 911 | MS checkout and new-user default | Hardcoded `"individual"`. OK — neither touches `pm_tier_id`. |
| `src/app/api/community/onboarding/complete/route.ts` | 296 | Onboarding save | Writes `plan_type` from the `HOUSEHOLD_LIMITS` lookup against `selected_plan_id`. **⚠ RISK (§5 #2)** — does not touch `pm_tier_id`. Can overwrite a paid Family `plan_type` back to `individual` if the user re-runs onboarding after a downgrade-like intake change. |
| `src/lib/perennial/household-provisioning.ts` | 279 | Household provision for admin-created accounts | Writes `plan_type` but never sets `pm_tier_id`. **Task 02/03 note: these members will always land in the "tier unresolved → fall back to plan_type" path until someone runs them through a Stripe flow.** |
| `src/app/api/community/members/create/route.ts` | 156 | Admin-created sub-member | Copies the primary's `plan_type`, does not set `pm_tier_id`. Safe — sub-members don't have their own subscription. |
| `src/app/api/admin/mandalism/members/route.ts` | 261 | Admin manual create | Writes `plan_type` from the form. No `pm_tier_id` write. |
| `src/lib/mystery-school/finalize-checkout.ts` | 54 | MS checkout | Hardcoded `"individual"`. |

### **Task 02 must not break these write paths.** It should only add `plan_type` sync alongside existing `pm_tier_id` writes in:
- `src/app/api/community/plan/change-tier/confirm/route.ts:225`
- `src/app/api/stripe/webhooks/route.ts:198` (conversion handler)
- `src/app/api/stripe/webhooks/route.ts:283` (checkout handler — already writes both; verify the mapping)

And must NOT touch `plan_type` writes that happen before Stripe success (onboarding, household provisioning, admin manual create) beyond adding logging when the write disagrees with the canonical tier.

## 5. Known stale-state / risk points

1. **Downgrade doesn't clear `plan_type`.** A member goes Individual → Family (both fields updated). Then Family → Individual via `change-tier/confirm` (only `pm_tier_id` updated, `plan_type` still says `"family"`). Result: `/api/community/family` still grants access. **Task 02 fix: confirm route must also write the derived `plan_type`.**
2. **Onboarding re-run can stomp on paid state.** `onboarding/complete/route.ts:296` writes `plan_type = "individual"` whenever `householdLimit === 0`. If a user who already upgraded to Family on Stripe somehow re-hits onboarding, this flips `plan_type` back to `individual` without touching `pm_tier_id` — canonical tier stays Family, legacy plan flag says individual. Creates the exact "banner says Individual but family members exist" bug from Task 03. **Task 02 fix: if `pm_tier_id` is already set to a Family tier, do NOT downgrade `plan_type`.**
3. **Household-provisioning members have no `pm_tier_id`.** Admin-created households via `/lib/perennial/household-provisioning.ts` set `plan_type` but never a tier. They always fall into the legacy-`plan_type` branch. Mention this in the Task 04 backfill so it can optionally set `pm_tier_id` for them by looking up the "Family" tier id.
4. **Tier name vs plan_type value semantic drift.** `pm_plan_tiers.name = 'Family'` → we expect `plan_type = 'family'`. But the seeded `Individual` tier allows up to 3 members (and `base_member_limit = 3`), which is plan-type-Family capable in a naive `base_member_limit > 1` reading. Task 02/03 must pick the name-based rule (§2) and document it in code, not a count-based rule — otherwise any Individual tier with a non-1 seat limit will be treated as Family.
5. **MembershipCard defaults the `plan_type` on backend outage.** `/api/community/subscription` line 79 defaults `plan_type` to `"individual"` when the member row's value is null. After Task 03 rewrites this to derive from `pm_tier_id`, make sure the fallback when `pm_tier_id` is ALSO null remains `individual` (safe default — doesn't grant family access).
6. **`/api/community/family` has no server-side entitlement enforcement on `POST`.** Only `membership_status === 'active'` is checked (line 57). Any active member hitting the POST can create family_members up to `FAMILY_PLAN_LIMIT = 5`, even Individual-tier ones, if they bypass the UI. **Task 03 must add canonical `isFamilyEntitled` gate on `POST` before insert.**
7. **Legacy `FAMILY_PLAN_LIMIT = 5` vs tier `max_total_members`.** `family/route.ts` hardcodes 5. `pm_plan_tiers.max_total_members` for the seeded Family tier is 15. Numbers disagree. Task 03 should use `tier.max_total_members` when available and fall back to 5 only if tier is unresolved.
8. **`subscription/route.ts` hardcodes PLAN_AMOUNTS.** Stripe prices on `pm_plan_tiers.base_price_usd` are the source of truth ($19.95 Individual / $34.95 Family per seed). The hardcoded `{individual: 9.97, family: 19.97}` is stale. Not in scope for this bundle, but flag for later cleanup.

## 6. Routes safe to leave alone

- `/api/admin/pm-plan-tiers/*` — admin-only, already canonical.
- `/api/community/plan/change-tier/preview` — already reads `pm_tier_id`.
- `/api/community/onboarding/prefill` — read-only prefill, runs before any Stripe state exists.
- `/lib/mystery-school/finalize-checkout.ts` — MS-only, `plan_type` is hardcoded `individual` and MS does not have Family entitlement semantics.
- `/api/cron/community-renewal-reminders` — email copy only, stale `plan_type` produces wrong-label emails but no entitlement consequence. Low priority; can be updated in a follow-up.

## 7. Implementation note for Tasks 02–04 (keep under 5 bullets)

- **Single helper to derive entitlement.** Add `src/lib/community/pm-entitlement.ts` exporting `resolvePmEntitlement(memberId)` that returns `{ tier, isFamilyEntitled, maxMembers, planTypeCanonical }`. Use it in `/api/community/family`, `/api/community/subscription`, and any other rewrite.
- **Task 02: only sync `plan_type` alongside the two canonical `pm_tier_id` writes.** Change-tier confirm and Stripe webhook conversion. Don't touch pre-success write paths.
- **Task 02: onboarding safeguard.** In `onboarding/complete/route.ts`, if `pm_tier_id` already resolves to a Family tier, don't downgrade `plan_type` to `individual` — log and skip that field.
- **Task 03: enforce server-side.** `POST /api/community/family` must reject when `!isFamilyEntitled` with 403, not 422.
- **Task 04: backfill rule.** `UPDATE community_members SET plan_type = <mapping from tier.name> WHERE pm_tier_id IS NOT NULL AND derived_plan_type <> plan_type`. Skip rows where `pm_tier_id` is NULL. Idempotent.

## 8. Acceptance checklist against Task 01

- [x] Canonical PM entitlement source is `community_members.pm_tier_id` (§1).
- [x] Every known read/write path is listed (§4).
- [x] Legacy compatibility field (`plan_type`) and its mapping rule are documented (§2).
- [x] Routes to update, routes safe to leave alone are separated (§4, §6).
- [x] Upgrade/downgrade stale-state risk points are explicit (§5).
- [x] Tasks 02–04 can proceed without re-deciding the contract (§3, §7).
- [x] No schema changes or runtime behavior changes made in this pass (audit only).
