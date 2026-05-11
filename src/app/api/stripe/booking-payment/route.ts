import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity-log";
import { trackDivinerActivityEvent } from "@/lib/diviner-analytics";
import { createPaymentIntent } from "@/lib/stripe/connect";
import { createCalendarEvent } from "@/lib/google-calendar";
import { buildCalendarDescription, stripHtml } from "@/lib/calendar-utils";
import { PRICING } from "@/lib/constants";
import { ensureOrderForBooking, getOrderStatusForService } from "@/lib/orders";
import { getServicePurchaseConfig } from "@/lib/service-purchase";
import { applyRuntimePricesToServices } from "@/lib/runtime-service-pricing";
import { isDivinerPayoutReadyForPaidServices } from "@/lib/payout-readiness";
import { calculateMoneySplit } from "@/lib/money-split";
import { getSessionLinkForBooking } from "@/lib/service-toolkit-mapping";
import { resolveStampForBooking } from "@/lib/affiliate-stamp";
import { computeCommissionCents } from "@/lib/affiliate-attribution";
import {
  generateBookingCallPin,
  getActiveChimePhoneNumber,
} from "@/lib/booking-call-pin";
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
  /**
   * 2026-04-21 affiliate sprint: the `?ref=` value from the URL (e.g.
   * `cmp_abCD1234`). When present and valid (matches /^cmp_[A-Za-z0-9]{8}$/),
   * the booking row persists it in bookings.ref_code and the Stripe
   * webhook will use it to credit commission to the owning affiliate.
   */
  refCode?: string;
  giftCode?: string;
  policyAcknowledgedAt?: string;
  booking_notes?: string;
  discount_token?: string;
  /** True when the slot is from an unscoped availability (no service linked). Skips charging. */
  freeSlot?: boolean;
  /**
   * Optional reference to a `service_template_intake_submissions` row.
   * Set by the `/book/template/[slug]` shared-calendar flow so the saved
   * intake remains linked to the created booking. Persisted to
   * `bookings.metadata.intake_submission_id` so future toolkit modules
   * can load the intake payload without needing a schema change.
   */
  submissionId?: string;
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
      refCode: rawRefCode,
      giftCode,
      policyAcknowledgedAt,
      booking_notes,
      discount_token,
      freeSlot,
      submissionId: rawSubmissionId,
    } = body;

    // Only accept a UUID-shaped value so a malformed query param can't
    // poison the metadata blob.
    const submissionId =
      typeof rawSubmissionId === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          rawSubmissionId.trim(),
        )
        ? rawSubmissionId.trim()
        : null;
    const questionnaireData = questionnaire ?? {};

    // Sanitize ref_code against cmp_XXXXXXXX pattern so random URL params
    // can't pollute the column.
    const { sanitizeRefCode } = await import("@/lib/affiliate-attribution");
    const refCode = sanitizeRefCode(rawRefCode);

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

    const t0 = Date.now();
    const lap = (label: string) => console.log(`[booking-payment] ${label} +${Date.now() - t0}ms`);

    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    lap("clients created");

    // Fetch the service first (source of truth for diviner_id)
    let { data: service, error: serviceError } = await adminSupabase
      .from("services")
      .select("id, name, slug, category, base_price, pricing_item_key, duration_minutes, diviner_id, requires_birth_data, intake_template_id, product_kind, is_subscription, requires_birth_time, requires_birth_city, requires_partner_data, pre_checkout_fields, post_checkout_fields")
      .eq("id", serviceId)
      .eq("is_active", true)
      .single();

    if (serviceError || !service) {
      const fallback = await supabase
        .from("services")
        .select("id, name, slug, category, base_price, pricing_item_key, duration_minutes, diviner_id, requires_birth_data, intake_template_id, product_kind, is_subscription, requires_birth_time, requires_birth_city, requires_partner_data, pre_checkout_fields, post_checkout_fields")
        .eq("id", serviceId)
        .eq("is_active", true)
        .single();
      service = fallback.data ?? null;
      serviceError = serviceError ?? fallback.error;
    }

    lap("service fetched");

    if (!service) {
      return NextResponse.json(
        { error: "Service not found", details: serviceError?.message ?? null },
        { status: 404 }
      );
    }
    [service] = await applyRuntimePricesToServices(adminSupabase, [service]);
    const purchaseConfig = getServicePurchaseConfig(service);

    let resolvedDivinerId = service.diviner_id ?? null;
    let diviner: {
      id: string;
      user_id?: string;
      stripe_account_id: string | null;
      charges_enabled?: boolean | null;
      payouts_enabled?: boolean | null;
      display_name: string;
      video_provider?: string;
      username?: string;
      chime_phone_number?: string | null;
    } | null = null;
    let divinerError: { message?: string } | null = null;

    async function fetchDivinerById(id: string) {
      let result = await adminSupabase
        .from("diviners")
        .select("id, user_id, stripe_account_id, charges_enabled, payouts_enabled, display_name, video_provider, username, chime_phone_number")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (result.error || !result.data) {
        result = await supabase
          .from("diviners")
          .select("id, user_id, stripe_account_id, charges_enabled, payouts_enabled, display_name, video_provider, username, chime_phone_number")
          .eq("id", id)
          .eq("is_active", true)
          .single();
      }

      return result;
    }

    async function fetchDivinerByUsername(username: string) {
      let result = await adminSupabase
        .from("diviners")
        .select("id, user_id, stripe_account_id, charges_enabled, payouts_enabled, display_name, video_provider, username, chime_phone_number")
        .eq("username", username)
        .eq("is_active", true)
        .single();

      if (result.error || !result.data) {
        result = await supabase
          .from("diviners")
          .select("id, user_id, stripe_account_id, charges_enabled, payouts_enabled, display_name, video_provider, username, chime_phone_number")
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
          .select("id, stripe_account_id, charges_enabled, payouts_enabled, display_name")
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

    lap("diviner resolved");

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

    lap("templates resolved");

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
        const { data: authListData } = await adminSupabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        const authListUsers = (authListData?.users ?? []) as Array<{ id: string; email?: string }>;
        const authUser = authListUsers.find((u) => u.email === clientEmail);
        clientAuthUserId = authUser?.id;
      }
    } else {
      isNewUser = true;
      clientAuthUserId = createUserData.user.id;
    }

    lap("auth user resolved");

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
    // Stale "pending" bookings from abandoned checkouts are cleaned up, not blocked.
    const { data: slotConflict } = await adminSupabase
      .from("bookings")
      .select("id, client_id, status")
      .eq("diviner_id", resolvedDivinerId)
      .eq("scheduled_at", scheduledAt)
      .not("status", "in", '("cancelled","no_show")')
      .maybeSingle();

    if (slotConflict) {
      // Same client retrying — cancel the stale pending booking so they can rebook
      if (slotConflict.client_id === client.id && slotConflict.status === "pending") {
        await adminSupabase
          .from("bookings")
          .update({ status: "cancelled", cancellation_reason: "Superseded by new checkout attempt" })
          .eq("id", slotConflict.id);
        lap("cancelled stale pending booking " + slotConflict.id);
      } else if (slotConflict.client_id === client.id) {
        return NextResponse.json(
          { error: "You have already booked this time slot" },
          { status: 409 }
        );
      } else {
        // Different client holds an active booking — slot is taken
        if (slotConflict.status !== "pending") {
          return NextResponse.json(
            { error: "This time slot is no longer available" },
            { status: 409 }
          );
        }
        // Another client's pending booking — allow override (they may have abandoned checkout)
      }
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

    // Calculate platform fee on the final price.
    // Use service-level fee if configured, otherwise fall back to global default (20%).
    // Member discount token: platform fee drops by 5% (floor at 10%).
    const basePlatformFeePercent =
      typeof (service as Record<string, unknown>).platform_fee_percent === "number"
        ? Number((service as Record<string, unknown>).platform_fee_percent)
        : PRICING.platformFeePercent;
    const effectivePlatformFeePercent = memberDiscountApplied
      ? Math.max(basePlatformFeePercent - 5, 10)
      : basePlatformFeePercent;

    // Resolve the commission rate stamp BEFORE the money split so the
    // affiliate carve-out (Phase-2-prerequisite, sprint
    // docs/tasks/2026-05-05/affiliate-carve-out-at-booking-creation/) can
    // feed into calculateMoneySplit. If refCode is valid AND all five
    // §3.8 conditions pass, the stamp fields get populated on the booking
    // row at creation time and become the authoritative rate for
    // commission payout when the Stripe webhook fires. If any condition
    // fails, the stamp fields stay NULL and the booking will never earn
    // commission — the diviner keeps 100% of the payment.
    const stamp = await resolveStampForBooking(adminSupabase, {
      refCode: refCode ?? null,
      divinerId: resolvedDivinerId,
      serviceId,
    });
    if (refCode && stamp.reason !== "stamped") {
      console.log(
        JSON.stringify({
          event: "affiliate_stamp_skipped",
          refCode,
          reason: stamp.reason,
          divinerId: resolvedDivinerId,
          serviceId,
        }),
      );
    }

    // Phase-2-prerequisite carve-out: when the booking is stamped,
    // compute the cents the affiliate is owed and feed it into the
    // money split so the PaymentIntent's application_fee_amount
    // includes the affiliate's share. Diviner's destination transfer
    // is correspondingly reduced. Non-stamped bookings → 0 cents →
    // unchanged from current behavior.
    const grossAmountCentsForCarveOut = Math.round(finalPrice * 100);
    const affiliateCommissionCents =
      stamp.reason === "stamped"
        ? computeCommissionCents(
          grossAmountCentsForCarveOut,
          stamp.rate_type_stamp,
          stamp.rate_value_stamp,
        )
        : 0;

    const grossAmountCents = Math.round(finalPrice * 100);
    const bookingSplit = calculateMoneySplit({
      grossAmountCents,
      platformFeePercent: effectivePlatformFeePercent,
      affiliateCommissionCents,
      platformFeeRule:
        typeof (service as Record<string, unknown>).platform_fee_percent === "number"
          ? "service_platform_fee_percent"
          : "global_platform_fee_percent",
      affiliateRule:
        affiliateCommissionCents > 0 ? "stamped_affiliate_share" : "no_affiliate_share",
      memberDiscountApplied,
    });
    // What stays on platform balance: platform's true fee + affiliate's
    // share (Phase 2 will later transfer the affiliate share out to the
    // affiliate's connected account). The diviner's destination transfer
    // is the remainder, equal to bookingSplit.divinerNetAmountCents.
    const platformPlusAffiliateCents =
      bookingSplit.platformFeeCents + bookingSplit.affiliateCommissionCents;
    const platformFee = platformPlusAffiliateCents / 100;
    // freeSlot=true means the client selected an unscoped availability (no service_id).
    // Verify this server-side: if the best-matched template has no service_id, honour the override.
    const bestTemplateServiceId =
      allTemplates && allTemplates.length > 0
        ? ((allTemplates as Record<string, unknown>[]).find(
          (t) => t.service_id === serviceId
        ) ??
          (allTemplates as Record<string, unknown>[]).find(
            (t) =>
              String(t.start_date ?? "") <= bookingDateStr &&
              String(t.end_date ?? "") >= bookingDateStr
          ) ??
          allTemplates[0]) as Record<string, unknown> | undefined
        : undefined;
    const slotIsVerifiedFree =
      freeSlot === true && (bestTemplateServiceId?.service_id == null);
    if (slotIsVerifiedFree) finalPrice = 0;
    const shouldCharge = hasServiceAvailability && finalPrice > 0 && !slotIsVerifiedFree;

    if (shouldCharge && !isDivinerPayoutReadyForPaidServices(diviner)) {
      return NextResponse.json(
        {
          error:
            "This diviner is still completing payment setup. Paid booking is temporarily unavailable.",
        },
        { status: 409 }
      );
    }

    // Calculate end time
    const startTime = new Date(scheduledAt);
    const endTime = new Date(
      startTime.getTime() + service.duration_minutes * 60 * 1000
    );

    lap("client + conflicts resolved");

    // Generate a call PIN for shared-central-number routing. This is
    // always generated (additive, nullable column, no user-facing
    // effect unless an active chime_phone_numbers row is configured)
    // so the column is ready the moment ops provisions a central number.
    // Failure here is non-fatal — we log and continue; the booking is
    // still valid.
    const callPin = await generateBookingCallPin(adminSupabase as any).catch(
      (err) => {
        console.warn("[booking-payment] call PIN generation failed", err);
        return null;
      }
    );
    if (!callPin) {
      console.warn(
        "[booking-payment] proceeding without call PIN (generator exhausted or errored)"
      );
    }

    // (Stamp resolution moved above the money split — see top of this
    // function. The `stamp` and `affiliateCommissionCents` locals are
    // already in scope here for the booking insert.)

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
        video_provider: diviner.video_provider ?? "daily",
        questionnaire_responses: Object.keys(questionnaireData).length > 0 ? questionnaireData : null,
        booking_notes: booking_notes ?? null,
        metadata: {
          ...requestMetadata,
          pre_checkout_fields: purchaseConfig.preCheckoutFields,
          post_checkout_fields: purchaseConfig.postCheckoutFields,
          ...(availabilityTemplateTitle ? { availability_title: availabilityTemplateTitle } : {}),
          ...(availabilityTemplateDescription ? { availability_description: availabilityTemplateDescription } : {}),
          ...(submissionId ? { intake_submission_id: submissionId } : {}),
        },
        ...(policyAcknowledgedAt ? { policy_acknowledged_at: policyAcknowledgedAt } : {}),
        ...(refCode ? { ref_code: refCode } : {}),
        ...(stamp.reason === "stamped"
          ? {
            commission_source_assignment_id: stamp.source_assignment_id,
            commission_source_template_id: stamp.source_template_id,
            commission_source_campaign_id: stamp.source_campaign_id,
            commission_rate_type_stamp: stamp.rate_type_stamp,
            commission_rate_value_stamp: stamp.rate_value_stamp,
            affiliate_commission_amount_cents: affiliateCommissionCents,
          }
          : {}),
        ...(callPin
          ? {
            call_pin: callPin.pin,
            call_pin_generated_at: callPin.generatedAt,
          }
          : {}),
      })
      .select("id, booking_token")
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    // Resolve which phone dial-in to advertise to the client on the
    // confirmation email / Gcal / confirmation page. Gate is data-
    // driven: if this booking has a PIN and an active central number
    // row exists, advertise the central number + PIN. Otherwise the
    // helpers fall back to the legacy per-diviner number naturally
    // (centralPhoneNumber/callPin will be null).
    let advertisedCentralNumber: string | null = null;
    let advertisedCallPin: string | null = null;
    if (callPin) {
      try {
        const central = await getActiveChimePhoneNumber(adminSupabase as any);
        if (central) {
          advertisedCentralNumber = central.phoneNumber;
          advertisedCallPin = callPin.pin;
        }
      } catch (err) {
        console.warn(
          "[booking-payment] central-number lookup failed; falling back to per-diviner number",
          err
        );
      }
    }

    await trackDivinerActivityEvent({
      divinerId: diviner.id,
      activityType: "booking_checkout_started",
      path: divinerUsername
        ? `/${divinerUsername}/book/${service.slug ?? service.id}`
        : null,
      referrer: request.headers.get("referer"),
      request,
      metadata: {
        bookingId: booking.id,
        serviceId: service.id,
        serviceName: service.name,
        affiliateCode: affiliateCode ?? null,
      },
    });

    // Booking wizard collects all intake data pre-checkout (name, email, phone,
    // birth data, notes), so post-payment intake is never needed for bookings.
    const initialOrderStatus = shouldCharge
      ? "pending_payment"
      : getOrderStatusForService(service, true, { intakeCompleted: true });
    const orderId = await ensureOrderForBooking(adminSupabase as any, {
      bookingId: booking.id,
      clientId: client.id,
      divinerId: resolvedDivinerId,
      serviceId,
      service,
      amountCents: grossAmountCents,
      currency: "usd",
      status: initialOrderStatus,
      paidAt: shouldCharge ? null : new Date().toISOString(),
      notes: booking_notes ?? null,
    });

    let clientSecret: string | null = null;

    // Only create a payment intent if there's an amount to charge
    if (shouldCharge) {
      const paymentIntent = await createPaymentIntent({
        amount: finalPrice,
        connectedAccountId: diviner.stripe_account_id!,
        platformFeeAmount: platformFee,
        metadata: {
          bookingId: booking.id,
          bookingToken: booking.booking_token,
          orderId,
          divinerId: resolvedDivinerId,
          serviceId,
          clientEmail,
          connectedAccountId: diviner.stripe_account_id ?? "",
          grossAmountCents: String(bookingSplit.grossAmountCents),
          platformFeeCents: String(bookingSplit.platformFeeCents),
          divinerGrossAmountCents: String(bookingSplit.divinerGrossAmountCents),
          divinerNetAmountCents: String(bookingSplit.divinerNetAmountCents),
          affiliateCommissionCents: String(bookingSplit.affiliateCommissionCents),
          applicationFeeCents: String(
            bookingSplit.platformFeeCents + bookingSplit.affiliateCommissionCents,
          ),
          splitPlatformFeePercent: String(bookingSplit.trace.platformFeePercent),
          splitPlatformFeeRule: bookingSplit.trace.platformFeeRule,
          splitAffiliateRule: bookingSplit.trace.affiliateRule,
          ...(affiliateCode ? { affiliateCode } : {}),
          ...(refCode ? { refCode } : {}),
          ...(giftCode ? { giftCode } : {}),
          ...(loyaltyRuleName
            ? { loyaltyDiscount: `${loyaltyDiscountPercent}%` }
            : {}),
          ...(memberDiscountApplied ? { memberDiscount: "5%" } : {}),
        },
      });

      lap("payment intent created");
      clientSecret = paymentIntent.client_secret;

      await adminSupabase
        .from("bookings")
        .update({ stripe_payment_intent_id: paymentIntent.id })
        .eq("id", booking.id);

      await ensureOrderForBooking(adminSupabase as any, {
        bookingId: booking.id,
        clientId: client.id,
        divinerId: resolvedDivinerId,
        serviceId,
        service,
        amountCents: grossAmountCents,
        currency: "usd",
        stripePaymentIntentId: paymentIntent.id,
        status: "pending_payment",
        notes: booking_notes ?? null,
      });

      // Push Google Calendar event immediately for paid bookings so it works
      // without needing the Stripe webhook (webhook will update if needed).
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
      const paidSessionLink = diviner?.username
        ? `${appUrl}/${diviner.username}/session/${booking.id}?token=${booking.booking_token}`
        : `${appUrl}/booking/${booking.booking_token}`;
      try {
        const calEventDescription = buildCalendarDescription(
          availabilityTemplateDescription,
          appUrl,
          booking.booking_token,
          {
            sessionLink: paidSessionLink,
            phoneNumber: diviner?.chime_phone_number,
            centralPhoneNumber: advertisedCentralNumber,
            callPin: advertisedCallPin,
          },
        );
        const calAttendeesPaid: Array<{ email: string; name?: string }> = [];
        const spEmailPaid = questionnaireData.secondPersonEmail as string | undefined;
        const spNamePaid = questionnaireData.secondPersonName as string | undefined;
        const spAttendingPaid = questionnaireData.secondPersonAttending as string | undefined;
        if (spEmailPaid && (spAttendingPaid === "yes" || spAttendingPaid === "maybe")) {
          calAttendeesPaid.push({ email: spEmailPaid, name: spNamePaid || undefined });
        }
        createCalendarEvent(resolvedDivinerId, {
          title: `${availabilityTemplateTitle ?? service.name} — ${clientName}`,
          description: calEventDescription,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          clientEmail,
          clientName,
          additionalAttendees: calAttendeesPaid,
        })
          .then(({ eventId }) =>
            adminSupabase
              .from("bookings")
              .update({ google_calendar_event_id: eventId })
              .eq("id", booking.id)
          )
          .catch((err) =>
            console.error("[booking-payment] Failed to create Google Calendar event (paid):", err)
          );
      } catch (gcalErr) {
        console.error("[booking-payment] GCal setup error (paid):", gcalErr);
      }

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
      // Token-based direct join link — no login required for client
      const portalBookingsUrl = diviner?.username
        ? `${appUrl}/${diviner.username}/session/${booking.id}?token=${booking.booking_token}`
        : `${appUrl}/booking/${booking.booking_token}`;
      const orderDetailUrl = `${appUrl}/login?redirect=${encodeURIComponent(
        `/portal/orders/${orderId}`
      )}`;
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
        phoneNumber: diviner.chime_phone_number ?? undefined,
        centralPhoneNumber: advertisedCentralNumber ?? undefined,
        callPin: advertisedCallPin ?? undefined,
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
            portalUrl: orderDetailUrl,
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
          portalUrl: orderDetailUrl,
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

          const toolkitPath = getSessionLinkForBooking({
            bookingId: booking.id,
            templateSlug: service.slug ?? null,
            category: service.category ?? null,
          });

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
                focusQuestion: questionnaireData.focusQuestion as string | undefined,
                lifeArea: questionnaireData.lifeArea as string | undefined,
              }
              : undefined,
            sessionUrl: toolkitPath ? `${appUrl}${toolkitPath}` : null,
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
          {
            sessionLink: portalBookingsUrl,
            phoneNumber: diviner?.chime_phone_number,
            centralPhoneNumber: advertisedCentralNumber,
            callPin: advertisedCallPin,
          },
        );
        // Gather additional attendees for calendar event
        const calAttendees: Array<{ email: string; name?: string }> = [];
        const spEmailCal = questionnaireData.secondPersonEmail as string | undefined;
        const spNameCal = questionnaireData.secondPersonName as string | undefined;
        const spAttendingCal = questionnaireData.secondPersonAttending as string | undefined;
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
      const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com"}/login?redirect=${encodeURIComponent(
        `/portal/orders/${orderId}`
      )}`;
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
    const secondPersonEmail = questionnaireData.secondPersonEmail as string | undefined;
    const secondPersonName = questionnaireData.secondPersonName as string | undefined;
    const secondPersonAttending = questionnaireData.secondPersonAttending as string | undefined;

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
        divinerLandingUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://astrologypro.com"}/${(diviner as any).slug || ""}`,
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

    lap(`done — clientSecret=${clientSecret ? "yes" : "no"}`);

    return NextResponse.json({
      clientSecret,
      bookingId: booking.id,
      bookingToken: booking.booking_token,
      orderId,
      requiresPostPaymentIntake: purchaseConfig.requiresPostPaymentIntake,
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
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
