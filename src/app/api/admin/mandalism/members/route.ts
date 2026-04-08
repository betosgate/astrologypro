import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/mandalism/members
 * List community_members with membership_type = perennial_mandalism.
 */
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const search = sp.get("search") ?? "";
  const status = sp.get("status") ?? "";

  const admin = createAdminClient();
  let query = admin
    .from("community_members")
    .select("*")
    .eq("membership_type", "perennial_mandalism")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("membership_status", status);
  if (search) {
    query = query.or(
      `email.ilike.%${search}%,full_name.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/**
 * POST /api/admin/mandalism/members
 * Create a new perennial mandalism member.
 * Optionally creates an auth user if password is provided.
 */
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    first_name,
    last_name,
    email,
    phone,
    state,
    city,
    zip,
    address,
    gender,
    date_of_birth,
    birth_time,
    birth_city,
    relationship_status,
    relation_type,
    membership_type,
    notes,
    password,
    confirmpassword,
    // Questionnaire fields go into intake_data JSONB
    personality,
    strengths,
    lifeAreasFulfilling,
    lifeAreasImprovement,
    longTermGoals,
    majorLifeEvents,
    relationship_with_family,
    biggest_current_challenges,
    mainConcern,
    additionalInfo,
    achieveFromReading,
    additional_info,
    focus_on_specific_relationships,
    stressManagement,
    workLifeBalance,
    concerns_about_romantic_life,
    social_life_fulfillment,
    spiritualPractices,
    guidance_on_specific_decision,
    ongoing_projects_or_plans,
    selfDiscovery,
    externalInfluences,
    specificQuestions,
    goalsOutcomes,
  } = body;

  // Validation
  if (!first_name?.trim()) {
    return NextResponse.json(
      { error: "First name is required" },
      { status: 422 }
    );
  }
  if (!last_name?.trim()) {
    return NextResponse.json(
      { error: "Last name is required" },
      { status: 422 }
    );
  }
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 422 });
  }

  if (password && password !== confirmpassword) {
    return NextResponse.json(
      { error: "Passwords do not match" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // If password provided, create an auth user
  let userId: string;
  if (password) {
    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email: email.trim(),
        password,
        email_confirm: true,
        user_metadata: {
          full_name: `${first_name.trim()} ${last_name.trim()}`,
          first_name: first_name.trim(),
          last_name: last_name.trim(),
        },
      });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }
    userId = authData.user.id;
  } else {
    // Create a user without password (invite-style)
    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email: email.trim(),
        email_confirm: true,
        user_metadata: {
          full_name: `${first_name.trim()} ${last_name.trim()}`,
          first_name: first_name.trim(),
          last_name: last_name.trim(),
        },
      });

    if (authError) {
      // If user already exists, try to find them
      if (
        authError.message.includes("already been registered") ||
        authError.message.includes("already exists")
      ) {
        const { data: existingUsers } =
          await admin.auth.admin.listUsers();
        const existing = existingUsers?.users?.find(
          (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
        );
        if (existing) {
          userId = existing.id;
        } else {
          return NextResponse.json(
            { error: authError.message },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: authError.message },
          { status: 400 }
        );
      }
    } else {
      userId = authData.user.id;
    }
  }

  // Build intake_data from questionnaire fields
  const intakeData: Record<string, unknown> = {};
  const questionnaireFields: Record<string, unknown> = {
    personality,
    strengths,
    lifeAreasFulfilling,
    lifeAreasImprovement,
    longTermGoals,
    majorLifeEvents,
    relationship_with_family,
    biggest_current_challenges,
    mainConcern,
    additionalInfo,
    achieveFromReading,
    additional_info,
    focus_on_specific_relationships,
    stressManagement,
    workLifeBalance,
    concerns_about_romantic_life,
    social_life_fulfillment,
    spiritualPractices,
    guidance_on_specific_decision,
    ongoing_projects_or_plans,
    selfDiscovery,
    externalInfluences,
    specificQuestions,
    goalsOutcomes,
  };

  for (const [key, val] of Object.entries(questionnaireFields)) {
    if (val !== undefined && val !== null && val !== "") {
      intakeData[key] = val;
    }
  }

  const fullName = `${first_name.trim()} ${last_name.trim()}`;
  const membershipTypeValue =
    membership_type === "family" ? "perennial_mandalism" : "perennial_mandalism";

  // Check if member record already exists
  const { data: existingMember } = await admin
    .from("community_members")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingMember) {
    return NextResponse.json(
      { error: "A community member record already exists for this user" },
      { status: 409 }
    );
  }

  const { data, error } = await admin
    .from("community_members")
    .insert({
      user_id: userId,
      email: email.trim(),
      full_name: fullName,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone: phone?.trim() || null,
      state: state?.trim() || null,
      city: city?.trim() || null,
      zip: zip?.trim() || null,
      address: address?.trim() || null,
      gender: gender || null,
      date_of_birth: date_of_birth || null,
      birth_time: birth_time || null,
      birth_city: birth_city?.trim() || null,
      relationship_status: relationship_status || null,
      relation_type: relation_type || null,
      membership_type: membershipTypeValue,
      membership_status: "active",
      plan_type: membership_type === "family" ? "family" : "individual",
      notes: notes?.trim() || null,
      intake_data: Object.keys(intakeData).length > 0 ? intakeData : null,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
