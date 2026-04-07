import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
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

  const enriched = (data ?? []).map((inv) => ({
    ...inv,
    invited_by_email: inv.invited_by ? (invitedByMap[inv.invited_by] ?? inv.invited_by) : null,
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

  // Send invitation email
  const acceptUrl = `${APP_URL}/invitations/${token}/accept`;
  await sendEmail({
    to: emailLower,
    subject: "You've been invited to AstrologyPro",
    html: `
      <p>Hello,</p>
      <p>You have been invited to join AstrologyPro as a <strong>${role_slug}</strong>.</p>
      <p>Click the link below to create your account. This link expires in 7 days.</p>
      <p><a href="${acceptUrl}" style="padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;display:inline-block;">Accept Invitation</a></p>
      <p>If you did not expect this invitation, you can safely ignore this email.</p>
    `,
  });

  return NextResponse.json(
    {
      id: invitation.id,
      email: invitation.email,
      token, // only time the raw token is returned
    },
    { status: 201 }
  );
}
