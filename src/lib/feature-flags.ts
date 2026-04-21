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
