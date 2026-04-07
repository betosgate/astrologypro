import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/bookings
 *
 * Returns the authenticated diviner's bookings for the schedule view.
 *
 * Query params:
 *   status  — comma-separated list, e.g. "confirmed,pending"  (default: all statuses)
 *   from    — ISO datetime lower bound on scheduled_at         (default: start of current week)
 *   to      — ISO datetime upper bound on scheduled_at         (default: end of current week)
 *
 * Response: { bookings: Booking[] }
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) {
    return NextResponse.json({ error: "Diviner profile not found" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;

  // Parse status filter
  const rawStatus = searchParams.get("status");
  const statusList =
    rawStatus && rawStatus !== "all"
      ? rawStatus.split(",").map((s) => s.trim()).filter(Boolean)
      : null;

  // Parse date range — default to current ISO week (Mon–Sun)
  const now = new Date();
  const todayDay = now.getDay(); // 0=Sun
  const daysFromMonday = (todayDay + 6) % 7; // shift so Monday=0
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const from = searchParams.get("from") ?? monday.toISOString();
  const to = searchParams.get("to") ?? sunday.toISOString();

  try {
    let query = supabase
      .from("bookings")
      .select(
        `id,
         scheduled_at,
         duration_minutes,
         status,
         base_price,
         total_amount,
         notes,
         session_notes,
         services(id, name, category),
         clients(id, full_name, email)`
      )
      .eq("diviner_id", diviner.id)
      .gte("scheduled_at", from)
      .lte("scheduled_at", to)
      .order("scheduled_at", { ascending: true });

    if (statusList && statusList.length > 0) {
      query = query.in("status", statusList);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error("[api/dashboard/bookings] query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ bookings: bookings ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
