import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity-log";
import { createPaymentIntent } from "@/lib/stripe/connect";
import { createCalendarEvent } from "@/lib/google-calendar";
import { buildCalendarDescription, stripHtml } from "@/lib/calendar-utils";
import { PRICING } from "@/lib/constants";
import {
  sendBookingConfirmation,
  sendBookingAccessInstructions,
  sendBookingInvoice,
  sendDivinerNewBookingNotification,
  sendWelcomeAndBooked,
  sendGuestBookingInvite,
} from "@/lib/email";

export const dynamic = "force-dynamic";


interface BookingPaymentBody {
  divinerId?: string;
  divinerUsername?: string;
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
      divinerUsername,
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
    if (!serviceId || !scheduledAt || !clientEmail || !clientName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!divinerId && !divinerUsername) {
      return NextResponse.json(
        { error: "Missing diviner identifier" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Fetch the service first (source of truth for diviner_id)
    let { data: service, error: serviceError } = await adminSupabase
      .from("services")
      .select("id, name, base_price, duration_minutes, diviner_id")
      .eq("id", serviceId)
      .eq("is_active", true)
      .single();

    if (serviceError || !service) {
      const fallback = await supabase
        .from("services")
        .select("id, name, base_price, duration_minutes, diviner_id")
        .eq("id", serviceId)
        .eq("is_active", true)
        .single();
      service = fallback.data ?? null;
      serviceError = serviceError ?? fallback.error;
    }

    if (!service) {
      return NextResponse.json(
        { error: "Service not found", details: serviceError?.message ?? null },
        { status: 404 }
      );
    }

    let resolvedDivinerId = service.diviner_id ?? null;
    let diviner: {
      id: string;
      user_id?: string;
      stripe_account_id: string | null;
      display_name: string;
      video_provider?: string;
    } | null = null;
    let divinerError: { message?: string } | null = null;

    async function fetchDivinerById(id: string) {
      let result = await adminSupabase
        .from("diviners")
        .select("id, user_id, stripe_account_id, display_name, video_provider")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (result.error || !result.data) {
        result = await supabase
          .from("diviners")
          .select("id, user_id, stripe_account_id, display_name, video_provider")
          .eq("id", id)
          .eq("is_active", true)
          .single();
      }

      return result;
    }

    async function fetchDivinerByUsername(username: string) {
      let result = await adminSupabase
        .from("diviners")
        .select("id, user_id, stripe_account_id, display_name, video_provider")
        .eq("username", username)
        .eq("is_active", true)
        .single();

      if (result.error || !result.data) {
        result = await supabase
          .from("diviners")
          .select("id, user_id, stripe_account_id, display_name, video_provider")
          .eq("username", username)
          .eq("is_active", true)
          .single();
      }

      return result;
    }

    if (divinerUsername) {
      const result = await fetchDivinerByUsername(divinerUsername);
      diviner = result.data ?? null;
      divinerError = result.error ?? null;
      resolvedDivinerId = diviner?.id ?? resolvedDivinerId;
    }

    if (!diviner && divinerId) {
      const result = await fetchDivinerById(divinerId);
      diviner = result.data ?? null;
      divinerError = result.error ?? null;

      if (!diviner) {
        const fallbackByUserId = await supabase
          .from("diviners")
          .select("id, stripe_account_id, display_name")
          .eq("user_id", divinerId)
          .eq("is_active", true)
          .single();
        diviner = fallbackByUserId.data ?? null;
        divinerError = divinerError ?? fallbackByUserId.error;
      }

      resolvedDivinerId = diviner?.id ?? resolvedDivinerId;
    }

    if (!diviner && resolvedDivinerId) {
      const result = await fetchDivinerById(resolvedDivinerId);
      diviner = result.data ?? null;
      divinerError = result.error ?? null;
    }

    if (diviner && service.diviner_id && diviner.id !== service.diviner_id) {
      return NextResponse.json(
        { error: "Service is not assigned to this diviner" },
        { status: 400 }
      );
    }

    if (!diviner) {
      return NextResponse.json(
        { error: "Diviner not found", details: divinerError?.message ?? null },
        { status: 404 }
      );
    }

    // Find the availability template that covers this booking slot.
    // Query by date range (covers the booked date) then prefer matching service_id.
    // Using select("*") avoids TypeScript-inferred column narrowing issues.
    const bookingDateStr = scheduledAt.substring(0, 10); // YYYY-MM-DD

    let hasServiceAvailability = false;
    let availabilityTemplateTitle: string | null = null;
    let availabilityTemplateDescription: string | null = null;

    // Fetch all active templates for this diviner — select("*") avoids any
    // column-narrowing issues. We rank matches in JS: service_id match first,
    // then date-range overlap, then any active template.
    const { data: allTemplates, error: templateFetchError } = await adminSupabase
      .from("availability_templates")
      .select("*")
      .or(`owner_id.eq.${resolvedDivinerId},diviner_id.eq.${resolvedDivinerId}`)
      .eq("is_active", true);

    // eslint-disable-next-line no-console
    console.log("[booking-payment] template lookup", {
      resolvedDivinerId,
      bookingDateStr,
      serviceId,
      templateFetchError,
      found: allTemplates?.map((t: Record<string, unknown>) => ({
        id: t.id,
        title: t.title,
        service_id: t.service_id,
        start_date: t.start_date,
        end_date: t.end_date,
      })),
    });

    if (allTemplates && allTemplates.length > 0) {
      // 1. Exact service_id match
      let best: Record<string, unknown> | undefined = (
        allTemplates as Record<string, unknown>[]
      ).find((t) => t.service_id === serviceId);

      // 2. Any template whose date range covers the booked date
      if (!best) {
        best = (allTemplates as Record<string, unknown>[]).find(
          (t) =>
            String(t.start_date ?? "") <= bookingDateStr &&
            String(t.end_date ?? "") >= bookingDateStr
        );
      }

      // 3. First template in the list
      if (!best) best = allTemplates[0] as Record<string, unknown>;

      hasServiceAvailability = true;
      availabilityTemplateTitle = (best.title as string) || null;
      availabilityTemplateDescription = (best.description as string) || null;
    }

    // --- Auto-create auth user if they don't exist ---
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
      const isEmailExists =
        createUserError.code === "email_exists" ||
        createUserError.message?.toLowerCase().includes("already registered");

      if (!isEmailExists) {
        console.error("Failed to auto-create auth user:", createUserError);
      }

      // Try the clients table first (fast path for returning bookers)
      const { data: existingClientRecord } = await adminSupabase
        .from("clients")
        .select("user_id")
        .eq("email", clientEmail)
        .maybeSingle();
      clientAuthUserId = existingClientRecord?.user_id ?? undefined;

      // Fallback: user exists in auth but has never booked before (no client
      // record yet). Look them up directly via the auth admin API.
      if (!clientAuthUserId) {
        const { data: authList } = await adminSupabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        const authUser = authList?.users?.find((u) => u.email === clientEmail);
        clientAuthUserId = authUser?.id;
      }
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
        { client_id: client.id, diviner_id: resolvedDivinerId },
        { onConflict: "client_id,diviner_id" }
      );

    // --- Duplicate / Slot Conflict Check ---
    // Prevent the same client from booking the same slot twice, and prevent
    // any two clients from claiming a slot already held by an active booking.
    const { data: slotConflict } = await adminSupabase
      .from("bookings")
      .select("id, client_id")
      .eq("diviner_id", resolvedDivinerId)
      .eq("scheduled_at", scheduledAt)
      .not("status", "in", '("cancelled","no_show")')
      .maybeSingle();

    if (slotConflict) {
      if (slotConflict.client_id === client.id) {
        return NextResponse.json(
          { error: "You have already booked this time slot" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "This time slot is no longer available" },
        { status: 409 }
      );
    }

    // --- Loyalty Discount Check ---
    let finalPrice = service.base_price;
    let loyaltyDiscountPercent = 0;
    let loyaltyRuleName: string | null = null;

    // Check client's session count with this diviner
    const { data: clientDiviner } = await adminSupabase
      .from("client_diviners")
      .select("total_sessions")
      .eq("client_id", client.id)
      .eq("diviner_id", resolvedDivinerId)
      .maybeSingle();

    if (clientDiviner && clientDiviner.total_sessions > 0) {
      // Fetch active discount rules for this diviner
      const { data: discountRules } = await adminSupabase
        .from("discount_rules")
        .select("id, name, type, min_sessions, discount_percent")
        .eq("diviner_id", resolvedDivinerId)
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
        .eq("diviner_id", resolvedDivinerId)
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
        diviner_id: resolvedDivinerId,
        client_id: client.id,
        service_id: serviceId,
        scheduled_at: scheduledAt,
        duration_minutes: service.duration_minutes,
        status: "pending",
        base_price: finalPrice,
        video_provider: (diviner as any)?.video_provider ?? "daily",
        questionnaire_responses: questionnaire,
        booking_notes: booking_notes ?? null,
        metadata: {
          ...requestMetadata,
          ...(availabilityTemplateTitle ? { availability_title: availabilityTemplateTitle } : {}),
          ...(availabilityTemplateDescription ? { availability_description: availabilityTemplateDescription } : {}),
        },
        ...(policyAcknowledgedAt ? { policy_acknowledged_at: policyAcknowledgedAt } : {}),
      })
      .select("id, booking_token")
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
    const shouldCharge = hasServiceAvailability && finalPrice > 0;

    if (shouldCharge && !diviner.stripe_account_id) {
      return NextResponse.json(
        { error: "Diviner has not set up payments yet" },
        { status: 400 }
      );
    }

    let clientSecret: string | null = null;

    // Only create a payment intent if there's an amount to charge
    if (shouldCharge) {
      const paymentIntent = await createPaymentIntent({
        amount: finalPrice,
        connectedAccountId: diviner.stripe_account_id!,
        platformFeeAmount: platformFee,
        metadata: {
          bookingId: booking.id,
          divinerId: resolvedDivinerId,
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
      // No payment required — mark booking as confirmed immediately
      console.log("[booking-payment] FREE PATH — confirming booking:", booking.id);
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
          divinerId: resolvedDivinerId,
          serviceName: service.name,
          paymentRequired: false,
        },
      });

      // Send confirmation emails to the booker
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
      const portalBookingsUrl = `${appUrl}/portal/bookings`;
      const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${availabilityTemplateTitle ?? service.name} with ${diviner.display_name}`)}&dates=${startTime.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}/${endTime.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}&details=${encodeURIComponent(availabilityTemplateDescription ? stripHtml(availabilityTemplateDescription) : `Your session with ${diviner.display_name}`)}`;

      const formattedDateTime = startTime.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

      const emailParams = {
        clientEmail,
        divinerName: diviner.display_name,
        serviceName: availabilityTemplateTitle ?? service.name,
        dateTime: formattedDateTime,
        // Point booker to their portal bookings page (not a raw session link)
        sessionLink: portalBookingsUrl,
        duration: service.duration_minutes,
      };

      const emailPromises: Promise<unknown>[] = [
        sendBookingConfirmation(emailParams),
        sendBookingAccessInstructions({
          ...emailParams,
          calendarLink,
        }),
      ];

      if (isNewUser) {
        emailPromises.push(
          sendWelcomeAndBooked({
            clientEmail,
            clientName,
            divinerName: diviner.display_name,
            serviceName: availabilityTemplateTitle ?? service.name,
            dateTime: formattedDateTime,
            portalUrl: `${appUrl}/portal`,
          })
        );
      }

      // Send invoice for free bookings (amount = 0 but still confirms the booking)
      emailPromises.push(
        sendBookingInvoice({
          clientEmail,
          clientName,
          divinerName: diviner.display_name,
          serviceName: availabilityTemplateTitle ?? service.name,
          dateTime: formattedDateTime,
          duration: service.duration_minutes,
          amount: Number(service.base_price),
          totalPaid: 0,
          bookingId: booking.id,
          portalUrl: `${appUrl}/portal/bookings`,
        })
      );

      // Notify diviner about the new booking
      emailPromises.push(
        (async () => {
          const { data: divinerAuth } = await adminSupabase.auth.admin.getUserById(
            diviner.user_id ?? ""
          );
          const divinerEmail = divinerAuth?.user?.email;
          if (!divinerEmail) return;

          await sendDivinerNewBookingNotification({
            divinerEmail,
            divinerName: diviner.display_name,
            clientName,
            clientEmail,
            serviceName: availabilityTemplateTitle ?? service.name,
            dateTime: formattedDateTime,
            duration: service.duration_minutes,
            amount: 0,
            bookingId: booking.id,
            dashboardUrl: `${appUrl}/dashboard/bookings`,
            questionnaire: questionnaire
              ? {
                  focusQuestion: questionnaire.focusQuestion as string | undefined,
                  lifeArea: questionnaire.lifeArea as string | undefined,
                }
              : undefined,
          });
        })()
      );

      // Fire-and-forget — don't block the response
      console.log("[booking-payment] Sending booking emails to:", clientEmail, "bookingId:", booking.id);
      Promise.all(emailPromises)
        .then(() => console.log("[booking-payment] Booking emails sent successfully"))
        .catch((err) => {
          console.error("[booking-payment] Failed to send booking emails:", {
            bookingId: booking.id,
            clientEmail,
            error: err instanceof Error ? err.message : String(err),
          });
        });

      // Push event to diviner's Google Calendar (non-blocking)
      console.log("[booking-payment] Creating Google Calendar event for diviner:", resolvedDivinerId);
      try {
        const calEventDescription = buildCalendarDescription(
          availabilityTemplateDescription,
          appUrl,
          booking.booking_token,
        );
        // Gather additional attendees for calendar event
        const calAttendees: Array<{ email: string; name?: string }> = [];
        const spEmailCal = questionnaire?.secondPersonEmail as string | undefined;
        const spNameCal = questionnaire?.secondPersonName as string | undefined;
        const spAttendingCal = questionnaire?.secondPersonAttending as string | undefined;
        if (spEmailCal && (spAttendingCal === "yes" || spAttendingCal === "maybe")) {
          calAttendees.push({ email: spEmailCal, name: spNameCal || undefined });
        }

        createCalendarEvent(resolvedDivinerId, {
          title: `${availabilityTemplateTitle ?? service.name} — ${clientName}`,
          description: calEventDescription,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          clientEmail,
          clientName,
          additionalAttendees: calAttendees,
        })
          .then(({ eventId }) =>
            adminSupabase
              .from("bookings")
              .update({ google_calendar_event_id: eventId })
              .eq("id", booking.id)
          )
          .catch((err) =>
            console.error("[Booking] Failed to create Google Calendar event:", err)
          );
      } catch (gcalErr) {
        console.error("[booking-payment] GCal setup error:", gcalErr);
      }
    }

    // Send welcome email for new users on the paid path (outside the $0 block)
    if (isNewUser && shouldCharge) {
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
