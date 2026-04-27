import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  resolveUserBirthData,
  findOrCreateSelfFamilyMember,
  type ResolvedBirthData,
} from "@/lib/community/birth-data-resolver";
import { generateNatalChart, type NatalChartData } from "@/lib/astro/natal-chart";
import { calculateMonthlyTransits } from "@/lib/astro/transits";
import { calculateSynastry } from "@/lib/astro/synastry";
import {
  isValidNatalChart,
  isValidRelationshipChart,
} from "@/lib/community/chart-validators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ChartType = "natal" | "monthly" | "relationship";

interface BirthDataInput {
  fullName: string;
  dateOfBirth: string;
  birthTime: string | null;
  birthCity: string | null;
  birthCountry: string | null;
  birthLat: number;
  birthLng: number;
}

/**
 * POST /api/community/me/generate-chart
 *
 * Body:
 *   { type: "natal" | "monthly" | "relationship", birthData?: BirthDataInput }
 *
 * Behavior:
 *  - Resolves birth data via priority fallback (family_self → past_booking → member_profile).
 *  - If missing required fields and `birthData` is not provided in body, returns 422
 *    with `missing` array so the UI can show an inline form.
 *  - If `birthData` is provided, it is used and the self family-member row is
 *    created/updated for future calls.
 *  - Reuses existing compute helpers — no new chart engine.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { data: member } = await supabase
    .from("community_members")
    .select("id, full_name, email, membership_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) {
    return Response.json(
      { type: "https://httpstatuses.com/404", title: "No community membership", status: 404 },
      { status: 404 }
    );
  }

  if (member.membership_status !== "active") {
    return Response.json(
      { type: "https://httpstatuses.com/403", title: "Inactive membership", status: 403 },
      { status: 403 }
    );
  }

  let body: {
    type?: string;
    birthData?: Partial<BirthDataInput>;
    forceRegenerate?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { type: "https://httpstatuses.com/400", title: "Invalid JSON", status: 400 },
      { status: 400 }
    );
  }

  // community-chart-cache-and-regeneration Task 02 (2026-04-27):
  // Caller may explicitly opt out of cache reuse. Birth-data changes
  // (`body.birthData` present below) are also treated as an implicit
  // force, since the persisted chart no longer reflects the input.
  const forceRegenerate = body.forceRegenerate === true;
  const birthDataChanged = !!body.birthData;

  const type = body.type as ChartType | undefined;
  if (!type || !["natal", "monthly", "relationship"].includes(type)) {
    return Response.json(
      {
        type: "https://httpstatuses.com/422",
        title: "Validation failed",
        status: 422,
        detail: "type must be one of: natal, monthly, relationship",
      },
      { status: 422 }
    );
  }

  // ── Resolve or apply provided birth data ────────────────────────────────────
  let resolved: ResolvedBirthData;
  try {
    resolved = await resolveUserBirthData(user.id, member.id, member.full_name);
  } catch (err) {
    console.error("[generate-chart] resolver error:", err);
    return Response.json(
      { type: "https://httpstatuses.com/500", title: "Internal error", status: 500 },
      { status: 500 }
    );
  }

  // If the caller sent birthData (inline modal), merge/override and persist as self
  if (body.birthData) {
    const bd = body.birthData;
    const fullName = bd.fullName?.trim() || resolved.fullName || member.full_name || "";
    const dateOfBirth = bd.dateOfBirth?.trim() || resolved.dateOfBirth || "";
    const birthTime = bd.birthTime?.trim() || resolved.birthTime || null;
    const birthCity = bd.birthCity?.trim() || resolved.birthCity || null;
    const birthCountry = bd.birthCountry?.trim() || resolved.birthCountry || null;
    const birthLat =
      typeof bd.birthLat === "number" ? bd.birthLat : resolved.birthLat;
    const birthLng =
      typeof bd.birthLng === "number" ? bd.birthLng : resolved.birthLng;

    if (!fullName || !dateOfBirth || birthLat == null || birthLng == null) {
      return Response.json(
        {
          type: "https://httpstatuses.com/422",
          title: "Validation failed",
          status: 422,
          detail: "fullName, dateOfBirth, birthLat, birthLng are required",
          missing: [
            ...(fullName ? [] : ["fullName"]),
            ...(dateOfBirth ? [] : ["dateOfBirth"]),
            ...(birthLat != null ? [] : ["birthLat"]),
            ...(birthLng != null ? [] : ["birthLng"]),
          ],
        },
        { status: 422 }
      );
    }

    const { id: selfId } = await findOrCreateSelfFamilyMember(
      supabase,
      user.id,
      member.id,
      {
        fullName,
        dateOfBirth,
        birthTime,
        birthCity,
        birthCountry,
        birthLat,
        birthLng,
      }
    );

    resolved = {
      source: "family_self",
      fullName,
      dateOfBirth,
      birthTime,
      birthCity,
      birthCountry,
      birthLat,
      birthLng,
      birthTimezone: resolved.birthTimezone,
      selfFamilyMemberId: selfId,
      missing: [],
    };
  }

  // Final check — must have everything to compute
  const stillMissing: string[] = [];
  if (!resolved.dateOfBirth) stillMissing.push("dateOfBirth");
  if (resolved.birthLat == null) stillMissing.push("birthLat");
  if (resolved.birthLng == null) stillMissing.push("birthLng");

  if (stillMissing.length > 0) {
    return Response.json(
      {
        type: "https://httpstatuses.com/422",
        title: "Birth data required",
        status: 422,
        detail: "We need your birth data before we can compute the chart.",
        missing: stillMissing,
        resolved,
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // ── Ensure self family_member row exists + has natal chart ──────────────────
  let selfId = resolved.selfFamilyMemberId;
  if (!selfId) {
    const { id } = await findOrCreateSelfFamilyMember(supabase, user.id, member.id, {
      fullName: resolved.fullName ?? member.full_name ?? "Self",
      dateOfBirth: resolved.dateOfBirth!,
      birthTime: resolved.birthTime,
      birthCity: resolved.birthCity,
      birthCountry: resolved.birthCountry,
      birthLat: resolved.birthLat!,
      birthLng: resolved.birthLng!,
    });
    selfId = id;
  }

  // community-chart-cache-and-regeneration Task 02 (2026-04-27):
  //
  // Stop blindly regenerating the self natal chart. Look up the stored
  // row first; reuse if it matches the current production shape, status
  // is `generated`, the caller didn't supply changed birth data, and
  // they didn't explicitly force regeneration.
  //
  // Important constraints from the spec:
  //   - cached reads must NOT consume natal correction retries
  //   - cached reads must NOT bypass `locked_for_review`
  //   - cached reads must NOT bump `chart_updated_at` /
  //     `natal_last_generated_at`
  //
  // We treat `locked_for_review` as a cache hit too — that status only
  // exists when a fully validated chart was already persisted, and the
  // governance flow at /api/community/generate-natal owns flipping it
  // off. Reading from this convenience endpoint must not interact with
  // governance state.
  const { data: existingSelf } = await admin
    .from("community_family_members")
    .select("natal_chart, natal_status, chart_updated_at, natal_last_generated_at")
    .eq("id", selfId)
    .maybeSingle();

  const cachedNatalCandidate = existingSelf?.natal_chart;
  const cachedNatalStatus = existingSelf?.natal_status as string | null | undefined;
  const cachedNatalIsValid =
    cachedNatalCandidate != null && isValidNatalChart(cachedNatalCandidate);
  const cachedNatalIsCurrent =
    (cachedNatalStatus === "generated" || cachedNatalStatus === "locked_for_review") &&
    cachedNatalIsValid;

  const shouldUseCachedNatal =
    cachedNatalIsCurrent && !birthDataChanged && !forceRegenerate;

  let selfNatal: NatalChartData;
  let selfNatalSource: "cached" | "generated" | "regenerated";

  if (shouldUseCachedNatal) {
    selfNatal = cachedNatalCandidate as NatalChartData;
    selfNatalSource = "cached";
    // No DB write — preserves chart_updated_at / natal_last_generated_at.
  } else {
    selfNatal = generateNatalChart({
      dateOfBirth: resolved.dateOfBirth!,
      birthTime: resolved.birthTime,
      lat: resolved.birthLat!,
      lng: resolved.birthLng!,
      ageGroup: "adult",
    });

    await admin
      .from("community_family_members")
      .update({
        natal_chart: selfNatal,
        chart_updated_at: new Date().toISOString(),
        natal_status: "generated",
        natal_last_generated_at: new Date().toISOString(),
      })
      .eq("id", selfId);

    // Distinguish first-time vs. legacy/forced regen for callers + telemetry.
    selfNatalSource =
      cachedNatalCandidate == null ? "generated" : "regenerated";
  }

  // ── Dispatch per chart type ─────────────────────────────────────────────────
  if (type === "natal") {
    return Response.json({
      ok: true,
      type: "natal",
      source: resolved.source,
      // Cache-aware status — "cached" means the persisted chart was
      // returned without recomputing or rewriting.
      cacheSource: selfNatalSource,
      data: { natalChart: selfNatal, selfFamilyMemberId: selfId },
    });
  }

  if (type === "monthly") {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthStr = `${year}-${String(month).padStart(2, "0")}`;

    let transitData;
    try {
      transitData = calculateMonthlyTransits(selfNatal, year, month);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "calculation_error";
      return Response.json({ error: msg }, { status: 500 });
    }

    // Upsert monthly_transits for self family member
    await admin
      .from("monthly_transits")
      .upsert(
        {
          family_member_id: selfId,
          month: monthStr,
          transit_data: transitData,
          generation_status: "generated",
          notification_sent: false,
          last_attempted_at: new Date().toISOString(),
        },
        { onConflict: "family_member_id,month" }
      );

    return Response.json({
      ok: true,
      type: "monthly",
      source: resolved.source,
      // Whether the underlying natal chart was reused or regenerated.
      cacheSource: selfNatalSource,
      data: { month: monthStr, transitData, selfFamilyMemberId: selfId },
    });
  }

  // ── type === "relationship" ─────────────────────────────────────────────────
  //
  // community-chart-cache-and-regeneration Task 04 (2026-04-27):
  //
  // Align this branch with /api/community/relationship-charts/batch:
  //   - skip pairs where a current (non-invalidated, shape-valid) chart exists
  //   - regenerate pairs where invalidated_at is set
  //   - regenerate pairs where stored chart_data fails shape validation
  //     (legacy/dummy data — Task 06)
  //   - generate missing pairs
  //   - report counts so callers can show "all current" vs. "5 generated"
  //
  // forceRegenerate=true rebuilds every pair regardless of cache state.
  //
  // Eligibility = `natal_status='generated'` AND a shape-valid stored
  // natal chart. The shape gate keeps Task 06 honest: a relationship
  // chart computed from a legacy/dummy natal chart would itself be
  // garbage.

  const { data: familyRows } = await admin
    .from("community_family_members")
    .select("id, full_name, natal_chart, natal_status")
    .eq("member_id", member.id);

  const family = (familyRows ?? []) as Array<{
    id: string;
    full_name: string;
    natal_chart: unknown;
    natal_status: string | null;
  }>;

  const eligible = family.filter(
    (f) =>
      f.natal_status === "generated" &&
      f.natal_chart != null &&
      isValidNatalChart(f.natal_chart)
  );

  const familyWithoutCharts = family
    .filter(
      (f) =>
        f.natal_status !== "generated" ||
        f.natal_chart == null ||
        !isValidNatalChart(f.natal_chart)
    )
    .map((f) => ({ id: f.id, fullName: f.full_name }));

  if (eligible.length < 2) {
    return Response.json({
      ok: true,
      type: "relationship",
      source: resolved.source,
      cacheSource: selfNatalSource,
      data: {
        generated: 0,
        cached: 0,
        invalidatedRegenerated: 0,
        blocked: 0,
        familyWithoutCharts,
        totalPairs: 0,
        message:
          "Need at least 2 members with generated natal charts to create relationship charts.",
      },
    });
  }

  // Pull existing relationship_charts for this member; we look at
  // invalidation + chart_data shape per pair.
  const { data: existingCharts } = await admin
    .from("relationship_charts")
    .select("id, person_a_id, person_b_id, invalidated_at, chart_data")
    .eq("member_id", member.id);

  const chartMap = new Map<
    string,
    {
      id: string;
      invalidated_at: string | null;
      chart_data: unknown;
    }
  >();
  for (const c of existingCharts ?? []) {
    const key = [c.person_a_id, c.person_b_id].sort().join(":");
    chartMap.set(key, {
      id: c.id,
      invalidated_at: c.invalidated_at,
      chart_data: c.chart_data,
    });
  }

  let generated = 0;
  let cached = 0;
  let invalidatedRegenerated = 0;
  let blocked = 0;

  for (let i = 0; i < eligible.length; i++) {
    for (let j = i + 1; j < eligible.length; j++) {
      const a = eligible[i];
      const b = eligible[j];
      const [aId, bId] = [a.id, b.id].sort();
      const pairKey = `${aId}:${bId}`;
      const existing = chartMap.get(pairKey);

      // Cache hit: row exists, not invalidated, shape valid, no force.
      const isCacheHit =
        !forceRegenerate &&
        existing != null &&
        existing.invalidated_at === null &&
        isValidRelationshipChart(existing.chart_data);

      if (isCacheHit) {
        cached++;
        continue;
      }

      // Otherwise (re)generate.
      try {
        const synastry = calculateSynastry(
          a.natal_chart as NatalChartData,
          b.natal_chart as NatalChartData,
          a.full_name,
          b.full_name
        );

        const { error: upsertError } = await admin
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
          console.error(
            "[me/generate-chart] relationship upsert error for pair",
            pairKey,
            upsertError
          );
          blocked++;
          continue;
        }

        if (existing?.invalidated_at) {
          invalidatedRegenerated++;
        } else {
          generated++;
        }
      } catch (err) {
        console.error(
          "[me/generate-chart] relationship calc failed for pair",
          pairKey,
          err
        );
        blocked++;
      }
    }
  }

  const totalPairs = (eligible.length * (eligible.length - 1)) / 2;

  return Response.json({
    ok: true,
    type: "relationship",
    source: resolved.source,
    cacheSource: selfNatalSource,
    data: {
      generated,
      cached,
      invalidatedRegenerated,
      blocked,
      familyWithoutCharts,
      totalPairs,
    },
  });
}
