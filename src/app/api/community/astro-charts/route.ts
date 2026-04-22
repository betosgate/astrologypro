import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ChartStatus = "ready" | "empty" | "pending" | "failed";

/**
 * GET /api/community/astro-charts
 *
 * Returns:
 * - natalChart: the first family member that has natal_chart data, else null
 * - monthlyTransit: this month's transit record for that member, else null
 * - status.natal / status.transit:
 *     "ready"   — data is available
 *     "empty"   — no data exists yet and no background generation is running;
 *                 the dashboard should render its empty state and stop polling
 *     "pending" — reserved for real background jobs; kept for future use
 *     "failed"  — an upstream read errored
 *
 * Used by the dashboard polling component (AstroChartsSection).
 *
 * Empty results are a normal outcome (a member may have zero family rows, or
 * the monthly transit for the current month may not have been generated yet),
 * so we use .maybeSingle() to avoid treating "no rows" as an error.
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
    .maybeSingle();

  if (!member || member.membership_status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Find first family member with a natal chart. `.maybeSingle()` because
  // an empty list is a valid "no chart yet" signal — not an error.
  const { data: familyWithChart, error: familyError } = await supabase
    .from("community_family_members")
    .select("id, full_name, date_of_birth, natal_chart")
    .eq("member_id", member.id)
    .not("natal_chart", "is", null)
    .limit(1)
    .maybeSingle();

  let natalChart: {
    id: string;
    full_name: string;
    date_of_birth: string;
    natal_chart: Record<string, unknown>;
  } | null = null;
  let monthlyTransit: {
    id: string;
    member_id: string;
    month: string;
    transit_data: Record<string, unknown>;
    created_at: string;
  } | null = null;

  let natalStatus: ChartStatus;
  let transitStatus: ChartStatus;

  if (familyError) {
    console.error("[community/astro-charts] family read error:", familyError);
    natalStatus = "failed";
    transitStatus = "failed";
  } else if (!familyWithChart) {
    // No family member has a natal chart yet — not a loading state.
    natalStatus = "empty";
    // Without a natal chart there is nothing to transit against.
    transitStatus = "empty";
  } else {
    natalChart = {
      id: familyWithChart.id,
      full_name: familyWithChart.full_name,
      date_of_birth: familyWithChart.date_of_birth,
      natal_chart: familyWithChart.natal_chart,
    };
    natalStatus = "ready";

    // Look up this month's transit for that family member.
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const { data: transit, error: transitError } = await supabase
      .from("monthly_transits")
      .select("id, month, transit_data, created_at")
      .eq("member_id", familyWithChart.id)
      .eq("month", currentMonth)
      .maybeSingle();

    if (transitError) {
      console.error("[community/astro-charts] transit read error:", transitError);
      transitStatus = "failed";
    } else if (transit) {
      monthlyTransit = {
        id: transit.id,
        member_id: familyWithChart.id,
        month: transit.month,
        transit_data: transit.transit_data,
        created_at: transit.created_at,
      };
      transitStatus = "ready";
    } else {
      transitStatus = "empty";
    }
  }

  return NextResponse.json({
    natalChart,
    monthlyTransit,
    status: { natal: natalStatus, transit: transitStatus },
  });
}
