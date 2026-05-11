import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPlatformInvitationEmail } from "@/lib/email";
import { APP_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// ─── POST /api/admin/invitations/:id/resend ───────────────────────────────────
// Re-generates the invitation token, resets expiry to now()+7days,
// increments resent_count, and sends a fresh invitation email.

export async function POST(_req: NextRequest, { params }: Params) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: invitation, error: fetchErr } = await admin
    .from("invitations")
    .select("id, email, role_slug, status, resent_count")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!invitation) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });

  if (invitation.status !== "pending") {
    return NextResponse.json(
      { error: `Cannot resend invitation with status '${invitation.status}'` },
      { status: 422 }
    );
  }

  // Generate a new token
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error: updateErr } = await admin
    .from("invitations")
    .update({
      token_hash: tokenHash,
      expires_at: expiresAt,
      resent_count: (invitation.resent_count ?? 0) + 1,
      last_resent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  const acceptUrl =
    invitation.role_slug === "diviner"
      ? `${APP_URL}/join/diviner?email=${encodeURIComponent(invitation.email)}&inviteToken=${encodeURIComponent(token)}`
      : `${APP_URL}/invitations/${token}/accept`;

  const emailResult = await sendPlatformInvitationEmail({
    to: invitation.email,
    roleSlug: invitation.role_slug,
    acceptUrl,
    resent: true,
    invitationId: invitation.id,
  });

  // Log to admin_activity_log
  await admin
    .from("admin_activity_log")
    .insert({
      admin_user_id: adminUser.email,
      target_user_id: null,
      action_type: "resend_invitation",
      details: {
        invitation_id: id,
        email: invitation.email,
        role_slug: invitation.role_slug,
        message_id: emailResult.id,
      },
    })
    .maybeSingle();

  return NextResponse.json({ success: true, messageId: emailResult.id });
}
