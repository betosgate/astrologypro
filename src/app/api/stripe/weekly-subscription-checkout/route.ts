import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureWeeklySubscriptionStripeProduct } from "@/lib/weekly-subscriptions";
import {
  isPublicSectionBlocked,
  normalizePublishPolicy,
  publishBlockMessage,
} from "@/lib/diviner-publishing";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      divinerUsername?: string;
      email?: string;
      name?: string;
      affiliateCode?: string;
    };

    const divinerUsername = body.divinerUsername?.trim();
    const email = body.email?.trim().toLowerCase();
    const name = body.name?.trim();
    const affiliateCode = body.affiliateCode?.trim();

    if (!divinerUsername || !email || !name) {
      return NextResponse.json(
        { error: "divinerUsername, email, and name are required" },
        { status: 422 }
      );
    }

    const admin = createAdminClient();

    const { data: diviner } = await admin
      .from("diviners")
      .select("id, username, display_name, public_publish_blocked, blocked_public_sections, blocked_media_types, publish_block_reason")
      .eq("username", divinerUsername)
      .eq("is_active", true)
      .maybeSingle();

    if (!diviner) {
      return NextResponse.json({ error: "Diviner not found" }, { status: 404 });
    }
    const publishPolicy = normalizePublishPolicy(diviner as Record<string, unknown>);
    if (isPublicSectionBlocked(publishPolicy, "weekly_subscription")) {
      return NextResponse.json(
        {
          error: publishBlockMessage(
            publishPolicy,
            "Weekly subscription publishing has been blocked for this diviner."
          ),
        },
        { status: 403 }
      );
    }

    const { data: product } = await admin
      .from("weekly_subscription_products")
      .select("id, title, description, price_cents, is_active, stripe_product_id, stripe_price_id")
      .eq("diviner_id", diviner.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!product) {
      return NextResponse.json(
        { error: "This diviner does not currently offer weekly subscriptions." },
        { status: 404 }
      );
    }

    const stripeIds = await ensureWeeklySubscriptionStripeProduct({
      productId: product.id,
      title: product.title,
      description: product.description,
      priceCents: product.price_cents,
      stripeProductId: product.stripe_product_id,
      stripePriceId: product.stripe_price_id,
    });

    if (
      stripeIds.stripeProductId !== product.stripe_product_id ||
      stripeIds.stripePriceId !== product.stripe_price_id
    ) {
      await admin
        .from("weekly_subscription_products")
        .update({
          stripe_product_id: stripeIds.stripeProductId,
          stripe_price_id: stripeIds.stripePriceId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id);
    }

    if (!stripeIds.stripePriceId) {
      return NextResponse.json(
        { error: "Subscription price could not be provisioned." },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
    const successUrl = `${appUrl}/login?redirect=${encodeURIComponent(
      "/portal/subscriptions"
    )}&subscription=success`;
    const cancelUrl = `${appUrl}/${diviner.username}?subscription=cancelled`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price: stripeIds.stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        type: "weekly_subscription",
        divinerId: diviner.id,
        divinerUsername: diviner.username,
        weeklySubscriptionProductId: product.id,
        email,
        name,
        ...(affiliateCode ? { affiliateCode } : {}),
      },
      subscription_data: {
        metadata: {
          type: "weekly_subscription",
          divinerId: diviner.id,
          divinerUsername: diviner.username,
          weeklySubscriptionProductId: product.id,
          email,
          name,
          ...(affiliateCode ? { affiliateCode } : {}),
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[weekly-subscription-checkout]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
