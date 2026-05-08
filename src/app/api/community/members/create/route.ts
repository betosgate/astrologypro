import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/community/members/create
 *
 * Creates a new family member record linked to the authenticated user's
 * community membership.
 *
 * Required: firstname, lastname, email, date_of_birth
 * Optional: contact/intake fields are stored as notes metadata where the
 * family-member table has no dedicated column.
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
      date_of_birth,
      birth_time,
      birth_city,
      birth_country,
      birth_lat,
      birth_lng,
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
      notes,
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
    if (
      !date_of_birth ||
      typeof date_of_birth !== "string" ||
      !String(date_of_birth).trim()
    ) {
      return NextResponse.json({ error: "Date of birth is required." }, { status: 422 });
    }

    // Basic email format check
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 422 });
    }

    const phoneDigits = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
    if (phoneDigits && phoneDigits.length !== 10) {
      return NextResponse.json({ error: "Phone must be a 10-digit number." }, { status: 422 });
    }

    const admin = createAdminClient();

    // Verify the authenticated user has an active community membership
    const { data: member } = await admin
      .from("community_members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: "No community membership found." },
        { status: 404 }
      );
    }

    const fullName = `${String(firstname).trim()} ${String(lastname).trim()}`;
    const trimmedDateOfBirth = String(date_of_birth).trim();
    const dob = new Date(trimmedDateOfBirth);
    if (Number.isNaN(dob.getTime())) {
      return NextResponse.json({ error: "Invalid date of birth." }, { status: 422 });
    }

    const ageYears =
      (new Date().getTime() - dob.getTime()) / (365.25 * 24 * 3600 * 1000);
    const ageGroup = ageYears < 14 ? "child" : "adult";

    const lat =
      birth_lat == null || birth_lat === ""
        ? null
        : Number.isFinite(Number(birth_lat))
          ? Number(birth_lat)
          : null;
    const lng =
      birth_lng == null || birth_lng === ""
        ? null
        : Number.isFinite(Number(birth_lng))
          ? Number(birth_lng)
          : null;

    const optionalLines = [
      notes ? `Notes: ${String(notes).trim()}` : "",
      phoneDigits ? `Phone: ${phoneDigits}` : "",
      gender ? `Gender: ${String(gender).trim()}` : "",
      relationship_status
        ? `Relationship status: ${String(relationship_status).trim()}`
        : "",
      address ? `Address: ${String(address).trim()}` : "",
      city ? `City: ${String(city).trim()}` : "",
      state ? `State: ${String(state).trim()}` : "",
      zip ? `ZIP: ${String(zip).trim()}` : "",
      personality ? `Personality: ${String(personality).trim()}` : "",
      strengths ? `Strengths: ${String(strengths).trim()}` : "",
      lifeAreasFulfilling
        ? `Life areas fulfilling: ${String(lifeAreasFulfilling).trim()}`
        : "",
      lifeAreasImprovement
        ? `Life areas for improvement: ${String(lifeAreasImprovement).trim()}`
        : "",
      longTermGoals ? `Long-term goals: ${String(longTermGoals).trim()}` : "",
      majorLifeEvents
        ? `Major life events: ${String(majorLifeEvents).trim()}`
        : "",
      relationship_with_family
        ? `Relationship with family: ${String(relationship_with_family).trim()}`
        : "",
      biggest_current_challenges
        ? `Biggest current challenges: ${String(biggest_current_challenges).trim()}`
        : "",
      mainConcern ? `Main concern: ${String(mainConcern).trim()}` : "",
      additionalInfo ? `Additional info: ${String(additionalInfo).trim()}` : "",
      achieveFromReading
        ? `Reading goal: ${String(achieveFromReading).trim()}`
        : "",
      focus_on_specific_relationships
        ? `Relationship focus: ${String(focus_on_specific_relationships).trim()}`
        : "",
      stressManagement
        ? `Stress management: ${String(stressManagement).trim()}`
        : "",
      workLifeBalance
        ? `Work-life balance: ${String(workLifeBalance).trim()}`
        : "",
      concerns_about_romantic_life
        ? `Romantic concerns: ${String(concerns_about_romantic_life).trim()}`
        : "",
      social_life_fulfillment
        ? `Social life fulfillment: ${String(social_life_fulfillment).trim()}`
        : "",
      spiritualPractices
        ? `Spiritual practices: ${String(spiritualPractices).trim()}`
        : "",
      guidance_on_specific_decision
        ? `Decision guidance: ${String(guidance_on_specific_decision).trim()}`
        : "",
      ongoing_projects_or_plans
        ? `Ongoing projects/plans: ${String(ongoing_projects_or_plans).trim()}`
        : "",
      selfDiscovery ? `Self-discovery: ${String(selfDiscovery).trim()}` : "",
      externalInfluences
        ? `External influences: ${String(externalInfluences).trim()}`
        : "",
      specificQuestions
        ? `Specific questions: ${String(specificQuestions).trim()}`
        : "",
      goalsOutcomes ? `Goals/outcomes: ${String(goalsOutcomes).trim()}` : "",
      additional_info ? `Additional notes: ${String(additional_info).trim()}` : "",
      status ? `Status: ${String(status).trim()}` : "",
    ].filter(Boolean);

    const { data: newMember, error: insertError } = await admin
      .from("community_family_members")
      .insert({
        member_id: member.id,
        full_name: fullName,
        date_of_birth: trimmedDateOfBirth,
        birth_time:
          typeof birth_time === "string" && birth_time.trim()
            ? birth_time.trim()
            : null,
        birth_city:
          typeof birth_city === "string" && birth_city.trim()
            ? birth_city.trim()
            : null,
        birth_country:
          typeof birth_country === "string" && birth_country.trim()
            ? birth_country.trim()
            : null,
        birth_lat: lat,
        birth_lng: lng,
        relationship:
          typeof relation_type === "string" && relation_type.trim()
            ? relation_type.trim()
            : null,
        notes: optionalLines.length ? optionalLines.join("\n") : null,
        age_group: ageGroup,
        invite_email: normalizedEmail,
      })
      .select("id, full_name, invite_email")
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
