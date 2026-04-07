# Master Task - Ritual Video Player Integration - 2026-04-07

- Status: Planned
- Priority: P1
- Owner: Fullstack
- Scope: Database updates, API integration, Interactive Video Player UI, Admin management
- Estimate: 2-3 days
- Task File: `tasks/perennial/2026-04-07/09-master-task-ritual-video-player-integration.md`

## Objective

Restore the missing interactive video playing experience to the Ritual Module. Currently, the new project correctly compiles the hermetic sequence of a ritual, but only outputs text instructions. This task implements a dynamic interactive video player mapping exactly to the old Angular project's capabilities.

## Child Tasks

1. `09.1-ritual-invocations-database-and-api-update.md`
2. `09.2-ritual-player-video-component-ui.md`
3. `09.3-admin-ritual-management-video-fields.md`

## Required Outcome

1. The `ritual_invocations` table must support storing video URLs or media paths.
2. The Admin panel must allow staff to attach specific videos to each ritual step (e.g., Banishing Gate, Planetary Invocation).
3. The Community Ritual Player (`ritual-result` equivalent) must be upgraded from a static text viewer to a dynamic, auto-playing video journey.
4. The system must seamlessly play the curated sequence (Openings → Elements/Planets → Closings) automatically transition between video clips.

## Done Definition

- Database schema includes `video_url`.
- Admins can upload or link videos for a specific ritual step.
- The community ritual dashboard uses an HTML5 or custom video player.
- After passing the "Prepare Sacred Space" overlay, the first video starts playing automatically.
- Upon completion of a video step, it automatically proceeds (or waits for user prompt) to the next step until the ritual is complete.

## Notion Ready Summary

P1 Ritual Video Restoration: Implemented missing interactive video playback into the Perennial Ritual module. Includes database integration for `video_url`, an upgraded Admin UI for video management, and a dynamic frontend player that strings together canonical hermetic video segments based on the user's selected configuration.
