import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/diviner-signup
 *
 * Creates an unverified Supabase auth user + a trainees row for a Professional
 * Divination Course signup. Caller is the public diviner-signup page.
 *
 * This endpoint deliberately does NOT collect a payment — payment integration
 * is handled by a separate Stripe step (see diviner-signup task 03). This
 * route only registers the user and returns the new user_id so the caller
 * can proceed to create a payment intent.
 *
 * Body:
 *   {
 *     first_name, last_name, email, phone, password,
 *     city, country, state, zip,
 *     affiliate_id?
 *   }
 *
 * Response (201): { user_id, email }
 * Response (400/422): { error }
 * Response (409): { error: "An account with this email already exists" }
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const firstName = String(body.first_name ?? "").trim();
  const lastName = String(body.last_name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const password = String(body.password ?? "");
  const city = String(body.city ?? "").trim();
  const country = String(body.country ?? "").trim();
  const state = String(body.state ?? "").trim();
  const zip = String(body.zip ?? "").trim();
  const affiliateId =
    typeof body.affiliate_id === "string" && body.affiliate_id.trim()
      ? body.affiliate_id.trim()
      : null;

  // Required-field check
  if (!firstName || !lastName) {
    return NextResponse.json(
      { error: "First and last name are required" },
      { status: 422 },
    );
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "A valid email address is required" },
      { status: 422 },
    );
  }
  if (!phone) {
    return NextResponse.json({ error: "Phone is required" }, { status: 422 });
  }
  // Per the spec: 8-15 chars, mixed case, digit, special character
  if (!/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).{8,15}$/.test(password)) {
    return NextResponse.json(
      {
        error:
          "Password must be 8-15 characters and include uppercase, lowercase, a digit, and one of @#$%^&+=",
      },
      { status: 422 },
    );
  }
  if (!country || !city || !zip) {
    return NextResponse.json(
      { error: "City, country, and zip are required" },
      { status: 422 },
    );
  }

  const admin = createAdminClient();

  // Create the auth user. email_confirm=true so the user can sign in
  // immediately after payment (admin-managed account; the user did not need
  // to verify their email to complete checkout).
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
      phone,
      affiliate_id: affiliateId,
    },
  });

  if (authError || !authData?.user) {
    const msg = authError?.message ?? "Failed to create account";
    if (/already (registered|exists)|User already/i.test(msg)) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }
    console.error("[diviner-signup] auth.admin.createUser:", authError);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const userId = authData.user.id;

  // Create the trainee row. Best-effort — if this fails the auth user still
  // exists; the operator can clean up via /admin/users.
  const { error: traineeError } = await admin
    .from("trainees")
    .insert({
      user_id: userId,
      email,
      name: `${firstName} ${lastName}`,
      phone,
      country,
      state,
      city,
      zip,
      training_status: "enrolled",
      enrolled_at: new Date().toISOString(),
      affiliate_id: affiliateId,
    });

  if (traineeError) {
    console.error("[diviner-signup] trainees.insert:", traineeError);
    // Don't 500 — the auth user is created and the operator can repair the
    // trainees row from /admin/users. Surface a warning to the client so the
    // signup page can decide whether to proceed to payment.
  }

  return NextResponse.json(
    { user_id: userId, email, trainee_warning: traineeError?.message ?? null },
    { status: 201 },
  );
}
