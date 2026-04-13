import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncProfileAcrossRoles } from "@/lib/profile-sync";

export const dynamic = "force-dynamic";

type FamilyMemberInput = {
  id?: string;
  full_name?: string;
  relationship?: string;
  date_of_birth?: string;
  birth_time?: string | null;
  birth_city?: string | null;
  birth_country?: string | null;
  notes?: string | null;
};

const HOUSEHOLD_LIMITS: Record<string, number> = {
  plan_pm_individual: 0,
  plan_pm_couple: 1,
  plan_pm_family: 4,
};

function trimStr(value: unknown): string | null {
  return value && typeof value === "string" ? value.trim() || null : null;
}

function getHouseholdLimit(
  selectedPlanId: string | null,
  planType: string | null
): number {
  if (selectedPlanId && selectedPlanId in HOUSEHOLD_LIMITS) {
    return HOUSEHOLD_LIMITS[selectedPlanId];
  }

  return planType === "family" ? 4 : 0;
}

function normalizeFamilyMembers(raw: unknown): FamilyMemberInput[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : undefined,
      full_name: typeof item.full_name === "string" ? item.full_name.trim() : undefined,
      relationship:
        typeof item.relationship === "string" ? item.relationship.trim() : undefined,
      date_of_birth:
        typeof item.date_of_birth === "string" ? item.date_of_birth : undefined,
      birth_time:
        typeof item.birth_time === "string" ? item.birth_time : null,
      birth_city:
        typeof item.birth_city === "string" ? item.birth_city.trim() : null,
      birth_country:
        typeof item.birth_country === "string" ? item.birth_country.trim() : null,
      notes: typeof item.notes === "string" ? item.notes.trim() : null,
    }))
    .filter((item) => item.full_name || item.relationship || item.date_of_birth);
}

