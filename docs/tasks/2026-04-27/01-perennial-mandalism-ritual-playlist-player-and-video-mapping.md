# Task 01 - Perennial Mandalism Ritual Playlist Player And Video Mapping - 2026-04-27

- Status: Planned
- Priority: P1
- Area: `community rituals`, `Perennial Mandalism dashboard`, `ritual playback`
- Scope: task specification for ritual video mapping, new ritual playback route, locked playlist UI, and sequential player behavior
- Requested By: user

## Goal

After clicking `Begin the Ritual` on a ritual detail page such as `/community/rituals/fce1fbaf-1c93-46e7-86ea-175e2f2ce08c`, open a new dynamic route using the ritual id and provide a playlist-based ritual video player for the Perennial Mandalism dashboard.

The new playback flow must:

1. Resolve the ritual's generated `ritual_tags`.
2. Map those tags to the correct ritual video URLs.
3. Build a canonical ordered playlist from those tags.
4. Start the first video automatically.
5. Lock forward navigation until the current video has ended.
6. Allow backward navigation to already-played steps.
7. Mark already-played items with a visibly different UI state.
8. Prevent the user from jumping ahead to uncompleted future playlist items.

## Source Documents To Preserve In This Task

This section captures the exact ritual sequencing and asset inventory rules provided by the user and should be treated as the implementation contract unless superseded by a later dated task.

### Ritual Builder Hierarchy Document

This document defines the strict, final hierarchical order for sequencing the invocations of all 22 Planetary and Zodiacal Divine Intelligences within the Ritual Builder. This priority is derived directly from the rules specified in the `Ritual Praxis` document and the `Order within a Gate` diagram. It is the definitive blueprint for the platform's ritual assembly logic.

The sequence is determined by a three-level hierarchy:

1. `Elemental Gate Priority`
   Fire -> Water -> Air -> Earth -> Spirit
2. `Entity Type Priority`
   Within each elemental gate, the order is always:
   Inner Planets -> Outer Planets -> Zodiacal Signs
3. `Zodiacal Modality Priority`
   When multiple zodiac signs share the same element, the order is always:
   Cardinal -> Fixed -> Mutable

### Definitive Invocation Priority Table

#### Fire Gate Invocations

- Elemental Priority 1: The Fire Gate is first in the elemental hierarchy.
- `1` Mars
  Inner Planet: Mars is the Inner Planet associated with Fire and is invoked first within this gate.
- `2` Jupiter
  Outer Planet: Jupiter is the Outer Planet of Fire and is invoked after the Inner Planet.
- `3` Aries
  Zodiac Cardinal: Aries is the Cardinal Fire sign and is invoked first among the fire zodiacs.
- `4` Leo
  Zodiac Fixed: Leo is invoked after the Cardinal sign.
- `5` Sagittarius
  Zodiac Mutable: Sagittarius is invoked last among the fire zodiacs.

#### Water Gate Invocations

- Elemental Priority 2: The Water Gate follows Fire.
- `6` Moon
  Inner Planet for Water.
- `7` Neptune
  Outer Planet for Water.
- `8` Cancer
  Zodiac Cardinal for Water.
- `9` Scorpio
  Zodiac Fixed for Water.
- `10` Pisces
  Zodiac Mutable for Water.

#### Air Gate Invocations

- Elemental Priority 3: The Air Gate follows Water.
- `11` Mercury
  Inner Planet for Air.
- `12` Uranus
  Outer Planet for Air.
- `13` Libra
  Zodiac Cardinal for Air.
- `14` Aquarius
  Zodiac Fixed for Air.
- `15` Gemini
  Zodiac Mutable for Air.

#### Earth Gate Invocations

- Elemental Priority 4: The Earth Gate follows Air.
- `16` Venus
  Inner Planet for Earth.
- `17` Saturn
  Outer Planet for Earth.
- `18` Capricorn
  Zodiac Cardinal for Earth.
- `19` Taurus
  Zodiac Fixed for Earth.
- `20` Virgo
  Zodiac Mutable for Earth.

