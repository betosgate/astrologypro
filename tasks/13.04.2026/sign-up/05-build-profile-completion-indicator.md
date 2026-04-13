# Build Profile Completion Indicator — 2026-04-13

- Status: Open
- Priority: P2
- Owner: Frontend
- Scope: Profile pages for each role, shared utility
- Estimate: 1 day

---

## Goal

Each role's profile page must show a **profile completion percentage** — a visual indicator showing how much of their profile is filled in. Users can see what is missing and return to fill it at any time after completing the mandatory onboarding gate.

---

## Verified Current Code — What Is Missing

### Profile pages (all lack completion indicator)

| Role | Profile page |
|---|---|
| Diviner | `src/app/dashboard/profile/page.tsx` |
| Community (perennial/MS) | `src/app/community/profile/page.tsx` |
| Portal (client) | `src/app/portal/profile/page.tsx` |
| Trainee | `src/app/trainee/profile/page.tsx` — confirmed exists |

None of these pages currently show a completion percentage. There is no shared utility for calculating it.

### DB tables — fields to score

| Role | Table | Fields to check for completeness |
|---|---|---|
| Diviner | `diviners` | display_name, bio, tagline, avatar_url, cover_image_url, timezone, specialties, phone, youtube_channel_id, stripe_account_id |
| Trainee | `trainees` | name, email, phone, timezone, bio, avatar_url, DOB |
| Perennial | `community_members` | full_name, phone, gender, state, city, zip, address, occupation, intake_data (DOB, birth_time, birth_location) |

---

## Required Behavior

1. Each profile page shows a progress bar or circular indicator: e.g., "Profile 60% complete"
2. Below the indicator, list which fields are still missing (as clickable items that scroll to or highlight that field in the form)
3. The percentage is calculated client-side from the loaded profile data — no separate API needed
4. Completed fields count toward 100%. Each field has equal weight unless product specifies otherwise
5. The indicator updates live as the user fills in fields in the form (before saving)
6. After saving, the updated percentage is shown

---

## Implementation Steps

### Step 1 — Create shared completion calculator utility

Create `src/lib/profile-completion.ts`:

```typescript
/**
 * Calculates profile completion percentage.
 * @param fields - Object where keys are field names and values are the current field value
 * @param requiredFields - Array of field keys that count toward completion
 * @returns { percentage: number, missingFields: string[] }
 */
export function calculateProfileCompletion(
  fields: Record<string, unknown>,
  requiredFields: string[]
): { percentage: number; missingFields: string[] } {
  const missing = requiredFields.filter((key) => {
    const val = fields[key];
    return val === null || val === undefined || val === "" ||
      (Array.isArray(val) && val.length === 0);
  });

  const filled = requiredFields.length - missing.length;
  const percentage = requiredFields.length === 0
    ? 100
    : Math.round((filled / requiredFields.length) * 100);

  return { percentage, missingFields: missing };
}
```

### Step 2 — Define field lists per role

In the same file or a companion config, define which fields count for each role:

```typescript
export const DIVINER_PROFILE_FIELDS = [
  "display_name", "bio", "tagline", "avatar_url", "cover_image_url",
  "timezone", "specialties", "phone", "youtube_channel_id", "stripe_account_id"
];

export const TRAINEE_PROFILE_FIELDS = [
  "name", "email", "phone", "timezone", "bio", "avatar_url", "dob"
];

export const PERENNIAL_PROFILE_FIELDS = [
  "full_name", "phone", "gender", "state", "city", "zip",
  "address", "occupation"
  // intake_data sub-fields (dob, birth_time, birth_location) — flatten before passing
];
```

### Step 3 — Add indicator component

Create `src/components/ui/profile-completion-bar.tsx`:

```typescript
// Props: percentage (number), missingFields (string[])
// Renders: progress bar + "X% complete" label + list of missing field labels
```

- Use the existing design system (shadcn/ui Progress component if available, or a simple div-based bar matching the app's gold/dark theme)
- Missing field labels should be human-readable (e.g., "avatar_url" → "Profile Photo")

### Step 4 — Add to each profile page

- Import `calculateProfileCompletion` and `ProfileCompletionBar`
- Compute completion from the loaded profile data
- Render `<ProfileCompletionBar>` near the top of the profile form
- Recompute on form field changes so it updates live

---

## Files to Create / Change

| File | Action |
|---|---|
| `src/lib/profile-completion.ts` | Create — shared calculator and field lists |
| `src/components/ui/profile-completion-bar.tsx` | Create — reusable UI component |
| `src/app/dashboard/profile/page.tsx` | Edit — add indicator for diviner |
| `src/app/community/profile/page.tsx` | Edit — add indicator for perennial/community |
| `src/app/trainee/profile/page.tsx` | Edit — add indicator for trainee (create page if it does not exist) |
| `src/app/portal/profile/page.tsx` | Edit — add indicator for portal/client (optional, lower priority) |

---

## Acceptance Criteria

- [ ] Diviner profile page shows correct completion % based on filled fields in `diviners` table
- [ ] Community/perennial profile page shows correct completion % based on `community_members` fields
- [ ] Trainee profile page shows correct completion % based on `trainees` fields
- [ ] Percentage updates live as the user edits the form (before saving)
- [ ] Missing fields are listed with human-readable labels
- [ ] 100% is shown when all tracked fields are filled
- [ ] Indicator does not show on the onboarding gate pages — only on profile pages
