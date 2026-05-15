import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateSynastry } from "@/lib/astro/synastry";
import type { NatalChartData } from "@/lib/astro/natal-chart";
import {
  isValidNatalChart,
  isValidRelationshipChart,
} from "@/lib/community/chart-validators";
import {
  computeBirthDataReadiness,
  buildNatalChartFromBirthData,
  isBirthDataComplete,
} from "@/lib/community/birth-data-readiness";
import { ensureCanonicalSelfFamilyMember } from "@/lib/community/self-family-member";
import {
  findSavedReportMatch,
  SAVED_REPORT_MATCH_SELECT,
  type JsonRecord,
  type PersonInput,
} from "@/lib/horoscope/saved-report-match";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveEntitlementFromRow } from "@/lib/community/pm-entitlement";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

async function getMember(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: member } = await supabase
    .from("community_members")
    .select(
      "id, user_id, full_name, membership_status, plan_type, pm_tier_id, date_of_birth, birth_time, birth_city, birth_country"
    )
    .eq("user_id", user.id)
    .single();
  return member ? { ...member, user_id: user.id } : null;
}

const FAMILY_OVERVIEW_TOOLNAMES = {
  romantic: "romantic_forecast_report_tropical_v2",
  friendship: "friendship_report_tropical_v2",
  business: "business_partner_v2",
} as const;

type FamilyOverviewMode = keyof typeof FAMILY_OVERVIEW_TOOLNAMES;

function familyMemberToPersonInput(member: {
  date_of_birth: string | null;
  birth_time: string | null;
  birth_lat: number | null;
  birth_lng: number | null;
}): PersonInput {
  return {
    dob: member.date_of_birth,
    tob: member.birth_time,
    city:
      member.birth_lat != null && member.birth_lng != null
        ? {
            lat: member.birth_lat,
            lng: member.birth_lng,
          }
        : null,
  };
}

/**
 * GET /api/community/relationship-charts
 * Returns all relationship charts + family members for the current member.
 *
 * Also (additive) returns the saved-report lifecycle rows from
 * `community_relationship_reports` so the list page can render per-type
 * Generate/View/Regenerate/Retry CTAs without an extra round trip. The
 * existing `familyMembers` and `charts` fields are unchanged so any old
 * caller keeps working.
 */
