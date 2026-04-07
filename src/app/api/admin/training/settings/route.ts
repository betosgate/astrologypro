import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";


// GET /api/admin/training/settings
export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("training_settings")
    .select("id, allowed_roles, global_sequential_lock, updated_at")
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    settings: data ?? { allowed_roles: [], global_sequential_lock: false, updated_at: null },
  });
}

// PUT /api/admin/training/settings
export async function PUT(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { allowed_roles?: string[]; global_sequential_lock?: boolean };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { allowed_roles, global_sequential_lock } = body;
  if (!Array.isArray(allowed_roles)) {
    return NextResponse.json({ error: "allowed_roles must be an array." }, { status: 422 });
  }

  const validRoles = [
    "trainee", "astrologer", "tarot_reader", "social_advocate",
    "affiliate", "mystery_school", "perennial_mandalism", "customer",
  ];
  const invalid = allowed_roles.filter(r => !validRoles.includes(r));
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Invalid roles: ${invalid.join(", ")}` },
      { status: 422 }
    );
  }

  if (global_sequential_lock !== undefined && typeof global_sequential_lock !== "boolean") {
    return NextResponse.json({ error: "global_sequential_lock must be a boolean." }, { status: 422 });
  }

  const admin = createAdminClient();

  // Get the single settings row id (may not exist yet)
  const { data: existing } = await admin
    .from("training_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  const updatePayload: Record<string, unknown> = {
    allowed_roles,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };
  if (global_sequential_lock !== undefined) {
    updatePayload.global_sequential_lock = global_sequential_lock;
  }

  let data, error;
  if (existing?.id) {
    ({ data, error } = await admin
      .from("training_settings")
      .update(updatePayload)
      .eq("id", existing.id)
      .select("id, allowed_roles, global_sequential_lock, updated_at")
      .single());
  } else {
    ({ data, error } = await admin
      .from("training_settings")
      .insert({ ...updatePayload })
      .select("id, allowed_roles, global_sequential_lock, updated_at")
      .single());
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}
