# Frontend/Backend Task - Add Community Profile Photo Upload

- Status: Planned
- Priority: P1
- Area: Perennial / Community Profile / Journey Progress
- Page Route: `/community/profile`
- Completion Source: `src/lib/community/profile-completion.ts`

---

## Problem

Community Journey Progress already tracks a `profile_photo` milestone, but `/community/profile` does not provide any way for a member to upload a profile photo.

Current completion item:

```ts
{
  key: "profile_photo",
  label: "Profile photo uploaded",
  completed: false,
  pct: 20,
  action_url: "/community/profile",
}
```

The API later marks this item complete by checking:

```ts
user.user_metadata?.avatar_url
```

Because the profile page has no avatar upload UI, a Perennial community member can be sent to `/community/profile` from Journey Progress but cannot complete the milestone there.

## Files To Inspect

- `src/app/community/profile/page.tsx`
- `src/components/community/profile-form.tsx`
- `src/lib/community/profile-completion.ts`
- `src/app/api/community/profile-completion/route.ts`
- `src/app/dashboard/profile/page.tsx`
- Existing upload/API routes around avatar upload, especially `/api/upload/avatar`

## Required Implementation

### 1. Load Existing Avatar

Pass the authenticated user's current avatar URL into the community profile form.

Recommended source:

```ts
user.user_metadata?.avatar_url
```

The profile form should display:

- Current uploaded image when `avatar_url` exists.
- Initials fallback when no avatar exists.

### 2. Add Profile Photo Upload UI

Add a profile photo card/section near the top of `/community/profile`, before or near the profile completion bar.

The UI should include:

- Avatar preview.
- Upload/change photo button.
- Loading state while uploading.
- Clear error and success toasts.

Keep the UI private/member-focused. Do not add public profile language.

### 3. Reuse Existing Storage Upload Flow

Follow the existing diviner profile upload pattern where appropriate:

- Validate image file exists.
- Accept image files only.
- Enforce max size of 2MB.
- Upload through the existing avatar upload route if compatible.

Likely route to inspect/reuse:

```txt
/api/upload/avatar
```

### 4. Persist Avatar Where Completion Reads It

After storage upload returns a public URL, persist that URL to:

```ts
auth.users.user_metadata.avatar_url
```

This is required because `/api/community/profile-completion` checks auth metadata, not `community_members`.

If no existing endpoint updates auth metadata, add a narrow authenticated endpoint such as:

```txt
PATCH /api/community/profile/avatar
```

Suggested body:

```json
{
  "avatar_url": "https://..."
}
```

Endpoint rules:

- Require authenticated user.
- Update only the current user's metadata.
- Use the admin client if that is the project pattern for auth user metadata updates.
- Do not update other profile fields.

### 5. Update UI Immediately

After successful upload and metadata update:

- Update local avatar preview immediately.
- Show success toast.
- Refresh server state if needed with `router.refresh()`.
- Ensure Journey Progress can reflect the completed photo milestone after navigation or refresh.

## Constraints

- Scope this task to Perennial/community profile photo upload only.
- Do not change Mystery School behavior in this task.
- Do not create a public community profile.
- Do not add cover/banner image upload.
- Do not refactor the whole community profile form.
- Do not change the Journey Progress weighting.
- Do not store the avatar only in `community_members`; completion currently reads from auth metadata.

## Acceptance Criteria

- [ ] `/community/profile` shows a profile photo/avatar section.
- [ ] Existing `user.user_metadata.avatar_url` is displayed when present.
- [ ] Users without a photo see initials fallback.
- [ ] User can upload an image under 2MB.
- [ ] Non-image or oversized files are rejected with a clear toast.
- [ ] Uploaded image is saved to storage and the resulting public URL is persisted to `user_metadata.avatar_url`.
- [ ] Avatar preview updates immediately after successful upload.
- [ ] `/api/community/profile-completion` returns `profile_photo.completed = true` after upload.
- [ ] `/community` Journey Progress no longer shows `Profile photo uploaded` as incomplete after refresh/navigation.
- [ ] Existing profile form save behavior is not regressed.

## QA Checklist

- [ ] Log in as an active Perennial community member.
- [ ] Navigate to `/community`.
- [ ] Confirm Journey Progress shows `Profile photo uploaded` incomplete for a user without an avatar.
- [ ] Click or navigate to `/community/profile`.
- [ ] Upload a valid image under 2MB.
- [ ] Confirm success toast appears.
- [ ] Confirm avatar preview updates on the profile page.
- [ ] Refresh `/community/profile` and confirm the avatar still appears.
- [ ] Navigate back to `/community`.
- [ ] Confirm Journey Progress marks `Profile photo uploaded` complete.
- [ ] Test an oversized image and confirm it is rejected.
- [ ] Test a non-image file and confirm it is rejected.

## Notes For Junior Developer

- The key detail is that completion checks `user_metadata.avatar_url`.
- Uploading the file to storage is not enough by itself.
- First inspect how diviner avatar upload works, then adapt only the parts that make sense for community members.
- Keep the implementation small and easy to review.
