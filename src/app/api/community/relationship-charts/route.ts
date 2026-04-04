import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateSynastry } from "@/lib/astro/synastry";
import type { NatalChartData } from "@/lib/astro/natal-chart";

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
 * Generate (or regenerate) a synastry chart for two family members.
 * Body: { personAId: string, personBId: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const member = await getMember(supabase);
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (member.membership_status !== "active")
    return NextResponse.json({ error: "Inactive membership" }, { status: 403 });

  const { personAId, personBId } = await request.json();
  if (!personAId || !personBId || personAId === personBId) {
    return NextResponse.json({ error: "Two distinct family member IDs required" }, { status: 400 });
  }

  // Fetch both members (RLS ensures they belong to this member)
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

  const synastry = calculateSynastry(
    personA.natal_chart as NatalChartData,
    personB.natal_chart as NatalChartData,
    personA.full_name,
    personB.full_name
  );

  // Upsert — use person_a < person_b ordering for dedup
  const [aId, bId] = [personAId, personBId].sort();

  const { data: chart, error } = await supabase
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
    )
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ chartId: chart?.id, synastry });
}
