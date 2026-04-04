import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const FAMILY_PLAN_LIMIT = 5;

async function getMember(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, member: null };

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status, plan_type")
    .eq("user_id", user.id)
    .single();

  return { user, member };
}

/**
 * GET /api/community/family
 * Returns all family members for the authenticated community member.
 */
export async function GET() {
  const supabase = await createClient();
  const { member } = await getMember(supabase);
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (member.membership_status !== "active")
    return NextResponse.json({ error: "Inactive membership" }, { status: 403 });

  const { data, error } = await supabase
    .from("community_family_members")
    .select(
      "id, full_name, date_of_birth, birth_time, birth_city, birth_country, relationship, age_group, natal_chart, chart_updated_at, notes, created_at, updated_at"
    )
    .eq("member_id", member.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data ?? [], planType: member.plan_type });
}

/**
 * POST /api/community/family
 * Add a family member. Family plan: max 5 members.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { member } = await getMember(supabase);
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (member.membership_status !== "active")
    return NextResponse.json({ error: "Inactive membership" }, { status: 403 });

  // Enforce limit
  const { count } = await supabase
    .from("community_family_members")
    .select("id", { count: "exact", head: true })
    .eq("member_id", member.id);

  if ((count ?? 0) >= FAMILY_PLAN_LIMIT) {
    return NextResponse.json(
      { error: `Family plan allows up to ${FAMILY_PLAN_LIMIT} members` },
      { status: 422 }
    );
  }

  const body = await request.json();
  const {
    fullName,
    dateOfBirth,
    birthTime,
    birthCity,
    birthCountry,
    relationship,
    notes,
  } = body;

  if (!fullName || !dateOfBirth) {
    return NextResponse.json(
      { error: "fullName and dateOfBirth are required" },
      { status: 400 }
    );
  }

  // Determine age group
  const dob = new Date(dateOfBirth);
  const ageYears =
    (new Date().getTime() - dob.getTime()) / (365.25 * 24 * 3600 * 1000);
  const ageGroup = ageYears < 14 ? "child" : "adult";

  const { data, error } = await supabase
    .from("community_family_members")
    .insert({
      member_id: member.id,
      full_name: fullName,
      date_of_birth: dateOfBirth,
      birth_time: birthTime || null,
      birth_city: birthCity || null,
      birth_country: birthCountry || null,
      relationship: relationship || null,
      notes: notes || null,
      age_group: ageGroup,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data }, { status: 201 });
}
