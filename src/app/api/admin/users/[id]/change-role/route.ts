import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── POST /api/admin/users/[id]/change-role ───────────────────────────────────
// Creates a new profile row in the target role table.
// Does NOT delete the existing role record (audit trail preserved).

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { new_role } = await req.json();

  const allowedRoles = ["diviner", "client", "advocate", "trainee"];
  if (!new_role || !allowedRoles.includes(new_role)) {
    return NextResponse.json(
      { error: `new_role must be one of: ${allowedRoles.join(", ")}` },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Fetch auth user for email + name context
  const { data: authUserData, error: authErr } = await admin.auth.admin.getUserById(id);
  if (authErr || !authUserData.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const email = authUserData.user.email ?? "";
  const displayName = email.split("@")[0] ?? "Unknown";

  // Build the minimal insert payload per role table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let insertPayload: Record<string, any>;
  let table: string;

  switch (new_role) {
    case "diviner":
      table = "diviners";
      insertPayload = { user_id: id, display_name: displayName, is_active: true };
      break;
    case "client":
      table = "clients";
      insertPayload = { user_id: id, full_name: displayName, email };
      break;
    case "advocate":
      table = "social_advocates";
      insertPayload = { user_id: id, name: displayName, email, is_active: true };
      break;
    case "trainee":
      table = "trainees";
      insertPayload = { user_id: id, name: displayName, email, training_status: "in_progress" };
      break;
    default:
      return NextResponse.json({ error: "Unknown role" }, { status: 422 });
  }

  const { error: insertErr } = await admin.from(table).insert(insertPayload);
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Log to admin_activity_log
  await admin.from("admin_activity_log").insert({
    admin_user_id: adminUser.email,
    target_user_id: id,
    action_type: "change_role",
    details: { new_role, table },
  }).maybeSingle();

  return NextResponse.json({ success: true, new_role });
}
