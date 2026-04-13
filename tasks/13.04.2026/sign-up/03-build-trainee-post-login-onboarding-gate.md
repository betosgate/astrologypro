# Build Trainee Post-Login Onboarding Gate — 2026-04-13

- Status: Open
- Priority: P1
- Owner: Full-stack
- Scope: `src/app/api/auth/post-login-redirect/route.ts`, `src/app/trainee/` area, new onboarding page for trainee role
- Estimate: 1 day

---

## Goal

After a trainee logs in for the first time, they must be taken through an onboarding gate that collects the required fields needed to load their trainee dashboard — before they can access `/trainee`. Currently, trainees are sent directly to `/trainee` with no data collected.

---

## Verified Current Code — What Is Missing

### `src/app/api/auth/post-login-redirect/route.ts`

- **Lines 83–106**: Only `role === "diviner"` is explicitly gated on onboarding completion. Checks `diviner.onboarding_completed` from `diviners` table at line 86.
- For `role === "trainee"`, falls to `getRoleDestination("trainee")` at line 109 → returns `/trainee` **with no onboarding check at all**.
- No equivalent `trainees.onboarding_completed` check exists.

### `src/types/user.ts`

- `"trainee"` is defined as a `UserRole` and maps to `/trainee` in `ROLE_DESTINATIONS` — correct, no change needed.

### `src/app/onboarding/page.tsx`

- Exists but is **diviner-specific** — loads `diviners` table, collects bio, services, timezone, photo, Stripe Connect setup. Not reusable for trainees as-is.

### `/src/app/trainee/` directory — already exists

- `src/app/trainee/layout.tsx` — **already exists**, add onboarding gate guard here
- `src/app/trainee/page.tsx` — already exists
- `src/app/trainee/profile/page.tsx` — already exists
- `src/app/trainee/onboarding/page.tsx` — **does NOT exist**, must be created

### `trainees` table

- Has `onboarding_completed: boolean` column (set to `false` by webhook in task 01).
- Has `name`, `email`, `username` from webhook provisioning.
- Missing fields to collect before dashboard: phone, timezone, DOB, profile photo, bio — confirm exact required fields with product.

---

## Required Behavior

1. After first login, a trainee with `onboarding_completed = false` in the `trainees` table must be redirected to `/trainee/onboarding` instead of `/trainee`.
2. `/trainee/onboarding` collects the required fields for the trainee dashboard (see Required Fields below).
3. On completion, sets `trainees.onboarding_completed = true` and redirects to `/trainee`.
4. On subsequent logins, if `onboarding_completed = true`, go directly to `/trainee`.
5. If `onboarding_completed = false` and the trainee navigates directly to `/trainee`, middleware or the trainee layout must redirect them back to `/trainee/onboarding`.

---

## Required Fields to Collect (Trainee Onboarding)

Confirm with product which of these are required before dashboard access vs optional (for profile completion):

**Likely required for dashboard:**
- Phone number
- Timezone
- Date of birth
- Profile photo (avatar)
- Short bio

**Likely optional (profile completion only):**
- Address
- Social media links
- Training goals / interests

---

## Implementation Steps

### Step 1 — `src/app/api/auth/post-login-redirect/route.ts`

Add a trainee onboarding gate after the diviner block:

```typescript
// After the diviner block (after line ~103)
if (role === "trainee") {
  const { data: trainee } = await admin
    .from("trainees")
    .select("id, onboarding_completed")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!trainee || !trainee.onboarding_completed) {
    return NextResponse.json({ destination: "/trainee/onboarding" });
  }

  return NextResponse.json({ destination: "/trainee" });
}
```

### Step 2 — Create `/trainee/onboarding` page

Create `src/app/trainee/onboarding/page.tsx`:

- Must be protected — redirect to `/login` if no session
- Redirect to `/trainee` if `trainees.onboarding_completed` is already `true`
- Collect required fields (phone, timezone, DOB, photo, bio)
- On submit: update `trainees` row with collected fields and set `onboarding_completed = true`
- Redirect to `/trainee` on success

### Step 3 — Guard `/trainee` routes

In the trainee layout or middleware, check `trainees.onboarding_completed`. If `false`, redirect to `/trainee/onboarding`.

This prevents trainees from bypassing the gate by navigating directly.

---

## Files to Create / Change

| File | Action | Change |
|---|---|---|
| `src/app/api/auth/post-login-redirect/route.ts` | Edit | Add trainee onboarding gate check |
| `src/app/trainee/onboarding/page.tsx` | Create | New onboarding page for trainee role |
| `src/app/trainee/layout.tsx` (or middleware) | Edit | Add guard that redirects to `/trainee/onboarding` if not completed |

---

## Acceptance Criteria

- [ ] First login as trainee → redirected to `/trainee/onboarding`
- [ ] Completing the onboarding form sets `trainees.onboarding_completed = true`
- [ ] After completing onboarding → redirected to `/trainee`
- [ ] Subsequent logins → go directly to `/trainee`
- [ ] Navigating directly to `/trainee` while `onboarding_completed = false` redirects back to `/trainee/onboarding`
- [ ] Diviner login flow is completely unaffected
