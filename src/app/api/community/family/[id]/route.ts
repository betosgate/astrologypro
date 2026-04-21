import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

  // Any change to a birth-location field invalidates the cached chart so
  // the next generate-natal call recomputes against the new coordinates.
  let invalidateChart = false;

  if (body.fullName !== undefined) updateData.full_name = body.fullName;
  if (body.dateOfBirth !== undefined) {
    updateData.date_of_birth = body.dateOfBirth;
    const dob = new Date(body.dateOfBirth);
    const ageYears =
      (new Date().getTime() - dob.getTime()) / (365.25 * 24 * 3600 * 1000);
    updateData.age_group = ageYears < 14 ? "child" : "adult";
    invalidateChart = true;
  }
  if (body.birthTime !== undefined) {
    updateData.birth_time = body.birthTime || null;
    invalidateChart = true;
  }
  if (body.birthCity !== undefined) {
    updateData.birth_city = body.birthCity || null;
    invalidateChart = true;
  }
  if (body.birthCountry !== undefined) {
    updateData.birth_country = body.birthCountry || null;
    invalidateChart = true;
  }
  if (body.birthLat !== undefined) {
    const latRaw = body.birthLat;
    updateData.birth_lat =
      latRaw == null || latRaw === ""
        ? null
        : Number.isFinite(Number(latRaw))
        ? Number(latRaw)
        : null;
    invalidateChart = true;
  }
  if (body.birthLng !== undefined) {
    const lngRaw = body.birthLng;
    updateData.birth_lng =
      lngRaw == null || lngRaw === ""
        ? null
        : Number.isFinite(Number(lngRaw))
        ? Number(lngRaw)
        : null;
    invalidateChart = true;
  }
  if (body.relationship !== undefined)
    updateData.relationship = body.relationship || null;
  if (body.notes !== undefined) updateData.notes = body.notes || null;

  if (invalidateChart) {
    // Clear cached chart + reset lifecycle so the next generate-natal call
    // treats this as a regeneration path. natal_status fields only exist
    // once the governance migration has been applied; swallow the update
    // gracefully if those columns are missing in an older environment.
    updateData.natal_chart = null;
    updateData.chart_updated_at = null;
    updateData.natal_status = "queued";
    updateData.natal_failure_reason = null;
  }

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
