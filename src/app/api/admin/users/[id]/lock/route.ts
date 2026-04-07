import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── POST /api/admin/users/[id]/lock ─────────────────────────────────────────
// Body: { reason: string }
// Inserts (or updates) a row in user_account_locks.
// Also bans the auth user (banned_until = far future).

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  let body: { reason?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const reason = (body.reason ?? "").toString().trim();
  if (!reason) {
    return NextResponse.json(
      {
        type: "https://tools.ietf.org/html/rfc7807",
        title: "Unprocessable Entity",
        status: 422,
        detail: "reason is required.",
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Upsert the account lock row
  const { error: lockErr } = await admin
    .from("user_account_locks")
    .upsert(
      {
        user_id: id,
        locked_at: new Date().toISOString(),
        locked_reason: reason,
        locked_by: adminUser.id,
        unlocked_at: null,
        unlocked_by: null,
      },
      { onConflict: "user_id" }
    );

  if (lockErr) {
    return NextResponse.json(
      {
        type: "https://tools.ietf.org/html/rfc7807",
        title: "Internal Server Error",
        status: 500,
        detail: lockErr.message,
      },
      { status: 500 }
    );
  }

  // Ban the auth user until far future
  const farFuture = "2099-12-31T23:59:59Z";
  await admin.auth.admin.updateUserById(id, {
    ban_duration: "876000h", // ~100 years
  });

  // Audit log
  await admin.from("admin_activity_log").insert({
    admin_user_id: adminUser.email,
    target_user_id: id,
    action_type: "account_locked",
    details: { reason },
  });

  return NextResponse.json({ ok: true, locked: true, reason, farFuture });
}

// ─── DELETE /api/admin/users/[id]/lock ───────────────────────────────────────
// Unlocks the account: sets unlocked_at = now, lifts the ban.

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const admin = createAdminClient();

  const now = new Date().toISOString();

  const { error: unlockErr } = await admin
    .from("user_account_locks")
    .update({ unlocked_at: now, unlocked_by: adminUser.id })
    .eq("user_id", id)
    .is("unlocked_at", null);

  if (unlockErr) {
    return NextResponse.json(
      {
        type: "https://tools.ietf.org/html/rfc7807",
        title: "Internal Server Error",
        status: 500,
        detail: unlockErr.message,
      },
      { status: 500 }
    );
  }

  // Lift the ban
  await admin.auth.admin.updateUserById(id, {
    ban_duration: "none",
  });

  // Audit log
  await admin.from("admin_activity_log").insert({
    admin_user_id: adminUser.email,
    target_user_id: id,
    action_type: "account_unlocked",
    details: { note: "Account unlocked by admin" },
  });

  return NextResponse.json({ ok: true, locked: false });
}
