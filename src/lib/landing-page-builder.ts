/**
 * DEPRECATED — this module is a placeholder kept only to preserve import
 * paths during the Deploy 1 rollout of the landing-page simplification
 * (Task 03, docs/tasks/2026-04-21/landing-page-simplification). All helpers
 * previously exported from here (`publishLandingPage`, `unpublishLandingPage`,
 * `getOrCreateLandingPage`, `getPublishedLandingPage`, `getDraftLandingPage`,
 * `getAvailableSectionTypes`) have been removed or relocated:
 *
 * - Block CRUD + owner-side reads live in `src/lib/diviner-service-blocks.ts`.
 * - The public route reads blocks via `getDivinerBlocks()` in the same module.
 * - There is no longer a "publish" or "draft" lifecycle at the page level;
 *   `diviner_services.is_published` is the single gate toggled from the
 *   dashboard.
 *
 * This file intentionally exports nothing runnable. Any remaining import
 * from `@/lib/landing-page-builder` is a bug — fix the caller rather than
 * shimming it here. The file itself will be removed in Deploy 2.
 */

export {};
