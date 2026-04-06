import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDivinerPlanCheckout } from "@/lib/stripe-saas";

export const dynamic = "force-dynamic";

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getAuthenticatedDiviner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) return null;

  return { userId: user.id, divinerId: diviner.id };
}

// ─── POST /api/dashboard/billing/checkout ────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedDiviner();
  if (!auth) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/401",
        title: "Unauthorized",
        status: 401,
        detail: "Authentication required.",
      },
      { status: 401 }
    );
  }

  let body: { plan_slug?: unknown; addon_slugs?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/422",
        title: "Invalid request body",
        status: 422,
        detail: "Request body must be valid JSON.",
      },
      { status: 422 }
    );
  }

  const { plan_slug, addon_slugs } = body;

  if (typeof plan_slug !== "string" || !plan_slug) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/422",
        title: "Unprocessable Entity",
        status: 422,
        detail: "plan_slug is required and must be a non-empty string.",
      },
      { status: 422 }
    );
  }

  const addonSlugs: string[] =
    Array.isArray(addon_slugs) && addon_slugs.every((s) => typeof s === "string")
      ? (addon_slugs as string[])
      : [];

  const admin = createAdminClient();

  // Look up the plan
  const { data: plan } = await admin
    .from("diviner_plans")
    .select("id, name, stripe_price_id")
    .eq("slug", plan_slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!plan) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/422",
        title: "Plan not found",
        status: 422,
        detail: `No active plan found with slug "${plan_slug}".`,
      },
      { status: 422 }
    );
  }

  if (!plan.stripe_price_id) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/422",
        title: "Plan not billable",
        status: 422,
        detail: "This plan does not have a Stripe price configured.",
      },
      { status: 422 }
    );
  }

  // Look up add-ons
  let addonPriceIds: string[] = [];
  if (addonSlugs.length > 0) {
    const { data: addons } = await admin
      .from("diviner_plan_addons")
      .select("slug, stripe_price_id")
      .in("slug", addonSlugs);

    const missing = addonSlugs.filter(
      (slug) => !addons?.find((a) => a.slug === slug && a.stripe_price_id)
    );
    if (missing.length > 0) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.com/422",
          title: "Add-on not found",
          status: 422,
          detail: `Add-ons not found or not billable: ${missing.join(", ")}`,
        },
        { status: 422 }
      );
    }

    addonPriceIds = (addons ?? [])
      .map((a) => a.stripe_price_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);
  }

  // Get diviner email and name via admin auth
  const { data: { user: authUser } } = await admin.auth.admin.getUserById(auth.userId);
  const email = authUser?.email ?? "";
  const name =
    (authUser?.user_metadata?.name as string | undefined) ??
    (authUser?.user_metadata?.full_name as string | undefined) ??
    email;

  if (!email) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/422",
        title: "Missing email",
        status: 422,
        detail: "Could not resolve diviner email.",
      },
      { status: 422 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

  try {
    const url = await createDivinerPlanCheckout({
      divinerId: auth.divinerId,
      email,
      name,
      stripePriceId: plan.stripe_price_id,
      successUrl: `${appUrl}/dashboard/billing?checkout=success`,
      cancelUrl: `${appUrl}/dashboard/billing?checkout=cancel`,
      addonPriceIds,
    });

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[billing/checkout] Stripe error:", err);
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/500",
        title: "Checkout failed",
        status: 500,
        detail: "Unable to create Stripe checkout session.",
      },
      { status: 500 }
    );
  }
}