#### Spirit Gate Invocations

- Elemental Priority 5: The Spirit Gate is final.
- `21` Sun
  Inner Planet for Spirit.
- `22` Pluto
  Outer Planet for Spirit.

### Video Asset Inventory Document

#### Static Videos

- `Standard Banishing Ritual of the Pentagram`
- `Standard Invocation Ritual of the Pentagram`
- `Divine Infinite Being Invocation Ritual`

#### Dynamic Foundational Components

- `Ritual Opening`
  Foundational Block: Grand Invocation to Hermes-Apollo
- `Ritual Closing`
  Closing of the Ritual

#### Gate Opening Videos

- Fire Gate Banishing
- Fire Gate Invoking
- Water Gate Banishing
- Water Gate Invoking
- Air Gate Banishing
- Air Gate Invoking
- Earth Gate Banishing
- Earth Gate Invoking
- Spirit Gate Banishing
- Spirit Gate Invoking

#### Divine Intelligence Invocation Videos

- Planetary invocation videos for:
  Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto
- Zodiacal invocation videos for:
  Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces

### Logic Clarification From The Document

1. `Planetary video logic`
   The choice between banishing and invoking affects only the gate-opening video.
   The planetary video that follows is always the invocation video.
2. `Zodiacal video logic`
   Zodiacal forces are always invoked and never banished.
   No zodiac-specific banishing step exists.
   The UI must not present zodiac banishing behavior.

### MVP Asset Count Summary

- Static Videos: `3`
- Dynamic Foundational Components: `2`
- Dynamic Gate Opening Videos: `10`
- Dynamic Divine Intelligence Invocations: `22`
- Total Required Videos: `37`

## Provided Video Asset Filenames

These filenames were provided by the user and should be mapped directly to S3 URLs.

- `air_gate_banishing.mp4`
- `air_gate_invocation.mp4`
- `aquarius_invocation.mp4`
- `aries_invocation.mp4`
- `cancer_invocation.mp4`
- `capricorn_invocation.mp4`
- `Core_Invocation_Ritual.mp4`
- `earth_gate_banishing.mp4`
- `earth_gate_invocation.mp4`
- `fire_gate_banishing.mp4`
- `fire_gate_invocation.mp4`
- `gemini_invocation.mp4`
- `jupiter_invocation.mp4`
- `leo_invocation.mp4`
- `libra_invocation.mp4`
- `mars_invocation.mp4`
- `mercury_invocation.mp4`
- `moon_invocation.mp4`
- `neptune_invocation.mp4`
- `pisces_invocation.mp4`
- `pluto_invocation.mp4`
- `Ritual_Closing.mp4`
- `Ritual_Opening.mp4`
- `sagittarius_invocation.mp4`
- `saturn_invocation.mp4`
- `scorpio_invocation.mp4`
- `spirit_gate_banishing.mp4`
- `spirit_gate_invocation.mp4`
- `StandardBanishingRitual.mp4`
- `StandardInvocationRitual.mp4`
- `sun_invocation.mp4`
- `taurus_invocation.mp4`
- `uranus_invocation.mp4`
- `venus_invocation.mp4`
- `virgo_invocation.mp4`
- `water_gate_banishing.mp4`
- `water_gate_invocation.mp4`

## Video URL Base

All video files should resolve to:

```text
https://divineritualasset.s3.us-east-1.amazonaws.com/<filename>
```

Example:

```text
https://divineritualasset.s3.us-east-1.amazonaws.com/water_gate_invocation.mp4
```

## Required Tag To Video Mapping Contract

This mapping section defines how ritual tags should resolve to the supplied video filenames.

### Foundational Tags

- `Ritual_Opening` -> `Ritual_Opening.mp4`
- `Ritual_Closing` -> `Ritual_Closing.mp4`

### Standard Static Ritual Tags

- `Pentagram_Gate_Banishing_Ritual` and `Pentagram_Banishing_Ritual`
  Preferred static playback target: `StandardBanishingRitual.mp4`
