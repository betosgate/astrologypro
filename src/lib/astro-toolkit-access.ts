import type { User } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AstroToolkitRole = "admin" | "diviner" | "community";

export interface AstroToolkitAccess {
  user: User;
  role: AstroToolkitRole;
}

/**
 * Grants access to the shared horoscope toolkit runtime for:
 * - admins
 * - registered diviners
 * - active Perennial Mandalism members
 *
 * The compute endpoints are stateless pass-throughs to upstream astrology
 * providers, so identity-level checks are sufficient here. Routes that expose
 * booking-specific data still enforce their own object-level authorization.
 */
export async function requireAstroToolkitAccess(): Promise<AstroToolkitAccess | null> {
  const adminUser = await requireAdmin();
  if (adminUser) return { user: adminUser, role: "admin" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();
  const [divinerRes, memberRes] = await Promise.all([
    admin.from("diviners").select("id").eq("user_id", user.id).maybeSingle(),
    admin
      .from("community_members")
      .select("id, membership_type, membership_status")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (divinerRes.data) return { user, role: "diviner" };

  if (
    memberRes.data &&
    memberRes.data.membership_type === "perennial_mandalism" &&
    memberRes.data.membership_status === "active"
  ) {
    return { user, role: "community" };
  }

  return null;
}
