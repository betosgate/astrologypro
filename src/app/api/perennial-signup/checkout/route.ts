import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import type {
  HouseholdMemberPayload,
  HouseholdPayload,
  PerennialPlanKey,
} from "@/lib/perennial/household-provisioning";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/perennial-signup/checkout
 *
 * Validates a Perennial household signup, persists it to
 * pending_perennial_signups, and creates a Stripe Checkout session for the
 * selected plan. Returns the Stripe checkout URL so the client can redirect.
 *
 * After payment Stripe fires checkout.session.completed; the webhook handler
 * (handlePerennialSignupCheckoutCompleted) reads the pending row by
 * stripe_session_id and provisions all household accounts.
 *
 * Body:
 *   {
 *     plan_key: "single" | "couple" | "family",
 *     members: HouseholdMemberPayload[]   // 1-5
 *   }
 *
 * Response (201):
 *   { checkout_url, session_id }
 *
 * Errors: 400/422 invalid body, 422 plan capacity / unique email, 500 stripe / db
 */

const PLAN_LIMITS: Record<PerennialPlanKey, { min: number; max: number; envVar: string }> = {
  single: { min: 1, max: 1, envVar: "STRIPE_PRICE_COMMUNITY_INDIVIDUAL" },
  couple: { min: 2, max: 2, envVar: "STRIPE_PRICE_COMMUNITY_COUPLE" },
  family: { min: 3, max: 5, envVar: "STRIPE_PRICE_COMMUNITY_FAMILY" },
};

function isPerennialPlanKey(v: unknown): v is PerennialPlanKey {
  return v === "single" || v === "couple" || v === "family";
}

function strOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function numOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function validateMember(m: unknown, idx: number): HouseholdMemberPayload | string {
  if (!m || typeof m !== "object") return `Member ${idx + 1}: not an object`;
  const r = m as Record<string, unknown>;

  const firstName = String(r.first_name ?? "").trim();
  const lastName = String(r.last_name ?? "").trim();
  const email = String(r.email ?? "").trim().toLowerCase();
  const phone = String(r.phone ?? "").trim();
  const relationType = String(r.relation_type ?? "").trim();
  const subRelation = strOrNull(r.sub_relation);
  const gender = String(r.gender ?? "").trim();
  const state = String(r.state ?? "").trim();
  const city = String(r.city ?? "").trim();
  const zip = String(r.zip ?? "").trim();
  const address = String(r.address ?? "").trim();
  const occupation = String(r.occupation ?? "").trim();
  const dob = String(r.date_of_birth ?? "").trim();
  const birthTime = String(r.birth_time ?? "").trim();
  const birthLocationLabel = String(
    r.birth_location_label ?? r.birthLocationLabel ?? "",
  ).trim();
  const birthLat = numOrNull(r.birth_lat ?? r.birthLat);
  const birthLng = numOrNull(r.birth_lng ?? r.birthLng);
  const birthTzone = String(r.birth_tzone ?? r.birthTzone ?? "").trim();
  const isPrimary = Boolean(r.is_primary);

  // Required-field gate (mirrors the page-side validator).
  if (!firstName || !lastName) return `Member ${idx + 1}: first and last name are required`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return `Member ${idx + 1}: a valid email is required`;
  if (phone.replace(/\D/g, "").length !== 10) {
    return `Member ${idx + 1}: phone must be a 10-digit number`;
  }
  if (!gender) return `Member ${idx + 1}: gender is required`;
  if (!state) return `Member ${idx + 1}: state is required`;
  if (!city) return `Member ${idx + 1}: city is required`;
  if (!/^\d{5}$/.test(zip)) return `Member ${idx + 1}: zip must be exactly 5 digits`;
  if (!address) return `Member ${idx + 1}: address is required`;
  if (!occupation) return `Member ${idx + 1}: occupation is required`;
  if (!dob) return `Member ${idx + 1}: date of birth is required`;
  if (!birthTime) return `Member ${idx + 1}: birth time is required`;
  if (!birthLocationLabel) return `Member ${idx + 1}: birth location is required`;
  if (birthLat === null || birthLat < -90 || birthLat > 90) {
    return `Member ${idx + 1}: valid birth latitude is required`;
  }
  if (birthLng === null || birthLng < -180 || birthLng > 180) {
    return `Member ${idx + 1}: valid birth longitude is required`;
  }
  if (!birthTzone) return `Member ${idx + 1}: birth timezone is required`;

  if (!isPrimary) {
    if (relationType !== "Couple" && relationType !== "Family") {
      return `Member ${idx + 1}: relation_type must be 'Couple' or 'Family'`;
    }
    if (!subRelation) return `Member ${idx + 1}: sub_relation is required`;
    const allowedSub: Record<string, string[]> = {
      Couple: ["Husband", "Wife"],
      Family: ["Son", "Daughter", "Spouse", "Partner", "Other"],
    };
    if (!allowedSub[relationType].includes(subRelation)) {
      return `Member ${idx + 1}: sub_relation '${subRelation}' is not valid for relation_type '${relationType}'`;
    }
  }

  return {
    is_primary: isPrimary,
    relation_type: isPrimary ? "Self" : relationType,
    sub_relation: isPrimary ? null : subRelation,
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    gender,
    state,
    city,
    zip,
    address,
    occupation,
    date_of_birth: dob,
    birth_time: birthTime,
    birth_location_label: birthLocationLabel,
    birth_lat: birthLat,
    birth_lng: birthLng,
    birth_tzone: birthTzone,
    // Optional questionnaire — every field passed through as-is.
    relationship_status: strOrNull(r.relationship_status),
    personality: strOrNull(r.personality),
    strengths: strOrNull(r.strengths),
    lifeAreasFulfilling: strOrNull(r.lifeAreasFulfilling),
    lifeAreasImprovement: strOrNull(r.lifeAreasImprovement),
    longTermGoals: strOrNull(r.longTermGoals),
    majorLifeEvents: strOrNull(r.majorLifeEvents),
    stressManagement: strOrNull(r.stressManagement),
    workLifeBalance: strOrNull(r.workLifeBalance),
    relationship_with_family: strOrNull(r.relationship_with_family),
    biggest_current_challenges: strOrNull(r.biggest_current_challenges),
    focus_on_specific_relationships: strOrNull(r.focus_on_specific_relationships),
    guidance_on_specific_decision: strOrNull(r.guidance_on_specific_decision),
    concerns_about_romantic_life: strOrNull(r.concerns_about_romantic_life),
    ongoing_projects_or_plans: strOrNull(r.ongoing_projects_or_plans),
    social_life_fulfillment: strOrNull(r.social_life_fulfillment),
    spiritualPractices: strOrNull(r.spiritualPractices),
    selfDiscovery: strOrNull(r.selfDiscovery),
    externalInfluences: strOrNull(r.externalInfluences),
    achieveFromReading: strOrNull(r.achieveFromReading),
    specificQuestions: strOrNull(r.specificQuestions),
    goalsOutcomes: strOrNull(r.goalsOutcomes),
    practicalSpiritualPref: strOrNull(r.practicalSpiritualPref),
    mainConcern: strOrNull(r.mainConcern),
    additionalInfo: strOrNull(r.additionalInfo),
  };
}

