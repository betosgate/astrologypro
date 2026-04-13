# Fix Plan Pricing — Remove Env Vars, Use pricing_plans DB Only — 2026-04-13

- Status: Done
- Priority: P0
- Owner: Backend / Full-stack
- Scope: `src/app/api/stripe/checkout/route.ts`, `src/app/api/stripe/upgrade/route.ts`, `src/lib/stripe/billing.ts`, `src/app/dashboard/settings/page.tsx`, `pricing_plans` DB table
- Estimate: 1 day

---

## Goal

All plan pricing (amounts, Stripe price IDs) must come exclusively from the `pricing_plans` DB table. No Stripe price IDs or amounts are read from environment variables. The `src/lib/plans.ts` legacy hardcoded plan map and `src/lib/stripe/billing.ts` are retired.

The settings page plan display name and upgrade button must also be driven from the DB instead of hardcoded legacy plan ID strings.

## Completion Notes

- Replaced the legacy marketing pricing component with the database-backed pricing API and `DynamicPricingSection`, removing the hardcoded `src/lib/plans.ts` dependency from the public pricing surface.
- Removed the legacy `both` / `tarot` / `astrology` fallback plan name map from the dashboard settings page so plan display now resolves from `pricing_plans` data and only falls back to the persisted plan id.
- The checkout and upgrade APIs were already migrated to `pricing_plans`, so these changes close the remaining legacy plan display gap for this task.

---

## Pricing Architecture (Source of Truth)

Each row in `pricing_plans` has:

| Field | Purpose |
|---|---|
| `onetime_amount` + `currency` | One-time / setup fee — used via Stripe `price_data` (dynamic) |
| `stripe_price_id` | Recurring subscription price ID — pre-configured in Stripe |
| `recurring_amount` | Display only — actual charge is controlled by Stripe via `stripe_price_id` |
| `recurring_interval` | Display only |

### Checkout mode rules

| Plan shape | Stripe checkout mode | Line items |
|---|---|---|
| `onetime_amount` only (no `stripe_price_id`) | `payment` | 1 dynamic `price_data` item |
| `stripe_price_id` only (no `onetime_amount`) — e.g. PM | `subscription` | 1 recurring price item |
| Both `onetime_amount` + `stripe_price_id` — e.g. diviner plans | `subscription` | 1 recurring price + 1 dynamic one-time `price_data` item |

In Stripe `subscription` mode, a one-time `price_data` line item (no `recurring`) is billed immediately as an invoice item alongside the first subscription payment.

---

## Verified Current Code — What Is Broken

### `src/lib/stripe/billing.ts` — **retire entirely**

- Reads `STRIPE_PRICE_TAROT_SETUP`, `STRIPE_PRICE_TAROT_MONTHLY` etc. from env vars via `PLANS` map
- Used only by the legacy `tarot` / `astrology` / `both` checkout path
- Must be replaced by DB-driven logic in the checkout route

### `src/app/api/stripe/checkout/route.ts`

- **Lines 22–44**: Legacy path — `if (PLANS[planId])` → calls `createCheckoutSession()` from `billing.ts` which reads env vars. Must be removed.
- **Lines 65–74**: DB path — uses `stripe_price_id` only; ignores `onetime_amount`. Must handle both fields per the rules above.
- **Lines 79–92**: Creates Stripe session without `onetime_amount` support.

### `src/app/api/stripe/upgrade/route.ts`

- **Line 4**: imports `PLANS` from `src/lib/plans.ts`
- **Line 26**: `!PLANS[newPlanId as PlanId]` — validates only legacy plan IDs
- **Line 62**: `newPlanId !== "both"` — hardcodes upgrade target
- **Line 70**: `process.env[PLANS[newPlanId].monthlyEnvKey]` — reads Stripe price from env var
- All of these must use `pricing_plans` DB lookup instead

### `src/app/dashboard/settings/page.tsx`

- **Lines 504–508**: hardcodes plan name display (`"both"` / `"tarot"` / `"astrology"`)
- **Lines 511–514**: `plan_id !== "both"` to show upgrade button
- **Line 101**: `UpgradeToBothButton` sends `newPlanId: "both"` hardcoded

---

## Required Changes

### 1. `src/app/api/stripe/checkout/route.ts` — full rewrite of checkout logic

Remove the entire legacy `PLANS` path. All plans go through the DB path:

