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

async function usernameExists(admin: ReturnType<typeof createAdminClient>, username: string) {
  const [diviners, trainees, advocates] = await Promise.all([
    admin.from("diviners").select("id", { head: true, count: "exact" }).eq("username", username),
    admin.from("trainees").select("id", { head: true, count: "exact" }).eq("username", username),
    admin
      .from("social_advocates")
      .select("id", { head: true, count: "exact" })
      .eq("username", username),
  ]);

  return Boolean(
    (diviners.count ?? 0) > 0 ||
      (trainees.count ?? 0) > 0 ||
      (advocates.count ?? 0) > 0,
  );
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
  const planId = String(body.planId ?? "").trim();
  const affiliateCode = String(body.affiliateCode ?? "").trim();
  const isCombo = Boolean(body.isCombo);
  const role = String(body.role ?? "diviner").trim();

  if (!name || !email || !password || !username || !planId) {
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
          "Username must be 3-30 characters, use lowercase letters, numbers, and hyphens, and start/end with a letter or number.",
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

  if (!["diviner", "trainee", "perennial_mandalism"].includes(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 422 });
  }

  if (await usernameExists(admin, username)) {
    return NextResponse.json(
      { error: "That public URL is already taken. Please choose another one." },
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
      role,
      plan: planId,
      isCombo,
      ...(affiliateCode ? { affiliateCode } : {}),
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

    console.error("[get-started/signup] admin.createUser failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json(
    {
      userId: data.user.id,
      email,
    },
    { status: 201 },
  );
}
