# Task - Refine Ritual Playback Timing Summary

- Status: Planned
- Priority: P2
- Area: Perennial Mandalism / Community Rituals / Playback UX
- Page Route: `/community/rituals/[ritualId]/playback`
- Date: 2026-05-11

---

## Goal

Refine the ritual playback timing display so the video player shows current-video timing, while the playlist sidebar shows whole-ritual timing.

## Current Problem

The playback page currently shows timing in two places:

- the video player control bar shows current video timing, such as `00:11 / 00:15`
- the playlist sidebar also shows `Elapsed`, `Remaining`, and `Total`

If the sidebar stats are also based only on the current video, the UI repeats the same information and does not help the user understand the full ritual duration.

## Required Behavior

Keep the video player timing scoped to the current video.

Use the playlist sidebar timing summary for the full ritual:

- `Elapsed`: completed video durations + current video elapsed time
- `Remaining`: current video remaining time + all upcoming video durations
- `Total`: total duration of all videos in the playlist

Example:

- Video player: `00:11 / 00:15`
- Playlist sidebar:
  - `Elapsed`: `01:04`
  - `Remaining`: `02:26`
  - `Total`: `03:30`

## Label Recommendation

Prefer concise labels in the playlist sidebar:

- `Elapsed`
- `Left`
- `Total`

If the UI needs clearer scope, use:

- `Ritual Elapsed`
- `Ritual Left`
- `Ritual Total`

## Implementation Notes

- Find the playback component that renders the playlist timing cards.
- Keep the native/custom video player control timing unchanged.
- Calculate total ritual duration from the playlist step video durations.
- Calculate elapsed ritual time as:

  completed step durations + current step elapsed seconds

- Calculate remaining ritual time as:

  current step remaining seconds + upcoming step durations

- If a video duration is unavailable, use a defensible fallback:
  - exclude unknown durations from total until metadata loads, or
  - show a loading/placeholder state for the affected summary value.

- Avoid showing misleading totals if not all durations are known yet.

## Out Of Scope

- Redesigning the playback page layout.
- Changing step completion or unlock logic.
- Changing ritual video sources.
- Changing the ritual sequence/list page.
- Changing redirect behavior after ritual creation.

## Acceptance Criteria

- [ ] The video player still shows current-video timing.
- [ ] The playlist sidebar timing summary reflects the whole ritual, not only the current video.
- [ ] `Elapsed` increases across the full ritual as steps complete.
- [ ] `Remaining` counts down across the full ritual.
- [ ] `Total` represents the total known duration of all playlist videos.
- [ ] Unknown video durations do not create misleading totals.
- [ ] Step progress such as `5 / 14` remains visible and accurate.
- [ ] Desktop and mobile playback layouts remain stable.

## QA Checklist

- [ ] Open a ritual playback page with multiple video steps.
- [ ] Confirm the video player displays the current video time, such as `00:11 / 00:15`.
- [ ] Confirm the playlist sidebar `Elapsed` includes previous completed steps.
- [ ] Confirm the playlist sidebar `Remaining` includes the current video remainder plus upcoming steps.
- [ ] Let one video finish and confirm sidebar values continue correctly on the next step.
- [ ] Confirm the final step reaches `Remaining 00:00` when the ritual completes.
- [ ] Confirm no duplicate/conflicting current-video-only timing appears in the sidebar.
