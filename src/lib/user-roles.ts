import type { SupabaseClient } from "@supabase/supabase-js";

export interface UserPortal {
  role: string;
  label: string;
  href: string;
  badge?: string; // e.g. membership type sub-label
}

/**
 * Detect every portal a user has access to by checking all role tables in parallel.
 * Used in portal layouts for the role switcher and in /switch page.
 *
 * Parallel membership model:
 *   - community_members with membership_type = 'perennial_mandalism' → PM portal
 *   - mystery_school_students with status = 'active' (or unexpired cancelled) → MS portal
 *   - A user can have BOTH records → dual-entitlement, both portals shown
 */
export async function getUserPortals(
  supabase: SupabaseClient,
  userId: string
): Promise<UserPortal[]> {
  const [diviner, client, advocate, community, mysteryStudent, trainee] = await Promise.all([
    supabase.from("diviners").select("id").eq("user_id", userId).maybeSingle(),
    supabase.from("clients").select("id").eq("user_id", userId).maybeSingle(),
    supabase
      .from("social_advocates")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("community_members")
      .select("id, membership_type, membership_status")
      .eq("user_id", userId)
      .eq("membership_status", "active")
      .maybeSingle(),
    supabase
      .from("mystery_school_students")
      .select("id, status, access_expires_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("trainees").select("id").eq("user_id", userId).maybeSingle(),
  ]);

  const portals: UserPortal[] = [];

  if (diviner.data)
    portals.push({ role: "diviner", label: "Diviner Dashboard", href: "/dashboard" });
  if (client.data)
    portals.push({ role: "client", label: "Client Portal", href: "/portal" });
  if (advocate.data)
    portals.push({ role: "advocate", label: "Advocate Portal", href: "/advocate" });

  // PM portal: active community_members with perennial_mandalism type
  if (
    community.data &&
    community.data.membership_type === "perennial_mandalism" &&
    community.data.membership_status === "active"
  ) {
    portals.push({
      role: "community",
      label: "Community",
      href: "/community",
      badge: "Perennial Mandalism",
    });
  }

  // MS portal: active mystery_school_students (or cancelled with future access_expires_at)
  if (mysteryStudent.data) {
    const msData = mysteryStudent.data as {
      id: string;
      status: string;
      access_expires_at: string | null;
    };
    const isActive = msData.status === "active";
    const isCancelledWithAccess =
      msData.status === "cancelled" &&
      msData.access_expires_at &&
      new Date(msData.access_expires_at) > new Date();

    if (isActive || isCancelledWithAccess) {
      portals.push({
        role: "mystery_school",
        label: "Mystery School",
        href: "/mystery-school",
      });
    }
  }

  if (trainee.data)
    portals.push({ role: "trainee", label: "Trainee Portal", href: "/trainee" });

  return portals;
}
