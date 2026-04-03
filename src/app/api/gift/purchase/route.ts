import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { PRICING } from "@/lib/constants";

function generateGiftCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GIFT-";
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 3) code += "-";
  }
  return code;
}

interface GiftPurchaseBody {
  divinerId: string;
  amount: number;
  purchaserName: string;
  purchaserEmail: string;
  recipientName?: string;
  recipientEmail?: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GiftPurchaseBody = await request.json();
    const {
      divinerId,
      amount,
      purchaserName,
      purchaserEmail,
      recipientName,
      recipientEmail,
      message,
    } = body;

    if (!divinerId || !amount || !purchaserName || !purchaserEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (amount < 10) {
      return NextResponse.json(
        { error: "Minimum gift amount is $10" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

    // Fetch diviner
    const { data: diviner } = await admin
      .from("diviners")
      .select("id, display_name, username, stripe_account_id")
      .eq("id", divinerId)
      .eq("is_active", true)
      .single();

    if (!diviner) {
      return NextResponse.json(
        { error: "Diviner not found" },
        { status: 404 }
      );
    }

    // Pre-generate a unique code — stored in Checkout metadata so the
    // webhook can create the cert record after payment succeeds.
    let code = generateGiftCode();
    let codeExists = true;
    let attempts = 0;
    while (codeExists && attempts < 10) {
      const { data: existing } = await admin
        .from("gift_certificates")
        .select("id")
        .eq("code", code)
        .maybeSingle();
      if (!existing) {
        codeExists = false;
      } else {
        code = generateGiftCode();
        attempts++;
      }
    }

    // Build Checkout session params — Connect transfer when available
    const amountCents = Math.round(amount * 100);
    const platformFeeCents = Math.round(
      amountCents * (PRICING.platformFeePercent / 100)
    );

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: purchaserEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Gift Certificate — Reading with ${diviner.display_name}`,
              description: recipientName
                ? `For ${recipientName}`
                : "Redeemable for any session",
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      // Embed the pre-generated code so the webhook can create the cert
      metadata: {
        type: "gift_certificate",
        code,
        diviner_id: divinerId,
        diviner_name: diviner.display_name,
        diviner_username: diviner.username,
        purchaser_name: purchaserName,
        purchaser_email: purchaserEmail,
        recipient_name: recipientName ?? "",
        recipient_email: recipientEmail ?? "",
        message: message ?? "",
        amount: String(amount),
      },
      // After payment, redirect through our confirm route which redirects to /gift/{code}
      success_url: `${appUrl}/api/gift/confirm?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/${diviner.username}/gift`,
      ...(diviner.stripe_account_id
        ? {
            payment_intent_data: {
              application_fee_amount: platformFeeCents,
              transfer_data: { destination: diviner.stripe_account_id },
            },
          }
        : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Gift purchase error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
