import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── GET /api/admin/users/[id]/sessions ──────────────────────────────────────
// Returns user_sessions ordered by last_seen_at DESC.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("user_sessions")
    .select(
      "id, session_ref, device_type, browser, os, ip_address, country_code, " +
      "last_seen_at, created_at, revoked_at, is_current"
    )
    .eq("user_id", id)
    .order("last_seen_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        type: "https://tools.ietf.org/html/rfc7807",
        title: "Internal Server Error",
        status: 500,
        detail: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ sessions: data ?? [] });
}

// ─── DELETE /api/admin/users/[id]/sessions ────────────────────────────────────
// Body (optional): { sessionId?: string }
// If sessionId provided: revoke that session only.
// If not provided: revoke all non-revoked sessions.

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const admin = createAdminClient();

  let body: { sessionId?: string } = {};
  try {
    body = await req.json();
  } catch {
    // body is optional — empty or non-JSON body means revoke all
  }

  const now = new Date().toISOString();

  if (body.sessionId) {
    const { error } = await admin
      .from("user_sessions")
      .update({ revoked_at: now })
      .eq("id", body.sessionId)
      .eq("user_id", id)
      .is("revoked_at", null);

    if (error) {
      return NextResponse.json(
        {
          type: "https://tools.ietf.org/html/rfc7807",
          title: "Internal Server Error",
          status: 500,
          detail: error.message,
        },
        { status: 500 }
      );
    }
  } else {
    const { error } = await admin
      .from("user_sessions")
      .update({ revoked_at: now })
      .eq("user_id", id)
      .is("revoked_at", null);

    if (error) {
      return NextResponse.json(
        {
          type: "https://tools.ietf.org/html/rfc7807",
          title: "Internal Server Error",
          status: 500,
          detail: error.message,
        },
        { status: 500 }
      );
    }
  }

  // Log the action
  await admin.from("admin_activity_log").insert({
    admin_user_id: adminUser.email,
    target_user_id: id,
    action_type: body.sessionId ? "revoke_session" : "revoke_all_sessions",
    details: body.sessionId ? { session_id: body.sessionId } : { note: "All sessions revoked" },
  });

  return NextResponse.json({ ok: true });
}
