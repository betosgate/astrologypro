import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/admin/invitations/:id ───────────────────────────────────────────
// Returns a single invitation detail.

export async function GET(_req: NextRequest, { params }: Params) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("invitations")
    .select(
      "id, email, role_slug, status, invited_by, token_hash, expires_at, accepted_at, cancelled_at, resent_count, last_resent_at, metadata, created_at, updated_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });

  // Resolve invited_by to email
  let invitedByEmail: string | null = null;
  if (data.invited_by) {
    const { data: authUser } = await admin.auth.admin.getUserById(data.invited_by);
    invitedByEmail = authUser?.user?.email ?? null;
  }

  // Never expose token_hash to the client
  const { token_hash: _omit, ...safe } = data;
  void _omit;

  return NextResponse.json({ ...safe, invited_by_email: invitedByEmail });
}

// ─── PATCH /api/admin/invitations/:id ─────────────────────────────────────────
// Updates invitation status. Currently supports action='cancel' only.
// Body: { action: 'cancel' }

export async function PATCH(req: NextRequest, { params }: Params) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { action } = body as { action?: string };

  if (action !== "cancel") {
    return NextResponse.json({ error: "Only action='cancel' is supported" }, { status: 422 });
  }

  const admin = createAdminClient();

  const { data: existing, error: fetchErr } = await admin
    .from("invitations")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });

  if (existing.status !== "pending") {
    return NextResponse.json(
      { error: `Cannot cancel invitation with status '${existing.status}'` },
      { status: 422 }
    );
  }

  const { data: updated, error: updateErr } = await admin
    .from("invitations")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, email, status, cancelled_at")
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Log to admin_activity_log
  await admin
    .from("admin_activity_log")
    .insert({
      admin_user_id: adminUser.email,
      target_user_id: null,
      action_type: "cancel_invitation",
      details: { invitation_id: id, email: updated.email },
    })
    .maybeSingle();

  return NextResponse.json({ success: true, invitation: updated });
}
