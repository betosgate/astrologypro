import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

// ─── POST /api/invitations/:token/accept ──────────────────────────────────────
// Public (unauthenticated) endpoint.
// Body: { password, first_name, last_name, phone? }
// 1. Hash the token, look up invitation by token_hash
// 2. Validate: status='pending', not expired
// 3. Check no existing Supabase user with this email
// 4. Create Supabase auth user
// 5. Insert into role-specific table
// 6. Mark invitation accepted
// 7. Log user_security_events

export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params;

  const body = await req.json();
  const { password, first_name, last_name, phone } = body as {
    password?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };

  if (!password || !first_name || !last_name) {
    return NextResponse.json(
      { error: "password, first_name, and last_name are required" },
      { status: 422 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 422 }
    );
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();

  // 1. Look up invitation by token_hash
  const { data: invitation, error: invErr } = await admin
    .from("invitations")
    .select("id, email, role_slug, status, expires_at, metadata")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 });
  if (!invitation) {
    return NextResponse.json({ error: "Invalid or expired invitation link." }, { status: 404 });
  }

  // 2. Validate status and expiry
  if (invitation.status !== "pending") {
    return NextResponse.json(
      { error: "This invitation has already been used or cancelled." },
      { status: 422 }
    );
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "This invitation link has expired. Please request a new one." },
      { status: 422 }
    );
  }

  // 3. Check for existing user with this email
  const { data: existingListData } = await admin.auth.admin.listUsers();
  const existingAuthUsers = (existingListData?.users ?? []) as Array<{ id: string; email?: string }>;
  const emailLower = invitation.email.toLowerCase();
  const alreadyExists = existingAuthUsers.some(
    (u) => u.email?.toLowerCase() === emailLower
  );

  if (alreadyExists) {
    return NextResponse.json(
      { error: "An account with this email already exists. Please log in." },
      { status: 422 }
    );
  }

  // 4. Create Supabase auth user
  const fullName = `${first_name.trim()} ${last_name.trim()}`;

  const { data: newAuthUser, error: createErr } = await admin.auth.admin.createUser({
    email: emailLower,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      full_name: fullName,
      role: invitation.role_slug,
    },
  });

  if (createErr || !newAuthUser.user) {
    return NextResponse.json(
      { error: createErr?.message ?? "Failed to create account." },
      { status: 500 }
    );
  }

  const userId = newAuthUser.user.id;

  // 5. Insert into role-specific table
  const metadata = (invitation.metadata ?? {}) as Record<string, unknown>;

  let profileInsertError: string | null = null;

  switch (invitation.role_slug) {
    case "diviner": {
      const { error } = await admin.from("diviners").insert({
        user_id: userId,
        display_name: fullName,
        phone: phone?.trim() || null,
        is_active: true,
      });
      if (error) profileInsertError = error.message;
      break;
    }
    case "client": {
      const { error } = await admin.from("clients").insert({
        user_id: userId,
        full_name: fullName,
        email: emailLower,
        phone: phone?.trim() || null,
      });
      if (error) profileInsertError = error.message;
      break;
    }
    case "social_advo":
    case "advocate": {
      const { error } = await admin.from("social_advocates").insert({
        user_id: userId,
        name: fullName,
        email: emailLower,
        phone: phone?.trim() || null,
        is_active: true,
      });
      if (error) profileInsertError = error.message;
      break;
    }
    case "trainee": {
      const { error } = await admin.from("trainees").insert({
        user_id: userId,
        name: fullName,
        email: emailLower,
        phone: phone?.trim() || null,
        training_status: "in_progress",
      });
      if (error) profileInsertError = error.message;
      break;
    }
    default:
      // Unknown role — we still created the auth user; profile insertion is best-effort
      break;
  }

  if (profileInsertError) {
    // Auth user was created but profile failed — attempt to clean up auth user
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: `Account setup failed: ${profileInsertError}` },
      { status: 500 }
    );
  }

  // Handle parent_diviner_id relationship if present in metadata
  if (metadata.parent_diviner_id && typeof metadata.parent_diviner_id === "string") {
    await admin.from("user_relationships").insert({
      parent_user_id: metadata.parent_diviner_id,
      child_user_id: userId,
      relationship_type: "diviner_client",
      status: "active",
      active_from: new Date().toISOString(),
      created_by: null,
    });
  }

  // 6. Mark invitation accepted
  await admin
    .from("invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", invitation.id);

  // 7. Log security event
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;

  await admin.from("user_security_events").insert({
    user_id: userId,
    event_type: "invite_accepted",
    ip_address: ipAddress,
    device_info: req.headers.get("user-agent") ?? null,
    metadata: { invitation_id: invitation.id, role_slug: invitation.role_slug },
    actor_user_id: null,
  });

  return NextResponse.json({
    success: true,
    message: "Account created. Please log in.",
  });
}
