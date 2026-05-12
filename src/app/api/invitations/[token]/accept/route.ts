import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getInvitedRoleDestination } from "@/lib/invite-destinations";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

const PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_ERROR =
  "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function buildUsername(fullName: string, userId: string, fallbackPrefix: string) {
  const base = slugify(fullName) || fallbackPrefix;
  return `${base}-${userId.slice(0, 6)}`;
}

function buildReferralCode(fullName: string, userId: string) {
  const prefix = slugify(fullName).replace(/-/g, "").toUpperCase().slice(0, 8);
  return `${prefix || "ADVOCATE"}${userId.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

function normalizeInvitationRole(roleSlug: string) {
  if (roleSlug === "advocate") return "social_advo";
  if (roleSlug === "community_perennial_mandalism") return "perennial_mandalism";
  if (roleSlug === "community_mystery_school") return "mystery_school";
  return roleSlug;
}

function getAcceptedInvitationDestination(roleSlug: string) {
  const normalizedRole = normalizeInvitationRole(roleSlug);
  if (normalizedRole === "admin") return "/admin";
  if (normalizedRole === "trainee") return "/join/trainee/plan?invited=true";
  if (normalizedRole === "social_advo") return "/advocate";
  if (normalizedRole === "mystery_school") return "/join/mystery-school?invited=true";
  return getInvitedRoleDestination(normalizedRole);
}

function normalizeOptionalPhone(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;

  const compact = trimmed.replace(/[\s().-]/g, "");
  if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact;

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return digits;

  return undefined;
}

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

  if (!PASSWORD_REGEX.test(password)) {
    return NextResponse.json(
      { error: PASSWORD_ERROR },
      { status: 422 }
    );
  }

  const normalizedPhone = normalizeOptionalPhone(phone);
  if (normalizedPhone === undefined) {
    return NextResponse.json(
      { error: "Phone must be a valid E.164 number or a 10-digit number." },
      { status: 422 }
    );
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();

  // 1. Look up invitation by token_hash
  const { data: invitation, error: invErr } = await admin
    .from("invitations")
    .select("id, email, role_slug, status, expires_at, metadata, invited_by")
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
      invited_by_admin: true,
      invitation_id: invitation.id,
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
    case "admin": {
      const { error } = await admin.from("admin_users").insert({
        user_id: userId,
        email: emailLower,
        granted_by: invitation.invited_by ? `invitation:${invitation.invited_by}` : "invitation",
      });
      if (error) profileInsertError = error.message;
      break;
    }
    case "diviner": {
      const { error } = await admin.from("diviners").insert({
        user_id: userId,
        display_name: fullName,
        phone: normalizedPhone,
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
        phone: normalizedPhone,
      });
      if (error) profileInsertError = error.message;
      break;
    }
    case "social_advo":
    case "advocate": {
      const username = buildUsername(fullName, userId, "advocate");
      const { error } = await admin.from("social_advocates").insert({
        user_id: userId,
        name: fullName,
        email: emailLower,
        phone: normalizedPhone,
        username,
        referral_code: buildReferralCode(fullName, userId),
        onboarding_completed: true,
        is_active: true,
      });
      if (error) profileInsertError = error.message;
      break;
    }
    case "trainee": {
      const username = buildUsername(fullName, userId, "trainee");
      const { error } = await admin.from("trainees").insert({
        user_id: userId,
        name: fullName,
        email: emailLower,
        username,
        phone: normalizedPhone,
        training_status: "active",
        onboarding_completed: false,
      });
      if (error) profileInsertError = error.message;
      break;
    }
    case "community_perennial_mandalism": {
      const { error } = await admin.from("community_members").insert({
        user_id: userId,
        full_name: fullName,
        email: emailLower,
        phone: normalizedPhone,
        membership_type: "perennial_mandalism",
        membership_status: "active",
        plan_type: "individual",
        joined_at: new Date().toISOString(),
        onboarding_completed: false,
      });
      if (error) profileInsertError = error.message;
      break;
    }
    case "community_mystery_school": {
      // Mystery School access is payment-backed by mystery_school_students.
      // Account creation succeeds here; enrollment continues on the MS join flow.
      break;
    }
    default:
      profileInsertError = `Unsupported invitation role '${invitation.role_slug}'`;
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
    userId,
    email: emailLower,
    roleSlug: invitation.role_slug,
    next: getAcceptedInvitationDestination(invitation.role_slug),
  });
}