```typescript
export async function POST(request: NextRequest) {
  const { email, userId, planId, affiliateCode } = await request.json();

  if (!email || !userId || !planId) {
    return NextResponse.json({ error: "Missing email, userId, or planId" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: dbPlan } = await admin
    .from("pricing_plans")
    .select("plan_id, display_name, stripe_price_id, onetime_amount, onetime_currency, recurring_amount, recurring_currency, recurring_interval, item_id, global_pricing(item_key, item_name)")
    .eq("plan_id", planId)
    .eq("is_active", true)
    .single();

  if (!dbPlan) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const hasRecurring = !!dbPlan.stripe_price_id;
  const hasOneTime = !!dbPlan.onetime_amount && dbPlan.onetime_amount > 0;
  // Use onetime_currency for one-time fees, recurring_currency for subscriptions
  // Both columns added in migration 20260410000124_pricing_onetime_recurring_html
  const onetimeCurrency = (dbPlan.onetime_currency ?? "usd").toLowerCase();
  const itemKey = (dbPlan.global_pricing as { item_key: string } | null)?.item_key ?? "";

  // Set webhook routing type tag based on itemKey
  const typeTag =
    itemKey === "trainee_program" ? "trainee_signup"
    : itemKey === "perennial_mandalism_community" ? "perennial_community_signup"
    : undefined;

  if (!hasRecurring && !hasOneTime) {
    return NextResponse.json(
      { error: "Plan has no configured price. Contact support." },
      { status: 422 }
    );
  }

  const mode = hasRecurring ? "subscription" : "payment";

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  // Recurring subscription line item
  if (hasRecurring) {
    lineItems.push({ price: dbPlan.stripe_price_id!, quantity: 1 });
  }

  // One-time / setup fee line item (works in both payment and subscription mode)
  if (hasOneTime) {
    lineItems.push({
      price_data: {
        currency: onetimeCurrency,
        unit_amount: Math.round(dbPlan.onetime_amount! * 100),
        product_data: { name: `${dbPlan.display_name} — Setup Fee` },
      },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    mode,
    line_items: lineItems,
    metadata: {
      userId,
      planId,
      itemKey,
      planName: dbPlan.display_name,
      // Webhook routing type tag — set automatically based on itemKey
      ...(typeTag ? { type: typeTag } : {}),
      ...(affiliateCode ? { affiliateCode } : {}),
    },
    success_url: `${APP_URL}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/get-started?cancelled=true`,
  });

  return NextResponse.json({ url: session.url });
}
```

> Note: webhook routing type tags (`type: "trainee_signup"`, `type: "perennial_community_signup"`) must still be added by the callers in `get-started/page.tsx` via the request body, or set inside this route based on `itemKey`. Coordinate with tasks 01 and 02.

### 2. `src/app/api/stripe/upgrade/route.ts` — replace PLANS with DB lookup

```typescript
// Remove: import { PLANS, type PlanId } from "@/lib/plans"
// Add:
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  // ... auth check (unchanged) ...

  const { newPlanId } = await request.json();
  if (!newPlanId) {
    return NextResponse.json({ error: "Missing newPlanId" }, { status: 400 });
  }

  // Look up new plan from DB
  const admin = createAdminClient();
  const { data: newPlan } = await admin
    .from("pricing_plans")
    .select("plan_id, display_name, stripe_price_id, custom_fields")
    .eq("plan_id", newPlanId)
    .eq("is_active", true)
    .maybeSingle();

  if (!newPlan || !newPlan.stripe_price_id) {
    return NextResponse.json({ error: "Invalid or unconfigured plan" }, { status: 400 });
  }

  // Check current plan is not already the full plan (replaces newPlanId !== "both")
  const { data: diviner } = await supabase
    .from("diviners")
    .select("id, plan_id, stripe_subscription_id, subscription_status")
    .eq("user_id", user.id)
    .single();

  // ... existing subscription checks (unchanged) ...

  if (diviner.plan_id === newPlanId) {
    return NextResponse.json({ error: "Already on this plan" }, { status: 400 });
  }

  // Validate upgrade target has is_full_plan: "true"
  // (prevents upgrading to a non-full plan or downgrading)
  const isFullPlan = (newPlan.custom_fields as { slug: string; value: string }[] | null)
    ?.find((f) => f.slug === "is_full_plan")?.value === "true";

  if (!isFullPlan) {
    return NextResponse.json(
      { error: "Downgrades are not supported. Contact support." },
      { status: 400 }
    );
  }

  // Use stripe_price_id from DB (replaces env var lookup)
  const newMonthlyPriceId = newPlan.stripe_price_id;

  // ... Stripe subscription update (unchanged logic, uses newMonthlyPriceId) ...

  // Store new plan_id in DB
  await supabase.from("diviners").update({ plan_id: newPlanId }).eq("id", diviner.id);

  return NextResponse.json({ success: true, newPlanId });
}
```

### 3. `src/app/dashboard/settings/page.tsx` — DB-driven plan name and upgrade button

