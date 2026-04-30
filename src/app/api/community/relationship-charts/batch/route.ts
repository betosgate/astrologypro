import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateSynastry } from "@/lib/astro/synastry";
import type { NatalChartData } from "@/lib/astro/natal-chart";
import { isValidNatalChart } from "@/lib/community/chart-validators";
import {
  isBirthDataComplete,
  buildNatalChartFromBirthData,
} from "@/lib/community/birth-data-readiness";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/community/relationship-charts/batch
 *
 * Generates all missing or invalidated pairwise relationship charts for the
 * authenticated member's household in a single request.
 *
 * Strategy (post 2026-04-30 — independent product rule):
 * - Eligibility = complete birth data, not saved natal_chart state.
 * - Saved natal_chart JSON is honoured as a read-through cache when
 *   shape-valid; otherwise we build NatalChartData on the fly from
 *   birth fields. No side-effect writes to natal_chart.
 * - Compute every valid pair combination.
 * - Skip pairs where a current (non-invalidated) chart already exists.
 * - Generate and upsert missing/invalidated pairs.
 *
 * Returns: { generated, skipped, blocked, invalidatedRegenerated }
 *   generated             — new charts created
 *   skipped               — already current, no action needed
 *   blocked               — pair skipped because one or both members have
 *                           incomplete birth data
 *   invalidatedRegenerated — stale charts refreshed due to natal chart update
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Resolve member and check entitlement
  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status, membership_type")
    .eq("user_id", user.id)
    .single();

  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (member.membership_status !== "active") {
    return NextResponse.json({ error: "Inactive membership" }, { status: 403 });
  }

  // Fetch all family members — eligibility for pairing is complete birth
  // data (independent product rule). We pull natal_chart so the compute
  // path below can use it as a read-through cache when shape-valid.
  const { data: allMembers, error: membersError } = await supabase
    .from("community_family_members")
    .select(
      "id, full_name, natal_chart, natal_status, age_group, date_of_birth, birth_time, birth_city, birth_country, birth_lat, birth_lng"
    )
    .eq("member_id", member.id)
    .order("created_at", { ascending: true });

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }

  const eligible = (allMembers ?? []).filter((m) => isBirthDataComplete(m));

  if (eligible.length < 2) {
    return NextResponse.json({
      generated: 0,
      skipped: 0,
      blocked: 0,
      invalidatedRegenerated: 0,
      message:
        "Need at least 2 members with complete birth details to create relationship charts.",
    });
  }

  // Fetch all existing relationship charts for this member
  const { data: existingCharts } = await supabase
    .from("relationship_charts")
    .select("id, person_a_id, person_b_id, invalidated_at")
    .eq("member_id", member.id);

  // Build a lookup: sorted pair key -> chart record
  const chartMap = new Map<string, { id: string; invalidated_at: string | null }>();
  for (const c of existingCharts ?? []) {
    const key = [c.person_a_id, c.person_b_id].sort().join(":");
    chartMap.set(key, { id: c.id, invalidated_at: c.invalidated_at });
  }

  let generated = 0;
  let skipped = 0;
  let blocked = 0;
  let invalidatedRegenerated = 0;

  // Generate all valid pair combinations
  for (let i = 0; i < eligible.length; i++) {
    for (let j = i + 1; j < eligible.length; j++) {
      const personA = eligible[i];
      const personB = eligible[j];

      const [aId, bId] = [personA.id, personB.id].sort();
      const pairKey = `${aId}:${bId}`;
      const existing = chartMap.get(pairKey);

      // Skip if chart exists and is not invalidated
      if (existing && existing.invalidated_at === null) {
        skipped++;
        continue;
      }

      // Both ends are guaranteed birth-data-complete by the `eligible`
      // filter above. Use saved natal_chart when shape-valid, otherwise
      // build NatalChartData from birth fields in memory. No write-back
      // to natal_chart — the relationship product is independent of
      // whether the natal chart product has been generated yet.
      let natalA: NatalChartData;
      let natalB: NatalChartData;
      try {
        natalA = isValidNatalChart(personA.natal_chart)
          ? (personA.natal_chart as NatalChartData)
          : buildNatalChartFromBirthData(personA);
        natalB = isValidNatalChart(personB.natal_chart)
          ? (personB.natal_chart as NatalChartData)
          : buildNatalChartFromBirthData(personB);
      } catch {
        blocked++;
        continue;
      }

      const synastry = calculateSynastry(
        natalA,
        natalB,
        personA.full_name,
        personB.full_name
      );

      const { error: upsertError } = await supabase
        .from("relationship_charts")
        .upsert(
          {
            member_id: member.id,
            person_a_id: aId,
            person_b_id: bId,
            chart_data: synastry,
            generated_at: new Date().toISOString(),
            invalidated_at: null,
            invalidation_reason: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "person_a_id,person_b_id" }
        );

      if (upsertError) {
        console.error("[relationship-charts/batch] upsert error for pair", pairKey, upsertError);
        blocked++;
        continue;
      }

      if (existing?.invalidated_at) {
        invalidatedRegenerated++;
      } else {
        generated++;
      }
    }
  }

  return NextResponse.json({
    generated,
    skipped,
    blocked,
    invalidatedRegenerated,
  });
}