export async function GET() {
  const supabase = await createClient();
  const member = await getMember(supabase);
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (member.membership_status !== "active")
    return NextResponse.json({ error: "Inactive membership" }, { status: 403 });

  await ensureCanonicalSelfFamilyMember(member, member.user_id);

  // Fetch family members with their natal charts
  const { data: familyMembers } = await supabase
    .from("community_family_members")
    .select(
      "id, full_name, natal_chart, age_group, date_of_birth, birth_time, birth_city, birth_country, birth_lat, birth_lng, relationship, natal_status, natal_report_id, natal_report_status, natal_report_generated_at, natal_last_generated_at, chart_updated_at, updated_at, notes"
    )
    .eq("member_id", member.id)
    .order("created_at", { ascending: true });

  // Fetch existing relationship charts
  const { data: charts } = await supabase
    .from("relationship_charts")
    .select("id, person_a_id, person_b_id, chart_data, generated_at")
    .eq("member_id", member.id);

  // Fetch saved-report lifecycle rows for this member.
  // The page maps these by (sorted pair, report_type) and feeds them
  // into deriveRelationshipReportState() to drive the CTA per type.
  const { data: relationshipReports } = await supabase
    .from("community_relationship_reports")
    .select(
      "person_a_id, person_b_id, report_type, astro_ai_response_id, report_status, invalidated_at, generated_at"
    )
    .eq("member_id", member.id);

  const familyOverviewMembers = (familyMembers ?? []).map((familyMember) => ({
    id: familyMember.id,
    ...familyMemberToPersonInput(familyMember),
  }));
  const familyOverviewReports: Array<{
    mode: FamilyOverviewMode;
    astro_ai_response_id: string | null;
    report_status: "generated" | null;
    generated_at: string | null;
  }> = [];

  if (familyOverviewMembers.length >= 2) {
    const admin = createAdminClient();
    const toolnames = Object.values(FAMILY_OVERVIEW_TOOLNAMES);
    const { data: familyOverviewCandidates, error: familyOverviewError } =
      await admin
        .from("astro_ai_responses")
        .select(SAVED_REPORT_MATCH_SELECT)
        .eq("user_id", member.user_id)
        .in("toolname", toolnames)
        .order("created_at", { ascending: false })
        .limit(100);

    if (familyOverviewError) {
      console.error(
        "[community/relationship-charts] family overview saved-report lookup failed:",
        familyOverviewError,
      );
    }

    for (const [mode, toolname] of Object.entries(
      FAMILY_OVERVIEW_TOOLNAMES,
    ) as Array<[FamilyOverviewMode, string]>) {
      const candidates = ((familyOverviewCandidates ?? []) as unknown as JsonRecord[]).filter(
        (candidate) => candidate.toolname === toolname,
      );
      const match = findSavedReportMatch(
        {
          toolname,
          type: "two-person",
          person1: familyOverviewMembers[0],
          person2: familyOverviewMembers[1],
          extras: {
            familyMembers: familyOverviewMembers,
          },
        },
        candidates,
      );

      familyOverviewReports.push({
        mode,
        astro_ai_response_id:
          typeof match?.id === "string" ? match.id : null,
        report_status: match ? "generated" : null,
        generated_at:
          typeof match?.created_at === "string" ? match.created_at : null,
      });
    }
  }

  // ── Plan entitlement ────────────────────────────────────────────────────────
  // Resolve isFamilyEntitled from the canonical pm-entitlement helper so the
  // client page can drive plan-aware CTAs without a separate API call.
  const admin = createAdminClient();
  const entitlement = await resolveEntitlementFromRow(admin, {
    pm_tier_id: (member as { pm_tier_id?: string | null }).pm_tier_id ?? null,
    plan_type: (member as { plan_type?: string | null }).plan_type ?? null,
  });

  // Count how many household members have birth data complete enough for
  // relationship-chart generation (same gate as the POST handler below).
  const birthDataCompleteCount = (familyMembers ?? []).filter((fm) =>
    isBirthDataComplete({
      date_of_birth: fm.date_of_birth ?? null,
      birth_time: fm.birth_time ?? null,
      birth_city: fm.birth_city ?? null,
      birth_country: (fm as { birth_country?: string | null }).birth_country ?? null,
      birth_lat: (fm as { birth_lat?: number | null }).birth_lat ?? null,
      birth_lng: (fm as { birth_lng?: number | null }).birth_lng ?? null,
    })
  ).length;

  return NextResponse.json({
    familyMembers: familyMembers ?? [],
    charts: charts ?? [],
    relationshipReports: relationshipReports ?? [],
    familyOverviewReports,
    // Plan-aware fields (additive — old callers can ignore):
    isFamilyEntitled: entitlement.isFamilyEntitled,
    planType: entitlement.planTypeCanonical,
    birthDataCompleteCount,
  });
}

