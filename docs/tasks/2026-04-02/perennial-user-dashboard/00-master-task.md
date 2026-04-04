# Master Task - Perennial User Dashboard Parity Migration - 2026-04-02

- Status: In Progress
- Priority: P1
- Owner: Frontend
- Module: Perennial Mandalism -> User Dashboard
- PMS Type: Master Task
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/perennial-user-dashboard`

## Goal

Bring the Perennial Mandalism User Dashboard in `Divine-infinite-ui-next` (`/admin/perennial`) to parity with the Angular implementation (`perennial-mandalism-dashboard`), focusing on interactive charts, progress tracking, and detailed membership orientation.

## Current Product Truth

The current Next dashboard is a simplified landing page with quick links and a basic rituals table. It lacks the critical "Astro Charts" (Natal/Monthly) which are a core part of the Perennial Mandalism experience, and does not show profile completion progress or a direct relationship preview.

## Folder Path For Execution

`Divine-infinite-ui-next/docs/tasks/2026-04-02/perennial-user-dashboard`

## Child Tasks In Scope

1. `01-implement-astro-charts-polling-and-display.md`: Polling and rendering of Natal and Monthly charts.
2. `02-implement-profile-completion-progress-rings.md`: Circular progress indicators for user and members.
3. `03-integrate-relationship-list-and-member-preview.md`: Dashboard-level member list and interaction.
4. `04-add-mystery-school-and-donation-promo-blocks.md`: Promo blocks with integrated navigation.
5. `05-implement-content-counts-and-detailed-membership-info.md`: Support for content counts and expanded membership details.
6. `06-implement-media-lists-and-content-table.md`: Migration of blogs, videos, and priority-sorted content.
7. `07-master-ritual-parity-task.md`: Master task for My Rituals, Create Ritual, ritual config fetch, and ritual video playback parity.
8. `08-my-rituals-list-and-navigation-parity.md`: My Rituals list fetch, count, row mapping, and navigate action parity.
9. `09-create-ritual-standard-presets-parity.md`: Standard Create Ritual presets and post-create navigation parity.
10. `10-custom-ritual-configurator-parity.md`: Planetary/zodiacal configurator, validation, and tag-generation parity.
11. `11-ritual-result-config-fetch-and-video-sequencing-parity.md`: Config-id-driven result flow, video-library fetch, ordering, and dynamic pre-start parity.

## Delivery Expectations

1. Ensure real-time polling logic for charts matches Angular's implementation (10s interval).
2. Use existing UI components (Cards, Badges, Avatars) where possible to maintain design consistency.
3. Keep the dashboard responsive and performant even with multiple async polling requests.
4. Implement child tasks in order to build data richness incrementally.
5. Preserve Angular’s ritual workflow semantics, even if the Create Ritual entry point is surfaced under the My Rituals tab in Next instead of the global header.

## Done Definition

- Natal and Monthly charts correctly poll, load, and display image/interpretation.
- Profile progress rings correctly reflect completeness percentages.
- Relationship list is visible on the dashboard with member details.
- Promo blocks for Mystery School and Donation are implemented and functional.
- Content counts and detailed membership info are integrated.
- My Rituals list, Create Ritual flow, and ritual result playback flow match Angular behavior and backend contracts.
