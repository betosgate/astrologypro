import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// ─── POST /api/admin/invitations/:id/copy-link ──────────────────────────────
// Generates a fresh public invite URL for a pending invitation and
// returns it to the admin for manual sharing. We rotate the token so the
// copied link is a valid, current invite URL instead of a fabricated client
// route such as /invite/:id.

export async function POST(_req: NextRequest, { params }: Params) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: invitation, error: fetchErr } = await admin
    .from("invitations")
    .select("id, email, role_slug, status")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }
  if (invitation.status !== "pending") {
    return NextResponse.json(
      { error: `Cannot copy link for invitation with status '${invitation.status}'` },
      { status: 422 }
    );
  }
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error: updateErr } = await admin
    .from("invitations")
    .update({
      token_hash: tokenHash,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  const acceptUrl = `${APP_URL}/invitations/${encodeURIComponent(token)}/accept`;

  await admin
    .from("admin_activity_log")
    .insert({
      admin_user_id: adminUser.email,
      target_user_id: null,
      action_type: "copy_invitation_link",
      details: {
        invitation_id: id,
        email: invitation.email,
        role_slug: invitation.role_slug,
      },
    })
    .maybeSingle();

  return NextResponse.json({
    success: true,
    acceptUrl,
    expiresAt,
  });
}
