import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TRAINEE_ITEM_KEY = "trainee_program";

type PricingPlanRow = {
  plan_id: string;
  display_name: string;
  stripe_price_id: string | null;
  onetime_amount: number | null;
  onetime_currency: string | null;
  recurring_amount: number | null;
  recurring_currency: string | null;
  recurring_interval: string | null;
  global_pricing:
    | { item_key: string; item_name: string }
    | { item_key: string; item_name: string }[]
    | null;
};

type AdminClient = ReturnType<typeof createAdminClient>;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

async function buildAvailableTraineeUsername(
  admin: AdminClient,
  preferredValue: string,
  userId: string,
) {
  const base = slugify(preferredValue) || `trainee-${userId.slice(0, 8)}`;

  for (let index = 0; index < 20; index += 1) {
    const suffix = index === 0 ? "" : `-${index + 1}`;
    const username = `${base}${suffix}`.slice(0, 50);
    const { count, error } = await admin
      .from("trainees")
      .select("id", { head: true, count: "exact" })
      .eq("username", username);

    if (error) {
      throw new Error(error.message);
    }

    if ((count ?? 0) === 0) {
      return username;
    }
  }

  return `${base.slice(0, 41)}-${userId.slice(0, 8)}`;
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      planId?: string;
    };
    const planId = body.planId?.trim();
    if (!planId) {
      return NextResponse.json({ error: "planId is required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: trainee } = await admin
      .from("trainees")
      .select("id, user_id, name, email, username, paid_at, service_package_code")
      .eq("user_id", user.id)
      .maybeSingle();
    let pendingTraineeProfile: {
      name: string;
      email: string;
      username: string;
      servicePackageCode: string | null;
      source: string;
    } | null = null;

    if (!trainee) {
      const { data: diviner } = await admin
        .from("diviners")
        .select("id, display_name, username, service_package_code")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!diviner) {
        return NextResponse.json(
          { error: "No trainee registration found for this account." },
          { status: 404 }
        );
      }

      const email = (user.email ?? "").trim().toLowerCase();
      if (!email) {
        return NextResponse.json(
          { error: "No email address available for this account." },
          { status: 422 }
        );
      }

      const displayName =
        diviner.display_name ??
        (user.user_metadata?.name as string | undefined) ??
        email.split("@")[0] ??
        "Trainee";
      const username = await buildAvailableTraineeUsername(
        admin,
        diviner.username ?? displayName,
        user.id,
      );

      pendingTraineeProfile = {
        name: displayName,
        email,
        username,
        servicePackageCode: diviner.service_package_code ?? "both",
        source: "diviner_trainee_upgrade",
      };
    }

    if (trainee?.paid_at) {
      return NextResponse.json(
        { error: "Your trainee program payment is already complete." },
        { status: 409 }
      );
    }

    const { data: rawPlan } = await admin
      .from("pricing_plans")
      .select(
        "plan_id, display_name, stripe_price_id, onetime_amount, onetime_currency, recurring_amount, recurring_currency, recurring_interval, global_pricing(item_key, item_name)"
      )
      .eq("plan_id", planId)
      .eq("is_active", true)
      .single();

    const dbPlan = rawPlan as PricingPlanRow | null;
    if (!dbPlan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const itemInfo = Array.isArray(dbPlan.global_pricing)
      ? dbPlan.global_pricing[0] ?? null
      : dbPlan.global_pricing;
    if (itemInfo?.item_key !== TRAINEE_ITEM_KEY) {
      return NextResponse.json(
        { error: "Selected plan is not a trainee program plan." },
        { status: 422 }
      );
    }

    const hasRecurring = Boolean(
      dbPlan.stripe_price_id &&
        dbPlan.recurring_amount &&
        dbPlan.recurring_amount > 0
    );
    const hasOneTime =
      typeof dbPlan.onetime_amount === "number" && dbPlan.onetime_amount > 0;
    if (!hasRecurring && !hasOneTime && !dbPlan.stripe_price_id) {
      return NextResponse.json(
        { error: "Plan has no configured price. Contact support." },
        { status: 422 }
      );
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    if (hasRecurring && dbPlan.stripe_price_id) {
      lineItems.push({ price: dbPlan.stripe_price_id, quantity: 1 });
      if (hasOneTime && dbPlan.onetime_amount) {
        lineItems.push({
          price_data: {
            currency: (
              dbPlan.onetime_currency ??
              dbPlan.recurring_currency ??
              "USD"
            ).toLowerCase(),
            unit_amount: Math.round(dbPlan.onetime_amount * 100),
            product_data: { name: `${dbPlan.display_name} - Setup Fee` },
          },
          quantity: 1,
        });
      }
    } else if (dbPlan.stripe_price_id) {
      lineItems.push({ price: dbPlan.stripe_price_id, quantity: 1 });
    } else if (hasOneTime && dbPlan.onetime_amount) {
      lineItems.push({
        price_data: {
          currency: (
            dbPlan.onetime_currency ??
            dbPlan.recurring_currency ??
            "USD"
          ).toLowerCase(),
          unit_amount: Math.round(dbPlan.onetime_amount * 100),
          product_data: { name: dbPlan.display_name },
        },
        quantity: 1,
      });
    }

    const email = (user.email ?? trainee?.email ?? pendingTraineeProfile?.email ?? "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json(
        { error: "No email address available for this account." },
        { status: 422 }
      );
    }

    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    let customerId = existingCustomers.data[0]?.id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId: user.id, role: "invited_trainee" },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: hasRecurring ? "subscription" : "payment",
      line_items: lineItems,
      metadata: {
        userId: user.id,
        planId,
        itemKey: TRAINEE_ITEM_KEY,
        planName: dbPlan.display_name,
        type: "trainee_signup",
        source:
          pendingTraineeProfile?.source ??
          (user.user_metadata?.invited_by_admin === true
            ? "invited_trainee"
            : "existing_trainee"),
        ...(trainee?.id ? { traineeId: trainee.id } : {}),
        traineeName: trainee?.name ?? pendingTraineeProfile?.name ?? "",
        traineeEmail: trainee?.email ?? pendingTraineeProfile?.email ?? email,
        traineeUsername: trainee?.username ?? pendingTraineeProfile?.username ?? "",
        servicePackageCode:
          trainee?.service_package_code ??
          pendingTraineeProfile?.servicePackageCode ??
          "both",
      },
      success_url: `${origin}/trainee-signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/join/trainee/plan?cancelled=1`,
    });

    return NextResponse.json({ checkout_url: session.url });
  } catch (error) {
    console.error("[join/trainee/checkout] error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