- `Pentagram_Gate_Invocation_Ritual` and `Pentagram_Invocation_Ritual`
  Preferred static playback target: `StandardInvocationRitual.mp4`
- `DIB_Gate_Invocation_Ritual` and `DIB_Invocation_Ritual`
  Playback target: `Core_Invocation_Ritual.mp4`

Implementation rule:
For the three fixed ritual presets, playback must use a single static video item in the playlist.

Required static playlist behavior:

1. `Standard Banishing Ritual of the Pentagram`
   Build a 1-item playlist using `StandardBanishingRitual.mp4`
2. `Standard Invocation Ritual of the Pentagram`
   Build a 1-item playlist using `StandardInvocationRitual.mp4`
3. `Divine Infinite Being Invocation Ritual of the Pentagram`
   Build a 1-item playlist using `Core_Invocation_Ritual.mp4`

Important:

- Do not expand these three rituals into modular `Ritual Opening`, `Gate`, `Core`, `Closing` playlist steps.
- Their saved tag sets may still contain opening/gate/core/closing tags for identity and display purposes, but playback must collapse each preset into a single static video row.
- This single-static-video behavior is the approved contract for preset ritual playback.

### Gate Tags

- `Fire_Gate_Banishing_Ritual` -> `fire_gate_banishing.mp4`
- `Fire_Gate_Invocation_Ritual` -> `fire_gate_invocation.mp4`
- `Water_Gate_Banishing_Ritual` -> `water_gate_banishing.mp4`
- `Water_Gate_Invocation_Ritual` -> `water_gate_invocation.mp4`
- `Air_Gate_Banishing_Ritual` -> `air_gate_banishing.mp4`
- `Air_Gate_Invocation_Ritual` -> `air_gate_invocation.mp4`
- `Earth_Gate_Banishing_Ritual` -> `earth_gate_banishing.mp4`
- `Earth_Gate_Invocation_Ritual` -> `earth_gate_invocation.mp4`
- `Spirit_Gate_Banishing_Ritual` -> `spirit_gate_banishing.mp4`
- `Spirit_Gate_Invocation_Ritual` -> `spirit_gate_invocation.mp4`

### Planetary Invocation Tags

- `Mars_Invocation_Ritual` -> `mars_invocation.mp4`
- `Jupiter_Invocation_Ritual` -> `jupiter_invocation.mp4`
- `Moon_Invocation_Ritual` -> `moon_invocation.mp4`
- `Neptune_Invocation_Ritual` -> `neptune_invocation.mp4`
- `Mercury_Invocation_Ritual` -> `mercury_invocation.mp4`
- `Uranus_Invocation_Ritual` -> `uranus_invocation.mp4`
- `Venus_Invocation_Ritual` -> `venus_invocation.mp4`
- `Saturn_Invocation_Ritual` -> `saturn_invocation.mp4`
- `Sun_Invocation_Ritual` -> `sun_invocation.mp4`
- `Pluto_Invocation_Ritual` -> `pluto_invocation.mp4`

### Zodiac Invocation Tags

- `Aries_Invocation_Ritual` -> `aries_invocation.mp4`
- `Leo_Invocation_Ritual` -> `leo_invocation.mp4`
- `Sagittarius_Invocation_Ritual` -> `sagittarius_invocation.mp4`
- `Cancer_Invocation_Ritual` -> `cancer_invocation.mp4`
- `Scorpio_Invocation_Ritual` -> `scorpio_invocation.mp4`
- `Pisces_Invocation_Ritual` -> `pisces_invocation.mp4`
- `Libra_Invocation_Ritual` -> `libra_invocation.mp4`
- `Aquarius_Invocation_Ritual` -> `aquarius_invocation.mp4`
- `Gemini_Invocation_Ritual` -> `gemini_invocation.mp4`
- `Capricorn_Invocation_Ritual` -> `capricorn_invocation.mp4`
- `Taurus_Invocation_Ritual` -> `taurus_invocation.mp4`
- `Virgo_Invocation_Ritual` -> `virgo_invocation.mp4`

## Ritual Playback Product Requirements

### Routing

