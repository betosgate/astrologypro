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

  let body: { type?: string; birthData?: Partial<BirthDataInput> };
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { type: "https://httpstatuses.com/400", title: "Invalid JSON", status: 400 },
      { status: 400 }
    );
  }

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

  // Always (re)generate the self natal chart — needed for all 3 chart types
  const selfNatal: NatalChartData = generateNatalChart({
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

  // ── Dispatch per chart type ─────────────────────────────────────────────────
  if (type === "natal") {
    return Response.json({
      ok: true,
      type: "natal",
      source: resolved.source,
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
      data: { month: monthStr, transitData, selfFamilyMemberId: selfId },
    });
  }

  // type === "relationship" — generate for every family pair that includes self
  // (and every other pair — matches existing /community/charts flow)
  const { data: familyRows } = await admin
    .from("community_family_members")
    .select("id, full_name, natal_chart")
    .eq("member_id", member.id);

  const family = (familyRows ?? []) as Array<{
    id: string;
    full_name: string;
    natal_chart: unknown;
  }>;

  const withCharts = family.filter((f) => f.natal_chart);
  const generated: Array<{ personAId: string; personBId: string; score: number }> = [];
  const skipped: Array<{ personAId: string; personBId: string; reason: string }> = [];

  for (let i = 0; i < withCharts.length; i++) {
    for (let j = i + 1; j < withCharts.length; j++) {
      const a = withCharts[i];
      const b = withCharts[j];
      const [aId, bId] = [a.id, b.id].sort();

      try {
        const synastry = calculateSynastry(
          a.natal_chart as NatalChartData,
          b.natal_chart as NatalChartData,
          a.full_name,
          b.full_name
        );

        await admin
          .from("relationship_charts")
          .upsert(
            {
              member_id: member.id,
              person_a_id: aId,
              person_b_id: bId,
              chart_data: synastry,
              generated_at: new Date().toISOString(),
            },
            { onConflict: "person_a_id,person_b_id" }
          );

        generated.push({ personAId: aId, personBId: bId, score: synastry.score });
      } catch (err) {
        skipped.push({
          personAId: aId,
          personBId: bId,
          reason: err instanceof Error ? err.message : "unknown",
        });
      }
    }
  }

  const familyWithoutCharts = family
    .filter((f) => !f.natal_chart)
    .map((f) => ({ id: f.id, fullName: f.full_name }));

  return Response.json({
    ok: true,
    type: "relationship",
    source: resolved.source,
    data: {
      generated,
      skipped,
      familyWithoutCharts,
      totalPairs: generated.length,
    },
  });
}
