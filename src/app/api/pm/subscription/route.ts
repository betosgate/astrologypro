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
  latest_invoice?:
    | {
        created?: number | null;
        status_transitions?: {
          paid_at?: number | null;
        } | null;
      }
    | string
    | null;
  items: Awaited<ReturnType<typeof stripe.subscriptions.retrieve>>["items"] & {
    data: Array<
      Awaited<ReturnType<typeof stripe.subscriptions.retrieve>>["items"]["data"][number] & {
        current_period_start?: number | null;
        current_period_end?: number | null;
      }
    >;
  };
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

function derivePeriodStart(periodEnd: Date, interval: string): Date {
  const periodStart = new Date(periodEnd);
  if (interval === "year") {
    periodStart.setFullYear(periodStart.getFullYear() - 1);
  } else if (interval === "week") {
    periodStart.setDate(periodStart.getDate() - 7);
  } else {
    periodStart.setMonth(periodStart.getMonth() - 1);
  }
  return periodStart;
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
        expand: ["items.data.price.product", "latest_invoice"],
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

    const stripePeriodEndTimestamp =
      primaryItem?.current_period_end ?? subscription.current_period_end ?? null;
    const stripePeriodEnd =
      stripePeriodEndTimestamp != null
        ? new Date(stripePeriodEndTimestamp * 1000)
        : null;
    const storedPeriodEnd = member.current_period_end
      ? new Date(member.current_period_end)
      : null;
    const periodEnd =
      stripePeriodEnd ?? storedPeriodEnd ?? projectPeriodEnd(interval);
    const latestInvoice =
      subscription.latest_invoice &&
      typeof subscription.latest_invoice !== "string"
        ? subscription.latest_invoice
        : null;
    const lastPaymentTimestamp =
      latestInvoice?.status_transitions?.paid_at ??
      latestInvoice?.created ??
      primaryItem?.current_period_start ??
      null;
    const lastPaymentDate = lastPaymentTimestamp
      ? new Date(lastPaymentTimestamp * 1000)
      : derivePeriodStart(periodEnd, interval);
    console.log("[api/pm/subscription] period end source", {
      subscription_id: subscription.id,
      item_current_period_start: primaryItem?.current_period_start ?? null,
      item_current_period_end: primaryItem?.current_period_end ?? null,
      subscription_current_period_end: subscription.current_period_end ?? null,
      stored_current_period_end: member.current_period_end ?? null,
      chosen_current_period_end: periodEnd.toISOString(),
      last_payment_date: lastPaymentDate.toISOString(),
    });

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: periodEnd.toISOString(),
        last_payment_date: lastPaymentDate.toISOString(),
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
        plan_type:
          getProductName(primaryPrice?.product)?.toLowerCase().includes("couple")
            ? "couple"
            : (member.plan_type ?? null),
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