When the user clicks `Begin the Ritual` on `/community/rituals/[id]`, navigate to a new dynamic playback page using the ritual id.

Suggested route:

```text
/community/rituals/[id]/playback
```

If an existing playback route already exists elsewhere in the project, either reuse its architecture or create a community-specific version with the same behavior.

### Player Layout

Build a ritual playback page with two major panels:

1. `Main video player panel`
   Shows the current ritual video.
2. `Playlist panel`
   Shows the full ritual sequence in order.

Desired playlist panel behavior:

- show current index, total step count
- show current item highlight
- show completed item styling
- show locked future item styling
- show per-item duration if available or derived
- show overall elapsed, remaining, total if practical

### Playback Rules

1. Automatically start the first video when the playback page loads.
2. The user can go backward to previously reached videos.
3. The user cannot jump forward past the highest unlocked step.
4. Future videos remain locked until the current video ends.
5. When video `n` ends, unlock and start video `n + 1`.
6. Once step `n` has completed, the user may replay any already-completed earlier step.
7. If the user goes back to an earlier video, they may then move forward again only up to the highest already-unlocked step.
8. The user cannot skip from step `1` to step `3` if step `2` has not completed.
9. Completed playlist items must have a clearly different UI treatment.
10. Current active step must have a distinct active UI treatment.
11. Locked future steps must look obviously unavailable.

### Ritual Completion Rules

When the final video ends:

1. Mark the ritual complete in persisted ritual state if needed.
2. Keep the full playlist unlocked for replay.
3. Provide a completion UI or route back to the existing ritual completion flow.

## Canonical Sequencing Rules For Playlist Assembly

For custom planetary/zodiacal rituals, the playlist order must be:

1. `Ritual_Opening`
2. Gate video for each active elemental gate, following elemental priority
3. Invocation videos inside each gate, following:
   Inner Planets -> Outer Planets -> Zodiac Signs
4. Zodiac signs inside a shared element follow:
   Cardinal -> Fixed -> Mutable
5. `Ritual_Closing`

### Static Ritual Playlist Rule

For the three preset rituals, the playback page must show a single playlist item only.

#### Static Standard Banishing

Saved tags may include:

1. `Ritual_Opening`
2. `Pentagram_Gate_Banishing_Ritual`
3. `Pentagram_Banishing_Ritual`
4. `Ritual_Closing`

But playback must collapse these into exactly:

1. `Standard Banishing Ritual of the Pentagram`

Video resolution:

1. `StandardBanishingRitual.mp4`

#### Static Standard Invocation

Saved tags may include:

1. `Ritual_Opening`
2. `Pentagram_Gate_Invocation_Ritual`
3. `Pentagram_Invocation_Ritual`
4. `Ritual_Closing`

But playback must collapse these into exactly:

1. `Standard Invocation Ritual of the Pentagram`

Video resolution:

1. `StandardInvocationRitual.mp4`

#### Static Divine Infinite Being

Saved tags may include:

1. `Ritual_Opening`
2. `DIB_Gate_Invocation_Ritual`
3. `DIB_Invocation_Ritual`
4. `Ritual_Closing`

But playback must collapse these into exactly:

1. `Divine Infinite Being Invocation Ritual of the Pentagram`

Video resolution:

1. `Core_Invocation_Ritual.mp4`

### Example Custom Invocation Playlist

If user chooses:

- Mode: `Invocation`
- Planets: `Jupiter`, `Mercury`
- Zodiacs: `Aquarius`

Then generated tags should sequence as:

1. `Ritual_Opening`
2. `Fire_Gate_Invocation_Ritual`
3. `Jupiter_Invocation_Ritual`
4. `Air_Gate_Invocation_Ritual`
5. `Mercury_Invocation_Ritual`
6. `Aquarius_Invocation_Ritual`
7. `Ritual_Closing`

Video resolution order:

1. `Ritual_Opening.mp4`
2. `fire_gate_invocation.mp4`
3. `jupiter_invocation.mp4`
4. `air_gate_invocation.mp4`
5. `mercury_invocation.mp4`
6. `aquarius_invocation.mp4`
7. `Ritual_Closing.mp4`