/**
 * POST /api/community/onboarding/complete
 *
 * Saves the authenticated user's PM onboarding profile. Core profile fields
 * update community_members, optional questionnaire fields stay in intake_data,
 * and couple/family household members are synced into community_family_members.
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

    if (!first_name || typeof first_name !== "string" || !first_name.trim()) {
      return NextResponse.json({ error: "First name is required." }, { status: 422 });
    }
    if (!last_name || typeof last_name !== "string" || !last_name.trim()) {
      return NextResponse.json({ error: "Last name is required." }, { status: 422 });
    }

    const emailVal = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 422 });
    }

    const phoneDigits = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
    if (phoneDigits.length !== 10) {
      return NextResponse.json(
        { error: "Phone must be a 10-digit number." },
        { status: 422 }
      );
    }
    if (!gender || typeof gender !== "string") {
      return NextResponse.json({ error: "Gender is required." }, { status: 422 });
    }
    if (!state || typeof state !== "string" || !state.trim()) {
      return NextResponse.json({ error: "State is required." }, { status: 422 });
    }
    if (!city || typeof city !== "string" || !city.trim()) {
      return NextResponse.json({ error: "City is required." }, { status: 422 });
    }

    const zipVal = typeof zip === "string" ? zip.trim() : "";
    if (!/^\d{5}$/.test(zipVal)) {
      return NextResponse.json({ error: "Zip must be exactly 5 digits." }, { status: 422 });
    }
    if (!address || typeof address !== "string" || !address.trim()) {
      return NextResponse.json({ error: "Address is required." }, { status: 422 });
    }
    if (!occupation || typeof occupation !== "string" || !occupation.trim()) {
      return NextResponse.json({ error: "Occupation is required." }, { status: 422 });
    }
    if (!date_of_birth || typeof date_of_birth !== "string") {
      return NextResponse.json({ error: "Date of birth is required." }, { status: 422 });
    }
    if (!birth_time || typeof birth_time !== "string") {
      return NextResponse.json({ error: "Birth time is required." }, { status: 422 });
    }

    const admin = createAdminClient();

    const { data: member, error: memberErr } = await admin
      .from("community_members")
      .select("id, membership_status, membership_type, plan_type, intake_data")
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

    const existingIntake =
      member.intake_data && typeof member.intake_data === "object"
        ? (member.intake_data as Record<string, unknown>)
        : {};
    const selectedPlanId =
      typeof existingIntake.selected_plan_id === "string"
        ? existingIntake.selected_plan_id
        : null;
    const householdLimit = getHouseholdLimit(selectedPlanId, member.plan_type);
    const familyMembers = normalizeFamilyMembers(body.family_members);

    if (selectedPlanId === "plan_pm_couple" && familyMembers.length !== 1) {
      return NextResponse.json(
        { error: "Couple plans require exactly one household member." },
        { status: 422 }
      );
    }
    if (familyMembers.length > householdLimit) {
      return NextResponse.json(
        { error: `This plan allows up to ${householdLimit} household members.` },
        { status: 422 }
      );
    }

    for (const [index, familyMember] of familyMembers.entries()) {
      if (!familyMember.full_name) {
        return NextResponse.json(
          { error: `Household member ${index + 1} needs a full name.` },
          { status: 422 }
        );
      }
      if (!familyMember.relationship) {
        return NextResponse.json(
          { error: `Household member ${index + 1} needs a relationship.` },
          { status: 422 }
        );
      }
      if (!familyMember.date_of_birth) {
        return NextResponse.json(
          { error: `Household member ${index + 1} needs a birth date.` },
          { status: 422 }
        );
      }
    }

    const fullName = `${first_name.trim()} ${last_name.trim()}`;

    const intakeData: Record<string, unknown> = {
      ...existingIntake,
      occupation: trimStr(occupation),
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

    const updatePayload: Record<string, unknown> = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
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
      intake_data: intakeData,
      plan_type: householdLimit > 0 ? "family" : "individual",
      onboarding_completed: true,
    };

    const { error: updateError } = await admin
      .from("community_members")
      .update(updatePayload)
      .eq("id", member.id);

    if (updateError) {
      console.error("[onboarding/complete] update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const submittedIds = familyMembers
      .map((familyMember) => familyMember.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    if (householdLimit > 0) {
      const retainedIds = [...submittedIds];

      for (const familyMember of familyMembers) {
        const ageYears =
          (Date.now() - new Date(familyMember.date_of_birth!).getTime()) /
          (365.25 * 24 * 3600 * 1000);
        const familyPayload = {
          member_id: member.id,
          full_name: familyMember.full_name,
          relationship: familyMember.relationship,
          date_of_birth: familyMember.date_of_birth,
          birth_time: trimStr(familyMember.birth_time),
          birth_city: trimStr(familyMember.birth_city),
          birth_country: trimStr(familyMember.birth_country),
          notes: trimStr(familyMember.notes),
          age_group: ageYears < 14 ? "child" : "adult",
        };

        if (familyMember.id) {
          const { error } = await admin
            .from("community_family_members")
            .update(familyPayload)
            .eq("id", familyMember.id)
            .eq("member_id", member.id);

          if (error) {
            console.error("[onboarding/complete] family update error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
          }
        } else {
          const { data: insertedMember, error } = await admin
            .from("community_family_members")
            .insert(familyPayload)
            .select("id")
            .single();

          if (error) {
            console.error("[onboarding/complete] family insert error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
          }

          if (insertedMember?.id) {
            retainedIds.push(insertedMember.id);
          }
        }
      }

      let deleteQuery = admin
        .from("community_family_members")
        .delete()
        .eq("member_id", member.id);

      if (retainedIds.length > 0) {
        deleteQuery = deleteQuery.not("id", "in", `(${retainedIds.join(",")})`);
      }

      const { error: deleteError } = await deleteQuery;
      if (deleteError) {
        console.error("[onboarding/complete] family delete error:", deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
    }

    syncProfileAcrossRoles(
      user.id,
      {
        display_name: fullName,
        phone: String(phone).trim() || undefined,
        birth_date: trimStr(date_of_birth) ?? undefined,
        birth_time: trimStr(birth_time) ?? undefined,
        birth_city: trimStr(city) ?? undefined,
      },
      "community_members"
    ).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[onboarding/complete] POST error:", err);
    return NextResponse.json(
      { error: "Failed to complete onboarding." },
      { status: 500 }
    );
  }
}
