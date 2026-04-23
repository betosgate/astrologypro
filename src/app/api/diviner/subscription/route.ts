import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: diviner, error: divinerError } = await supabase
    .from("diviners")
    .select("stripe_subscription_id, stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  console.log("diviner---------->>", diviner);

  if (divinerError || !diviner) {
    return NextResponse.json({ error: "Diviner record not found" }, { status: 404 });
  }

  if (!diviner.stripe_subscription_id) {
    return NextResponse.json({ subscription: null });
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(
      diviner.stripe_subscription_id,
      {
        expand: ["items.data.price.product"],
      }
    );

    console.log("subscription---------->>", subscription);

    // Fetch enrollment fee
    const { data: pricing } = await supabase
      .from("global_pricing")
      .select("price, currency")
      .eq("item_key", "professional_divination_course")
      .maybeSingle();

    const item = subscription.items.data[0];
    const plan = item?.plan;
    const product = item?.price?.product as any;

    const interval = plan?.interval ?? "month";
    const amount = plan?.amount ?? 0;
    const currency = plan?.currency ?? "usd";

    // Fallback date projection if current_period_end is missing
    let periodEnd = new Date();
    if (subscription.current_period_end) {
      periodEnd = new Date(subscription.current_period_end * 1000);
    } else {
      if (interval === "month") periodEnd.setMonth(periodEnd.getMonth() + 1);
      else if (interval === "year") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      else if (interval === "week") periodEnd.setDate(periodEnd.getDate() + 7);
      else periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        amount,
        currency,
        interval,
        plan_name: product?.name ?? "Professional Plan",
        one_time_fee: pricing?.price ?? 0,
        one_time_fee_currency: pricing?.currency ?? "INR",
      },
    });
  } catch (err) {
    console.error("[api/diviner/subscription] Stripe error:", err);
    return NextResponse.json({ error: "Failed to fetch Stripe subscription" }, { status: 500 });
  }
}
