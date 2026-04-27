import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type StripeProductLike = {
  name?: string | null;
};

type StripeSubscriptionWithPeriod = Awaited<
  ReturnType<typeof stripe.subscriptions.retrieve>
> & {
  current_period_end?: number | null;
};

function getProductName(product: unknown): string | null {
  if (product && typeof product === "object" && "name" in product) {
    return (product as StripeProductLike).name ?? null;
  }
  return null;
}

function projectPeriodEnd(interval: string): Date {
  const periodEnd = new Date();
  if (interval === "year") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else if (interval === "week") {
    periodEnd.setDate(periodEnd.getDate() + 7);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }
  return periodEnd;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: member, error: memberError } = await admin
    .from("community_members")
    .select(
      "id, membership_type, membership_status, plan_type, pm_tier_id, stripe_customer_id, stripe_subscription_id, current_period_end"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberError || !member) {
    return NextResponse.json(
      { error: "PM membership record not found" },
      { status: 404 }
    );
  }

  if (
    member.membership_type &&
    member.membership_type !== "perennial_mandalism"
  ) {
    return NextResponse.json(
      { error: "PM membership record not found" },
      { status: 404 }
    );
  }

  if (!member.stripe_subscription_id) {
    return NextResponse.json({ subscription: null });
  }

  const { data: tier } = member.pm_tier_id
    ? await admin
        .from("pm_plan_tiers")
        .select("id, name, base_price_usd, extra_per_member_usd")
        .eq("id", member.pm_tier_id)
        .maybeSingle()
    : { data: null };

  try {
    const subscription = (await stripe.subscriptions.retrieve(
      member.stripe_subscription_id,
      {
        expand: ["items.data.price.product"],
      }
    )) as StripeSubscriptionWithPeriod;

    const primaryItem = subscription.items.data[0];
    const primaryPrice = primaryItem?.price;
    const interval =
      primaryPrice?.recurring?.interval ?? primaryItem?.plan?.interval ?? "month";
    const currency =
      primaryPrice?.currency ?? primaryItem?.plan?.currency ?? "usd";
    const amount = subscription.items.data.reduce((total, item) => {
      const unitAmount = item.price?.unit_amount ?? item.plan?.amount ?? 0;
      return total + unitAmount * (item.quantity ?? 1);
    }, 0);

    const stripePeriodEnd =
      subscription.current_period_end != null
        ? new Date(subscription.current_period_end * 1000)
        : null;
    const storedPeriodEnd = member.current_period_end
      ? new Date(member.current_period_end)
      : null;
    const periodEnd =
      stripePeriodEnd ?? storedPeriodEnd ?? projectPeriodEnd(interval);

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        amount,
        currency,
        interval,
        plan_name:
          getProductName(primaryPrice?.product) ??
          (tier?.name ? `Perennial Mandalism - ${tier.name}` : "Perennial Mandalism"),
        one_time_fee: 0,
        one_time_fee_currency: currency,
        membership_status: member.membership_status ?? null,
        membership_type: "perennial_mandalism",
        plan_type: member.plan_type ?? null,
        stripe_customer_id: member.stripe_customer_id ?? null,
        tier_id: tier?.id ?? member.pm_tier_id ?? null,
        tier_name: tier?.name ?? null,
      },
    });
  } catch (err) {
    console.error("[api/pm/subscription] Stripe error:", err);
    return NextResponse.json(
      { error: "Failed to fetch Stripe subscription" },
      { status: 500 }
    );
  }
}
