import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateNatalChart } from "@/lib/astro/natal-chart";

export const runtime = "nodejs";

/**
 * POST /api/community/generate-natal
 * Body: { familyMemberId: string }
 * Generates a natal chart for the given family member and stores it.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { familyMemberId } = await request.json();
  if (!familyMemberId) {
    return NextResponse.json({ error: "familyMemberId required" }, { status: 400 });
  }

  // Verify ownership via member RLS
  const { data: fm, error: fmError } = await supabase
    .from("community_family_members")
    .select(
      "id, full_name, date_of_birth, birth_time, birth_city, birth_country, birth_lat, birth_lng, age_group, member_id"
    )
    .eq("id", familyMemberId)
    .single();

  if (fmError || !fm) {
    return NextResponse.json({ error: "Family member not found" }, { status: 404 });
  }

  // Use stored coordinates, or default to 0,0 if unknown
  const lat = Number(fm.birth_lat ?? 0);
  const lng = Number(fm.birth_lng ?? 0);

  const chart = generateNatalChart({
    dateOfBirth: fm.date_of_birth,
    birthTime: fm.birth_time ?? null,
    lat,
    lng,
    ageGroup: (fm.age_group as "child" | "adult") ?? "adult",
  });

  const { error: updateError } = await supabase
    .from("community_family_members")
    .update({
      natal_chart: chart,
      chart_updated_at: new Date().toISOString(),
    })
    .eq("id", familyMemberId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ chart });
}
