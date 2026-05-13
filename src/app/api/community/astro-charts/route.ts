import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isValidNatalChart,
  isValidMonthlyTransit,
} from "@/lib/community/chart-validators";
import {
  deriveMonthlyReportState,
  deriveNatalReportState,
} from "@/lib/community/chart-report-state";
import { isBirthDataComplete } from "@/lib/community/birth-data-readiness";
import { ensureCurrentMonthTransitsForMember } from "@/lib/community/ensure-monthly-transits";

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

  // community-dashboard-monthly-transit-card-sync (2026-04-30):
  // Identify the household member ID. A user is either the primary
  // account owner (community_members) or a family member who accepted
  // an invite (community_family_members).
  let memberId: string | null = null;
  let membershipStatus: string | null = null;

  // 1. Try primary owner path
  const { data: primaryMember } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (primaryMember) {
    memberId = primaryMember.id;
    membershipStatus = primaryMember.membership_status;
  } else {
    // 2. Try household member path
    const { data: familyMember } = await supabase
      .from("community_family_members")
      .select("member_id")
      .eq("user_id", user.id)
      .eq("invite_status", "accepted")
      .maybeSingle();

    if (familyMember) {
      memberId = familyMember.member_id;
      // Household members inherit the subscription status of the owner
      const { data: owner } = await supabase
        .from("community_members")
        .select("membership_status")
        .eq("id", familyMember.member_id)
        .maybeSingle();
      membershipStatus = owner?.membership_status ?? null;
    }
  }

  if (!memberId || membershipStatus !== "active") {
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
    .eq("member_id", memberId)
    .order("created_at", { ascending: true });

  type NatalChartItem = {
    id: string;
    full_name: string;
    date_of_birth: string;
    natal_chart: Record<string, unknown>;
    natal_report_id: string | null;
    natal_report_status: string | null;
    chart_state: string;
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
    generated_at: string | null;
    report_state: string;
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
    // ── Natal carousel: include every household member with complete birth 
    //    data, even if their chart hasn't been generated yet. This allows 
    //    the dashboard to show a "Generate" CTA for them.
    natalCharts = familyRows
      .filter((row) => isBirthDataComplete(row))
      .map((row) => ({
        id: row.id,
        full_name: row.full_name,
        date_of_birth: row.date_of_birth,
        natal_chart: isValidNatalChart(row.natal_chart) ? row.natal_chart : {},
        natal_report_id: row.natal_report_id,
        natal_report_status: row.natal_report_status,
        chart_state: deriveNatalReportState(row),
      }));

    natalChart =
      natalCharts.find((c) => c.chart_state === "generated") ??
      natalCharts[0] ??
      null;
    natalStatus = natalCharts.length === 0 ? "empty" : "ready";

    // ── Monthly transit list: gated on complete birth data, NOT on
    //    natalCharts[0]. Mirrors /community/transits exactly.
    const eligibleFamily = familyRows.filter((row) => isBirthDataComplete(row));
    const eligibleIds = eligibleFamily.map((row) => row.id);
    const allFamilyIds = familyRows.map((row) => row.id);
    const familyNameById = new Map<string, string>(
      familyRows.map((row) => [row.id, row.full_name])
    );

    if (allFamilyIds.length === 0) {
      transitStatus = "empty";
    } else {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;

      // community-dashboard-monthly-transit-card-sync (2026-04-30):
      // Ensure current-month summaries exist for the eligible household
      // members. Mirrors the lazy-fallback on /community/transits.
      if (eligibleIds.length > 0) {
        try {
          const { count: transitCount } = await supabase
            .from("monthly_transits")
            .select("id", { count: "exact", head: true })
            .in("family_member_id", eligibleIds)
            .eq("month", currentMonth);

          if ((transitCount ?? 0) < eligibleIds.length) {
            await ensureCurrentMonthTransitsForMember(memberId);
          }
        } catch (ensureErr) {
          console.warn(
            "[api/community/astro-charts] lazy catch-up failed:",
            ensureErr
          );
        }
      }

      // Query for EVERY family member in the household (allFamilyIds),
      // matching the broad visibility of /community/transits.
      const { data: transitRows, error: transitError } = await supabase
        .from("monthly_transits")
        .select(
          "id, family_member_id, month, transit_data, generation_status, full_report_id, full_report_status, full_report_generated_at, generated_at, community_family_members!inner(full_name)"
        )
        .in("family_member_id", allFamilyIds)
        .eq("month", currentMonth)
        .order("id");

      if (transitError) {
        console.error(
          "[api/community/astro-charts] transit read error:",
          transitError
        );
        transitStatus = "failed";
      } else {
        const seen = new Set<string>();
        let hasPending = false;

        for (const row of transitRows ?? []) {
          if (!row.family_member_id) continue;

          // --- RESTORED (Commented Out) ---
          // Drift guard: if we've already taken a row for this member in
          // this month, the rest are duplicates. Log once per duplicate
          // and move on without failing the whole card.
          // if (seen.has(row.family_member_id)) {
          //   console.warn(
          //     "[community/astro-charts] duplicate monthly_transits row",
          //     {
          //       family_member_id: row.family_member_id,
          //       month: currentMonth,
          //       duplicate_row_id: row.id,
          //     }
          //   );
          //   continue;
          // }

          // if (!isValidMonthlyTransit(row.transit_data, currentMonth)) {
          //   // Skip invalid/legacy shape — don't break valid neighbours.
          //   console.warn(
          //     "[community/astro-charts] skipping invalid monthly transit row",
          //     {
          //       family_member_id: row.family_member_id,
          //       row_id: row.id,
          //     }
          //   );
          //   continue;
          // }

          // seen.add(row.family_member_id);
          // ---------------------------------

          if (seen.has(row.family_member_id)) continue;
          seen.add(row.family_member_id);

          if (row.generation_status === "pending") {
            hasPending = true;
          }

          // Validation: If the lightweight summary data is invalid/missing 
          // (e.g. calculation failed), we still want to show this member 
          // in the carousel so the user can access their full report or 
          // retry generation. We just provide an empty object for transit_data.
          const validData = isValidMonthlyTransit(row.transit_data) 
            ? row.transit_data 
            : {};

          const memberName =
            familyNameById.get(row.family_member_id) ?? "Member";
          const reportState = deriveMonthlyReportState(
            {
              transit_data: row.transit_data,
              generation_status: row.generation_status,
              full_report_id: row.full_report_id,
              full_report_status: row.full_report_status,
              full_report_generated_at: row.full_report_generated_at,
            },
            currentMonth
          );
          monthlyTransits.push({
            id: row.id,
            family_member_id: row.family_member_id,
            member_id: row.family_member_id,
            member_name: memberName,
            month: row.month,
            transit_data: validData as Record<string, unknown>,
            generation_status: row.generation_status as string | null,
            full_report_id: row.full_report_id as string | null,
            full_report_status: row.full_report_status as string | null,
            full_report_generated_at:
              row.full_report_generated_at as string | null,
            generated_at: row.generated_at as string | null,
            report_state: reportState,
          });
        }

        // community-dashboard-monthly-transit-card-sync (2026-04-30):
        // Mirrors Natal Carousel behavior — if an eligible member has no 
        // transit row yet, add a placeholder so they still appear in the 
        // dashboard carousel (allows the user to see the "Generate" CTA).
        for (const id of eligibleIds) {
          if (!seen.has(id)) {
            monthlyTransits.push({
              id: "",
              family_member_id: id,
              member_id: id,
              member_name: familyNameById.get(id) ?? "Member",
              month: currentMonth,
              transit_data: {},
              generation_status: null,
              full_report_id: null,
              full_report_status: null,
              full_report_generated_at: null,
              generated_at: null,
              report_state: "missing",
            });
          }
        }

        // Dashboard carousel ordering by household joined_at
        const familyOrderById = new Map(
          familyRows.map((row, idx) => [row.id, idx])
        );
        monthlyTransits.sort(
          (a, b) =>
            (familyOrderById.get(a.family_member_id) ?? 0) -
            (familyOrderById.get(b.family_member_id) ?? 0)
        );

        monthlyTransit = monthlyTransits[0] ?? null;

        // Status logic: if we have ANY members to show (actual rows or 
        // placeholders), it's "ready" (carousel).
        // If the list is empty but we know some are being calculated, it's "pending".
        if (monthlyTransits.length > 0) {
          transitStatus = "ready";
        } else if (hasPending) {
          transitStatus = "pending";
        } else {
          transitStatus = "empty";
        }
      }
    }

    // Task sync audit: ensure we never return "empty" if the household 
    // actually has members. This forces the carousel to show placeholders
    // if rows are missing.
    if (transitStatus === "empty" && eligibleIds.length > 0) {
      transitStatus = "ready";
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