/**
 * POST /api/community/relationship-charts
 *
 * Generate, regenerate, or return-cached a synastry chart for two family
 * members of the authenticated community member.
 *
 * Body:
 *   {
 *     personAId: string,
 *     personBId: string,
 *     forceRegenerate?: boolean   // (default false)
 *   }
 *
 * Behaviour
 * ─────────
 * community-chart-cache-and-regeneration Task 03 (2026-04-27):
 *   1. Authenticate + verify both family-member ids belong to this member
 *      (RLS-scoped query — cross-household ids are silently filtered).
 *   2. Sort the pair to match the canonical (person_a_id, person_b_id)
 *      uniqueness key used by the batch route.
 *   3. Look up the existing relationship_charts row.
 *   4. Cache hit when:
 *        - row exists
 *        - invalidated_at IS NULL
 *        - chart_data matches the current production shape (Task 06)
 *        - caller did NOT request forceRegenerate
 *      → return stored chart_data, leave generated_at untouched.
 *   5. Otherwise calculate synastry + upsert with cleared invalidation
 *      fields. Distinguish "regenerated" (a row existed but was stale or
 *      invalidated) from "generated" (first time for this pair).
 *
 * Response shape:
 *   { chartId, synastry, source: "cached" | "generated" | "regenerated" }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const member = await getMember(supabase);
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (member.membership_status !== "active")
    return NextResponse.json({ error: "Inactive membership" }, { status: 403 });

  const body = await request.json();
  const { personAId, personBId } = body as {
    personAId?: string;
    personBId?: string;
    forceRegenerate?: boolean;
  };
  const forceRegenerate = body?.forceRegenerate === true;

  if (!personAId || !personBId || personAId === personBId) {
    return NextResponse.json(
      { error: "Two distinct family member IDs required" },
      { status: 400 }
    );
  }

  // Fetch both members (RLS ensures they belong to this member). If either
  // id is from another household it simply won't appear in the result —
  // no information leak.
  //
  // Independent product rule (tasks/30.04.2026): the gate is complete
  // birth data on both people. We still pull `natal_chart` because we
  // honour it as a read-through cache when shape-valid, but its absence
  // is no longer a hard gate — we can build NatalChartData on the fly
  // from birth fields, just like the admin Horoscope Toolkit.
  const { data: members } = await supabase
    .from("community_family_members")
    .select(
      "id, full_name, natal_chart, age_group, date_of_birth, birth_time, birth_city, birth_country, birth_lat, birth_lng"
    )
    .eq("member_id", member.id)
    .in("id", [personAId, personBId]);

  const personA = (members ?? []).find((m) => m.id === personAId);
  const personB = (members ?? []).find((m) => m.id === personBId);

  if (!personA || !personB) {
    return NextResponse.json({ error: "Family member(s) not found" }, { status: 404 });
  }

  // Canonical sorted pair — matches the (person_a_id, person_b_id) unique
  // index, the batch route, and me/generate-chart relationship branch.
  const [aId, bId] = [personAId, personBId].sort();

  // Look up existing chart row.
  const { data: existing } = await supabase
    .from("relationship_charts")
    .select("id, chart_data, invalidated_at")
    .eq("member_id", member.id)
    .eq("person_a_id", aId)
    .eq("person_b_id", bId)
    .maybeSingle();

  // Cache hit: existing, not invalidated, shape valid, no force.
  // Birth data is irrelevant on a cache hit — we just hydrate the saved
  // relationship report row.
  if (
    !forceRegenerate &&
    existing &&
    existing.invalidated_at === null &&
    isValidRelationshipChart(existing.chart_data)
  ) {
    return NextResponse.json({
      chartId: existing.id,
      synastry: existing.chart_data,
      source: "cached",
    });
  }

  // Compute path — gate now is complete birth data for both people.
  // We use saved natal_chart as a cache when shape-valid, otherwise we
  // build NatalChartData from birth fields in memory. No side-effect
  // write back to community_family_members.natal_chart.
  const readyA = computeBirthDataReadiness(personA);
  const readyB = computeBirthDataReadiness(personB);
  if (!readyA.complete || !readyB.complete) {
    const detail = [
      !readyA.complete ? `${personA.full_name}: ${readyA.missing.join(", ")}` : null,
      !readyB.complete ? `${personB.full_name}: ${readyB.missing.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join("; ");
    return NextResponse.json(
      {
        error:
          "Both people need complete birth details before a relationship report can be generated.",
        detail,
      },
      { status: 422 }
    );
  }

  let natalA: NatalChartData;
  let natalB: NatalChartData;
  try {
    natalA = isValidNatalChart(personA.natal_chart)
      ? (personA.natal_chart as NatalChartData)
      : buildNatalChartFromBirthData(personA);
    natalB = isValidNatalChart(personB.natal_chart)
      ? (personB.natal_chart as NatalChartData)
      : buildNatalChartFromBirthData(personB);
  } catch (e) {
    return NextResponse.json(
      {
        error: "Could not build a chart from one or both people's birth data.",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 422 }
    );
  }

  // Regenerate or generate.
  const synastry = calculateSynastry(
    natalA,
    natalB,
    personA.full_name,
    personB.full_name
  );

  const { data: chart, error } = await supabase
    .from("relationship_charts")
    .upsert(
      {
        member_id: member.id,
        person_a_id: aId,
        person_b_id: bId,
        chart_data: synastry,
        generated_at: new Date().toISOString(),
        // Clear invalidation state — the new payload is current.
        invalidated_at: null,
        invalidation_reason: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "person_a_id,person_b_id" }
    )
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Distinguish first-time generation from regen of an existing row.
  const source: "generated" | "regenerated" = existing ? "regenerated" : "generated";

  return NextResponse.json({
    chartId: chart?.id,
    synastry,
    source,
  });
}
