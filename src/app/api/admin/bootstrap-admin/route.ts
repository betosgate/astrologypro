import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/bootstrap-admin
 * Body: { email?: string }  — omit to promote self, or provide email to promote another user
 *
 * Protected by requireAdmin (which falls back to ADMIN_EMAILS for bootstrap).
 * Idempotent — safe to call multiple times.
 */
export async function POST(req: NextRequest) {
  const admin_user = await requireAdmin();
  if (!admin_user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { email?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body ok */
  }

  const targetEmail = (body.email ?? admin_user.email ?? "").trim().toLowerCase();
  if (!targetEmail) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Find the user by email
  const { data: userList } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const target = userList?.users?.find(
    (u) => u.email?.toLowerCase() === targetEmail
  );
  if (!target) {
    return NextResponse.json(
      { error: `User ${targetEmail} not found in auth` },
      { status: 404 }
    );
  }

  // Upsert into admin_users
  const { error } = await admin.from("admin_users").upsert(
    {
      user_id: target.id,
      email: target.email!,
      granted_by: admin_user.email ?? "bootstrap",
    },
    { onConflict: "user_id", ignoreDuplicates: true }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, promoted: targetEmail });
}
