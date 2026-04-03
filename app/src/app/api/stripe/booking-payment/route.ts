import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
    } = body;

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
      .select("id, name, price, duration_minutes")
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

    // Try to create the auth user directly; if they already exist the call
    // will fail with a "user already registered" error which we handle below.
    const { error: createUserError } =
      await adminSupabase.auth.admin.createUser({
        email: clientEmail,
        email_confirm: true,
        user_metadata: {
          full_name: clientName,
        },
      });

    if (createUserError) {
      // "User already registered" is expected for returning clients
      if (
        !createUserError.message
          ?.toLowerCase()
          .includes("already registered")
      ) {
        console.error("Failed to auto-create auth user:", createUserError);
      }
    } else {
      isNewUser = true;
    }

    // Upsert client record by email (with birth data from questionnaire)
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .upsert(
        {
          email: clientEmail,
          full_name: clientName,
          phone: clientPhone ?? null,
          diviner_id: divinerId,
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
        { onConflict: "email,diviner_id" }
      )
      .select("id")
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Failed to create client record" },
        { status: 500 }
      );
    }

    // --- Loyalty Discount Check ---
    let finalPrice = service.price;
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
          service.price * (1 - loyaltyDiscountPercent / 100) * 100
        ) / 100;
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
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        diviner_id: divinerId,
        client_id: client.id,
        service_id: serviceId,
        scheduled_at: scheduledAt,
        end_at: endTime.toISOString(),
        status: "pending",
        price: finalPrice,
        questionnaire,
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
      const { data: affiliate } = await supabase
        .from("affiliates")
        .select("id")
        .eq("code", affiliateCode)
        .single();

      if (affiliate) {
        await supabase.from("affiliate_referrals").insert({
          affiliate_id: affiliate.id,
          booking_id: booking.id,
          diviner_id: divinerId,
        });
      }
    }

    // Calculate platform fee on the final price
    const platformFee =
      (finalPrice * PRICING.platformFeePercent) / 100;

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
        },
      });

      clientSecret = paymentIntent.client_secret;

      await supabase
        .from("bookings")
        .update({ stripe_payment_intent_id: paymentIntent.id })
        .eq("id", booking.id);
    } else {
      // Fully covered by gift certificate — mark booking as confirmed
      await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", booking.id);

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
      const { data: currentCert } = await supabase
        .from("gift_certificates")
        .select("remaining_amount")
        .eq("id", giftCertificateId)
        .single();

      if (currentCert) {
        const newRemaining = Math.max(
          0,
          currentCert.remaining_amount - giftDeduction
        );
        await supabase
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
      originalPrice: service.price,
      finalPrice,
      ...(loyaltyDiscountPercent > 0
        ? {
            loyaltyDiscount: {
              name: loyaltyRuleName,
              percent: loyaltyDiscountPercent,
              saved: Math.round((service.price - finalPrice + giftDeduction) * 100) / 100,
            },
          }
        : {}),
      ...(giftDeduction > 0
        ? { giftDeduction: Math.round(giftDeduction * 100) / 100 }
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
