import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username: string) {
  if (username.length < 3 || username.length > 30) return false;
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(username);
}

function isValidPassword(password: string) {
  return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/.test(
    password,
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function generateCode(name: string) {
  return (slugify(name).slice(0, 8) + Math.random().toString(36).slice(2, 6))
    .slice(0, 12)
    .toUpperCase();
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const name = String(body.name ?? "").trim();
  const username = String(body.username ?? "").trim().toLowerCase();

  if (!name || !email || !password || !username) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 422 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 422 },
    );
  }

  if (!isValidUsername(username)) {
    return NextResponse.json(
      {
        error:
          "Username must be 3-30 characters, use lowercase letters, numbers, and hyphens, and start and end with a letter or number.",
      },
      { status: 422 },
    );
  }

  if (!isValidPassword(password)) {
    return NextResponse.json(
      {
        error:
          "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.",
      },
      { status: 422 },
    );
  }

  const admin = createAdminClient();

  const { count: existingUsernameCount } = await admin
    .from("social_advocates")
    .select("id", { count: "exact", head: true })
    .eq("username", username);

  if ((existingUsernameCount ?? 0) > 0) {
    return NextResponse.json(
      { error: "That advocate username is already taken." },
      { status: 409 },
    );
  }

  const { count: existingEmailCount } = await admin
    .from("social_advocates")
    .select("id", { count: "exact", head: true })
    .eq("email", email);

  if ((existingEmailCount ?? 0) > 0) {
    return NextResponse.json(
      { error: "An advocate account with this email already exists." },
      { status: 409 },
    );
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      full_name: name,
      username,
      role: "social_advo",
    },
  });

  if (error || !data.user) {
    const message = error?.message ?? "Failed to create account";
    if (/already (registered|exists)|User already/i.test(message)) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { error: insertError } = await admin.from("social_advocates").insert({
    user_id: data.user.id,
    name,
    email,
    username,
    referral_code: generateCode(name),
    onboarding_completed: true,
    is_active: true,
  });

  if (insertError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return NextResponse.json(
      { error: "Could not create advocate profile." },
      { status: 500 },
    );
  }

  return NextResponse.json({ userId: data.user.id, email }, { status: 201 });
}
