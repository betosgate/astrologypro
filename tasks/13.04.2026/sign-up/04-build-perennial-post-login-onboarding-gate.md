# Build Perennial Community Post-Login Onboarding Gate — 2026-04-13

- Status: Open
- Priority: P1
- Owner: Full-stack
- Scope: `src/app/api/auth/post-login-redirect/route.ts`, `src/app/community/onboarding/`, `community_members` table
- Estimate: 1.5–2 days

---

## Goal

After a perennial member logs in for the first time (via the new get-started flow — task 02), they must be taken through an onboarding gate at `/community/onboarding` that collects all role-specific required data before they can access the `/community` dashboard. This replaces the pre-payment data collection that existed in the old `/perennial-signup` page.

Currently, perennial users are routed directly to `/community` with no onboarding gate and no data collected beyond name and email.

---

## Verified Current Code — What Is Missing

### `src/app/api/auth/post-login-redirect/route.ts`

- **Lines 83–106**: Only `role === "diviner"` is gated. For `role === "perennial_mandalism"`, falls to `getRoleDestination` at line 109 → `/community` with **no onboarding check**.
- No check of `community_members.onboarding_completed`.

### `src/app/community/onboarding/page.tsx`

- **File already exists** with a 3-step structure (TOTAL_STEPS = 3), gender/relationship constants matching the old perennial-signup page, and partial form logic.
- **Action: extend this existing file** — do not create from scratch. Read the full file first before implementing to understand the existing step structure and reuse it.

### `src/app/community/layout.tsx`

- **Already exists** — add the onboarding gate guard here.

### `community_members` table

- Has `membership_type`, `membership_status`, `plan_type`, `email`, `full_name`, `intake_data` JSONB.
- `onboarding_completed` column is added by **task 02's Step 0 migration** — confirm that migration has run before implementing this task.
- `intake_data` JSONB is the correct place to store questionnaire answers, birth data, and household member details.

---

## Required Behavior

1. After first login with `role === "perennial_mandalism"` and `community_members.onboarding_completed = false`, redirect to `/community/onboarding`.
2. `/community/onboarding` collects data in logical steps (not all on one page):
   - **Step 1 — Personal details**: phone, gender, DOB, birth time, birth location (lat/lng/timezone), address, city, state, zip, occupation
   - **Step 2 — Household members**: if `plan_type` is couple or family, collect each member's details (name, email, DOB, birth time, birth location, relationship)
   - **Step 3 — Questionnaire**: 25-field optional questionnaire (relationship_status, personality, strengths, life_areas, goals, events, stress_management, family_relationships, challenges, projects, spiritual_practices, etc.)
3. On completion, update `community_members` row: save all data into `intake_data` JSONB, set `onboarding_completed = true`, update `plan_type` to correct value based on household size.
4. For household members: create `community_family_members` rows linking secondary members to the primary `community_members` row (same schema as the old `provisionPerennialHousehold` flow in `src/lib/perennial/household-provisioning.ts`).
5. Redirect to `/community` after completion.
6. On subsequent logins, if `onboarding_completed = true`, go directly to `/community`.
7. Navigating directly to `/community` while `onboarding_completed = false` must redirect to `/community/onboarding`.

---

## Reference — Old Field Schema

The old `/perennial-signup` page and `src/lib/perennial/household-provisioning.ts` defined all the fields. Use these as the field reference:

**Primary member required fields** (from `src/app/api/perennial-signup/checkout/route.ts` lines 56–143):
- first_name, last_name, email, phone, gender, state, city, zip, address, occupation
- DOB, birth_time, birth_location_label, birth_lat, birth_lng, birth_tzone

**Secondary members** (couple/family plan):
- Same required fields as primary, plus:
- relation_type: "Couple" | "Family"
- sub_relation: "Husband" | "Wife" | "Son" | "Daughter" | "Spouse" | "Partner" | "Other"

**Questionnaire (all optional, stored in intake_data JSONB)**:
- relationship_status, personality, strengths, life_areas, goals, events
- stress_management, family_relationships, challenges, projects, spiritual_practices
- (25 fields total — see old checkout route for full list)

---

## DB Migration

The `onboarding_completed` column on `community_members` is added in **task 02, Step 0** — not here. Confirm that migration has run before implementing this task. No additional migration is needed in this task.

---

## Implementation Steps

### Step 1 — DB migration

Add `onboarding_completed boolean NOT NULL DEFAULT false` to `community_members`. Run the back-fill for existing members.

### Step 2 — `src/app/api/auth/post-login-redirect/route.ts`

Add perennial onboarding gate after the diviner block:

```typescript
if (role === "perennial_mandalism") {
  const { data: member } = await admin
    .from("community_members")
    .select("id, onboarding_completed")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member || !member.onboarding_completed) {
    return NextResponse.json({ destination: "/community/onboarding" });
  }

  return NextResponse.json({ destination: "/community" });
}
```

### Step 3 — Build `/community/onboarding` page

Read `src/app/community/onboarding/page.tsx` first to see existing structure.

The page must:
- Be protected — redirect to `/login` if no session
- Load the user's `community_members` row to determine `plan_type` (single/couple/family) and pre-fill any already-saved data
- Render a multi-step form (step 1: personal, step 2: household members if applicable, step 3: questionnaire)
- On final submit: upsert `community_members` with all `intake_data`, set `onboarding_completed = true`, update `plan_type` to match actual household size
- Create `community_family_members` rows for secondary members
- Redirect to `/community` on success

### Step 4 — Guard `/community` routes

In the community layout (`src/app/community/layout.tsx`), check `community_members.onboarding_completed`. If `false`, redirect to `/community/onboarding`.

---

## Files to Create / Change

| File | Action | Change |
|---|---|---|
| DB migration | Create | Add `onboarding_completed` column, back-fill existing rows |
| `src/app/api/auth/post-login-redirect/route.ts` | Edit | Add perennial onboarding gate |
| `src/app/community/onboarding/page.tsx` | Edit or create | Multi-step onboarding form |
| `src/app/community/layout.tsx` | Edit | Guard against `onboarding_completed = false` |

---

## Acceptance Criteria

- [ ] DB migration runs cleanly; existing fully-provisioned members have `onboarding_completed = true`
- [ ] First login as perennial member → redirected to `/community/onboarding`
- [ ] Step 1 (personal details) is required before proceeding
- [ ] Step 2 (household members) only shown when `plan_type` is couple or family
- [ ] Step 3 (questionnaire) is shown; fields are optional but must be saveable
- [ ] On completion: `community_members.intake_data` is populated, `onboarding_completed = true`, `plan_type` updated to reflect household size
- [ ] Secondary members create `community_family_members` rows
- [ ] After completion → redirect to `/community`
- [ ] Subsequent logins → go directly to `/community`
- [ ] Navigating to `/community` while `onboarding_completed = false` redirects to `/community/onboarding`
- [ ] Old `/perennial-signup` household provisioning flow (`handlePerennialSignupCheckoutCompleted`) is unaffected
