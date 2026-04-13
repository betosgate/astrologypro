# Fix Perennial Community Webhook Provisioning — 2026-04-13

- Status: Done
- Priority: P0
- Owner: Backend
- Depends on: **Task 06 must be completed first** — task 06 rewrites `src/app/api/stripe/checkout/route.ts` and sets `metadata.type = "perennial_community_signup"` based on `itemKey`. Do not touch `checkout/route.ts` in this task.
- Scope: `src/app/get-started/page.tsx`, `src/app/api/stripe/webhooks/route.ts`, DB migration
- Estimate: 0.5 day

---

## Goal

When a user selects a `perennial_mandalism_community` plan on `/get-started` and completes Stripe checkout, the system must:
1. Store `role: "perennial_mandalism"` in Supabase auth user metadata at signup
2. Provision a minimal `community_members` DB record — not a `diviners` record — via the Stripe webhook
3. All additional data (household members, birth data, 25-field questionnaire) is collected in the post-login onboarding gate (task 04)

## Completion Notes

- `src/app/get-started/page.tsx` already derives `isPerennial` from `plan?.itemKey === "perennial_mandalism_community"` and submits `role: "perennial_mandalism"` for perennial signups.
- `src/app/api/get-started/signup/route.ts` already accepts `role: "perennial_mandalism"` and persists it in Supabase auth user metadata during account creation.
- `src/app/api/stripe/webhooks/route.ts` already contains `handlePerennialCommunitySignupCheckoutCompleted()` plus a `session.metadata?.type === "perennial_community_signup"` route guard, so the new get-started flow provisions `community_members` instead of falling through to diviner provisioning.
- The required `community_members.onboarding_completed` support is already present in the repo migration set at `supabase/migrations/20260413000012_community_onboarding_completed.sql`.
- The old `/perennial-signup` flow remains separate and unchanged, which matches the task requirement.

---

## Architecture Context

The old `/perennial-signup` page collected all household data before payment. The new architecture collects only basic fields (email, name, password, username) at signup — same as all other plans. Detailed perennial data is collected after login via the onboarding gate (task 04).

The existing `handlePerennialSignupCheckoutCompleted()` webhook handler (old multi-member flow via `pending_perennial_signups`) must not be modified — it is still used by direct visits to `/perennial-signup`.

---

## What Task 06 Handles (do not duplicate)

Task 06 rewrites `src/app/api/stripe/checkout/route.ts` to:
- Use only `pricing_plans` DB fields — no env vars
- Set `metadata.type = "perennial_community_signup"` automatically when `itemKey === "perennial_mandalism_community"`
- Correctly handle PM plans which have `stripe_price_id` only (no `onetime_amount`) → `subscription` mode from first month

This task only handles the `get-started` page role fix and the webhook provisioning handler.

---

## Verified Current Code — What Is Broken

### `src/app/get-started/page.tsx`

- **Lines 296–308**: `supabase.auth.signUp()` always stores `role: "diviner"` for all plans. A perennial user gets `role: "diviner"` — wrong. Should be `role: "perennial_mandalism"`.
- Role fix is applied in this task alongside the trainee role fix (same lines, coordinate with task 01).

### `src/app/api/stripe/webhooks/route.ts`

- **Line 662**: Routes `type === "perennial_signup"` → `handlePerennialSignupCheckoutCompleted()` — this is the old multi-member flow only.
- No check for `type === "perennial_community_signup"` (the new get-started flow).
- Falls to default diviner provisioning → upserts `diviners` table.
- `community_members` record is **never created**.

### `src/types/user.ts`

- `perennial_mandalism` is already defined as a `UserRole` → maps to `/community`. No change needed.

### `src/app/api/auth/post-login-redirect/route.ts`

- **Lines 83–106**: Only explicitly gates `role === "diviner"`. For `role === "perennial_mandalism"`, falls to `getRoleDestination` at line 109 → `/community` with no onboarding gate.
- The onboarding gate is handled in task 04.

### `community_members` table

- Does **not** yet have an `onboarding_completed` column. The webhook handler in this task sets it — the migration below (Step 0) must run before deploying this webhook handler.

