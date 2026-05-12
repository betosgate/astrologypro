import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPlatformInvitationEmail } from "@/lib/email";
import { APP_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

// ─── GET /api/admin/invitations ───────────────────────────────────────────────
// Returns paginated invitations list.
// Query params: status=pending|accepted|expired|cancelled|all, page=1, limit=20

export async function GET(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "all";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  let query = admin
    .from("invitations")
    .select(
      "id, email, role_slug, status, invited_by, expires_at, accepted_at, created_at, resent_count",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Resolve invited_by user_id to email via auth admin
  const invitedByIds = [...new Set((data ?? []).map((inv) => inv.invited_by).filter(Boolean))];
  const invitedByMap: Record<string, string> = {};

  for (const uid of invitedByIds) {
    const { data: authUser } = await admin.auth.admin.getUserById(uid as string);
    if (authUser?.user?.email) {
      invitedByMap[uid as string] = authUser.user.email;
    }
  }

  // Diviner sub-status enrichment.
  //
  // The invited-diviner flow (docs/tasks/2026-04-30) needs admin to see
  // a three-state label:
  //   pending                                 → "Pending"
  //   accepted + no diviner / inactive sub   → "Active"
  //   accepted + diviner subscription active → "Completed"
  //
  // We don't migrate the invitations.status enum (it stays
  // pending|accepted|expired|cancelled). Instead we attach a derived
  // `diviner_subscription_status` field for diviner-role rows so the
  // client renders the 3-state label without a follow-up fetch.
  const divinerEmails = (data ?? [])
    .filter(
      (inv) =>
        inv.role_slug === "diviner" &&
        (inv.status === "accepted" || inv.status === "pending")
    )
    .map((inv) => inv.email.toLowerCase());

  const divinerSubStatusByEmail = new Map<string, string | null>();
  if (divinerEmails.length > 0) {
    // Resolve emails → user_ids via auth admin (RLS-bypassing path).
    const { data: usersList } = await admin.auth.admin.listUsers();
    const emailToUserId = new Map<string, string>();
    for (const u of usersList?.users ?? []) {
      const e = u.email?.toLowerCase();
      if (e) emailToUserId.set(e, u.id);
    }
    const userIds = divinerEmails
      .map((e) => emailToUserId.get(e))
      .filter((v): v is string => Boolean(v));

    if (userIds.length > 0) {
      const { data: divinersRows } = await admin
        .from("diviners")
        .select("user_id, subscription_status")
        .in("user_id", userIds);
      const userIdToStatus = new Map<string, string | null>();
      for (const row of divinersRows ?? []) {
        userIdToStatus.set(
          row.user_id as string,
          (row.subscription_status as string | null) ?? null
        );
      }
      for (const email of divinerEmails) {
        const uid = emailToUserId.get(email);
        if (uid) {
          divinerSubStatusByEmail.set(email, userIdToStatus.get(uid) ?? null);
        }
      }
    }
  }

  const enriched = (data ?? []).map((inv) => ({
    ...inv,
    invited_by_email: inv.invited_by ? (invitedByMap[inv.invited_by] ?? inv.invited_by) : null,
    diviner_subscription_status:
      inv.role_slug === "diviner"
        ? divinerSubStatusByEmail.get(inv.email.toLowerCase()) ?? null
        : null,
  }));

  return NextResponse.json({
    data: enriched,
    count: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}

// ─── POST /api/admin/invitations ──────────────────────────────────────────────
// Creates a new invitation and sends the invite email.
// Body: { email, role_slug, metadata?: { parent_diviner_id?: string, ... } }

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { email, role_slug, metadata } = body as {
    email?: string;
    role_slug?: string;
    metadata?: Record<string, unknown>;
  };

  if (!email || !role_slug) {
    return NextResponse.json({ error: "email and role_slug are required" }, { status: 422 });
  }

  const emailLower = email.trim().toLowerCase();

  const admin = createAdminClient();

  // Check for an existing pending invitation for this email
  const { data: existing } = await admin
    .from("invitations")
    .select("id, status")
    .eq("email", emailLower)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "A pending invitation already exists for this email." },
      { status: 422 }
    );
  }

  // Generate a cryptographically secure token
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: invitation, error: insertErr } = await admin
    .from("invitations")
    .insert({
      email: emailLower,
      role_slug,
      invited_by: adminUser.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      status: "pending",
      metadata: metadata ?? null,
    })
    .select("id, email, role_slug, status, expires_at, created_at")
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  const acceptUrl = `${APP_URL}/invitations/${encodeURIComponent(token)}/accept`;

  const emailResult = await sendPlatformInvitationEmail({
    to: emailLower,
    roleSlug: role_slug,
    acceptUrl,
    invitationId: invitation.id,
  });

  return NextResponse.json(
    {
      id: invitation.id,
      email: invitation.email,
      token, // only time the raw token is returned
      messageId: emailResult.id,
    },
    { status: 201 }
  );
}
