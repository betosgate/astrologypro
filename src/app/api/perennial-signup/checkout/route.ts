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

function validateMember(m: unknown, idx: number): HouseholdMemberPayload | string {
  if (!m || typeof m !== "object") return `Member ${idx + 1}: not an object`;
  const r = m as Record<string, unknown>;
  const firstName = String(r.first_name ?? "").trim();
  const lastName = String(r.last_name ?? "").trim();
  const email = String(r.email ?? "").trim().toLowerCase();
  const relation = String(r.relation ?? "").trim();
  const dob = String(r.date_of_birth ?? "").trim();
  if (!firstName || !lastName) return `Member ${idx + 1}: first and last name are required`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return `Member ${idx + 1}: a valid email is required`;
  if (!relation) return `Member ${idx + 1}: relation is required`;
  if (!dob) return `Member ${idx + 1}: date of birth is required`;
  return {
    is_primary: Boolean(r.is_primary),
    relation,
    first_name: firstName,
    last_name: lastName,
    email,
    date_of_birth: dob,
    birth_time: typeof r.birth_time === "string" && r.birth_time ? r.birth_time : null,
    birth_city: typeof r.birth_city === "string" && r.birth_city ? r.birth_city : null,
    birth_country:
      typeof r.birth_country === "string" && r.birth_country ? r.birth_country : null,
    intentions: typeof r.intentions === "string" && r.intentions ? r.intentions : null,
    challenges: typeof r.challenges === "string" && r.challenges ? r.challenges : null,
    goals: typeof r.goals === "string" && r.goals ? r.goals : null,
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