---

## Required Changes

### Step 0 — DB migration (run before deploying webhook changes)

Add `onboarding_completed` column to `community_members` table. Create a new migration file in `src/data/migrations/`:

```sql
ALTER TABLE community_members
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Back-fill: existing fully-provisioned members from the old /perennial-signup flow
-- have intake_data already filled — mark them as completed
UPDATE community_members
SET onboarding_completed = true
WHERE intake_data IS NOT NULL AND intake_data != '{}'::jsonb;
```

Run via Supabase CLI (project ref: `wyluvclvtvwptsvvtgkv`) or `scripts/run-migration.js`.

### 1. `src/app/get-started/page.tsx`

Role fix is shared with task 01 — apply both in one pass. See task 01 for the full code change. Summary:

```typescript
const isTraineeOnly = plan?.itemKey === "trainee_program";
const isPerennial = plan?.itemKey === "perennial_mandalism_community";

// role in signUp:
role: isTraineeOnly ? "trainee" : isPerennial ? "perennial_mandalism" : "diviner"
```

### 2. `src/app/api/stripe/webhooks/route.ts`

**Add new handler function** (place near `handleCommunityCheckoutCompleted`):

```typescript
async function handlePerennialCommunitySignupCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  const supabase = createAdminClient();
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!userId) {
    console.error("[Webhook] perennial_community_signup: missing userId", session.metadata);
    return;
  }

  const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
  const email = authUser?.email ?? "";
  const fullName = (authUser?.user_metadata?.name as string) ?? null;

  // Minimal row — detailed data collected post-login (task 04)
  const { error } = await supabase.from("community_members").upsert(
    {
      user_id: userId,
      email,
      full_name: fullName,
      membership_type: "perennial_mandalism",
      membership_status: "active",
      plan_type: "individual",        // updated to correct type in onboarding gate (task 04)
      stripe_subscription_id: subscriptionId ?? null,
      joined_at: new Date().toISOString(),
      onboarding_completed: false,    // gates the onboarding flow in task 04
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[Webhook] perennial_community_signup: failed to upsert community_members:", error);
  }

  // Affiliate commission
  const affiliateCode = session.metadata?.affiliateCode;
  if (affiliateCode) {
    const amountTotal = (session.amount_total ?? 0) / 100;
    recordSignupAffiliateCommission(
      affiliateCode,
      amountTotal,
      `perennial-community-signup:${session.id}`,
      "subscription"
    );
  }
}
```

**In `handleCheckoutCompleted`**, add routing check after the existing `perennial_signup` check:

```typescript
if (session.metadata?.type === "perennial_community_signup") {
  return handlePerennialCommunitySignupCheckoutCompleted(session);
}
```

---

## Files to Change

| File | Change |
|---|---|
| `src/app/get-started/page.tsx` | Set correct `role` for perennial (coordinate with task 01 — same lines) |
| `src/app/api/stripe/webhooks/route.ts` | Add `handlePerennialCommunitySignupCheckoutCompleted()` and routing check |

**Do not change:**
- `src/app/api/stripe/checkout/route.ts` — owned by task 06
- `src/app/perennial-signup/page.tsx` — old multi-member flow, keep intact
- `src/app/api/perennial-signup/checkout/route.ts` — old flow, keep intact
- Existing `handlePerennialSignupCheckoutCompleted()` — old flow, keep intact

---

## Acceptance Criteria

- [ ] Purchasing `perennial_mandalism_community` from `/get-started` creates a `community_members` row with `membership_type: "perennial_mandalism"` and `membership_status: "active"`
- [ ] No `diviners` row is created for a perennial purchase
- [ ] Supabase auth user has `role: "perennial_mandalism"` in `user_metadata`
- [ ] After login, user routes to `/community` (existing `ROLE_DESTINATIONS` already handles this)
- [ ] Webhook upsert is idempotent
- [ ] Old `/perennial-signup` multi-member flow (`type === "perennial_signup"`) is unaffected
- [ ] All other plan types are unaffected
