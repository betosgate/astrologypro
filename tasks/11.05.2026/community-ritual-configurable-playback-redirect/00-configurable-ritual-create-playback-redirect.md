# Task - Redirect Configurable Ritual Creation Directly To Playback

- Status: Planned
- Priority: P1
- Area: Perennial Mandalism / Community Rituals / Configurable Ritual Create Flow
- Page Routes:
  - `/community/rituals`
  - `/community/rituals/[ritualId]`
  - `/community/rituals/[ritualId]/playback`
- Date: 2026-05-11

---

## Goal

After a user creates a configurable ritual from the `Configure Your Ritual` flow, skip the intermediate ritual sequence/list page and redirect directly to the playback page.

The desired post-create flow is:

1. User chooses the configurable ritual option.
2. User completes `Configure Your Ritual`.
3. The ritual is created successfully.
4. A success toast confirms creation.
5. The user is redirected directly to `/community/rituals/[ritualId]/playback`.

## Current Problem

After the configurable ritual is created, the app redirects to the ritual detail page:

`/community/rituals/[ritualId]`

That page displays the full ritual sequence/list. For this flow, the list page is unnecessary and creates an extra step before the user can begin the ritual.

## Required Behavior

- Show a success toast after successful configurable ritual creation.
- Redirect directly to:

  `/community/rituals/[ritualId]/playback`

- Do not automatically redirect to:

  `/community/rituals/[ritualId]`

## Implementation Notes

- Find the redirect/navigation logic that runs after configurable ritual creation succeeds.
- Replace the destination from `/community/rituals/${ritualId}` to `/community/rituals/${ritualId}/playback`.
- Keep the old redirect path commented for now if it is useful for future restoration.
- Add or reuse the app's existing toast system for a success message such as:

  `Ritual created successfully`

- Do not remove the ritual detail/list page itself. It may still be useful when a user intentionally opens an existing ritual.

## Out Of Scope

- Redesigning the playback page.
- Removing the ritual sequence/list page globally.
- Changing ritual generation logic.
- Changing ritual step ordering or invocation data.
- Changing admin ritual configuration.

## Acceptance Criteria

- [ ] Configurable ritual creation shows a success toast.
- [ ] Successful creation redirects directly to `/community/rituals/[ritualId]/playback`.
- [ ] The intermediate `/community/rituals/[ritualId]` sequence/list page is not opened automatically from this create flow.
- [ ] The sequence/list page still works when opened directly or from any existing intentional entry point.
- [ ] The redirect uses the newly created ritual id.
- [ ] Failed creation does not redirect and still shows the existing error handling.
- [ ] Desktop and mobile create flows behave consistently.

## QA Checklist

- [ ] Start from the ritual creation flow and choose the configurable option.
- [ ] Complete the `Configure Your Ritual` step.
- [ ] Submit/create the ritual.
- [ ] Confirm the success toast appears.
- [ ] Confirm the final URL is `/community/rituals/[ritualId]/playback`.
- [ ] Confirm the page shown is the playback/player page, not the sequence/list page.
- [ ] Confirm browser back behavior does not trap the user in the skipped sequence/list page.
