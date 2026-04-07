import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity-log";
import { createPaymentIntent } from "@/lib/stripe/connect";
import { PRICING } from "@/lib/constants";
import {
  sendBookingConfirmation,
  sendBookingAccessInstructions,
  sendWelcomeAndBooked,
  sendGuestBookingInvite,
} from "@/lib/email";

interface BookingPaymentBody {
  divinerId: string;
  serviceId: string;
  scheduledAt: string;
  clientEmail: string;
  clientName: string;
  clientPhone?: string;
  questionnaire: Record<string, string | number | undefined>;
  affiliateCode?: string;
  giftCode?: string;
  policyAcknowledgedAt?: string;
  booking_notes?: string;
  discount_token?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BookingPaymentBody = await request.json();

    const {
      divinerId,
      serviceId,
      scheduledAt,
      clientEmail,
      clientName,
      clientPhone,
      questionnaire,
      affiliateCode,
      giftCode,
      policyAcknowledgedAt,
      booking_notes,
      discount_token,
    } = body;

    // Capture request metadata for audit/analytics
    const requestMetadata = {
      ip:
        request.headers.get("cf-connecting-ip") ??
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "unknown",
      userAgent: request.headers.get("user-agent") ?? "",
      referrer: request.headers.get("referer") ?? "",
      language: request.headers.get("accept-language") ?? "",
    };

    // Extract birth geo from questionnaire (sent inline by the wizard)
    const birthLat = questionnaire?.birthLat as number | undefined;
    const birthLng = questionnaire?.birthLng as number | undefined;
    const birthTimezone = questionnaire?.birthTimezone as string | undefined;

