# Fix Trainee Program Webhook Provisioning — 2026-04-13

- Status: Done
- Priority: P0
- Owner: Backend
- Depends on: **Task 06 must be completed first** — task 06 rewrites `src/app/api/stripe/checkout/route.ts`. The `metadata.type` tag for trainee routing is set inside that rewritten route based on `itemKey`. Do not touch `checkout/route.ts` in this task.
- Scope: `src/app/get-started/page.tsx`, `src/app/api/stripe/webhooks/route.ts`
- Estimate: 0.5 day

---

## Goal

When a user selects a `trainee_program` plan and completes Stripe checkout, the system must:
1. Store `role: "trainee"` in the Supabase auth user metadata at signup
2. Provision a `trainees` DB record — not a `diviners` record — via the Stripe webhook

## Completion Notes

- `src/app/get-started/page.tsx` already derives `isTraineeOnly` from `plan?.itemKey === "trainee_program"` and submits `role: "trainee"` for trainee-only signups.
- `src/app/api/get-started/signup/route.ts` already accepts `role: "trainee"` and persists it into Supabase auth user metadata during account creation.
- `src/app/api/stripe/webhooks/route.ts` already contains `handleTraineeSignupCheckoutCompleted()` plus a `session.metadata?.type === "trainee_signup"` route guard, so trainee purchases provision `trainees` instead of falling through to diviner provisioning.
- The post-login onboarding gate for trainees remains a separate concern and is still covered by task `03`.

---

## What Task 06 Handles (do not duplicate)

Task 06 rewrites `src/app/api/stripe/checkout/route.ts` to:
- Use only `pricing_plans` DB fields (`onetime_amount`, `stripe_price_id`) — no env vars
- Set `metadata.type = "trainee_signup"` automatically when `itemKey === "trainee_program"`

This task only handles the `get-started` page role fix and the webhook provisioning handler.

---

## Verified Current Code — What Is Broken

### `src/app/get-started/page.tsx`

- **Line 294**: Only checks `isCombo = plan?.itemKey === "trainee_diviner_bundle"`. No check for `trainee_program`.
- **Lines 296–308**: `supabase.auth.signUp()` always stores `role: "diviner"` for all plans. A trainee user gets `role: "diviner"` — wrong.

### `src/app/api/stripe/webhooks/route.ts`

- **Lines 650–674**: `handleCheckoutCompleted()` has no routing check for `type === "trainee_signup"`.
- Falls through to default diviner provisioning at line 704 → upserts `diviners` table.
- A `trainees` record is **never created**.

### `src/app/api/auth/post-login-redirect/route.ts`

- **Lines 83–106**: Only explicitly handles `role === "diviner"`. For `role === "trainee"`, falls to `getRoleDestination` at line 109 → returns `/trainee` with no onboarding gate check.
- The onboarding gate for trainees is handled in task 03.

---

## Reference — Correct Pattern (combo bundle)

- **`src/app/api/stripe/webhooks/route.ts` line 667**: `if (session.metadata?.itemKey === "trainee_diviner_bundle") → handleComboBundleCheckoutCompleted()`
- **Lines 490–507**: combo handler upserts `trainees` with `{ user_id, name, email, username, training_status: "active", onboarding_completed: false }`

This task follows the same pattern for trainee-only (no `diviners` record).

---

## Required Changes

### 1. `src/app/get-started/page.tsx`

**At line 294**, extend plan-type detection:

```typescript
// BEFORE
const isCombo = plan?.itemKey === "trainee_diviner_bundle";

// AFTER
const isCombo = plan?.itemKey === "trainee_diviner_bundle";
const isTraineeOnly = plan?.itemKey === "trainee_program";
const isPerennial = plan?.itemKey === "perennial_mandalism_community";
```

**At lines 296–308**, set `role` based on plan type:

```typescript
options: {
  data: {
    name: name.trim(),
    username,
    role: isTraineeOnly
      ? "trainee"
      : isPerennial
      ? "perennial_mandalism"
      : "diviner",
    plan: selectedPlan,
    isCombo,
  },
},
```

> Note: `isPerennial` role fix is also included here since both tasks 01 and 02 modify the same `get-started` page lines. Coordinate to avoid duplicate edits — apply both role changes in one pass.

### 2. `src/app/api/stripe/webhooks/route.ts`

**Add new handler function** (place near `handleComboBundleCheckoutCompleted`):

```typescript
async function handleTraineeSignupCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  const supabase = createAdminClient();
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;

  if (!userId) {
    console.error("[Webhook] trainee_signup: missing userId", session.metadata);
    return;
  }

  const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
  const email = authUser?.email ?? "";
  const username = (authUser?.user_metadata?.username as string) ?? "";
  const displayName =
    (authUser?.user_metadata?.name as string) ?? email.split("@")[0] ?? "Trainee";

  const { error } = await supabase.from("trainees").upsert(
    {
      user_id: userId,
      name: displayName,
      email,
      username,
      training_status: "active",
      onboarding_completed: false,
      ...(planId ? { plan_id: planId } : {}),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[Webhook] trainee_signup: failed to upsert trainees record:", error);
  }
}
```

**In `handleCheckoutCompleted`**, add routing check after the `trainee_diviner_bundle` check:

```typescript
if (session.metadata?.type === "trainee_signup") {
  return handleTraineeSignupCheckoutCompleted(session);
}
```

---

## Files to Change

| File | Change |
|---|---|
| `src/app/get-started/page.tsx` | Detect `isTraineeOnly` + `isPerennial`; set correct `role` in auth metadata |
| `src/app/api/stripe/webhooks/route.ts` | Add `handleTraineeSignupCheckoutCompleted()` and routing check |

**Do not change:**
- `src/app/api/stripe/checkout/route.ts` — owned by task 06

---

## Acceptance Criteria

- [ ] Purchasing `trainee_program` creates a `trainees` row with `training_status: "active"`
- [ ] No `diviners` row is created for a `trainee_program` purchase
- [ ] Supabase auth user has `role: "trainee"` in `user_metadata`
- [ ] Webhook upsert is idempotent — re-firing does not duplicate rows
- [ ] `trainee_diviner_bundle` (combo) behavior is unchanged
- [ ] `professional_divination_course` behavior is unchanged
