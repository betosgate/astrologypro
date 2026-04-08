# Refactor Community Profile Form

- Status: Completed (2026-04-08, verified)
- Completion Notes: src/components/community/profile-form.tsx implements the editable client form (full_name, etc.) consumed by src/app/community/profile/page.tsx.

## Objective
Convert the current static, read-only `/community/profile` page into an interactive form where users can edit their basic details, mirroring the standard set by the Client Portal profile.

## Files To Read First
- `src/app/community/profile/page.tsx`
- `src/app/portal/profile/page.tsx` (for functional parity code reference)

## Exact Gap
The `CommunityProfilePage` currently uses a static `CardContent` with `div` rows that display user data (Name, Email, Program, Status) directly from the `community_members` table on the server. It lacks an `<form>`, input fields, an `onSubmit` handler, and a save state.

## Required Implementation
1. **Convert to Interactive Page**: Since this requires interactive form states (saving, loading, updating database), convert the UI into a Client Component (e.g., `use client`) or extract the form markup into a new Client Component named `CommunityProfileForm` (e.g. `src/components/community/profile-form.tsx`) and place it inside the server-rendered page.
2. **Input Fields**: 
   - `FullName`: Editable text `<Input>`, linked to `community_members.full_name`.
   - `Email`: Text `<Input>` with `disabled` and `readOnly` mapped to the user record.
3. **Update Logic**: When the user submits the form, execute a Supabase `update()` call on the `community_members` row using `user.id` to save the new `full_name`. Show standard `Saving...` logic using the `lucide-react` `Loader2` similar to the portal profile.
4. **Consistent Display Details**: Ensure the uneditable details like 'Member Since', 'Status', and 'Program' continue to display clearly alongside the form (e.g. using readonly fields or text badges).

## Acceptance Criteria
- Visiting `/community/profile` presents input fields for data entry.
- The Email field is visibly grayed out and cannot be typed in.
- Editing `FullName` and pressing "Save Changes" successfully updates the database row and displays a success notification/text.
- Standard loading indicators appear correctly during the save process.
