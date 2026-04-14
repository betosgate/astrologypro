import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/bookings/stats
 *
 * Returns live KPI counts for the authenticated diviner's bookings dashboard.
 *
 * Response:
 *   sessionsThisWeek  — bookings scheduled within the current Sun–Sat week
 *   hoursThisWeek     — total duration (hours) of those sessions
 *   upcomingCount     — future bookings with status pending | confirmed | pending_payment
 *   totalClients      — distinct client count across all bookings
 *   totalRevenue      — sum of base_price on confirmed + completed bookings
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const ownerId = diviner?.id ?? user.id;

  const now = new Date();

  // Current week: Sunday 00:00 → Saturday 23:59:59
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const [weekRes, upcomingRes, clientsRes, revenueRes] = await Promise.all([
    // Sessions this week + hours
    admin
      .from("bookings")
      .select("duration_minutes")
      .eq("owner_id", ownerId)
      .in("status", ["pending", "confirmed", "in_progress", "completed"])
      .gte("scheduled_at", weekStart.toISOString())
      .lt("scheduled_at", weekEnd.toISOString()),

    // Upcoming (future) bookings
    admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", ownerId)
      .in("status", ["pending", "confirmed", "pending_payment"])
      .gt("scheduled_at", now.toISOString()),

    // Total distinct clients
    admin
      .from("bookings")
      .select("client_id")
      .eq("owner_id", ownerId)
      .not("client_id", "is", null),

    // Total revenue (confirmed + completed)
    admin
      .from("bookings")
      .select("base_price")
      .eq("owner_id", ownerId)
      .in("status", ["confirmed", "completed"])
      .gt("base_price", 0),
  ]);

  const sessionsThisWeek = weekRes.data?.length ?? 0;
  const hoursThisWeek =
    Math.round(
      ((weekRes.data ?? []).reduce((sum, b) => sum + (b.duration_minutes ?? 0), 0) / 60) * 10
    ) / 10;

  const upcomingCount = upcomingRes.count ?? 0;

  const uniqueClients = new Set((clientsRes.data ?? []).map((b) => b.client_id));
  const totalClients = uniqueClients.size;

  const totalRevenue = (revenueRes.data ?? []).reduce(
    (sum, b) => sum + Number(b.base_price ?? 0),
    0
  );

  return NextResponse.json({
    sessionsThisWeek,
    hoursThisWeek,
    upcomingCount,
    totalClients,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
  });
}