    // Validate required fields
    if (!divinerId || !serviceId || !scheduledAt || !clientEmail || !clientName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch diviner with their Stripe Connect account
    const { data: diviner } = await supabase
      .from("diviners")
      .select("id, stripe_account_id, display_name, slug")
      .eq("id", divinerId)
      .eq("is_active", true)
      .single();

    if (!diviner) {
      return NextResponse.json(
        { error: "Diviner not found" },
        { status: 404 }
      );
    }

    if (!diviner.stripe_account_id) {
      return NextResponse.json(
        { error: "Diviner has not set up payments yet" },
        { status: 400 }
      );
    }

    // Fetch the service
    const { data: service } = await supabase
      .from("services")
      .select("id, name, base_price, duration_minutes")
      .eq("id", serviceId)
      .eq("diviner_id", divinerId)
      .eq("is_active", true)
      .single();

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // --- Auto-create auth user if they don't exist ---
    const adminSupabase = createAdminClient();
    let isNewUser = false;

    // Try to create the auth user; capture the new user's ID if created.
    const { data: createUserData, error: createUserError } =
      await adminSupabase.auth.admin.createUser({
        email: clientEmail,
        email_confirm: true,
        user_metadata: {
          full_name: clientName,
        },
      });

    let clientAuthUserId: string | undefined;

    if (createUserError) {
      // "User already registered" is expected for returning clients
      if (
        !createUserError.message
          ?.toLowerCase()
          .includes("already registered")
      ) {
        console.error("Failed to auto-create auth user:", createUserError);
      }
      // Look up their existing client record to get user_id
      const { data: existingClientRecord } = await adminSupabase
        .from("clients")
        .select("user_id")
        .eq("email", clientEmail)
        .maybeSingle();
      clientAuthUserId = existingClientRecord?.user_id ?? undefined;
    } else {
      isNewUser = true;
      clientAuthUserId = createUserData.user.id;
    }

    if (!clientAuthUserId) {
      return NextResponse.json(
        { error: "Could not resolve client user account" },
        { status: 500 }
      );
    }

    // Upsert client record keyed on user_id
    const { data: client, error: clientError } = await adminSupabase
      .from("clients")
      .upsert(
        {
          user_id: clientAuthUserId,
          email: clientEmail,
          full_name: clientName,
          phone: clientPhone ?? null,
          ...(questionnaire?.birthDate
            ? { birth_date: questionnaire.birthDate }
            : {}),
          ...(questionnaire?.birthTime
            ? { birth_time: questionnaire.birthTime }
            : {}),
          ...(questionnaire?.birthCity
            ? { birth_city: questionnaire.birthCity }
            : {}),
          ...(birthLat != null && birthLng != null
            ? { birth_lat: birthLat, birth_lng: birthLng }
            : {}),
          ...(birthTimezone ? { birth_timezone: birthTimezone } : {}),
        },
        { onConflict: "user_id" }
      )
      .select("id")
      .single();

    if (clientError || !client) {
      console.error("Failed to upsert client:", clientError);
      return NextResponse.json(
        { error: "Failed to create client record" },
        { status: 500 }
      );
    }

    // Ensure the client-diviner relationship exists
    await adminSupabase
      .from("client_diviners")
      .upsert(
        { client_id: client.id, diviner_id: divinerId },
        { onConflict: "client_id,diviner_id" }
      );

    // --- Loyalty Discount Check ---
    let finalPrice = service.base_price;
    let loyaltyDiscountPercent = 0;
    let loyaltyRuleName: string | null = null;

    // Check client's session count with this diviner
    const { data: clientDiviner } = await supabase
      .from("client_diviners")
      .select("total_sessions")
      .eq("client_id", client.id)
      .eq("diviner_id", divinerId)
      .maybeSingle();

    if (clientDiviner && clientDiviner.total_sessions > 0) {
      // Fetch active discount rules for this diviner
      const { data: discountRules } = await supabase
        .from("discount_rules")
        .select("id, name, type, min_sessions, discount_percent")
        .eq("diviner_id", divinerId)
        .eq("is_active", true)
        .eq("type", "session_count")
        .lte("min_sessions", clientDiviner.total_sessions)
        .order("discount_percent", { ascending: false })
        .limit(1);

      if (discountRules && discountRules.length > 0) {
        const bestRule = discountRules[0];
        loyaltyDiscountPercent = bestRule.discount_percent;
        loyaltyRuleName = bestRule.name;
        finalPrice = Math.round(
          service.base_price * (1 - loyaltyDiscountPercent / 100) * 100
        ) / 100;
      }
    }

    // --- Member Discount Token Check ---
    // Valid token reduces platform fee from 20% to 15% (platform cut only; diviner payout unchanged).
    // Combined floor with any future stacking is 10%.
    let memberDiscountTokenId: string | null = null;
    let memberDiscountApplied = false;

    if (discount_token) {
      const { data: tokenRecord } = await adminSupabase
        .from("member_discount_tokens")
        .select("id, user_id, discount_percent, expires_at, used_at")
        .eq("token", discount_token)
        .maybeSingle();

      if (
        tokenRecord &&
        !tokenRecord.used_at &&
        new Date(tokenRecord.expires_at) >= new Date()
      ) {
        memberDiscountTokenId = tokenRecord.id as string;
        memberDiscountApplied = true;
      }
    }

    // --- Gift Certificate Check ---
    let giftDeduction = 0;
    let giftCertificateId: string | null = null;

    if (giftCode) {
      const { data: giftCert } = await supabase
        .from("gift_certificates")
        .select("id, remaining_amount, diviner_id, expires_at")
        .eq("code", giftCode)
        .eq("diviner_id", divinerId)
        .gt("remaining_amount", 0)
        .maybeSingle();

      if (giftCert) {
        const isExpired =
          giftCert.expires_at && new Date(giftCert.expires_at) < new Date();
        if (!isExpired) {
          giftDeduction = Math.min(giftCert.remaining_amount, finalPrice);
          giftCertificateId = giftCert.id;
          finalPrice = Math.round((finalPrice - giftDeduction) * 100) / 100;
        }
      }
    }

    // Calculate end time
    const startTime = new Date(scheduledAt);
    const endTime = new Date(
      startTime.getTime() + service.duration_minutes * 60 * 1000
    );

    // Create booking record with pending status
    // Use admin client — guest bookers have no session so RLS would block the insert
    const { data: booking, error: bookingError } = await adminSupabase
      .from("bookings")
      .insert({
        diviner_id: divinerId,
        client_id: client.id,
        service_id: serviceId,
        scheduled_at: scheduledAt,
        duration_minutes: service.duration_minutes,
        status: "pending",
        base_price: finalPrice,
        questionnaire_responses: questionnaire,
        booking_notes: booking_notes ?? null,
        metadata: requestMetadata,
        ...(policyAcknowledgedAt ? { policy_acknowledged_at: policyAcknowledgedAt } : {}),
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    // Handle affiliate tracking
    if (affiliateCode) {
      const { data: affiliate } = await adminSupabase
        .from("affiliates")
        .select("id, commission_percent, total_referrals, total_earned")
        .eq("referral_code", affiliateCode)
        .eq("is_active", true)
        .maybeSingle();

      if (affiliate) {
        const commissionAmount =
          Math.round(finalPrice * (affiliate.commission_percent / 100) * 100) / 100;

        await adminSupabase.from("affiliate_referrals").insert({
          affiliate_id: affiliate.id,
          booking_id: booking.id,
          commission_amount: commissionAmount,
          status: "pending",
        });

        // Increment referral count and earned total
        await adminSupabase
          .from("affiliates")
          .update({
            total_referrals: (affiliate.total_referrals ?? 0) + 1,
            total_earned: Number(affiliate.total_earned ?? 0) + commissionAmount,
          })
          .eq("id", affiliate.id);
      }
    }

    // Calculate platform fee on the final price.
    // Member discount token: platform fee drops from 20% → 15% (diviner payout unchanged).
    // Floor at 10% to prevent stacking below the minimum viable platform margin.
    const effectivePlatformFeePercent = memberDiscountApplied
      ? Math.max(PRICING.platformFeePercent - 5, 10)
      : PRICING.platformFeePercent;
    const platformFee =
      (finalPrice * effectivePlatformFeePercent) / 100;

    let clientSecret: string | null = null;

    // Only create a payment intent if there's an amount to charge
    if (finalPrice > 0) {
      const paymentIntent = await createPaymentIntent({
        amount: finalPrice,
        connectedAccountId: diviner.stripe_account_id,
        platformFeeAmount: platformFee,
        metadata: {
          bookingId: booking.id,
          divinerId,
          serviceId,
          clientEmail,
          ...(giftCode ? { giftCode } : {}),
          ...(loyaltyRuleName
            ? { loyaltyDiscount: `${loyaltyDiscountPercent}%` }
            : {}),
          ...(memberDiscountApplied ? { memberDiscount: "5%" } : {}),
        },
      });

      clientSecret = paymentIntent.client_secret;

      await adminSupabase
        .from("bookings")
        .update({ stripe_payment_intent_id: paymentIntent.id })
        .eq("id", booking.id);

      // Consume the member discount token now that the payment intent is created
      if (memberDiscountTokenId) {
        await adminSupabase
          .from("member_discount_tokens")
          .update({
            used_at: new Date().toISOString(),
            booking_id: booking.id,
          })
          .eq("id", memberDiscountTokenId);
      }
    } else {
      // Fully covered by gift certificate — mark booking as confirmed
      await adminSupabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", booking.id);

      logActivity({
        userId: clientAuthUserId,
        eventCategory: 'booking',
        eventType: 'booking.created',
        metadata: {
          bookingId: booking.id,
          divinerId,
          serviceName: service.name,
          giftCovered: true,
        },
      })

      // Send confirmation + access instructions emails immediately
      const sessionLink = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com"}/session/${booking.id}`;
      const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${service.name} with ${diviner.display_name}`)}&dates=${startTime.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}/${endTime.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}&details=${encodeURIComponent(`Your reading session on AstrologyPro.\n\nJoin: ${sessionLink}`)}`;

      const emailParams = {
        clientEmail,
        divinerName: diviner.display_name,
        serviceName: service.name,
        dateTime: startTime.toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
        sessionLink,
        duration: service.duration_minutes,
      };

      // Fire emails without blocking the response
      const emailPromises: Promise<any>[] = [
        sendBookingConfirmation(emailParams),
        sendBookingAccessInstructions({
          ...emailParams,
          calendarLink,
        }),
      ];

      // Send welcome email for new users with portal access instructions
      if (isNewUser) {
        const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com"}/portal`;
        emailPromises.push(
          sendWelcomeAndBooked({
            clientEmail,
            clientName,
            divinerName: diviner.display_name,
            serviceName: service.name,
            dateTime: startTime.toLocaleString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }),
            portalUrl,
          })
        );
      }

      Promise.all(emailPromises).catch((err) =>
        console.error("Failed to send booking emails:", err)
      );
    }

    // Send welcome email for new users on the paid path (outside the $0 block)
    if (isNewUser && finalPrice > 0) {
      const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com"}/portal`;
      sendWelcomeAndBooked({
        clientEmail,
        clientName,
        divinerName: diviner.display_name,
        serviceName: service.name,
        dateTime: startTime.toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
        portalUrl,
      }).catch((err) => console.error("Failed to send welcome email:", err));
    }

    // Guest invite email
    const secondPersonEmail = questionnaire?.secondPersonEmail as string | undefined;
    const secondPersonName = questionnaire?.secondPersonName as string | undefined;
    const secondPersonAttending = questionnaire?.secondPersonAttending as string | undefined;

    if (secondPersonEmail && (secondPersonAttending === "yes" || secondPersonAttending === "maybe")) {
      const sessionDateStr = new Date(scheduledAt).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "numeric", minute: "2-digit", timeZoneName: "short",
      });
      await sendGuestBookingInvite({
        guestEmail: secondPersonEmail,
        guestName: secondPersonName || "Guest",
        clientName,
        divinerName: diviner.display_name,
        serviceName: service.name,
        sessionDate: sessionDateStr,
        divinerLandingUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://astrologypro.com"}/${(diviner as Record<string, string>).slug || ""}`,
      }).catch((err) => console.error("Failed to send guest invite:", err));
    }

    // Deduct from gift certificate if used
    if (giftCertificateId && giftDeduction > 0) {
      const { data: currentCert } = await adminSupabase
        .from("gift_certificates")
        .select("remaining_amount")
        .eq("id", giftCertificateId)
        .single();

      if (currentCert) {
        const newRemaining = Math.max(
          0,
          currentCert.remaining_amount - giftDeduction
        );
        await adminSupabase
          .from("gift_certificates")
          .update({
            remaining_amount: newRemaining,
            ...(newRemaining <= 0
              ? { redeemed_at: new Date().toISOString() }
              : {}),
          })
          .eq("id", giftCertificateId);
      }
    }

    return NextResponse.json({
      clientSecret,
      bookingId: booking.id,
      originalPrice: service.base_price,
      finalPrice,
      ...(loyaltyDiscountPercent > 0
        ? {
            loyaltyDiscount: {
              name: loyaltyRuleName,
              percent: loyaltyDiscountPercent,
              saved: Math.round((service.base_price - finalPrice + giftDeduction) * 100) / 100,
            },
          }
        : {}),
      ...(giftDeduction > 0
        ? { giftDeduction: Math.round(giftDeduction * 100) / 100 }
        : {}),
      ...(memberDiscountApplied
        ? { memberDiscount: { platformFeePercent: effectivePlatformFeePercent } }
        : {}),
    });
  } catch (err) {
    console.error("Booking payment error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
