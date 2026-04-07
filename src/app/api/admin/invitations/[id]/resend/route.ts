import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
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

  // Send fresh invitation email
  const acceptUrl = `${APP_URL}/invitations/${token}/accept`;
  await sendEmail({
    to: invitation.email,
    subject: "Your AstrologyPro invitation has been resent",
    html: `
      <p>Hello,</p>
      <p>Your invitation to join AstrologyPro as a <strong>${invitation.role_slug}</strong> has been resent.</p>
      <p>Click the link below to create your account. This link expires in 7 days.</p>
      <p><a href="${acceptUrl}" style="padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;display:inline-block;">Accept Invitation</a></p>
      <p>If you did not expect this invitation, you can safely ignore this email.</p>
    `,
  });

  // Log to admin_activity_log
  await admin
    .from("admin_activity_log")
    .insert({
      admin_user_id: adminUser.email,
      target_user_id: null,
      action_type: "resend_invitation",
      details: { invitation_id: id, email: invitation.email },
    })
    .maybeSingle();

  return NextResponse.json({ success: true });
}