**Fetch plan details alongside settings:**

```typescript
// After fetching diviner settings, fetch plan details from pricing_plans
let planDetails: { display_name: string; custom_fields: { slug: string; value: string }[] | null } | null = null;

if (data.plan_id) {
  const { data: plan } = await supabase
    .from("pricing_plans")
    .select("display_name, custom_fields")
    .eq("plan_id", data.plan_id)
    .maybeSingle();
  planDetails = plan ?? null;
}
```

**Replace hardcoded plan name (lines 504–508):**

```typescript
// BEFORE
{settings.plan_id === "both" ? "The Oracle (both)" : settings.plan_id === "tarot" ? "The Tarot Reader" : "The Astrologer"}

// AFTER
{planDetails?.display_name ?? settings.plan_id ?? "Active Plan"}
```

**Replace hardcoded upgrade button check (lines 511–514):**

```typescript
// BEFORE
{settings.plan_id !== "both" && settings.subscription_status === "active" && <UpgradeToBothButton />}

// AFTER
{(() => {
  const isFullPlan = (planDetails?.custom_fields ?? [])
    .find((f) => f.slug === "is_full_plan")?.value === "true";
  return !isFullPlan && settings.subscription_status === "active"
    ? <UpgradeToBothButton />
    : null;
})()}
```

**Update `UpgradeToBothButton` to use the correct DB plan_id** (instead of hardcoded `"both"`):

The button needs to know the target upgrade plan_id. Options:
- Pass it as a prop from the parent (preferred)
- Or keep a convention that the "full plan" for `professional_divination_course` has a known plan_id

```typescript
// Pass target plan_id as prop
<UpgradeToBothButton targetPlanId={fullPlanId} />

// In UpgradeToBothButton, use it:
body: JSON.stringify({ newPlanId: targetPlanId })
```

The `fullPlanId` is determined from the `pricing_plans` query — find the plan under the same `item_id` that has `is_full_plan: "true"`.

### 4. `src/lib/stripe/billing.ts` — retire

Once the checkout route no longer calls `createCheckoutSession()` from this file, it can be safely deleted. Confirm no other file imports from it first:

```bash
grep -r "from.*billing" src/
```

### 5. DB migration — add `is_full_plan` custom_field

Add `is_full_plan: "true"` to whichever `professional_divination_course` plan represents full access. Confirm the plan_id with product before running:

```sql
UPDATE pricing_plans
SET custom_fields = COALESCE(custom_fields, '[]'::jsonb) || '[{"label": "Full Plan", "slug": "is_full_plan", "value": "true"}]'::jsonb
WHERE plan_id = '<full_plan_id>';  -- confirm with product
```

---

## Files to Change

| File | Action | Change |
|---|---|---|
| `src/app/api/stripe/checkout/route.ts` | Edit | Remove legacy PLANS path; unified DB-driven checkout with `onetime_amount` + `stripe_price_id` support |
| `src/app/api/stripe/upgrade/route.ts` | Edit | Replace PLANS/env var lookup with `pricing_plans` DB lookup; use `is_full_plan` flag for upgrade validation |
| `src/app/dashboard/settings/page.tsx` | Edit | Fetch plan `display_name` + `custom_fields` from DB; remove hardcoded plan ID checks; pass `targetPlanId` to upgrade button |
| `src/lib/stripe/billing.ts` | Delete | No longer used once checkout route is updated |
| `src/lib/plans.ts` | Delete (or keep for reference) | Legacy hardcoded plans — no longer used for pricing logic |
| New DB migration | Create | Add `is_full_plan` custom_field to the appropriate `professional_divination_course` plan |

---

## Acceptance Criteria

- [ ] Checkout for any plan reads `onetime_amount` and `stripe_price_id` exclusively from `pricing_plans` — no env vars
- [ ] Plans with only `stripe_price_id` (e.g. PM) create a `subscription` mode checkout with one recurring line item
- [ ] Plans with only `onetime_amount` create a `payment` mode checkout with one dynamic `price_data` line item
- [ ] Plans with both fields create a `subscription` mode checkout with recurring + one-time line items
- [ ] Upgrade route reads target plan's `stripe_price_id` from DB — no env var
- [ ] Upgrade is only allowed to plans with `is_full_plan: "true"` in `custom_fields`
- [ ] Settings page shows `display_name` from `pricing_plans` for any `plan_id`
- [ ] "Upgrade" button appears only when current plan does not have `is_full_plan: "true"`
- [ ] `billing.ts` is deleted and no file imports from it
- [ ] All legacy plan ID string comparisons (`=== "both"`, `=== "tarot"`, `=== "astrology"`) are removed from the codebase
