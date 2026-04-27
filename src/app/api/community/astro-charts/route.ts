import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isValidNatalChart,
  isValidMonthlyTransit,
} from "@/lib/community/chart-validators";
import { deriveNatalReportState } from "@/lib/community/chart-report-state";

export const dynamic = "force-dynamic";

type ChartStatus = "ready" | "empty" | "pending" | "failed";

/**
 * GET /api/community/astro-charts
 *
 * Returns:
 * - natalChart  : the first family member that has natal_chart data, else null
 *                 (kept for backward compatibility with older clients).
 * - natalCharts : full list of family members that have natal_chart data
 *                 (used by the dashboard member-carousel UI added in
 *                 community-natal-carousel Task 02). Empty array when no
 *                 charts exist yet — never null.
 * - monthlyTransit: this month's transit record for the first ready member,
 *                 else null.
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
 * so we use .maybeSingle() / array reads that tolerate zero-row responses.
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

  // Pull every family member that has a natal chart, ordered by
  // created_at so the carousel ordering is stable across refreshes.
  // An empty array is a valid "no chart yet" signal — not an error.
  const { data: familyWithCharts, error: familyError } = await supabase
    .from("community_family_members")
    .select(
      "id, full_name, date_of_birth, natal_chart, natal_status, natal_report_id, natal_report_status, created_at"
    )
    .eq("member_id", member.id)
    .order("created_at", { ascending: true });

  type NatalChartItem = {
    id: string;
    full_name: string;
    date_of_birth: string;
    natal_chart: Record<string, unknown>;
  };

  let natalChart: NatalChartItem | null = null;
  let natalCharts: NatalChartItem[] = [];
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
  } else if (!familyWithCharts || familyWithCharts.length === 0) {
    // No family member has a natal chart yet — not a loading state.
    natalStatus = "empty";
    // Without a natal chart there is nothing to transit against.
    transitStatus = "empty";
  } else {
    // community-chart-cache-and-regeneration Task 06 (2026-04-27):
    // Filter out rows whose stored natal_chart JSON does NOT match the
    // current production shape — they're legacy/dummy and would mislead
    // the dashboard into treating them as ready. Such members are surfaced
    // as "no chart" so the user is offered regeneration instead of a
    // stale render.
    natalCharts = familyWithCharts
      .filter((row) => deriveNatalReportState(row) === "generated")
      .map((row) => ({
        id: row.id,
        full_name: row.full_name,
        date_of_birth: row.date_of_birth,
        natal_chart: isValidNatalChart(row.natal_chart) ? row.natal_chart : {},
      }));

    if (natalCharts.length === 0) {
      // All stored charts failed validation → treat as empty.
      natalStatus = "empty";
      transitStatus = "empty";
    } else {
      // First chart kept on the legacy `natalChart` field for back-compat.
      natalChart = natalCharts[0] ?? null;
      natalStatus = "ready";

      // Monthly transit is still scoped to the first ready member so the
      // existing Monthly Transit card behaviour is unchanged.
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      // community-chart-cache-and-regeneration Task 01 (2026-04-27):
      // monthly_transits keys family-member rows via `family_member_id`
      // (see migration + cron at src/app/api/cron/monthly-transits).
      // The previous `member_id` filter never matched a row, so the
      // dashboard always rendered the empty state even when a transit
      // existed. Switching the FK column makes existing rows visible.
      const { data: transit, error: transitError } = await supabase
        .from("monthly_transits")
        .select("id, month, transit_data, created_at")
        .eq("family_member_id", natalCharts[0].id)
        .eq("month", currentMonth)
        .maybeSingle();

      if (transitError) {
        console.error("[community/astro-charts] transit read error:", transitError);
        transitStatus = "failed";
      } else if (
        transit &&
        // Task 06 — guard against legacy dummy transit rows.
        isValidMonthlyTransit(transit.transit_data, currentMonth)
      ) {
        monthlyTransit = {
          id: transit.id,
          member_id: natalCharts[0].id,
          month: transit.month,
          transit_data: transit.transit_data,
          created_at: transit.created_at,
        };
        transitStatus = "ready";
      } else {
        // No row, or row exists but doesn't pass shape validation.
        transitStatus = "empty";
      }
    }
  }

  return NextResponse.json({
    natalChart,
    natalCharts,
    monthlyTransit,
    status: { natal: natalStatus, transit: transitStatus },
  });
}
