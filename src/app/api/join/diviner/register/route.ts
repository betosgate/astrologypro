import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/join/diviner/register
 *
 * Spec source:
 *   docs/tasks/2026-04-30/diviner-invite-registration-plan-gating.md
 *
 * Public, unauthenticated endpoint hit by /join/diviner once the invited
 * user has filled out the registration form.
 *
 * Pipeline:
 *   1. Validate input (email/password/fullName/profileUrl/inviteToken).
 *   2. SHA256 inviteToken → look up invitations.token_hash.
 *   3. Validate the invitation: status=pending, not expired, role=diviner,
 *      email matches the form email (anti-tampering).
 *   4. Verify no Supabase auth user exists for that email.
 *   5. Verify the requested username (profileUrl slug) is free in `diviners`.
 *   6. Create the Supabase auth user (admin client, email_confirm=true).
 *   7. Insert a `diviners` row in the unpaid state — onboarding_completed=false
 *      so the dashboard layout still treats it as in-progress, and we leave
 *      subscription_status at the column default ('trialing') which the
 *      access gate rejects until Stripe webhook flips it to 'active'.
 *   8. Mark the invitation accepted.
 *   9. Log a user_security_event for audit.
 *
 * The endpoint deliberately does NOT sign the user in — the client signs
 * in with the password it already has after this endpoint returns 200,
 * which keeps cookie-writing in one place (the SSR client) and avoids
 * the JSON-vs-redirect ambiguity of a server-side session swap.
 */

interface RegisterBody {
  email?: string;
  password?: string;
  fullName?: string;
  profileUrl?: string;
  inviteToken?: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as RegisterBody;
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const fullName = body.fullName?.trim() ?? "";
  const profileUrl = slugify(body.profileUrl ?? "");
  const inviteToken = body.inviteToken?.trim() ?? "";

  if (!email || !password || !fullName || !profileUrl || !inviteToken) {
    return NextResponse.json(
      { error: "All fields are required." },
      { status: 422 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 422 }
    );
  }
  if (profileUrl.length < 3 || profileUrl.length > 50) {
    return NextResponse.json(
      { error: "Profile URL must be 3–50 characters." },
      { status: 422 }
    );
  }
  if (fullName.length > 100) {
    return NextResponse.json(
      { error: "Full name is too long." },
      { status: 422 }
    );
  }

  const tokenHash = createHash("sha256").update(inviteToken).digest("hex");
  const admin = createAdminClient();

  // ── 1. Look up + validate invitation ──────────────────────────────────
  const { data: invitation, error: invErr } = await admin
    .from("invitations")
    .select("id, email, role_slug, status, expires_at, metadata")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (invErr) {
    return NextResponse.json({ error: invErr.message }, { status: 500 });
  }
  if (!invitation) {
    return NextResponse.json(
      { error: "Invalid or expired invitation link." },
      { status: 404 }
    );
  }
  if (invitation.role_slug !== "diviner") {
    return NextResponse.json(
      { error: "This invitation is for a different role." },
      { status: 422 }
    );
  }
  if (invitation.status !== "pending") {
    return NextResponse.json(
      { error: "This invitation has already been used or cancelled." },
      { status: 422 }
    );
  }
  if (
    invitation.expires_at &&
    new Date(invitation.expires_at) < new Date()
  ) {
    return NextResponse.json(
      { error: "This invitation link has expired. Please request a new one." },
      { status: 422 }
    );
  }
  if (invitation.email.toLowerCase() !== email) {
    // Anti-tampering: the form must use the email the invitation was sent to.
    return NextResponse.json(
      { error: "Email does not match the invited address." },
      { status: 422 }
    );
  }

  // ── 2. Email uniqueness ───────────────────────────────────────────────
  const { data: existingListData } = await admin.auth.admin.listUsers();
  const existingAuthUsers = (existingListData?.users ?? []) as Array<{
    id: string;
    email?: string;
  }>;
  const alreadyExists = existingAuthUsers.some(
    (u) => u.email?.toLowerCase() === email
  );
  if (alreadyExists) {
    return NextResponse.json(
      { error: "An account with this email already exists. Please log in." },
      { status: 422 }
    );
  }

  // ── 3. Username uniqueness ────────────────────────────────────────────
  const { data: usernameClash } = await admin
    .from("diviners")
    .select("id")
    .eq("username", profileUrl)
    .maybeSingle();
  if (usernameClash) {
    return NextResponse.json(
      { error: "That profile URL is already taken. Please pick another." },
      { status: 409 }
    );
  }

  // ── 4. Create Supabase auth user ──────────────────────────────────────
  const { data: newAuthUser, error: createErr } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        username: profileUrl,
        role: "diviner",
      },
    });

  if (createErr || !newAuthUser.user) {
    return NextResponse.json(
      { error: createErr?.message ?? "Failed to create account." },
      { status: 500 }
    );
  }
  const userId = newAuthUser.user.id;

  // ── 5. Create the diviners row in unpaid/draft state ──────────────────
  //
  // We DO create the row up-front so the user has a stable `diviners.id`
  // throughout the rest of the journey (plan-page checkout will reference
  // it via user_id). The dashboard gate is enforced by
  // subscription_status — left at the column default ('trialing') here —
  // and the Stripe webhook flips it to 'active' on payment success.
  const { error: divinerErr } = await admin.from("diviners").insert({
    user_id: userId,
    username: profileUrl,
    display_name: fullName,
    onboarding_completed: false,
    is_active: true,
  });

  if (divinerErr) {
    // Best-effort cleanup of the auth user so the email can be re-tried.
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    return NextResponse.json(
      { error: `Account setup failed: ${divinerErr.message}` },
      { status: 500 }
    );
  }

  // ── 6. Mark invitation accepted ──────────────────────────────────────
  await admin
    .from("invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", invitation.id);

  // ── 7. Audit log ──────────────────────────────────────────────────────
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  await admin
    .from("user_security_events")
    .insert({
      user_id: userId,
      event_type: "invite_accepted",
      ip_address: ipAddress,
      device_info: req.headers.get("user-agent") ?? null,
      metadata: {
        invitation_id: invitation.id,
        role_slug: "diviner",
        flow: "join_diviner_register",
      },
      actor_user_id: null,
    })
    .then(() => {}, () => {}); // best-effort, never block the response

  return NextResponse.json({
    success: true,
    userId,
    next: "/join/diviner/plan",
  });
}
