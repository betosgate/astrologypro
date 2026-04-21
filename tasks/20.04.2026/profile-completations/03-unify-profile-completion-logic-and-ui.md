# Frontend Task - Unified Profile Completion Logic & Labeling

- Status: Planned
- Priority: P2
- Area: Frontend / Logic
- Files: `src/lib/profile-completion.ts`, `src/app/community/page.tsx`, `src/components/community/profile-form.tsx`

---

## Problem

There is currently a discrepancy between the **Community Dashboard** and the **Profile Page** regarding how "completion" is calculated and displayed.

1.  **Dashboard**: Uses a *weighted model* (total 100%) checking for "Journey" milestones like uploading a photo, adding family members, and generating charts.
2.  **Profile Form**: Uses a *count model* checking for specific data fields (like Phone, Address, Occupation).

Because these use different logic, a user might see "100% Complete" on their Profile page but only "60% Complete" on their Dashboard, which is confusing.

## Required Frontend Fix

### 1. Centralize Data Field List
In `src/lib/profile-completion.ts`, define a constant list of fields that constitute a "Complete Profile Data" set. This ensures both the form and any other data-focused check use the same criteria.

### 2. Rename Dashboard Labels
Update the Dashboard Progress bar label to clarify that it represents the **"Journey Progress"** or **"Account Setup"** (which includes charts and family), rather than just "Profile."

### 3. Synchronize Profile Form Logic
Update `CommunityProfileForm` to use the centralized field list from Step 1. Ensure it specifically labels itself as **"Identity Details"** or **"Profile Data"** to distinguish it from the Dashboard's Journey bar.

## Acceptance Criteria

- [ ] A central constant for mandatory profile data fields exists in `lib/profile-completion.ts`.
- [ ] Dashboard bar is clearly labeled to indicate it includes "Charts" and "Family" milestones.
- [ ] Profile Page bar specifically refers to "Profile Data" or "Personal Details."
- [ ] No more discrepancy between different "Data" checks; they all pull from the same field list.

## QA Checklist

- [ ] Navigate to the Dashboard. Verify the bar label mentions "Journey" or "Account Setup."
- [ ] Navigate to `/community/profile`. Verify the bar label mentions "Personal Details" or "Identity."
- [ ] Fill out the "Occupation" field in the Profile and verify the percentage increases correctly.
- [ ] Confirm that even if Profile Data is 100%, the Dashboard bar correctly stays below 100% if no family members or charts have been added.
