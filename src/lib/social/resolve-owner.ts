/**
 * Resolve the caller of a /api/social/* route to an `Owner`:
 *   - If the caller is an admin AND passes `?scope=admin` (or the route
 *     body says so), we treat this as the brand-wide admin connection
 *     (owner_id = null).
 *   - Otherwise, if the caller has a row in `diviners`, we treat them as
 *     a diviner owner (owner_id = diviners.id).
 *   - Otherwise, null — the route should return 401/403.
 *
 * This keeps one set of routes (`/api/social/*`) serving both admin and
 * diviner flows, with the caller picking which "hat" they're wearing via
 * an explicit `scope` parameter (never inferred silently — a diviner who
 * is ALSO an admin must consciously pick which identity is posting).
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import type { Owner } from "./types";

export type ScopeInput = "admin" | "diviner" | undefined | null;

export interface ResolvedOwner {
  owner: Owner;
  userId: string;
}

/**
 * @param requestedScope - "admin" forces admin-owner; "diviner" or null lets
 *   us auto-detect a diviner profile; anything else returns null.
 */
export async function resolveOwnerFromRequest(
  requestedScope: ScopeInput,
): Promise<ResolvedOwner | null> {
  // Admin path — must be explicit ("admin") to avoid a diviner who happens to
  // also be in admin_users accidentally publishing as the brand.
  if (requestedScope === "admin") {
    const adminUser = await requireAdmin();
    if (!adminUser) return null;
    return { owner: { type: "admin", id: null }, userId: adminUser.id };
  }

  // Diviner path.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) return null;

  return { owner: { type: "diviner", id: diviner.id }, userId: user.id };
}

export function redirectUriForPlatform(platform: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  return `${base.replace(/\/$/, "")}/api/social/connect/${platform}/callback`;
}
