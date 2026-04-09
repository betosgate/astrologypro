import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the community member record including intake_data (which holds questionnaire)
  const { data: member, error } = await supabase
    .from("community_members")
    .select("id, full_name, email, phone, gender, state, city, zip, address, intake_data")
    .eq("user_id", user.id)
    .single();

  if (error || !member) {
    return NextResponse.json({ error: "Member profile not found" }, { status: 404 });
  }

  return NextResponse.json(member);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: member, error: fetchError } = await supabase
    .from("community_members")
    .select("intake_data")
    .eq("user_id", user.id)
    .single();

  if (fetchError || !member) {
    return NextResponse.json({ error: "Member profile not found" }, { status: 404 });
  }

  const existingIntakeData = member.intake_data || {};

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // The fields we allow updating in the post-login completion
  const allowedFields = [
    "relationship_status", "personality", "strengths", "lifeAreasFulfilling",
    "lifeAreasImprovement", "longTermGoals", "majorLifeEvents", "stressManagement",
    "workLifeBalance", "relationship_with_family", "biggest_current_challenges",
    "focus_on_specific_relationships", "guidance_on_specific_decision",
    "concerns_about_romantic_life", "ongoing_projects_or_plans", "social_life_fulfillment",
    "spiritualPractices", "selfDiscovery", "externalInfluences", "achieveFromReading",
    "specificQuestions", "goalsOutcomes", "practicalSpiritualPref", "mainConcern",
    "additionalInfo"
  ];

  const updatedIntakeData = { ...existingIntakeData };

  // Only apply allowed keys from body
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updatedIntakeData[field] = body[field];
    }
  }

  const { error: updateError } = await supabase
    .from("community_members")
    .update({ intake_data: updatedIntakeData })
    .eq("user_id", user.id);

  if (updateError) {
    console.error("[profile/complete] Database update error:", updateError);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({ success: true, intake_data: updatedIntakeData });
}
