import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateSynastry } from "@/lib/astro/synastry";
import type { NatalChartData } from "@/lib/astro/natal-chart";
import {
  isValidNatalChart,
  isValidRelationshipChart,
} from "@/lib/community/chart-validators";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

async function getMember(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();
  return member;
}

/**
 * GET /api/community/relationship-charts
 * Returns all relationship charts + family members for the current member.
 */
export async function GET() {
  const supabase = await createClient();
  const member = await getMember(supabase);
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (member.membership_status !== "active")
    return NextResponse.json({ error: "Inactive membership" }, { status: 403 });

  // Fetch family members with their natal charts
  const { data: familyMembers } = await supabase
    .from("community_family_members")
    .select("id, full_name, natal_chart, age_group, date_of_birth")
    .eq("member_id", member.id)
    .order("created_at", { ascending: true });

  // Fetch existing relationship charts
  const { data: charts } = await supabase
    .from("relationship_charts")
    .select("id, person_a_id, person_b_id, chart_data, generated_at")
    .eq("member_id", member.id);

  return NextResponse.json({
    familyMembers: familyMembers ?? [],
    charts: charts ?? [],
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
  const { data: members } = await supabase
    .from("community_family_members")
    .select("id, full_name, natal_chart")
    .eq("member_id", member.id)
    .in("id", [personAId, personBId]);

  const personA = (members ?? []).find((m) => m.id === personAId);
  const personB = (members ?? []).find((m) => m.id === personBId);

  if (!personA || !personB) {
    return NextResponse.json({ error: "Family member(s) not found" }, { status: 404 });
  }

  if (!personA.natal_chart || !personB.natal_chart) {
    return NextResponse.json(
      { error: "Both people need natal charts generated first" },
      { status: 422 }
    );
  }

  // Task 06 — refuse to compute synastry from a legacy/dummy natal chart.
  // The relationship guard relies on natal_chart being a valid current
  // shape; if either input fails validation we report as 422 so the user
  // can regenerate the underlying natal chart through the governed path.
  if (
    !isValidNatalChart(personA.natal_chart) ||
    !isValidNatalChart(personB.natal_chart)
  ) {
    return NextResponse.json(
      {
        error:
          "One or both natal charts are stale and need to be regenerated before computing this relationship.",
      },
      { status: 422 }
    );
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

  // Regenerate or generate.
  const synastry = calculateSynastry(
    personA.natal_chart as NatalChartData,
    personB.natal_chart as NatalChartData,
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
