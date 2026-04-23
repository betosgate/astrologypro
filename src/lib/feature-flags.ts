/**
 * Feature flags — read from environment at module load.
 *
 * NEXT_PUBLIC_AFFILIATE_ASSIGNMENT_V2 ("on" | "off", default "off" in prod)
 *   Gates the service-scoped affiliate assignments flow introduced in
 *   the 2026-04-21 sprint. When "off", the new Assignments UIs redirect
 *   back to their parent page and the new create-campaign/assignment
 *   write endpoints return 503.
 *
 * These flags are read-only at runtime — flipping an env var requires
 * a redeploy (that's intentional — server components cache).
 */

export function isAffiliateAssignmentV2Enabled(): boolean {
  // Default to "on" in non-production so local + preview envs don't
  // block the new flow by accident. Production requires an explicit
  // `"on"` to flip it live.
  const raw = process.env.NEXT_PUBLIC_AFFILIATE_ASSIGNMENT_V2;
  if (raw === "on") return true;
  if (raw === "off") return false;
  // Fallback: dev/preview → on, prod → off
  return process.env.NODE_ENV !== "production";
}

/**
 * NEXT_PUBLIC_LANDING_PAGE_V2 ("on" | "off", default "off" in prod)
 *   Gates the simplified landing-page flow introduced in the 2026-04-21
 *   landing-page-simplification sprint. When "off", the current (pre-V2)
 *   builder + publish model remains live. When "on":
 *     - the new Live/Offline toggle UI is shown on /dashboard/landing-pages
 *     - POST /api/dashboard/landing-pages/[templateId]/toggle-live is the
 *       canonical publish-state write path (replaces publish + unpublish)
 *     - public route renders legacy template + slot blocks (once Task 02
 *       is implemented)
 */
export function isLandingPageV2Enabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_LANDING_PAGE_V2;
  if (raw === "on") return true;
  if (raw === "off") return false;
  return process.env.NODE_ENV !== "production";
}

/**
 * NEXT_PUBLIC_AFFILIATE_IDENTITY_V2 ("on" | "off", default "off" in prod)
 *   Gates the 2026-04-23 affiliate-identity-refactor. When "off":
 *     - new routes created by this sprint return 503 (invite/accept/portal APIs)
 *     - `getUserPortals()` does not emit an Affiliate tile
 *     - the `/affiliate/*` middleware guard returns 404 for the portal (the
 *       existing broken scaffolding stays hidden)
 *   When "on":
 *     - canonical `affiliate_accounts` is the identity source of truth
 *     - `/dashboard/affiliates` shows the invite-only flow
 *     - `/affiliate/*` portal routes via `affiliate_accounts.user_id`
 *
 * Sprint plan: docs/tasks/2026-04-23/affiliate-identity-refactor/
 */
export function isAffiliateIdentityV2Enabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_AFFILIATE_IDENTITY_V2;
  if (raw === "on") return true;
  if (raw === "off") return false;
  // Default: dev/preview → on, prod → off
  return process.env.NODE_ENV !== "production";
}
