import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoleCount {
  role: string;
  count: number;
}

interface TopDiviner {
  name: string;
  id: string;
  affiliate_count: number;
}

interface UserReportResponse {
  total_users: number;
  by_role: RoleCount[];
  active_vs_inactive: { active: number; inactive: number };
  new_this_month: number;
  new_this_week: number;
  pending_invitations: number;
  locked_accounts: number;
  diviner_count: number;
  affiliate_count: number;
  customer_count: number;
  top_diviners_by_affiliates: TopDiviner[];
}

// ─── GET /api/admin/reports/users ────────────────────────────────────────────
// Returns aggregated user stats across all role profile tables.
// Admin only.

export async function GET() {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/403",
        title: "Forbidden",
        status: 403,
        detail: "Admin authentication required",
      },
      { status: 403 }
    );
  }

  const admin = createAdminClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fire all parallel queries
  const [
    divinersAll,
    divinersActive,
    clientsAll,
    advocatesAll,
    advocatesActive,
    communityAll,
    communityActive,
    traineesAll,
    traineesActive,
    // New this month
    divinersNewMonth,
    clientsNewMonth,
    advocatesNewMonth,
    communityNewMonth,
    traineesNewMonth,
    // New this week
    divinersNewWeek,
    clientsNewWeek,
    advocatesNewWeek,
    communityNewWeek,
    traineesNewWeek,
    // Affiliates count (diviner_affiliates table)
    affiliatesAll,
    // Locked accounts (user_account_locks)
    lockedAccounts,
    // Pending invitations (user_invitations)
    pendingInvitations,
  ] = await Promise.all([
    // Total counts
    admin.from("diviners").select("id", { count: "exact", head: true }),
    admin.from("diviners").select("id", { count: "exact", head: true }).eq("is_active", true),
    admin.from("clients").select("id", { count: "exact", head: true }),
    admin.from("social_advocates").select("id", { count: "exact", head: true }),
    admin.from("social_advocates").select("id", { count: "exact", head: true }).eq("is_active", true),
    admin.from("community_members").select("id", { count: "exact", head: true }),
    admin.from("community_members").select("id", { count: "exact", head: true }).eq("membership_status", "active"),
    admin.from("trainees").select("id", { count: "exact", head: true }),
    admin.from("trainees").select("id", { count: "exact", head: true }).in("training_status", ["active", "in_progress"]),

    // New this month
    admin.from("diviners").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth),
    admin.from("clients").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth),
    admin.from("social_advocates").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth),
    admin.from("community_members").select("id", { count: "exact", head: true }).gte("joined_at", startOfMonth),
    admin.from("trainees").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth),

    // New this week
    admin.from("diviners").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    admin.from("clients").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    admin.from("social_advocates").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    admin.from("community_members").select("id", { count: "exact", head: true }).gte("joined_at", sevenDaysAgo),
    admin.from("trainees").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),

    // Affiliates (diviner_affiliates table)
    admin.from("diviner_affiliates").select("id", { count: "exact", head: true }),

    // Locked accounts — user_account_locks where unlocked_at IS NULL
    admin
      .from("user_account_locks")
      .select("id", { count: "exact", head: true })
      .is("unlocked_at", null),

    // Pending invitations
    admin
      .from("user_invitations")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  // Aggregate counts
  const dTotal  = divinersAll.count ?? 0;
  const dActive = divinersActive.count ?? 0;
  const cTotal  = clientsAll.count ?? 0;
  const aTotal  = advocatesAll.count ?? 0;
  const aActive = advocatesActive.count ?? 0;
  const cmTotal = communityAll.count ?? 0;
  const cmActive = communityActive.count ?? 0;
  const tTotal  = traineesAll.count ?? 0;
  const tActive = traineesActive.count ?? 0;

  const totalUsers = dTotal + cTotal + aTotal + cmTotal + tTotal;
  const totalActive = dActive + cTotal + aActive + cmActive + tActive;
  const totalInactive = totalUsers - totalActive;

  const newThisMonth =
    (divinersNewMonth.count ?? 0) +
    (clientsNewMonth.count ?? 0) +
    (advocatesNewMonth.count ?? 0) +
    (communityNewMonth.count ?? 0) +
    (traineesNewMonth.count ?? 0);

  const newThisWeek =
    (divinersNewWeek.count ?? 0) +
    (clientsNewWeek.count ?? 0) +
    (advocatesNewWeek.count ?? 0) +
    (communityNewWeek.count ?? 0) +
    (traineesNewWeek.count ?? 0);

  // Top 5 diviners by affiliate count
  // We fetch from diviner_affiliates grouped by diviner_id
  let topDiviners: TopDiviner[] = [];
  const { data: topAffiliateRows } = await admin
    .from("diviner_affiliates")
    .select("diviner_id, id")
    .order("created_at", { ascending: false });

  if (topAffiliateRows && topAffiliateRows.length > 0) {
    // Count affiliates per diviner
    const countMap: Record<string, number> = {};
    for (const row of topAffiliateRows as Array<Record<string, unknown>>) {
      const did = row.diviner_id as string;
      if (did) countMap[did] = (countMap[did] ?? 0) + 1;
    }

    // Sort and take top 5
    const sortedDiviners = Object.entries(countMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    if (sortedDiviners.length > 0) {
      const divinerIds = sortedDiviners.map(([id]) => id);
      const { data: divinerRows } = await admin
        .from("diviners")
        .select("id, user_id, display_name")
        .in("user_id", divinerIds);

      for (const [userId, affiliateCount] of sortedDiviners) {
        const divRow = (divinerRows ?? []).find(
          (d) => (d as Record<string, unknown>).user_id === userId
        ) as Record<string, unknown> | undefined;
        topDiviners.push({
          name: (divRow?.display_name as string) ?? userId,
          id: userId,
          affiliate_count: affiliateCount,
        });
      }
    }
  }

  const response: UserReportResponse = {
    total_users: totalUsers,
    by_role: [
      { role: "diviner",    count: dTotal },
      { role: "client",     count: cTotal },
      { role: "advocate",   count: aTotal },
      { role: "community",  count: cmTotal },
      { role: "trainee",    count: tTotal },
    ],
    active_vs_inactive: { active: totalActive, inactive: totalInactive },
    new_this_month:       newThisMonth,
    new_this_week:        newThisWeek,
    pending_invitations:  pendingInvitations.count ?? 0,
    locked_accounts:      lockedAccounts.count ?? 0,
    diviner_count:        dTotal,
    affiliate_count:      affiliatesAll.count ?? 0,
    customer_count:       cTotal,
    top_diviners_by_affiliates: topDiviners,
  };

  return NextResponse.json(response);
}
