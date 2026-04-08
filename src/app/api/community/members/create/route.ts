import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/community/members/create
 *
 * Creates a new Perennial Mandalism family/community member record linked to
 * the authenticated user's community membership.
 *
 * Required: firstname, lastname, email
 * Optional: all intake questionnaire fields stored in intake_data JSONB
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const {
      relation_type,
      firstname,
      lastname,
      email,
      phone,
      gender,
      relationship_status,
      state,
      city,
      zip,
      address,
      // intake questionnaire fields
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
      additional_info,
      status,
    } = body;

    // Required field validation
    if (!firstname || typeof firstname !== "string" || !String(firstname).trim()) {
      return NextResponse.json({ error: "First name is required." }, { status: 422 });
    }
    if (!lastname || typeof lastname !== "string" || !String(lastname).trim()) {
      return NextResponse.json({ error: "Last name is required." }, { status: 422 });
    }
    if (!email || typeof email !== "string" || !String(email).trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 422 });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 422 });
    }

    const admin = createAdminClient();

    // Verify the authenticated user has an active community membership
    const { data: member } = await admin
      .from("community_members")
      .select("id, membership_status, plan_type")
      .eq("user_id", user.id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: "No community membership found." },
        { status: 404 }
      );
    }

    // Collect intake questionnaire fields into JSONB
    const intakeData = {
      personality: personality ?? null,
      strengths: strengths ?? null,
      lifeAreasFulfilling: lifeAreasFulfilling ?? null,
      lifeAreasImprovement: lifeAreasImprovement ?? null,
      longTermGoals: longTermGoals ?? null,
      majorLifeEvents: majorLifeEvents ?? null,
      relationship_with_family: relationship_with_family ?? null,
      biggest_current_challenges: biggest_current_challenges ?? null,
      mainConcern: mainConcern ?? null,
      additionalInfo: additionalInfo ?? null,
      achieveFromReading: achieveFromReading ?? null,
      focus_on_specific_relationships: focus_on_specific_relationships ?? null,
      stressManagement: stressManagement ?? null,
      workLifeBalance: workLifeBalance ?? null,
      concerns_about_romantic_life: concerns_about_romantic_life ?? null,
      social_life_fulfillment: social_life_fulfillment ?? null,
      spiritualPractices: spiritualPractices ?? null,
      guidance_on_specific_decision: guidance_on_specific_decision ?? null,
      ongoing_projects_or_plans: ongoing_projects_or_plans ?? null,
      selfDiscovery: selfDiscovery ?? null,
      externalInfluences: externalInfluences ?? null,
      specificQuestions: specificQuestions ?? null,
      goalsOutcomes: goalsOutcomes ?? null,
      additional_info: additional_info ?? null,
    };

    const fullName = `${String(firstname).trim()} ${String(lastname).trim()}`;

    const { data: newMember, error: insertError } = await admin
      .from("community_members")
      .insert({
        full_name: fullName,
        first_name: String(firstname).trim(),
        last_name: String(lastname).trim(),
        email: String(email).trim().toLowerCase(),
        phone: phone ? String(phone).trim() : null,
        gender: gender ? String(gender).trim() : null,
        relationship_status: relationship_status ? String(relationship_status).trim() : null,
        relation_type: relation_type ? String(relation_type).trim() : null,
        state: state ? String(state).trim() : null,
        city: city ? String(city).trim() : null,
        zip: zip ? String(zip).trim() : null,
        address: address ? String(address).trim() : null,
        intake_data: Object.keys(intakeData).some((k) => intakeData[k as keyof typeof intakeData] !== null)
          ? intakeData
          : null,
        membership_type: "perennial_mandalism",
        membership_status: status === "active" ? "active" : "pending",
        plan_type: member.plan_type ?? "individual",
        joined_at: new Date().toISOString(),
      })
      .select("id, full_name, email")
      .single();

    if (insertError) {
      console.error("[community/members/create] insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ member: newMember }, { status: 201 });
  } catch (err) {
    console.error("[community/members/create] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 }
    );
  }
}
