import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/community/astro-charts
 *
 * Returns:
 * - natalChart: the first family member that has natal_chart data
 * - monthlyTransit: this month's transit record for that member
 *
 * Used by the dashboard polling component (AstroChartsSection).
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get community member
  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member || member.membership_status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Find first family member with a natal chart
  const { data: familyWithChart } = await supabase
    .from("community_family_members")
    .select("id, full_name, date_of_birth, natal_chart")
    .eq("member_id", member.id)
    .not("natal_chart", "is", null)
    .limit(1)
    .single();

  let natalChart = null;
  let monthlyTransit = null;

  if (familyWithChart) {
    natalChart = {
      id: familyWithChart.id,
      full_name: familyWithChart.full_name,
      date_of_birth: familyWithChart.date_of_birth,
      natal_chart: familyWithChart.natal_chart,
    };

    // Look up this month's transit for that family member
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const { data: transit } = await supabase
      .from("monthly_transits")
      .select("id, month, transit_data, created_at")
      .eq("member_id", familyWithChart.id)
      .eq("month", currentMonth)
      .single();

    if (transit) {
      monthlyTransit = {
        id: transit.id,
        member_id: familyWithChart.id,
        month: transit.month,
        transit_data: transit.transit_data,
        created_at: transit.created_at,
      };
    }
  }

  return NextResponse.json({ natalChart, monthlyTransit });
}
