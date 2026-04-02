import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import {
  sendGiftCertificateToRecipient,
  sendGiftCertificateConfirmation,
} from "@/lib/email";

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

    // Generate unique code
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

    // Create Stripe PaymentIntent for the gift certificate
    let paymentIntentId: string | null = null;
    if (diviner.stripe_account_id) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        metadata: {
          type: "gift_certificate",
          divinerId: diviner.id,
          purchaserEmail,
          giftCode: code,
        },
        automatic_payment_methods: { enabled: true },
      });
      paymentIntentId = paymentIntent.id;
    }

    // Create gift certificate record
    const { data: certificate, error: insertError } = await admin
      .from("gift_certificates")
      .insert({
        diviner_id: divinerId,
        code,
        purchaser_name: purchaserName,
        purchaser_email: purchaserEmail,
        recipient_name: recipientName ?? null,
        recipient_email: recipientEmail ?? null,
        amount,
        remaining_amount: amount,
        message: message ?? null,
        stripe_payment_intent_id: paymentIntentId,
      })
      .select("id, code")
      .single();

    if (insertError || !certificate) {
      console.error("Failed to create gift certificate:", insertError);
      return NextResponse.json(
        { error: "Failed to create gift certificate" },
        { status: 500 }
      );
    }

    // Send emails
    const redeemUrl = `${appUrl}/gift/${code}`;

    if (recipientEmail) {
      await sendGiftCertificateToRecipient({
        recipientEmail,
        purchaserName,
        divinerName: diviner.display_name,
        amount,
        code,
        message,
        redeemUrl,
      });
    }

    await sendGiftCertificateConfirmation({
      purchaserEmail,
      recipientName,
      divinerName: diviner.display_name,
      amount,
      code,
    });

    return NextResponse.json({
      success: true,
      code: certificate.code,
      certificateId: certificate.id,
    });
  } catch (err) {
    console.error("Gift purchase error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
