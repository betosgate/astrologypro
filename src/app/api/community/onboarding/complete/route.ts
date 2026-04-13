import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/community/onboarding/complete
 *
 * Saves new-member onboarding profile data to the authenticated user's
 * community_members row. Uses the same field set as the perennial-signup
 * page: required core fields (first_name, last_name, email, phone, gender,
 * state, city, zip, address, occupation, date_of_birth, birth_time) plus
 * the full 25-field optional questionnaire.
 *
 * Core fields go into dedicated columns where they exist; everything else
 * goes into the intake_data JSONB column.
 *
 * Uses `first_name IS NOT NULL` as the onboarding-complete flag so no
 * schema migration is required.
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
      first_name,
      last_name,
      email,
      phone,
      gender,
      state,
      city,
      zip,
      address,
      occupation,
      date_of_birth,
      birth_time,
      // Optional questionnaire (25 fields)
      relationship_status,
      personality,
      strengths,
      lifeAreasFulfilling,
      lifeAreasImprovement,
      longTermGoals,
      majorLifeEvents,
      stressManagement,
      workLifeBalance,
      relationship_with_family,
      biggest_current_challenges,
      focus_on_specific_relationships,
      guidance_on_specific_decision,
      concerns_about_romantic_life,
      ongoing_projects_or_plans,
      social_life_fulfillment,
      spiritualPractices,
      selfDiscovery,
      externalInfluences,
      achieveFromReading,
      specificQuestions,
      goalsOutcomes,
      practicalSpiritualPref,
      mainConcern,
      additionalInfo,
    } = body;

    // ── Validation (matches perennial-signup required fields) ───────────────
    const trimStr = (v: unknown) =>
      v && typeof v === "string" ? v.trim() || null : null;

    if (!first_name || typeof first_name !== "string" || !String(first_name).trim()) {
      return NextResponse.json({ error: "First name is required." }, { status: 422 });
    }
    if (!last_name || typeof last_name !== "string" || !String(last_name).trim()) {
      return NextResponse.json({ error: "Last name is required." }, { status: 422 });
    }
    const emailVal = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 422 });
    }
    const phoneDigits = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
    if (phoneDigits.length !== 10) {
      return NextResponse.json({ error: "Phone must be a 10-digit number." }, { status: 422 });
    }
    if (!gender || typeof gender !== "string") {
      return NextResponse.json({ error: "Gender is required." }, { status: 422 });
    }
    if (!state || typeof state !== "string" || !String(state).trim()) {
      return NextResponse.json({ error: "State is required." }, { status: 422 });
    }
    if (!city || typeof city !== "string" || !String(city).trim()) {
      return NextResponse.json({ error: "City is required." }, { status: 422 });
    }
    const zipVal = typeof zip === "string" ? zip.trim() : "";
    if (!/^\d{5}$/.test(zipVal)) {
      return NextResponse.json({ error: "Zip must be exactly 5 digits." }, { status: 422 });
    }
    if (!address || typeof address !== "string" || !String(address).trim()) {
      return NextResponse.json({ error: "Address is required." }, { status: 422 });
    }
    if (!occupation || typeof occupation !== "string" || !String(occupation).trim()) {
      return NextResponse.json({ error: "Occupation is required." }, { status: 422 });
    }
    if (!date_of_birth || typeof date_of_birth !== "string") {
      return NextResponse.json({ error: "Date of birth is required." }, { status: 422 });
    }
    if (!birth_time || typeof birth_time !== "string") {
      return NextResponse.json({ error: "Birth time is required." }, { status: 422 });
    }

    const admin = createAdminClient();

    // Verify authenticated user has an active PM membership
    const { data: member, error: memberErr } = await admin
      .from("community_members")
      .select("id, membership_status, membership_type")
      .eq("user_id", user.id)
      .eq("membership_type", "perennial_mandalism")
      .maybeSingle();

    if (memberErr) {
      console.error("[onboarding/complete] member lookup error:", memberErr);
      return NextResponse.json({ error: "Failed to verify membership." }, { status: 500 });
    }

    if (!member) {
      return NextResponse.json(
        { error: "No active Perennial Mandalism membership found." },
        { status: 404 }
      );
    }

    if (member.membership_status !== "active") {
      return NextResponse.json(
        { error: "Your membership is not active." },
        { status: 403 }
      );
    }

    // ── Build update payload ──────────────────────────────────────────────────
    const fullName = `${String(first_name).trim()} ${String(last_name).trim()}`;

    // intake_data stores the full optional questionnaire + any core fields
    // that don't have dedicated columns (occupation, birth location data).
    const intakeData: Record<string, unknown> = {
      occupation: trimStr(occupation),
      // Questionnaire (25 fields)
      relationship_status: trimStr(relationship_status),
      personality: trimStr(personality),
      strengths: trimStr(strengths),
      lifeAreasFulfilling: trimStr(lifeAreasFulfilling),
      lifeAreasImprovement: trimStr(lifeAreasImprovement),
      longTermGoals: trimStr(longTermGoals),
      majorLifeEvents: trimStr(majorLifeEvents),
      stressManagement: trimStr(stressManagement),
      workLifeBalance: trimStr(workLifeBalance),
      relationship_with_family: trimStr(relationship_with_family),
      biggest_current_challenges: trimStr(biggest_current_challenges),
      focus_on_specific_relationships: trimStr(focus_on_specific_relationships),
      guidance_on_specific_decision: trimStr(guidance_on_specific_decision),
      concerns_about_romantic_life: trimStr(concerns_about_romantic_life),
      ongoing_projects_or_plans: trimStr(ongoing_projects_or_plans),
      social_life_fulfillment: trimStr(social_life_fulfillment),
      spiritualPractices: trimStr(spiritualPractices),
      selfDiscovery: trimStr(selfDiscovery),
      externalInfluences: trimStr(externalInfluences),
      achieveFromReading: trimStr(achieveFromReading),
      specificQuestions: trimStr(specificQuestions),
      goalsOutcomes: trimStr(goalsOutcomes),
      practicalSpiritualPref: trimStr(practicalSpiritualPref),
      mainConcern: trimStr(mainConcern),
      additionalInfo: trimStr(additionalInfo),
    };

    // Merge with any existing intake_data to preserve provisioning-time data
    // (e.g. birth_location_label, birth_lat, birth_lng, birth_tzone,
    //  household_primary_email, etc.)
    const { data: existingRow } = await admin
      .from("community_members")
      .select("intake_data")
      .eq("id", member.id)
      .single();

    const existingIntake =
      existingRow?.intake_data && typeof existingRow.intake_data === "object"
        ? existingRow.intake_data
        : {};

    const mergedIntake = { ...existingIntake, ...intakeData };

    const updatePayload: Record<string, unknown> = {
      first_name: String(first_name).trim(),
      last_name: String(last_name).trim(),
      full_name: fullName,
      email: emailVal,
      phone: String(phone).trim(),
      gender: trimStr(gender),
      date_of_birth: trimStr(date_of_birth),
      birth_time: trimStr(birth_time),
      address: trimStr(address),
      city: trimStr(city),
      state: trimStr(state),
      zip: zipVal,
      relationship_status: trimStr(relationship_status),
      intake_data: mergedIntake,
    };

    // ── Persist ───────────────────────────────────────────────────────────────
    const { error: updateError } = await admin
      .from("community_members")
      .update(updatePayload)
      .eq("id", member.id);

    if (updateError) {
      console.error("[onboarding/complete] update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[onboarding/complete] POST error:", err);
    return NextResponse.json(
      { error: "Failed to complete onboarding." },
      { status: 500 }
    );
  }
}
