/**
 * Auth helper: returns the authenticated User when the caller is either
 *   (a) a master admin (admin_users row or ADMIN_EMAILS bootstrap), OR
 *   (b) a registered diviner (a row in `diviners` with user_id = current user).
 *
 * Used by the astrology compute + AI interpretation endpoints so that the
 * diviner-facing /admin/horoscope/session/[bookingId] toolkit can work
 * without surfacing admin-level permissions to divines.
 *
 * CLAUDE.md §13 (data-level authorization): this check is identity-level
 * ("is the caller a legitimate tool operator?"). The compute endpoints are
 * stateless pass-throughs to AstrologyAPI — no sensitive record is ever
 * returned, so no further object-level scoping is needed here. Per-booking
 * scoping is enforced at the page level (requireDivinerOrAdminForBooking).
 */

import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function requireAdminOrDiviner(): Promise<User | null> {
  // Admin path (fast, reuses existing helper).
  const adminUser = await requireAdmin();
  if (adminUser) return adminUser;

  // Diviner path: authenticated + row in `diviners`.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return data ? user : null;
}