### Example Custom Banishing Playlist

If user chooses:

- Mode: `Banishing`
- Planets: `Mercury`, `Moon`

Then generated tags should sequence as:

1. `Ritual_Opening`
2. `Water_Gate_Banishing_Ritual`
3. `Air_Gate_Banishing_Ritual`
4. `Ritual_Closing`

Video resolution order:

1. `Ritual_Opening.mp4`
2. `water_gate_banishing.mp4`
3. `air_gate_banishing.mp4`
4. `Ritual_Closing.mp4`

Important:

- Banishing mode does not include separate planet invocation videos.
- Zodiac choices are disabled in banishing mode.

## Proposed Technical Breakdown

### Step 1 - Add Documentation And Contracts

- add this task file
- ensure future code references this task as the source of truth
- note any divergence between older Angular-era tag rules and this updated gate-first model

### Step 2 - Build A Shared Ritual Video Mapping Module

Create a dedicated mapping utility, for example:

```text
src/lib/community/ritual-video-map.ts
```

Responsibilities:

- map ritual tags to S3 filenames
- produce full URLs
- expose playlist item metadata
- keep canonical ordering centralized
- provide helper for "is this static ritual or dynamic ritual"

Suggested exported helpers:

- `getRitualVideoUrlForTag(tag: string): string | null`
- `buildRitualPlaylist(ritual: RitualConfig): RitualPlaylistItem[]`
- `sortRitualTagsForPlayback(tags: string[]): string[]`

### Step 3 - Add New Community Playback Route

Create a new page:

```text
src/app/community/rituals/[id]/playback/page.tsx
```

Responsibilities:

- fetch ritual by id
- build ordered playlist
- render player and sidebar playlist
- auto-start first video
- control forward/backward locks
- persist progress if needed

### Step 4 - Add Playlist And Player Components

Suggested components:

- `src/components/community/ritual-playlist-player.tsx`
- `src/components/community/ritual-playlist-sidebar.tsx`
- `src/components/community/ritual-video-shell.tsx`

Responsibilities:

- HTML5 video player wrapper
- current/locked/completed playlist row states
- timers for elapsed/remaining/total
- disable playlist clicks for locked steps

### Step 5 - Add Sequential Unlock State

Required local state:

- `currentStepIndex`
- `highestUnlockedStepIndex`
- `completedStepIndexes`

Rules:

- initialize to `0`
- initialize unlocked to `0`
- mark current step completed on `ended`
- unlock next step on `ended`
- auto-advance to next step after `ended`
- allow selecting any index `<= highestUnlockedStepIndex`
- block any selection `> highestUnlockedStepIndex`

### Step 6 - Connect Begin Ritual Button To Playback Route

Current ritual detail page:

```text
src/app/community/rituals/[id]/page.tsx
```

Change:

- `Begin the Ritual` should route to `/community/rituals/[id]/playback`
- if there is existing prep overlay behavior, preserve it if still desired before entering playback

### Step 7 - Handle Persisted Ritual Progress

Decide whether playback progress should persist across refreshes.

Recommended MVP:

- persist:
  - `current_step`
  - `is_complete`
- optionally persist:
  - highest unlocked step

If current API only stores coarse ritual progress, that may be enough for MVP.

### Step 8 - UI States For Playlist

Completed items:

- green or success-tinted background
- checkmark or completed indicator

Current item:

- highlighted active row
- stronger text and border

Locked future items:

- muted text
- reduced opacity
- disabled pointer behavior
- optional lock icon

### Step 9 - Validation And Missing Asset Handling

If a generated tag lacks a mapped video:

- do not silently skip without logging
- show a clear fallback UI or warning
- log missing mapping in console and/or API response
- optionally show "missing video asset" badge in playlist row

## Suggested Data Shape

```ts
type RitualPlaylistItem = {
  tag: string;
  title: string;
  videoUrl: string;
  filename: string;
  sequence: number;
  kind: "opening" | "gate" | "invocation" | "closing" | "static";
  locked: boolean;
  completed: boolean;
};
```

