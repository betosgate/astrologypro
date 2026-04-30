import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isValidNatalChart,
  isValidMonthlyTransit,
} from "@/lib/community/chart-validators";
import { deriveNatalReportState } from "@/lib/community/chart-report-state";
import { isBirthDataComplete } from "@/lib/community/birth-data-readiness";

export const dynamic = "force-dynamic";

type ChartStatus = "ready" | "empty" | "pending" | "failed";

/**
 * GET /api/community/astro-charts
 *
 * Spec source for the monthly-transit list shape:
 *   tasks/30.04.2026/community-dashboard-monthly-transit-card-sync/
 *     02-update-astro-charts-api-monthly-list.md
 *     04-hardening-and-data-drift-handling.md
 *
 * Returns:
 * - natalChart      : the first family member that has natal_chart data, else null
 *                     (kept for backward compatibility with older clients).
 * - natalCharts     : full list of family members that have natal_chart data
 *                     (used by the dashboard member-carousel UI).
 * - monthlyTransit  : legacy single transit field — the first valid current-month
 *                     row from `monthlyTransits` (kept so an older dashboard
 *                     bundle deployed mid-rollout still renders something).
 * - monthlyTransits : full list of valid current-month transit rows for every
 *                     eligible (complete-birth-data) household member, mirroring
 *                     `/community/transits`. Empty array when nothing is ready
 *                     yet — never null.
 * - status.natal / status.transit:
 *     "ready"   — data is available
 *     "empty"   — no data exists yet and no background generation is running;
 *                 the dashboard should render its empty state and stop polling
 *     "pending" — reserved for real background jobs; kept for future use
 *     "failed"  — an upstream read errored
 *
 * Eligibility rule for the monthly-transit list (post-2026-04-30):
 *   complete birth data on `community_family_members`. Saved natal_chart
 *   state is not a gate — see /community/transits for the same rule.
 *
 * Hardening:
 *   - We use an `IN (eligibleIds)` array read, not `.maybeSingle()`, so a
 *     duplicate (family_member_id, month) row can never throw and hide
 *     other valid members' reports.
 *   - Each row is individually validated with `isValidMonthlyTransit`.
 *     Bad rows are logged + skipped, not surfaced as a global failure.
 *   - When duplicates are seen for the same member/month we keep the
 *     newest valid row (created_at desc) and warn on the server.
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

  // Pull every household family member, with the birth-data fields the
  // monthly-transit eligibility rule needs and the natal_* fields the
  // existing natal-carousel logic depends on. An empty array is a valid
  // "no family yet" signal — not an error.
  const { data: familyRows, error: familyError } = await supabase
    .from("community_family_members")
    .select(
      "id, full_name, date_of_birth, birth_time, birth_city, birth_country, birth_lat, birth_lng, natal_chart, natal_status, natal_report_id, natal_report_status, created_at"
    )
    .eq("member_id", member.id)
    .order("created_at", { ascending: true });

  type NatalChartItem = {
    id: string;
    full_name: string;
    date_of_birth: string;
    natal_chart: Record<string, unknown>;
  };

  type MonthlyTransitItem = {
    id: string;
    family_member_id: string;
    member_name: string;
    /** legacy alias for back-compat — same value as family_member_id */
    member_id: string;
    month: string;
    transit_data: Record<string, unknown>;
    generation_status: string | null;
    full_report_id: string | null;
    full_report_status: string | null;
    full_report_generated_at: string | null;
    created_at: string | null;
  };

  let natalChart: NatalChartItem | null = null;
  let natalCharts: NatalChartItem[] = [];
  let monthlyTransit: MonthlyTransitItem | null = null;
  let monthlyTransits: MonthlyTransitItem[] = [];

  let natalStatus: ChartStatus;
  let transitStatus: ChartStatus;

  if (familyError) {
    console.error("[community/astro-charts] family read error:", familyError);
    natalStatus = "failed";
    transitStatus = "failed";
  } else if (!familyRows || familyRows.length === 0) {
    // No family members yet — nothing to surface.
    natalStatus = "empty";
    transitStatus = "empty";
  } else {
    // ── Natal carousel: same rule as before — only members whose stored
    //    natal_chart passes shape validation. Unchanged behaviour for
    //    back-compat with the existing carousel UI.
    natalCharts = familyRows
      .filter((row) => deriveNatalReportState(row) === "generated")
      .map((row) => ({
        id: row.id,
        full_name: row.full_name,
        date_of_birth: row.date_of_birth,
        natal_chart: isValidNatalChart(row.natal_chart) ? row.natal_chart : {},
      }));

    natalChart = natalCharts[0] ?? null;
    natalStatus = natalCharts.length === 0 ? "empty" : "ready";

    // ── Monthly transit list: gated on complete birth data, NOT on
    //    natalCharts[0]. Mirrors /community/transits exactly.
    const eligibleFamily = familyRows.filter((row) => isBirthDataComplete(row));
    const eligibleIds = eligibleFamily.map((row) => row.id);
    const familyNameById = new Map<string, string>(
      eligibleFamily.map((row) => [row.id, row.full_name])
    );

    if (eligibleIds.length === 0) {
      transitStatus = "empty";
    } else {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;

      // Array read — survives duplicate (family_member_id, month) rows
      // that would have thrown under .maybeSingle(). Newest-first so the
      // dedupe logic below picks the freshest valid row per member.
      const { data: transitRows, error: transitError } = await supabase
        .from("monthly_transits")
        .select(
          "id, family_member_id, month, transit_data, generation_status, full_report_id, full_report_status, full_report_generated_at, created_at"
        )
        .in("family_member_id", eligibleIds)
        .eq("month", currentMonth)
        .order("created_at", { ascending: false });

      if (transitError) {
        console.error(
          "[community/astro-charts] transit read error:",
          transitError
        );
        transitStatus = "failed";
      } else {
        const seen = new Set<string>();
        for (const row of transitRows ?? []) {
          if (!row.family_member_id) continue;

          // Drift guard: if we've already taken a row for this member in
          // this month, the rest are duplicates. Log once per duplicate
          // and move on without failing the whole card.
          if (seen.has(row.family_member_id)) {
            console.warn(
              "[community/astro-charts] duplicate monthly_transits row",
              {
                family_member_id: row.family_member_id,
                month: currentMonth,
                duplicate_row_id: row.id,
              }
            );
            continue;
          }

          if (!isValidMonthlyTransit(row.transit_data, currentMonth)) {
            // Skip invalid/legacy shape — don't break valid neighbours.
            console.warn(
              "[community/astro-charts] skipping invalid monthly transit row",
              {
                family_member_id: row.family_member_id,
                row_id: row.id,
              }
            );
            continue;
          }

          seen.add(row.family_member_id);
          const memberName =
            familyNameById.get(row.family_member_id) ?? "Member";
          monthlyTransits.push({
            id: row.id,
            family_member_id: row.family_member_id,
            member_id: row.family_member_id, // legacy alias
            member_name: memberName,
            month: row.month,
            transit_data: row.transit_data as Record<string, unknown>,
            generation_status: row.generation_status as string | null,
            full_report_id: row.full_report_id as string | null,
            full_report_status: row.full_report_status as string | null,
            full_report_generated_at:
              row.full_report_generated_at as string | null,
            created_at: row.created_at as string | null,
          });
        }

        // Stable ordering for the dashboard carousel: by family creation
        // order (matches the natal carousel ordering for visual parity).
        const familyOrderById = new Map(
          eligibleFamily.map((row, idx) => [row.id, idx])
        );
        monthlyTransits.sort(
          (a, b) =>
            (familyOrderById.get(a.family_member_id) ?? 0) -
            (familyOrderById.get(b.family_member_id) ?? 0)
        );

        monthlyTransit = monthlyTransits[0] ?? null;
        transitStatus = monthlyTransits.length === 0 ? "empty" : "ready";
      }
    }
  }

  return NextResponse.json({
    natalChart,
    natalCharts,
    monthlyTransit,
    monthlyTransits,
    status: { natal: natalStatus, transit: transitStatus },
  });
}
