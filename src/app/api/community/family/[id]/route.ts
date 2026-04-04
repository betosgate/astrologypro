import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function getMemberId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: member } = await supabase
    .from("community_members")
    .select("id")
    .eq("user_id", user.id)
    .single();
  return member?.id ?? null;
}

/**
 * PATCH /api/community/family/:id
 * Update a family member's details. Regenerates age_group if dob changes.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const memberId = await getMemberId(supabase);
  if (!memberId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.fullName !== undefined) updateData.full_name = body.fullName;
  if (body.dateOfBirth !== undefined) {
    updateData.date_of_birth = body.dateOfBirth;
    const dob = new Date(body.dateOfBirth);
    const ageYears =
      (new Date().getTime() - dob.getTime()) / (365.25 * 24 * 3600 * 1000);
    updateData.age_group = ageYears < 14 ? "child" : "adult";
    // Invalidate chart so it gets regenerated
    updateData.natal_chart = null;
    updateData.chart_updated_at = null;
  }
  if (body.birthTime !== undefined) {
    updateData.birth_time = body.birthTime || null;
    updateData.natal_chart = null;
    updateData.chart_updated_at = null;
  }
  if (body.birthCity !== undefined) updateData.birth_city = body.birthCity || null;
  if (body.birthCountry !== undefined)
    updateData.birth_country = body.birthCountry || null;
  if (body.relationship !== undefined)
    updateData.relationship = body.relationship || null;
  if (body.notes !== undefined) updateData.notes = body.notes || null;

  const { data, error } = await supabase
    .from("community_family_members")
    .update(updateData)
    .eq("id", id)
    .eq("member_id", memberId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ member: data });
}

/**
 * DELETE /api/community/family/:id
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const memberId = await getMemberId(supabase);
  if (!memberId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { error } = await supabase
    .from("community_family_members")
    .delete()
    .eq("id", id)
    .eq("member_id", memberId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
