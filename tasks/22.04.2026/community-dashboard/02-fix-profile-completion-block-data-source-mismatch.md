# Frontend/Backend Task - Fix Dashboard Profile Completion Data Source Mismatch

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / Profile Completion
- Page Route: `/community`
- Profile Route: `/community/profile`
- Dashboard Component: `src/components/community/profile-progress-section.tsx`
- Dashboard Data Source: `src/app/community/page.tsx`
- Profile Completion Source: `src/lib/profile-completion.ts`

---

## Problem

The `/community/profile` page can show **Profile Details 100%**, but the `/community` dashboard **Profile Completion** block still shows:

- `Your Profile: 0%`
- `Birth data filled`
- Missing birth data instructions

This is confusing because the user has already completed the profile form.

Observed example:

- `/community/profile` shows `100%`, `12/12 fields complete`
- `/community` dashboard profile block shows `0%`

## Root Cause

The two screens are using different data sources.

### `/community/profile`

The profile page calculates completion from `community_members` fields and `intake_data`.

Relevant source:

```txt
src/components/community/profile-form.tsx
src/lib/profile-completion.ts
```

Fields include:

- `first_name`
- `last_name`
- `phone`
- `gender`
- `date_of_birth`
- `birth_time`
- `birth_city`
- `address`
- `city`
- `state`
- `zip`
- `occupation`

### `/community` Dashboard Profile Completion Block

The dashboard calculates `profilePct` from the `clients` table only:

```ts
let profilePct = 0;
if (client?.birth_date) profilePct += 34;
if (client?.birth_time) profilePct += 33;
if (client?.birth_city) profilePct += 33;
```

Relevant source:

```txt
src/app/community/page.tsx
src/components/community/profile-progress-section.tsx
```

The dashboard fetches:

```ts
supabase
  .from("clients")
  .select("birth_date, birth_time, birth_city")
  .eq("user_id", user.id)
  .single()
```

If the `clients` row is missing, stale, or not yet synced, the dashboard shows `0%` even though `community_members` has complete profile data.

## Additional Sync Risk

`POST /api/community/onboarding/complete` updates `community_members`, then calls:

```ts
syncProfileAcrossRoles(...).catch(console.error);
```

That sync is:

- not awaited before returning success
- only updates role tables where a row already exists
- does not create a missing `clients` row

So `clients.birth_date`, `clients.birth_time`, and `clients.birth_city` can remain empty/missing while `/community/profile` is fully complete.

## Required Fix

### 1. Pick One Canonical Source For This Dashboard Block

For Perennial community dashboard profile completion, prefer `community_members` as the canonical source because `/community/profile` saves there directly.

Recommended:

- Use `member.date_of_birth`
- Use `member.birth_time`
- Use `member.birth_city`

Do not depend on `clients` birth fields for the dashboard profile block unless the sync is guaranteed.

### 2. Rename Or Clarify The Block If Needed

The block currently says:

- `Profile Completion`
- `Your Profile`
- `Birth data filled`

If it only measures birth data readiness, make that explicit:

- `Birth Data Readiness`
- `Birth Data`
- `Chart data complete`

If it is intended to represent full profile details, use the same centralized `getCommunityProfileFields()` logic as `/community/profile`.

### 3. Fix Missing Field Logic

The missing-field text should check actual missing fields, not percentage thresholds.

Current threshold logic can produce duplicate/confusing messages:

```tsx
{profilePct < 34 && <li>• Add your date of birth</li>}
{profilePct < 67 && profilePct >= 34 && <li>• Add your birth time</li>}
{profilePct < 100 && profilePct >= 67 && <li>• Add your birth city</li>}
{profilePct === 0 && <li>• Add your date of birth, birth time, and birth city</li>}
```

Replace with explicit checks:

- missing `date_of_birth`
- missing `birth_time`
- missing `birth_city`

### 4. Decide What To Do With Client Sync

If other features need `clients` birth data, then also fix sync.

Options:

- Await `syncProfileAcrossRoles()` before returning success.
- Ensure a `clients` row exists for community members during onboarding/provisioning.
- Add an upsert path specifically for `clients` birth fields.

Do not rely on best-effort async sync for dashboard-critical display.

## Constraints

- Scope this task to the `/community` dashboard Profile Completion block and its data source.
- Do not change `/community/profile` completion calculation unless using its existing helper.
- Do not remove the broader Journey Progress card.
- Do not hide the issue by only changing labels while still reading stale data.
- Do not make Mystery School behavior part of this task; Perennial is the active scope.

## Acceptance Criteria

- [ ] A user with complete `/community/profile` birth data no longer sees `Your Profile: 0%` on `/community`.
- [ ] Dashboard Profile Completion reads birth readiness from `community_members` or another guaranteed source.
- [ ] Missing-field messages match the actual missing fields.
- [ ] If `date_of_birth`, `birth_time`, and `birth_city` are present on `community_members`, the dashboard birth/profile ring shows `100%`.
- [ ] If one field is missing, the dashboard names that specific missing field.
- [ ] The block copy no longer implies the full profile is incomplete when `/community/profile` is 100%.
- [ ] Existing chart quick actions and Journey Progress remain functional.

## QA Checklist

- [ ] Log in as a Perennial member whose `/community/profile` shows `100%`.
- [ ] Navigate to `/community`.
- [ ] Confirm the Profile Completion block no longer shows `0%`.
- [ ] Confirm it shows complete birth/profile readiness when birth date, birth time, and birth city exist.
- [ ] Remove or clear only `birth_time` in test data.
- [ ] Confirm the dashboard specifically asks for birth time only.
- [ ] Test a user with no birth data.
- [ ] Confirm the dashboard lists all missing birth data fields without duplicate/confusing messages.
- [ ] Confirm `/community/profile` still shows its separate `Profile Details` percentage correctly.

## Notes For Junior Developer

- The bug is not the progress ring component itself.
- The bug is the data contract: profile form saves to `community_members`, dashboard reads from `clients`.
- Start by fixing `src/app/community/page.tsx` so `profilePct` uses the same source that profile save writes to.
- Then simplify `ProfileProgressSection` so it receives either explicit missing fields or enough values to render accurate messages.