export async function POST(req: NextRequest) {
  let body: { plan_key?: unknown; members?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const planKey = body.plan_key;
  if (!isPerennialPlanKey(planKey)) {
    return NextResponse.json(
      { error: "plan_key must be 'single', 'couple', or 'family'" },
      { status: 422 },
    );
  }

  if (!Array.isArray(body.members) || body.members.length === 0) {
    return NextResponse.json(
      { error: "members must be a non-empty array" },
      { status: 422 },
    );
  }

  const limits = PLAN_LIMITS[planKey];
  if (body.members.length < limits.min || body.members.length > limits.max) {
    return NextResponse.json(
      {
        error: `${planKey} plan requires ${
          limits.min === limits.max
            ? `exactly ${limits.min}`
            : `${limits.min}-${limits.max}`
        } member${limits.max === 1 ? "" : "s"}, got ${body.members.length}`,
      },
      { status: 422 },
    );
  }

  // Validate every member
  const validatedMembers: HouseholdMemberPayload[] = [];
  for (let i = 0; i < body.members.length; i++) {
    const m = validateMember(body.members[i], i);
    if (typeof m === "string") {
      return NextResponse.json({ error: m }, { status: 422 });
    }
    validatedMembers.push(m);
  }

  // Exactly one primary member
  const primaryCount = validatedMembers.filter((m) => m.is_primary).length;
  if (primaryCount !== 1) {
    return NextResponse.json(
      { error: "Household must have exactly one primary member" },
      { status: 422 },
    );
  }

  // Email uniqueness within the household
  const seen = new Set<string>();
  for (const m of validatedMembers) {
    if (seen.has(m.email)) {
      return NextResponse.json(
        { error: `Email ${m.email} is used by more than one member` },
        { status: 422 },
      );
    }
    seen.add(m.email);
  }

  // Stripe price configuration check — fail loudly if the env var is missing.
  const priceId = process.env[limits.envVar];
  if (!priceId) {
    return NextResponse.json(
      {
        error: `${planKey} plan is not yet available — ${limits.envVar} is not configured. An admin must create the Stripe price and add it to Vercel env vars.`,
        missing_env: limits.envVar,
      },
      { status: 503 },
    );
  }

  const primary = validatedMembers.find((m) => m.is_primary)!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

  // Create the Stripe Checkout session.
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: primary.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/perennial-signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/perennial-signup?cancelled=1`,
      metadata: {
        type: "perennial_signup",
        plan_key: planKey,
        primary_email: primary.email,
        member_count: String(validatedMembers.length),
      },
    });
  } catch (err) {
    console.error("[perennial-signup/checkout] stripe error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to create checkout session",
      },
      { status: 500 },
    );
  }

  if (!session.id || !session.url) {
    return NextResponse.json(
      { error: "Stripe returned an incomplete session" },
      { status: 500 },
    );
  }

  // Persist the household payload keyed on session id so the webhook can
  // pick it up after Stripe completes payment.
  const admin = createAdminClient();
  const household: HouseholdPayload = {
    plan_key: planKey,
    members: validatedMembers,
  };

  const { error: insertError } = await admin
    .from("pending_perennial_signups")
    .insert({
      stripe_session_id: session.id,
      plan_key: planKey,
      household,
      primary_email: primary.email,
      status: "pending",
    });

  if (insertError) {
    console.error("[perennial-signup/checkout] insert error:", insertError);
    // The Stripe session is already created — surface the error so the
    // operator can clean it up. Don't fail silently.
    return NextResponse.json(
      {
        error: `Stripe session created but household payload could not be saved: ${insertError.message}`,
        session_id: session.id,
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      checkout_url: session.url,
      session_id: session.id,
    },
    { status: 201 },
  );
}
