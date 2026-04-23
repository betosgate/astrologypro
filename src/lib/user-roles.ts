import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasValidMysterySchoolBilling } from "@/lib/mystery-school/access";
import { isAffiliateIdentityV2Enabled } from "@/lib/feature-flags";

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
 *   - mystery_school_students with status = 'active'
 *     or 'cancelled' with future access_expires_at → MS portal
 *   - the MS row must also contain the required payment-linked fields
 *   - A user can have BOTH records → dual-entitlement, both portals shown
 */
/**
 * Options for getUserPortals.
 * @param isAdmin - Explicitly set admin status.
 *   - true  → always include Admin portal
 *   - false → never include Admin portal
 *   - undefined (default) → auto-check admin_users table via service-role client
 */
export interface GetUserPortalsOptions {
  isAdmin?: boolean;
}

export async function getUserPortals(
  supabase: SupabaseClient,
  userId: string,
  options: GetUserPortalsOptions = {}
): Promise<UserPortal[]> {
  // Resolve admin status: explicit override or auto-check via service-role client
  let resolvedIsAdmin = options.isAdmin ?? false;
  if (options.isAdmin === undefined) {
    try {
      const adminDb = createAdminClient();
      const { data: adminRow } = await adminDb
        .from("admin_users")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      resolvedIsAdmin = !!adminRow;
    } catch {
      resolvedIsAdmin = false;
    }
  }

  const affiliateFlagOn = isAffiliateIdentityV2Enabled();

  const [diviner, client, advocate, community, mysteryStudent, trainee, affiliate] = await Promise.all([
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
      .eq("membership_type", "perennial_mandalism")
      .maybeSingle(),
    supabase
      .from("mystery_school_students")
      .select("id, status, access_expires_at, stripe_subscription_id, one_time_fee_paid, one_time_fee_amount")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("trainees").select("id").eq("user_id", userId).maybeSingle(),
    // Affiliate account (2026-04-23 identity refactor). Skipped when flag is off.
    affiliateFlagOn
      ? supabase
          .from("affiliate_accounts")
          .select("id, status")
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null as { id: string; status: string } | null }),
  ]);

  const portals: UserPortal[] = [];

  // Admin portal
  if (resolvedIsAdmin)
    portals.push({ role: "admin", label: "Admin", href: "/admin" });

  if (diviner.data)
    portals.push({ role: "diviner", label: "Diviner", href: "/dashboard" });
  if (client.data)
    portals.push({ role: "client", label: "Client Portal", href: "/portal" });
  if (advocate.data)
    portals.push({ role: "advocate", label: "Advocate", href: "/advocate" });

  // PM portal: show for any PM member (active, cancelling, or cancelled).
  // Active members see the full dashboard; inactive members see the
  // SubscriptionExpiredView with a resubscribe option.
  if (
    community.data &&
    community.data.membership_type === "perennial_mandalism"
  ) {
    portals.push({
      role: "community",
      label: "Community",
      href: "/community",
      badge: community.data.membership_status === "active"
        ? "Perennial Mandalism"
        : "Perennial Mandalism (Inactive)",
    });
  }

  // MS portal: active mystery_school_students, plus cancelled students
  // who still have access until the paid-through date.
  if (mysteryStudent.data) {
    const msData = mysteryStudent.data as {
      id: string;
      status: string;
      access_expires_at: string | null;
      stripe_subscription_id: string | null;
      one_time_fee_paid: boolean;
      one_time_fee_amount: number | null;
    };
    const isCancelledWithAccess =
      msData.status === "cancelled" &&
      !!msData.access_expires_at &&
      new Date(msData.access_expires_at) > new Date();

    if (
      hasValidMysterySchoolBilling(msData) &&
      (msData.status === "active" || isCancelledWithAccess)
    ) {
      portals.push({
        role: "mystery_school",
        label: "Mystery School",
        href: "/mystery-school",
      });
    }
  }

  if (trainee.data)
    portals.push({ role: "trainee", label: "Trainee Portal", href: "/trainee" });

  // Affiliate portal — only surfaced when the 2026-04-23 identity refactor
  // is enabled AND the user has an active canonical affiliate_accounts row.
  if (affiliate.data && affiliate.data.status === "active") {
    portals.push({ role: "affiliate", label: "Affiliate Portal", href: "/affiliate" });
  }

  return portals;
}
