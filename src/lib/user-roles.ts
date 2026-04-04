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
 */
export async function getUserPortals(
  supabase: SupabaseClient,
  userId: string
): Promise<UserPortal[]> {
  const [diviner, client, advocate, community, trainee] = await Promise.all([
    supabase.from("diviners").select("id").eq("user_id", userId).maybeSingle(),
    supabase.from("clients").select("id").eq("user_id", userId).maybeSingle(),
    supabase
      .from("social_advocates")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("community_members")
      .select("id, membership_type")
      .eq("user_id", userId)
      .eq("membership_status", "active")
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
  if (community.data) {
    const badge =
      community.data.membership_type === "mystery_school"
        ? "Mystery School"
        : "Perennial Mandalism";
    portals.push({ role: "community", label: "Community", href: "/community", badge });
  }
  if (trainee.data)
    portals.push({ role: "trainee", label: "Trainee Portal", href: "/trainee" });

  return portals;
}