## Acceptance Criteria

1. Clicking `Begin the Ritual` from `/community/rituals/[id]` opens a new dynamic playback route using that ritual id.
2. Playback page builds the video list from the saved ritual tags, not from transient UI state.
3. First video starts automatically.
4. User cannot jump to future steps before the current step finishes.
5. User can return to any previously reached step.
6. After a step ends, the next step auto-starts and becomes unlocked.
7. Completed steps show visibly different UI.
8. Current step shows visibly different UI.
9. Locked future steps show visibly different UI and are not clickable.
10. Playlist sequencing for custom rituals follows:
    Opening -> Gate order by element -> Invocation order by gate hierarchy -> Closing
11. The three static preset rituals render as a single playlist item each and do not expand into four modular steps.
12. Banishing custom rituals use gate banishing videos only, with no planet invocation videos.
13. Invocation custom rituals use gate invocation videos plus relevant invocation videos.
14. Zodiac invocation order inside the same element follows Cardinal -> Fixed -> Mutable.
15. All provided video filenames resolve to the S3 URL base correctly.
16. Ritual completion behavior remains compatible with existing ritual state handling.

## Verification Plan

### Custom Invocation

1. Create a ritual with:
   `Jupiter`, `Mercury`, `Aquarius`
2. Confirm playlist order is:
   Opening -> Fire Gate Invocation -> Jupiter Invocation -> Air Gate Invocation -> Mercury Invocation -> Aquarius Invocation -> Closing
3. Confirm first video auto-plays.
4. Confirm step 2 is locked until step 1 ends.
5. Confirm after finishing step 1, step 2 unlocks and auto-plays.
6. Confirm after reaching later steps, user can go back and replay earlier steps.
7. Confirm user still cannot jump beyond the highest unlocked step.

### Custom Banishing

1. Create a banishing ritual with:
   `Moon`, `Mercury`
2. Confirm playlist is:
   Opening -> Water Gate Banishing -> Air Gate Banishing -> Closing
3. Confirm no planet invocation videos are inserted.

### Multi-Gate Invocation With Zodiacs

1. Create ritual with:
   `Mars`, `Jupiter`, `Aries`, `Leo`, `Sagittarius`, `Moon`, `Cancer`
2. Confirm order is:
   Opening -> Fire Gate Invocation -> Mars -> Jupiter -> Aries -> Leo -> Sagittarius -> Water Gate Invocation -> Moon -> Cancer -> Closing

### Locking Rules

1. Attempt to click a future playlist item before current step ends.
2. Confirm click is blocked.
3. Finish current step and confirm only the next step unlocks.

### Completion

1. Finish the final video.
2. Confirm ritual completion state updates properly.
3. Confirm playlist becomes fully replayable if that is the chosen completion behavior.

## Risks And Open Questions

1. Existing `ritual_invocations` data model may already contain video URLs and may conflict with filename-based mapping.
2. The three preset rituals may need a follow-up decision on whether to remain static/single-video or become playlist-based.
3. Existing route conventions may already include a playback route in a different app area and should be reconciled.
4. Video duration availability may require reading media metadata client-side instead of hardcoding durations.
5. If persisted progress across refresh is required, API contract may need extension.

## Recommended Implementation Order

1. Add mapping utility with tests.
2. Add playlist assembly helper with tests for invocation and banishing ordering.
3. Build new playback page and sidebar UI.
4. Wire `Begin the Ritual` navigation.
5. Add locking and replay behavior.
6. Add persistence hooks if needed.
7. Run manual QA with multiple ritual combinations.

## Notion Summary

P1 task for Perennial Mandalism ritual playback. Add a new `/community/rituals/[id]/playback` route that converts saved ritual tags into a locked sequential video playlist using the provided S3 assets. Preserve the canonical ritual hierarchy: elemental gate order, then entity type order, then zodiac modality order. Auto-play the first video, unlock steps only after completion, allow backward replay, and visually distinguish completed/current/locked playlist items.
