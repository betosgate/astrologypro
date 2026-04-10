import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── POST /api/admin/users — Create a new user directly ─────────────────────

interface CreateUserBody {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  zip: string;
  gender: string;
  password: string;
  user_type: string;
  bio?: string;
  is_active?: boolean;
}

const VALID_USER_TYPES = [
  "admin",
  "diviner",
  "client",
  "advocate",
  "trainee",
  "community_mystery_school",
  "community_perennial_mandalism",
];

export async function POST(req: Request) {
  // Verify caller is admin
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as CreateUserBody;

  // ── Server-side validation ──────────────────────────────────────────────
  const {
    first_name,
    last_name,
    email,
    phone,
    state,
    city,
    zip,
    gender,
    password,
    user_type,
    bio,
    is_active,
  } = body;

  if (!first_name?.trim() || !last_name?.trim()) {
    return NextResponse.json({ error: "First name and last name are required" }, { status: 422 });
  }
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 422 });
  }
  if (!phone?.trim()) {
    return NextResponse.json({ error: "Phone is required" }, { status: 422 });
  }
  if (!state || !city?.trim() || !zip?.trim()) {
    return NextResponse.json({ error: "State, city, and zip are required" }, { status: 422 });
  }
  if (!gender) {
    return NextResponse.json({ error: "Gender is required" }, { status: 422 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 422 });
  }
  if (!user_type || !VALID_USER_TYPES.includes(user_type)) {
    return NextResponse.json({ error: "Invalid user type" }, { status: 422 });
  }

  const admin = createAdminClient();
  const fullName = `${first_name.trim()} ${last_name.trim()}`;

  // ── Step 1: Create auth user via Supabase Admin API ─────────────────────
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true, // Skip email confirmation — admin-created
    user_metadata: {
      name: fullName,
      role: user_type,
      created_by_admin: true,
    },
  });

  if (authError) {
    // Supabase returns specific message for duplicate emails
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const userId = authData.user.id;

  // ── Step 2: Create profile record in the appropriate role table ──────────
  try {
    if (user_type === "admin") {
      // Admin users are tracked in admin_users — no separate profile table.
      // The table schema only has user_id, email, granted_by — no name column.
      await admin.from("admin_users").insert({
        user_id: userId,
        email: email.trim().toLowerCase(),
        granted_by: adminUser.email ?? "admin",
      });
    } else if (user_type === "diviner") {
      await admin.from("diviners").insert({
        user_id: userId,
        display_name: fullName,
        phone: phone.trim(),
        state,
        city: city.trim(),
        zip: zip.trim(),
        gender,
        bio: bio?.trim() || null,
        is_active: is_active !== false,
      });
    } else if (user_type === "client") {
      await admin.from("clients").insert({
        user_id: userId,
        full_name: fullName,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        state,
        city: city.trim(),
        zip: zip.trim(),
        gender,
        bio: bio?.trim() || null,
      });
    } else if (user_type === "advocate") {
      await admin.from("social_advocates").insert({
        user_id: userId,
        name: fullName,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        state,
        city: city.trim(),
        zip: zip.trim(),
        gender,
        is_active: is_active !== false,
      });
    } else if (user_type === "trainee") {
      await admin.from("trainees").insert({
        user_id: userId,
        name: fullName,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        state,
        city: city.trim(),
        zip: zip.trim(),
        gender,
        bio: bio?.trim() || null,
        training_status: "in_progress",
      });
    } else if (user_type === "community_mystery_school" || user_type === "community_perennial_mandalism") {
      const membershipType = user_type === "community_mystery_school" ? "mystery_school" : "perennial_mandalism";
      await admin.from("community_members").insert({
        user_id: userId,
        full_name: fullName,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        state,
        city: city.trim(),
        zip: zip.trim(),
        gender,
        membership_type: membershipType,
        membership_status: is_active !== false ? "active" : "inactive",
      });
    }

    // ── Audit trail ─────────────────────────────────────────────────────────
    await admin.from("admin_user_notes").insert({
      user_id: userId,
      note: `User created by admin (${adminUser.email}). Role: ${user_type}`,
      role: user_type.startsWith("community_") ? "community" : user_type,
      created_by: adminUser.email ?? "admin",
    });

    return NextResponse.json({ id: userId }, { status: 201 });
  } catch (err) {
    // If profile creation fails, clean up the auth user to avoid orphans
    await admin.auth.admin.deleteUser(userId);
    const message = err instanceof Error ? err.message : "Failed to create profile record";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
