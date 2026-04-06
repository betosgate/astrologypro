import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Resolve membership type so we can filter display_for correctly
  const { data: member } = await supabase
    .from("community_members")
    .select("membership_type")
    .eq("user_id", user.id)
    .single();

  const isMysterySchool = member?.membership_type === "mystery_school";
  const displayForValues = ["public", "members"];
  if (isMysterySchool) displayForValues.push("students");
  displayForValues.push("members_and_guests");

  const sp = req.nextUrl.searchParams;
  const monthParam = sp.get("month");
  const yearParam = sp.get("year");

  const admin = createAdminClient();
  let query = admin
    .from("calendar_events")
    .select("id, title, description, category, start_at, end_at, display_for, priority, is_active")
    .eq("is_active", true)
    .in("display_for", displayForValues)
    .order("start_at", { ascending: true });

  if (monthParam && yearParam) {
    const month = parseInt(monthParam, 10);
    const year = parseInt(yearParam, 10);
    // Build ISO range for the requested calendar month
    const startOfMonth = new Date(year, month - 1, 1).toISOString();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59).toISOString();
    query = query.gte("start_at", startOfMonth).lte("start_at", endOfMonth);
  } else {
    // Default: upcoming 60 days
    const now = new Date();
    const cutoff = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    query = query.gte("start_at", now.toISOString()).lte("start_at", cutoff.toISOString());
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    events: data ?? [],
    meta: { month: monthParam ? parseInt(monthParam, 10) : null, year: yearParam ? parseInt(yearParam, 10) : null },
  });
}
