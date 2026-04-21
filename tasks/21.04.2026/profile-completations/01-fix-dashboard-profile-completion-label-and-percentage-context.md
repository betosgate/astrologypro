# Frontend Task - Fix Dashboard Profile Completion Label & Percentage Context

- Status: Planned
- Priority: P1
- Area: Frontend / Community Dashboard
- Files: `src/app/community/page.tsx`, `src/components/community/profile-completion-card.tsx`

---

## Problem

The Community Dashboard still presents the weighted setup progress as **Profile** completion.

For example, a user can see:

- `/community/profile`: **Profile Details 100%**
- `/community`: **Profile 20% complete**

This looks like incorrect profile data percentage, even though the dashboard value is actually tracking broader journey/setup milestones such as profile photo, birth data, natal chart, family member, and relationship chart.

Current failing dashboard labels include:

- `Profile 20% complete`
- `Complete Your Profile`
- `Profile Complete`
- `Complete Profile →`

## Required Frontend Fix

### 1. Rename Dashboard Progress UI

Update all dashboard progress labels that refer to this weighted checklist as **Profile** so they clearly say **Journey Progress** or **Account Setup**.

Use consistent wording across:

- Mini progress bar near the dashboard header.
- Main progress prompt card.
- Complete-state badge.
- Progress `aria-label` values.
- CTA link text.

### 2. Clarify That Dashboard Percentage Is Not Profile Data Percentage

The dashboard should make it clear that its percentage includes setup milestones beyond personal profile data.

Suggested labels:

- `Journey`
- `Journey Progress`
- `Complete Your Journey Setup`
- `Journey Setup Complete`
- `Continue Setup →`

### 3. Keep Profile Page Data Percentage Separate

Do not change the `/community/profile` profile-data calculation. That page should continue using the centralized profile field list from `src/lib/profile-completion.ts`.

## Acceptance Criteria

- [ ] Dashboard mini progress bar no longer says `Profile`.
- [ ] Dashboard progress `aria-label` values no longer say `Profile {n}% complete`.
- [ ] Dashboard incomplete-state card no longer says `Complete Your Profile`.
- [ ] Dashboard complete-state badge no longer says `Profile Complete`.
- [ ] Dashboard CTA no longer says `Complete Profile →`.
- [ ] `/community/profile` still shows the personal/profile data completion percentage separately.
- [ ] A user with Profile Details at 100% can still see Dashboard Journey Progress below 100% without confusing wording.

## QA Checklist

- [ ] Log in as `river.ashton@test.astrologypro.com`.
- [ ] Navigate to `/community`.
- [ ] Confirm the dashboard progress label says `Journey` or `Account Setup`, not `Profile`.
- [ ] Inspect the progress bar accessibility label and confirm it says `Journey` or `Account Setup`.
- [ ] Confirm the main progress prompt says `Complete Your Journey Setup` or equivalent.
- [ ] Navigate to `/community/profile`.
- [ ] Confirm the profile page still says `Profile Details`.
- [ ] Confirm the profile page percentage can be 100% while the dashboard journey/setup percentage remains below 100%.
