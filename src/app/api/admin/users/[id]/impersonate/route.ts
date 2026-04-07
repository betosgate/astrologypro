import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// ─── POST /api/admin/users/:id/impersonate ────────────────────────────────────
// Super admin only (admin_users table + 'impersonation.use' permission).
// Body: { reason: string }
// Creates user_impersonation_log entry.
// Returns: { magicLinkUrl: string } — a one-time Supabase magic link for the target user.
// Logs user_security_events for both impersonator and impersonated.

export async function POST(req: NextRequest, { params }: Params) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: targetUserId } = await params;
  const body = await req.json();
  const { reason } = body as { reason?: string };

  if (!reason || reason.trim().length < 5) {
    return NextResponse.json(
      { error: "A reason of at least 5 characters is required for impersonation." },
      { status: 422 }
    );
  }

  if (adminUser.id === targetUserId) {
    return NextResponse.json({ error: "Cannot impersonate yourself." }, { status: 422 });
  }

  const admin = createAdminClient();

  // Verify the admin has the 'impersonation.use' permission
  const { data: impersonationPerm } = await admin
    .from("role_permissions")
    .select("id")
    .eq("granted_by", adminUser.id)
    .limit(1)
    .maybeSingle();

  // Check via permission code join
  const { data: permCheck } = await admin
    .from("permissions")
    .select("id")
    .eq("code", "impersonation.use")
    .maybeSingle();

  if (permCheck) {
    const { data: hasPerm } = await admin
      .from("role_permissions")
      .select("id")
      .eq("permission_id", permCheck.id)
      .limit(1)
      .maybeSingle();

    // If the permission exists in the system but this admin doesn't have it, block
    if (!hasPerm && !impersonationPerm) {
      return NextResponse.json(
        { error: "Forbidden: impersonation.use permission required." },
        { status: 403 }
      );
    }
  }

  // Verify target user exists
  const { data: targetAuthData, error: targetErr } = await admin.auth.admin.getUserById(targetUserId);
  if (targetErr || !targetAuthData.user) {
    return NextResponse.json({ error: "Target user not found" }, { status: 404 });
  }

  const targetEmail = targetAuthData.user.email;
  if (!targetEmail) {
    return NextResponse.json({ error: "Target user has no email address" }, { status: 422 });
  }

  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;

  const startedAt = new Date().toISOString();

  // Generate a one-time magic link for the target user
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: targetEmail,
  });

  if (linkErr || !linkData?.properties?.action_link) {
    return NextResponse.json(
      { error: linkErr?.message ?? "Failed to generate impersonation link." },
      { status: 500 }
    );
  }

  // Create impersonation log entry
  const { error: logErr } = await admin.from("user_impersonation_log").insert({
    impersonator_id: adminUser.id,
    impersonated_id: targetUserId,
    reason: reason.trim(),
    started_at: startedAt,
    ip_address: ipAddress,
    actions_taken: null,
  });

  if (logErr) {
    return NextResponse.json({ error: logErr.message }, { status: 500 });
  }

  // Log security event for the impersonator
  await admin.from("user_security_events").insert({
    user_id: adminUser.id,
    event_type: "impersonation_started",
    ip_address: ipAddress,
    device_info: req.headers.get("user-agent") ?? null,
    metadata: { target_user_id: targetUserId, reason: reason.trim() },
    actor_user_id: adminUser.id,
  });

  // Log security event for the impersonated user
  await admin.from("user_security_events").insert({
    user_id: targetUserId,
    event_type: "impersonated_by_admin",
    ip_address: ipAddress,
    device_info: req.headers.get("user-agent") ?? null,
    metadata: { impersonator_id: adminUser.id, reason: reason.trim() },
    actor_user_id: adminUser.id,
  });

  // Log to admin_activity_log
  await admin
    .from("admin_activity_log")
    .insert({
      admin_user_id: adminUser.email,
      target_user_id: targetUserId,
      action_type: "impersonate_user",
      details: { reason: reason.trim(), ip_address: ipAddress },
    })
    .maybeSingle();

  return NextResponse.json({
    magicLinkUrl: linkData.properties.action_link,
  });
}
