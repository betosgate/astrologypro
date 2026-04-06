import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map((e) => e.trim()).filter(Boolean);

async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET /api/admin/training/settings
export async function GET() {
  const user = await getAdminUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("training_settings")
    .select("id, allowed_roles, updated_at")
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data ?? { allowed_roles: [], updated_at: null } });
}

// PUT /api/admin/training/settings
export async function PUT(req: NextRequest) {
  const user = await getAdminUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { allowed_roles?: string[] };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { allowed_roles } = body;
  if (!Array.isArray(allowed_roles)) {
    return NextResponse.json({ error: "allowed_roles must be an array." }, { status: 422 });
  }

  const validRoles = [
    "trainee", "astrologer", "tarot_reader", "social_advocate",
    "affiliate", "mystery_school", "perennial_mandalism", "customer"
  ];
  const invalid = allowed_roles.filter(r => !validRoles.includes(r));
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Invalid roles: ${invalid.join(", ")}` },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Get the single settings row id (may not exist yet)
  const { data: existing } = await admin
    .from("training_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  let data, error;
  if (existing?.id) {
    ({ data, error } = await admin
      .from("training_settings")
      .update({
        allowed_roles,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("id", existing.id)
      .select("id, allowed_roles, updated_at")
      .single());
  } else {
    ({ data, error } = await admin
      .from("training_settings")
      .insert({ allowed_roles, updated_by: user.id })
      .select("id, allowed_roles, updated_at")
      .single());
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}
