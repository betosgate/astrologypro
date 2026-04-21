import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity-log";
import Stripe from "stripe";
import {
  sendBookingConfirmation,
  sendBookingAccessInstructions,
  sendBookingInvoice,
  sendDivinerNewBookingNotification,
  sendGiftCertificateToRecipient,
  sendGiftCertificateConfirmation,
  sendCommunityPaymentFailed,
  sendCommunitySubscriptionCancelled,
  sendMysterySchoolEnrollmentConfirmation,
  sendCommunityMembershipWelcome,
  sendComboBundleWelcome,
} from "@/lib/email";
import { createCalendarEvent } from "@/lib/google-calendar";
import { buildCalendarDescription } from "@/lib/calendar-utils";
import { getActiveChimePhoneNumber } from "@/lib/booking-call-pin";
import { createMsCalendarEvent } from "@/lib/microsoft-calendar";
import { ensureOrderForBooking, getOrderStatusForService } from "@/lib/orders";
import { recordAffiliateCommission } from "@/lib/affiliate-commissions";
import { getSessionLinkForBooking } from "@/lib/service-toolkit-mapping";
import {
  getSubscriptionPeriodEndIso,
  mapMysterySchoolLifecycleUpdate,
} from "@/lib/mystery-school/subscription-lifecycle";
import { finalizeMysterySchoolCheckoutSession } from "@/lib/mystery-school/finalize-checkout";
import { mapStripeSubscriptionStatus } from "@/lib/weekly-subscriptions";
import {
  recordRevenueLedgerEntry,
  getAffiliateCommissionTotalForOrderRef,
  WEEKLY_SUBSCRIPTION_PLATFORM_SHARE_PERCENT,
} from "@/lib/revenue-ledger";
import { PRICING } from "@/lib/constants";
import { calculateMoneySplit } from "@/lib/money-split";
import { provisionNatalReadiness } from "@/lib/community/provision-natal-readiness";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

async function handleGiftCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  const meta = session.metadata ?? {};
  if (meta.type !== "gift_certificate") return;

  const supabase = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

  const code = meta.code;
  const amount = parseFloat(meta.amount ?? "0");

  if (!code || !amount) {
    console.error("[Webhook] Gift checkout missing code or amount", meta);
    return;
  }

  // Idempotency guard — don't double-insert if webhook fires twice
  const { data: existing } = await supabase
    .from("gift_certificates")
    .select("id")
    .eq("code", code)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("gift_certificates").insert({
      diviner_id: meta.diviner_id,
      code,
      purchaser_name: meta.purchaser_name,
      purchaser_email: meta.purchaser_email,
      recipient_name: meta.recipient_name || null,
      recipient_email: meta.recipient_email || null,
      amount,
      remaining_amount: amount,
      message: meta.message || null,
      // Store the Checkout session ID so /api/gift/confirm can look this up
      stripe_payment_intent_id: session.id,
    });

    if (error) {
      console.error("[Webhook] Failed to insert gift certificate:", error);
      return;
    }
  }

  const amountCents = session.amount_total ?? Math.round(amount * 100);
  const split = calculateMoneySplit({
    grossAmountCents: amountCents,
    platformFeePercent: PRICING.platformFeePercent,
    platformFeeRule: "global_platform_fee_percent",
  });

  await recordRevenueLedgerEntry({
    sourceType: "gift_certificate",
    sourceReference: session.id,
    divinerId: meta.diviner_id ?? null,
    grossAmountCents: split.grossAmountCents,
    platformFeeCents: split.platformFeeCents,
    currency: session.currency ?? "usd",
    metadata: {
      code,
      purchaserEmail: meta.purchaser_email ?? null,
      recipientEmail: meta.recipient_email ?? null,
      divinerUsername: meta.diviner_username ?? null,
      splitTrace: split.trace,
    },
  });

  // Send emails (idempotent — SES deduplication window is 24h)
  const redeemUrl = `${appUrl}/gift/${code}`;

  if (meta.recipient_email) {
    await sendGiftCertificateToRecipient({
      recipientEmail: meta.recipient_email,
      purchaserName: meta.purchaser_name,
      divinerName: meta.diviner_name,
      amount,
      code,
      message: meta.message || undefined,
      redeemUrl,
    });
  }

  await sendGiftCertificateConfirmation({
    purchaserEmail: meta.purchaser_email,
    recipientName: meta.recipient_name || undefined,
    divinerName: meta.diviner_name,
    amount,
    code,
  });
}

/**
 * Task 06 — finalize the community plan subscription conversion flow.
 * Fires when a one-time / no-subscription user completes a new recurring
 * Stripe Checkout session via /api/community/plan/change-tier/checkout.
 *
 * Only runs when session.metadata.flow === "community_plan_subscription_conversion".
 * Writes pm_tier_id / stripe_customer_id / stripe_subscription_id ONLY after
 * Stripe confirms the checkout.
 */
async function handleCommunityPlanConversionCompleted(
  session: Stripe.Checkout.Session
) {
  const supabase = createAdminClient();
  const userId = session.metadata?.user_id;
  const communityMemberId = session.metadata?.community_member_id;
  const targetTierId = session.metadata?.target_tier_id;

  if (!userId || !communityMemberId || !targetTierId) {
    console.error(
      "[Webhook] community_plan_subscription_conversion missing required metadata",
      { session_id: session.id, metadata: session.metadata }
    );
    return;
  }

  if (session.payment_status && session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    console.warn("[Webhook] conversion checkout not paid — skipping DB update", {
      session_id: session.id,
      payment_status: session.payment_status,
    });
    return;
  }

  // Verify target tier still exists and is active
  const { data: tier } = await supabase
    .from("pm_plan_tiers")
    .select("id, is_active")
    .eq("id", targetTierId)
    .maybeSingle();
  if (!tier || !tier.is_active) {
    console.error(
      "[Webhook] conversion target tier missing/inactive — manual reconciliation needed",
      { session_id: session.id, target_tier_id: targetTierId }
    );
    return;
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  const { error: updateErr } = await supabase
    .from("community_members")
    .update({
      pm_tier_id: targetTierId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      membership_status: "active",
    })
    .eq("id", communityMemberId)
    .eq("user_id", userId); // tenant-scope by user_id too
  if (updateErr) {
    console.error(
      "[Webhook] CRITICAL: conversion payment succeeded but DB update failed — manual reconciliation required",
      {
        session_id: session.id,
        user_id: userId,
        community_member_id: communityMemberId,
        target_tier_id: targetTierId,
        subscription_id: subscriptionId,
        err: updateErr,
      }
    );
  }
}

async function handleCommunityCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient();
  const userId = session.metadata?.userId;
  const membershipType = session.metadata?.membershipType;
  const planType = session.metadata?.planType ?? "individual";
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!userId || !membershipType) return;

  const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
  const email = authUser?.email ?? "";
  const fullName = (authUser?.user_metadata?.full_name ?? authUser?.user_metadata?.name ?? null) as string | null;

  const isMysterySchool = membershipType === "mystery_school";

  // --- Parallel membership model ---
  // PM and MS are independent entitlements:
  //   community_members   → PM membership (perennial_mandalism)
  //   mystery_school_students → MS entitlement
  //
  // For PM checkout: upsert community_members as before.
  // For MS checkout: provision mystery_school_students WITHOUT touching
  //   an existing PM community_members row.

  let communityMemberId: string | null = null;

  if (!isMysterySchool) {
    // Resolve pm_tier_id: prefer explicit metadata (new conversion flow),
    // otherwise map planType → tier name (Individual/couple → Individual, family → Family).
    const explicitTargetTierId = session.metadata?.target_tier_id ?? null;
    let resolvedTierId: string | null = explicitTargetTierId;
    if (!resolvedTierId) {
      const desiredTierName = planType === "family" ? "Family" : "Individual";
      const { data: tierRow } = await supabase
        .from("pm_plan_tiers")
        .select("id")
        .eq("is_active", true)
        .ilike("name", desiredTierName)
        .maybeSingle();
      resolvedTierId = (tierRow?.id as string | undefined) ?? null;
      if (!resolvedTierId) {
        console.warn(
          `[webhook/community] Could not resolve pm_tier_id for planType=${planType} — member will default to lowest-order tier on read`
        );
      }
    }

    // PM checkout — upsert community_members as the PM record
    const { data: member } = await supabase
      .from("community_members")
      .upsert(
        {
          user_id: userId,
          email,
          full_name: fullName,
          membership_type: membershipType,
          membership_status: "active",
          plan_type: planType,
          stripe_subscription_id: subscriptionId ?? null,
          joined_at: new Date().toISOString(),
          ...(resolvedTierId ? { pm_tier_id: resolvedTierId } : {}),
        },
        { onConflict: "user_id" }
      )
      .select("id")
      .single();

    communityMemberId = member?.id ?? null;

    // Task 08: provision natal readiness for the PM base user immediately after membership creation.
    // Only natal + monthly transit eligibility — relationship charts are NOT provisioned here
    // because no family context exists yet.
    if (communityMemberId && membershipType === "perennial_mandalism") {
      provisionNatalReadiness({
        admin: supabase,
        communityMemberId,
        birthData: {
          fullName,
          // Birth data not available at Stripe checkout time; user fills it in onboarding.
          // The provision function will set natal_status='not_started' and upgrade to
          // 'queued' on the next auth callback or onboarding save.
        },
      }); // fire-and-forget — must not block the webhook response
    }
  } else {
    // MS checkout — look up existing community_members row (may be PM) but do NOT overwrite it
    const { data: existingMember } = await supabase
      .from("community_members")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    communityMemberId = existingMember?.id ?? null;

    // If user has no community_members row at all, create one for MS tracking
    // (new users who go straight to MS without PM)
    if (!communityMemberId) {
      const { data: newMember } = await supabase
        .from("community_members")
        .insert({
          user_id: userId,
          email,
          full_name: fullName,
          membership_type: "mystery_school",
          membership_status: "active",
          plan_type: "individual",
          stripe_subscription_id: subscriptionId ?? null,
          joined_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      communityMemberId = newMember?.id ?? null;
    }
  }

  logActivity({
    userId: userId,
    eventCategory: 'subscription',
    eventType: 'subscription.created',
    metadata: { planName: membershipType, planType, status: 'active' },
  })

  // ── Affiliate commission on community/subscription signup ────────────────
  const communityAffiliateCode = session.metadata?.affiliateCode;
  if (communityAffiliateCode) {
    const amountTotal = (session.amount_total ?? 0) / 100;
    recordSignupAffiliateCommission(
      communityAffiliateCode,
      amountTotal,
      `community-signup:${session.id}`,
      "subscription"
    );
  }

  // Send community welcome email for all membership types (idempotent via SES dedup window)
  if (email) {
    sendCommunityMembershipWelcome({
      to: email,
      name: fullName ?? "Member",
      membershipType,
      planType: planType ?? null,
    }).catch((err) =>
      console.error("[Webhook] Failed to send community welcome email:", err)
    );
  }

  // Provision mystery school student record on enrollment
  if (isMysterySchool) {
    const entryQuarter = session.metadata?.entry_quarter ?? null;
    const enrollmentDate = new Date().toISOString();
    const { error: studentError } = await finalizeMysterySchoolCheckoutSession(session)
      .then(() => ({ error: null }))
      .catch((error: unknown) => ({ error }));

    if (studentError) {
      console.error("[Webhook] Failed to upsert mystery_school_students:", studentError);
    }

    // Send enrollment confirmation email (fire-and-forget; idempotent via SES dedup window)
    if (email) {
      sendMysterySchoolEnrollmentConfirmation({
        to: email,
        name: fullName ?? "Student",
        quarter: entryQuarter,
        entryDate: enrollmentDate,
        startDate: null,
      }).catch((err) =>
        console.error("[Webhook] Failed to send MS enrollment confirmation:", err)
      );
    }

    // NOTE: We intentionally do NOT update community_members.membership_type
    // to 'mystery_school'. PM membership stays intact (parallel entitlement).
  }
}

async function handlePerennialSignupCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  const supabase = createAdminClient();

  // 1. Look up the pending row.
  const { data: pending, error: lookupError } = await supabase
    .from("pending_perennial_signups")
    .select("id, plan_key, household, primary_email, status")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (lookupError || !pending) {
    console.error(
      "[stripe/webhooks] perennial_signup pending row missing:",
      session.id,
      lookupError?.message,
    );
    return;
  }

  // 2. Idempotency: if already completed, do nothing.
  if (pending.status === "completed") {
    return;
  }

  // 3. Mark processing.
  await supabase
    .from("pending_perennial_signups")
    .update({ status: "processing" })
    .eq("id", pending.id);

  // 4. Provision the household.
  const { provisionPerennialHousehold } = await import(
    "@/lib/perennial/household-provisioning"
  );
  const household = pending.household as Parameters<
    typeof provisionPerennialHousehold
  >[1];
  const result = await provisionPerennialHousehold(supabase, household);

  // 5. Persist the outcome.
  const updateFields: Record<string, unknown> = {
    provisioned_user_ids: result.user_ids,
    processed_at: new Date().toISOString(),
  };
  if (result.ok) {
    updateFields.status = "completed";
    updateFields.error_message = null;
  } else {
    updateFields.status = "failed";
    updateFields.error_message = result.errors
      .map((e) => `${e.email}: ${e.error}`)
      .join("; ");
  }

  await supabase
    .from("pending_perennial_signups")
    .update(updateFields)
    .eq("id", pending.id);

  console.log(
    `[stripe/webhooks] perennial_signup ${result.ok ? "completed" : "PARTIAL"} session=${session.id} provisioned=${result.user_ids.length} errors=${result.errors.length}`,
  );
}

async function handleManualBookingCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) return;

  const supabase = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

  // Confirm the booking
  await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", bookingId);

  // Fetch full booking for calendar + email
  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, booking_token, scheduled_at, duration_minutes, base_price, call_pin, metadata, questionnaire_responses, diviner_id, client_id, service_id, services(id, name, slug, category, duration_minutes, requires_birth_data, intake_template_id, product_kind, is_subscription, requires_birth_time, requires_birth_city, requires_partner_data, pre_checkout_fields, post_checkout_fields), diviners(id, display_name, username, chime_phone_number), clients(id, email, full_name)"
    )
    .eq("id", bookingId)
    .single();

  if (!booking) return;

  // Resolve effective phone dial-in info (central+PIN vs per-diviner).
  // Gate is data-driven: if the booking has a PIN AND a central number
  // row is configured active, advertise that. Otherwise fall through to
  // the legacy per-diviner number naturally (both left null).
  let mbAdvertisedCentralNumber: string | null = null;
  let mbAdvertisedCallPin: string | null = null;
  const mbCallPin = (booking as Record<string, unknown>).call_pin as string | null | undefined;
  if (mbCallPin) {
    try {
      const central = await getActiveChimePhoneNumber(supabase as any);
      if (central) {
        mbAdvertisedCentralNumber = central.phoneNumber;
        mbAdvertisedCallPin = mbCallPin;
      }
    } catch (err) {
      console.warn(
        "[webhook:manual-booking] central-number lookup failed; falling back to per-diviner",
        err
      );
    }
  }

  const svc = (booking as Record<string, unknown>).services as {
    id: string;
    name: string;
    slug?: string | null;
    category?: string | null;
    duration_minutes: number;
    requires_birth_data?: boolean | null;
    intake_template_id?: string | null;
    product_kind?: string | null;
    is_subscription?: boolean | null;
    requires_birth_time?: boolean | null;
    requires_birth_city?: boolean | null;
    requires_partner_data?: boolean | null;
    pre_checkout_fields?: unknown;
    post_checkout_fields?: unknown;
  } | null;
  const div = (booking as Record<string, unknown>).diviners as { id: string; display_name: string; username?: string; chime_phone_number?: string | null } | null;
  const clientRecord = (booking as Record<string, unknown>).clients as { id: string; email: string; full_name: string | null } | null;
  const meta = (booking as Record<string, unknown>).metadata as { availability_title?: string; availability_description?: string } | null;

  if (!svc || !div || !clientRecord) return;

  await ensureOrderForBooking(supabase, {
    bookingId,
    clientId: clientRecord.id,
    divinerId: div.id,
    serviceId: svc.id ?? ((booking as Record<string, unknown>).service_id as string),
    service: svc,
    amountCents: Math.round(Number((booking as Record<string, unknown>).base_price ?? 0) * 100),
    currency: session.currency ?? "usd",
    stripePaymentIntentId:
      typeof session.payment_intent === "string" ? session.payment_intent : session.id,
    status: getOrderStatusForService(svc, true, { intakeCompleted: true }),
    paidAt: new Date().toISOString(),
  });

  const startTime = new Date(booking.scheduled_at as string);
  const durationMins = (booking.duration_minutes as number) ?? svc.duration_minutes;
  const endTime = new Date(startTime.getTime() + durationMins * 60 * 1000);
  const sessionLink = div.username
    ? `${appUrl}/${div.username}/session/${bookingId}?token=${booking.booking_token}`
    : `${appUrl}/booking/${booking.booking_token}`;

  const formattedDateTime = startTime.toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });

  const eventTitle = meta?.availability_title ?? svc.name;
  const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${eventTitle} with ${div.display_name}`)}&dates=${startTime.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}/${endTime.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`;

  // Gather all attendee emails from questionnaire_responses
  const qr = (booking as Record<string, unknown>).questionnaire_responses as Record<string, unknown> | null;
  const additionalEmails: Array<{ email: string; name?: string }> = [];
  const spEmail = qr?.secondPersonEmail as string | undefined;
  const spName = qr?.secondPersonName as string | undefined;
  const spAttending = qr?.secondPersonAttending as string | undefined;
  if (spEmail && (spAttending === "yes" || spAttending === "maybe")) {
    additionalEmails.push({ email: spEmail, name: spName || undefined });
  }
  const storedAttendees = Array.isArray(qr?.attendees) ? (qr.attendees as Array<{ name?: string; email?: string }>) : [];
  for (const a of storedAttendees) {
    if (a.email && a.email !== clientRecord.email && !additionalEmails.some((x) => x.email === a.email)) {
      additionalEmails.push({ email: a.email, name: a.name || undefined });
    }
  }

  // Send booking confirmation emails to primary client + all attendees
  const confirmationPromises = [
    sendBookingConfirmation({
      clientEmail: clientRecord.email,
      divinerName: div.display_name,
      serviceName: eventTitle,
      dateTime: formattedDateTime,
      duration: durationMins,
      sessionLink,
      phoneNumber: div.chime_phone_number ?? undefined,
      centralPhoneNumber: mbAdvertisedCentralNumber ?? undefined,
      callPin: mbAdvertisedCallPin ?? undefined,
    }),
    sendBookingAccessInstructions({
      clientEmail: clientRecord.email,
      divinerName: div.display_name,
      serviceName: eventTitle,
      dateTime: formattedDateTime,
      sessionLink,
      calendarLink,
    }),
  ];
  // Send confirmation to additional attendees
  for (const attendee of additionalEmails) {
    confirmationPromises.push(
      sendBookingConfirmation({
        clientEmail: attendee.email,
        divinerName: div.display_name,
        serviceName: eventTitle,
        dateTime: formattedDateTime,
        duration: durationMins,
        sessionLink,
        centralPhoneNumber: mbAdvertisedCentralNumber ?? undefined,
        callPin: mbAdvertisedCallPin ?? undefined,
      })
    );
  }
  await Promise.all(confirmationPromises).catch((err) =>
    console.error("[Webhook] Failed to send manual booking confirmation emails:", err)
  );

  // Push Google Calendar event (createCalendarEvent handles connection lookup internally)
  {
    createCalendarEvent(div.id, {
      title: `${eventTitle} — ${clientRecord.full_name ?? clientRecord.email}`,
      description: buildCalendarDescription(meta?.availability_description ?? null, appUrl, booking.booking_token as string | undefined, {
        sessionLink,
        phoneNumber: div.chime_phone_number,
        centralPhoneNumber: mbAdvertisedCentralNumber,
        callPin: mbAdvertisedCallPin,
      }),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      clientEmail: clientRecord.email,
      clientName: clientRecord.full_name ?? undefined,
      additionalAttendees: additionalEmails,
    })
      .then(({ eventId }) =>
        supabase.from("bookings").update({ google_calendar_event_id: eventId }).eq("id", bookingId)
      )
      .catch((err) =>
        console.error("[Webhook] Failed to create Google Calendar event for manual booking:", err)
      );
  }
}

async function handleComboBundleCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  const supabase = createAdminClient();
  const meta = session.metadata ?? {};
  const userId = meta.userId;
  const planId = meta.planId;
  const planName = meta.planName ?? "Combo Bundle";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

  if (!userId) {
    console.error("[Webhook] Combo bundle checkout missing userId", meta);
    return;
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  // Fetch user metadata (name + username set at signup)
  const {
    data: { user: authUser },
  } = await supabase.auth.admin.getUserById(userId);
  const email = authUser?.email ?? "";
  const username = (authUser?.user_metadata?.username as string) ?? "";
  const displayName =
    (authUser?.user_metadata?.name as string) ??
    email.split("@")[0] ??
    "Diviner";

  if (!username) {
    console.error(
      "[Webhook] Combo bundle checkout missing username in user metadata for userId:",
      userId
    );
    return;
  }

  // ── 1. Upsert diviner record ──────────────────────────────────────────────
  const { error: divinerError } = await supabase.from("diviners").upsert(
    {
      user_id: userId,
      username,
      display_name: displayName,
      stripe_subscription_id: subscriptionId ?? null,
      subscription_status: "active",
      onboarding_completed: false,
      onboarding_step: 1,
      ...(planId ? { plan_id: planId } : {}),
    },
    { onConflict: "user_id" }
  );

  if (divinerError) {
    console.error(
      "[Webhook] Combo bundle: failed to upsert diviner record:",
      divinerError
    );
  }

  // ── 2. Upsert trainee record ──────────────────────────────────────────────
  const { error: traineeError } = await supabase.from("trainees").upsert(
    {
      user_id: userId,
      name: displayName,
      email,
      username,
      training_status: "active",
      onboarding_completed: false,
    },
    { onConflict: "user_id" }
  );

  if (traineeError) {
    console.error(
      "[Webhook] Combo bundle: failed to upsert trainee record:",
      traineeError
    );
  }

  // ── 3. Log activity ───────────────────────────────────────────────────────
  logActivity({
    userId,
    eventCategory: "subscription",
    eventType: "subscription.created",
    metadata: {
      planName,
      planId,
      itemKey: "trainee_diviner_bundle",
      isCombo: true,
      status: "active",
    },
  });

  // ── 4. Send combo welcome email ───────────────────────────────────────────
  if (email) {
    sendComboBundleWelcome({
      to: email,
      name: displayName,
      planName,
      onboardingUrl: `${appUrl}/onboarding`,
    }).catch((err) =>
      console.error(
        "[Webhook] Failed to send combo bundle welcome email:",
        err
      )
    );
  }

  // ── Affiliate commission on combo bundle signup ──────────────────────────
  const comboAffiliateCode = meta.affiliateCode;
  if (comboAffiliateCode) {
    const amountTotal = (session.amount_total ?? 0) / 100;
    recordSignupAffiliateCommission(
      comboAffiliateCode,
      amountTotal,
      `combo-signup:${session.id}`,
      "signup"
    );
  }

  console.log(
    `[Webhook] Combo bundle provisioned: userId=${userId} username=${username} plan=${planName}`
  );
}

async function handleTraineeSignupCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  const supabase = createAdminClient();
  const userId = session.metadata?.userId;

  if (!userId) {
    console.error("[Webhook] trainee_signup: missing userId", session.metadata);
    return;
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.admin.getUserById(userId);

  const email = authUser?.email ?? "";
  const username = (authUser?.user_metadata?.username as string) ?? "";
  const displayName =
    (authUser?.user_metadata?.name as string) ?? email.split("@")[0] ?? "Trainee";

  if (!username) {
    console.error("[Webhook] trainee_signup: missing username", session.metadata);
    return;
  }

  const { error } = await supabase.from("trainees").upsert(
    {
      user_id: userId,
      name: displayName,
      email,
      username,
      training_status: "active",
      onboarding_completed: false,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error(
      "[Webhook] trainee_signup: failed to upsert trainees record:",
      error
    );
  }
}

async function handlePerennialCommunitySignupCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  const supabase = createAdminClient();
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId ?? null;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!userId) {
    console.error(
      "[Webhook] perennial_community_signup: missing userId",
      session.metadata
    );
    return;
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.admin.getUserById(userId);
  const email = authUser?.email ?? "";
  const fullName =
    (authUser?.user_metadata?.name as string) ??
    (authUser?.user_metadata?.full_name as string) ??
    null;

  const { error } = await supabase.from("community_members").upsert(
    {
      user_id: userId,
      email,
      full_name: fullName,
      membership_type: "perennial_mandalism",
      membership_status: "active",
      plan_type: "individual",
      stripe_subscription_id: subscriptionId ?? null,
      joined_at: new Date().toISOString(),
      onboarding_completed: false,
      intake_data: planId ? { selected_plan_id: planId } : {},
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error(
      "[Webhook] perennial_community_signup: failed to upsert community_members:",
      error
    );
  }

  const affiliateCode = session.metadata?.affiliateCode;
  if (affiliateCode) {
    const amountTotal = (session.amount_total ?? 0) / 100;
    recordSignupAffiliateCommission(
      affiliateCode,
      amountTotal,
      `perennial-community-signup:${session.id}`,
      "subscription"
    );
  }
}

/**
 * Fire-and-forget: record an affiliate commission for a signup/subscription checkout.
 * Supports both the old `affiliates` (social_advocates) table and the new
 * `diviner_affiliates` system via `affiliate_referral_links`.
 */
async function recordSignupAffiliateCommission(
  affiliateCode: string,
  amountDollars: number,
  orderRef: string,
  productType: "signup" | "subscription"
) {
  try {
    await recordAffiliateCommission({
      affiliateCode,
      amountCents: Math.round(amountDollars * 100),
      orderRef,
      productType,
    });
  } catch (err) {
    // Fire-and-forget — never block the main flow
    console.error("[Webhook] Failed to record signup affiliate commission:", err);
  }
}

async function handleWeeklySubscriptionCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  const supabase = createAdminClient();
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  const productId = session.metadata?.weeklySubscriptionProductId;
  const divinerId = session.metadata?.divinerId;
  const email = session.metadata?.email;
  const name = session.metadata?.name;

  if (!subscriptionId || !customerId || !productId || !divinerId || !email) {
    console.error("[Webhook] Weekly subscription missing metadata", {
      subscriptionId,
      customerId,
      productId,
      divinerId,
      email,
    });
    return;
  }

  let clientUserId: string | null = null;
  const { data: createdUser, error: createUserError } =
    await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: name ?? email,
      },
    });

  if (createUserError) {
    const { data: existingClient } = await supabase
      .from("clients")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();
    clientUserId = existingClient?.user_id ?? null;

    if (!clientUserId) {
      const { data: authListData } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      const authListUsers = (authListData?.users ?? []) as Array<{ id: string; email?: string }>;
      clientUserId =
        authListUsers.find((user) => user.email === email)?.id ?? null;
    }
  } else {
    clientUserId = createdUser.user.id;
  }

  if (!clientUserId) {
    console.error("[Webhook] Weekly subscription could not resolve client user");
    return;
  }

  const { data: client } = await supabase
    .from("clients")
    .upsert(
      {
        user_id: clientUserId,
        email,
        full_name: name ?? email,
      },
      { onConflict: "user_id" }
    )
    .select("id")
    .single();

  if (!client) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const periodEnd =
    (subscription as unknown as { current_period_end?: number }).current_period_end
      ? new Date(
          (subscription as unknown as { current_period_end: number })
            .current_period_end * 1000
        ).toISOString()
      : null;

  const mappedStatus = mapStripeSubscriptionStatus(subscription.status);

  const weeklySubscriberPayload = {
    product_id: productId,
    diviner_id: divinerId,
    client_id: client.id,
    email,
    name: name ?? null,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: customerId,
    status: mappedStatus === "paused" ? "past_due" : mappedStatus,
    current_period_end: periodEnd,
    subscribed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { data: existingWeeklySubscriber } = await supabase
    .from("weekly_subscription_subscribers")
    .select("id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();
  if (existingWeeklySubscriber) {
    await supabase
      .from("weekly_subscription_subscribers")
      .update(weeklySubscriberPayload)
      .eq("id", existingWeeklySubscriber.id);
  } else {
    await supabase
      .from("weekly_subscription_subscribers")
      .insert(weeklySubscriberPayload);
  }

  const { data: weeklyProduct } = await supabase
    .from("weekly_subscription_products")
    .select("price_cents, title")
    .eq("id", productId)
    .maybeSingle();

  const clientSubscriptionPayload = {
    client_id: client.id,
    diviner_id: divinerId,
    product_id: productId,
    subscription_type: "weekly_updates",
    status: mappedStatus,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: customerId,
    amount_cents: weeklyProduct?.price_cents ?? 1000,
    current_period_end: periodEnd,
    updated_at: new Date().toISOString(),
  };
  const { data: existingClientSubscription } = await supabase
    .from("client_subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();
  if (existingClientSubscription) {
    await supabase
      .from("client_subscriptions")
      .update(clientSubscriptionPayload)
      .eq("id", existingClientSubscription.id);
  } else {
    await supabase
      .from("client_subscriptions")
      .insert(clientSubscriptionPayload);
  }

  const { count: activeSubscriberCount } = await supabase
    .from("weekly_subscription_subscribers")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId)
    .eq("status", "active");

  await supabase
    .from("weekly_subscription_products")
    .update({
      subscriber_count: activeSubscriberCount ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (session.metadata?.affiliateCode && session.amount_total) {
    await recordAffiliateCommission({
      affiliateCode: session.metadata.affiliateCode,
      amountCents: session.amount_total,
      orderRef: `weekly-subscription:${subscriptionId}`,
      productType: "weekly_subscription",
      divinerId,
    });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Route gift certificate checkouts to their own handler
  if (session.metadata?.type === "gift_certificate") {
    return handleGiftCheckoutCompleted(session);
  }

  // Route Community plan subscription conversion (Task 05/06)
  // One-time/manual/no-subscription user just completed a new recurring
  // subscription for a different PM tier.
  if (
    session.metadata?.flow === "community_plan_subscription_conversion"
  ) {
    return handleCommunityPlanConversionCompleted(session);
  }

  // Route community subscription checkouts
  if (session.metadata?.type === "community") {
    return handleCommunityCheckoutCompleted(session);
  }

  if (session.metadata?.type === "weekly_subscription") {
    return handleWeeklySubscriptionCheckoutCompleted(session);
  }

  // Route Perennial multi-member household signups
  if (session.metadata?.type === "perennial_signup") {
    return handlePerennialSignupCheckoutCompleted(session);
  }

  if (session.metadata?.type === "perennial_community_signup") {
    return handlePerennialCommunitySignupCheckoutCompleted(session);
  }

  // Route combo bundle (trainee + diviner) checkouts
  if (session.metadata?.itemKey === "trainee_diviner_bundle") {
    return handleComboBundleCheckoutCompleted(session);
  }

  if (session.metadata?.type === "trainee_signup") {
    return handleTraineeSignupCheckoutCompleted(session);
  }

  // Handle manual booking payment link checkout
  if (session.metadata?.bookingId) {
    return handleManualBookingCheckoutCompleted(session);
  }

  const supabase = createAdminClient();
  const userId = session.metadata?.userId;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!userId || !subscriptionId) {
    console.error("Missing data in checkout session:", {
      userId,
      subscriptionId,
    });
    return;
  }

  // Fetch user metadata (name + username set at signup)
  const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
  const username = authUser?.user_metadata?.username as string | undefined;
  const displayName = (authUser?.user_metadata?.name ?? authUser?.email ?? "Diviner") as string;

  if (!username) {
    console.error("Missing username in user metadata for userId:", userId);
    return;
  }

  const planId = session.metadata?.planId as string | undefined;

  // Upsert so re-fired webhooks don't duplicate
  const { error } = await supabase.from("diviners").upsert(
    {
      user_id: userId,
      username,
      display_name: displayName,
      stripe_subscription_id: subscriptionId,
      subscription_status: "active",
      onboarding_step: 1,
      ...(planId ? { plan_id: planId } : {}),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("Failed to upsert diviner record:", error);
  }

  // ── Affiliate commission on diviner signup ────────────────────────────────
  const signupAffiliateCode = session.metadata?.affiliateCode;
  if (signupAffiliateCode) {
    const amountTotal = (session.amount_total ?? 0) / 100;
    recordSignupAffiliateCommission(
      signupAffiliateCode,
      amountTotal,
      `diviner-signup:${session.id}`,
      "signup"
    );
  }
}

function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent;
  if (!parent) return null;
  const details = parent.subscription_details;
  if (!details) return null;
  const sub = details.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

async function handleMysterySchoolSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  const adminClient = createAdminClient();

  const { data: student } = await adminClient
    .from("mystery_school_students")
    .select("id, status")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (!student) return;

  const now = new Date().toISOString();
  const update = mapMysterySchoolLifecycleUpdate(subscription, now);

  await adminClient
    .from("mystery_school_students")
    .update(update)
    .eq("id", student.id);
}

async function syncWeeklySubscriptionStatus(
  admin: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription,
  nextStatusOverride?: "cancelled" | "past_due" | "active" | "paused"
) {
  const mappedStatus =
    nextStatusOverride ?? mapStripeSubscriptionStatus(subscription.status);
  const periodEnd =
    (subscription as unknown as { current_period_end?: number }).current_period_end
      ? new Date(
          (subscription as unknown as { current_period_end: number })
            .current_period_end * 1000
        ).toISOString()
      : null;
  const cancelledAt =
    mappedStatus === "cancelled" ? new Date().toISOString() : null;

  await admin
    .from("client_subscriptions")
    .update({
      status: mappedStatus,
      current_period_end: periodEnd,
      cancelled_at: cancelledAt,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  await admin
    .from("weekly_subscription_subscribers")
    .update({
      status: mappedStatus === "paused" ? "past_due" : mappedStatus,
      current_period_end: periodEnd,
      cancelled_at: cancelledAt,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const supabase = createAdminClient();
  const subscriptionId = getSubscriptionIdFromInvoice(invoice);
  if (!subscriptionId) return;

  const { error } = await supabase
    .from("diviners")
    .update({ subscription_status: "active" })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    console.error("Failed to update subscription status on invoice.paid:", error);
  }

  // Mystery School: a paid invoice confirms the subscription is still billable.
  // Do not undo scheduled cancellation windows, but clear a paused state.
  const { data: student } = await supabase
    .from("mystery_school_students")
    .select("id, status")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (student && student.status === "paused") {
    await supabase
      .from("mystery_school_students")
      .update({
        status: "active",
        paused_at: null,
      })
      .eq("id", student.id);
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncWeeklySubscriptionStatus(supabase, subscription, "active");

  const { data: weeklySubscription } = await supabase
    .from("client_subscriptions")
    .select("id, client_id, diviner_id, product_id")
    .eq("stripe_subscription_id", subscriptionId)
    .eq("subscription_type", "weekly_updates")
    .maybeSingle();

  if (weeklySubscription && invoice.amount_paid > 0) {
    const affiliateCode = subscription.metadata?.affiliateCode;
    const orderRef = `weekly-subscription-invoice:${invoice.id}`;

    if (affiliateCode) {
      await recordAffiliateCommission({
        affiliateCode,
        amountCents: invoice.amount_paid,
        orderRef,
        productType: "weekly_subscription",
        divinerId: weeklySubscription.diviner_id,
      });
    }

    const affiliateCommissionCents =
      await getAffiliateCommissionTotalForOrderRef(orderRef);

    const subscriptionSplit = calculateMoneySplit({
      grossAmountCents: invoice.amount_paid,
      platformFeePercent: WEEKLY_SUBSCRIPTION_PLATFORM_SHARE_PERCENT,
      affiliateCommissionCents,
      platformFeeRule: "weekly_subscription_platform_share_percent",
      affiliateRule: affiliateCode ? "affiliate_commission_rule" : "no_affiliate_share",
    });

    await recordRevenueLedgerEntry({
      sourceType: "weekly_subscription_invoice",
      sourceReference: invoice.id,
      sourceId: weeklySubscription.id,
      divinerId: weeklySubscription.diviner_id,
      clientId: weeklySubscription.client_id,
      productId: weeklySubscription.product_id,
      grossAmountCents: subscriptionSplit.grossAmountCents,
      platformFeeCents: subscriptionSplit.platformFeeCents,
      affiliateCommissionCents: subscriptionSplit.affiliateCommissionCents,
      currency: invoice.currency,
      metadata: {
        stripeInvoiceId: invoice.id,
        stripeSubscriptionId: subscriptionId,
        splitTrace: subscriptionSplit.trace,
      },
    });
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const supabase = createAdminClient();
  const subscriptionId = getSubscriptionIdFromInvoice(invoice);
  if (!subscriptionId) return;

  // Diviner: mark as past_due
  const { error } = await supabase
    .from("diviners")
    .update({ subscription_status: "past_due" })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    console.error(
      "Failed to update subscription status on payment_failed:",
      error
    );
  }

  // Community member: keep active but send payment-failed warning
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : (invoice.customer as Stripe.Customer | null)?.id ?? null;

  if (customerId) {
    const { data: communityMember } = await supabase
      .from("community_members")
      .select("id, user_id, email, full_name, membership_status")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (communityMember) {
      // Keep access active — just alert the member
      await supabase
        .from("community_members")
        .update({ membership_status: "active" })
        .eq("id", communityMember.id);

      if (communityMember.user_id) {
        logActivity({
          userId: communityMember.user_id,
          eventCategory: 'payment',
          eventType: 'payment.failed',
          metadata: {
            error: 'invoice_payment_failed',
            amountDue: invoice.amount_due / 100,
            currency: invoice.currency,
          },
        })
      }

      if (communityMember.email) {
        sendCommunityPaymentFailed({
          to: communityMember.email,
          name: communityMember.full_name ?? "Member",
          amount: (invoice.amount_due / 100).toFixed(2),
          currency: invoice.currency.toUpperCase(),
          retryDate: invoice.next_payment_attempt
            ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString()
            : "soon",
          billingPortalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/community/plan?tab=billing`,
      }).catch(() => {});
    }
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncWeeklySubscriptionStatus(supabase, subscription, "past_due");
}

  // Mystery School: keep access state unchanged for payment failure.
  // Stripe will send subscription.updated / deleted when the lifecycle actually changes.
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const adminClient = createAdminClient();
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : (subscription.customer as Stripe.Customer).id;

  await handleMysterySchoolSubscriptionUpdated(subscription);
  await syncWeeklySubscriptionStatus(adminClient, subscription);

  // ── Diviner SaaS plan upsert ────────────────────────────────────────────────
  await upsertDivinerPlanSubscription(adminClient, subscription, customerId);

  // ── Community member status sync ────────────────────────────────────────────
  const { data: member } = await adminClient
    .from("community_members")
    .select("id, user_id, email, membership_status")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!member) return;

  const newStatus = subscription.status;
  const cancelAtPeriodEnd =
    (subscription as unknown as { cancel_at_period_end?: boolean })
      .cancel_at_period_end ?? false;

  const mappedStatus =
    newStatus === "active" && cancelAtPeriodEnd
      ? "cancelling" // scheduled to cancel at period end
      : newStatus === "active"
      ? "active"
      : newStatus === "past_due"
      ? "active" // keep access, just flag payment issue
      : newStatus === "canceled"
      ? "cancelled"
      : newStatus === "paused"
      ? "paused"
      : member.membership_status;

  const subAny = subscription as unknown as { current_period_end?: number };
  const periodEnd = subAny.current_period_end
    ? new Date(subAny.current_period_end * 1000).toISOString()
    : null;

  await adminClient
    .from("community_members")
    .update({
      membership_status: mappedStatus,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("id", member.id);

  if (member.user_id) {
    logActivity({
      userId: member.user_id,
      eventCategory: 'subscription',
      eventType: 'subscription.updated',
      metadata: { status: mappedStatus, stripeStatus: newStatus },
    })
  }
}

// ─── Diviner SaaS plan subscription helpers ───────────────────────────────────

type SupabaseAdminClient = ReturnType<typeof createAdminClient>;

function mapStripeStatusToDiviner(
  stripeStatus: Stripe.Subscription.Status
): string {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
      return "cancelled";
    case "unpaid":
      return "suspended";
    default:
      return stripeStatus;
  }
}

async function upsertDivinerPlanSubscription(
  admin: SupabaseAdminClient,
  subscription: Stripe.Subscription,
  customerId: string
): Promise<void> {
  // Only process subscriptions tagged for diviner SaaS
  const metadata = subscription.metadata ?? {};
  const divinerId = metadata.diviner_id as string | undefined;
  if (!divinerId && metadata.type !== "diviner_saas") {
    // Not a diviner SaaS subscription — nothing to do here
    return;
  }

  // Resolve diviner by customer ID if metadata doesn't have it
  let resolvedDivinerId = divinerId;
  if (!resolvedDivinerId) {
    const { data: d } = await admin
      .from("diviners")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    resolvedDivinerId = d?.id;
  }

  if (!resolvedDivinerId) {
    console.warn("[Webhook] upsertDivinerPlanSubscription: no diviner found for customer", customerId);
    return;
  }

  // Ensure stripe_customer_id is recorded on the diviners row
  await admin
    .from("diviners")
    .update({ stripe_customer_id: customerId })
    .eq("id", resolvedDivinerId)
    .is("stripe_customer_id", null);

  const subAny = subscription as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  };

  const periodStart = subAny.current_period_start
    ? new Date(subAny.current_period_start * 1000).toISOString()
    : null;
  const periodEnd = subAny.current_period_end
    ? new Date(subAny.current_period_end * 1000).toISOString()
    : null;

  const items = subscription.items?.data ?? [];
  const firstItem = items[0];
  const firstPriceId = firstItem?.price?.id ?? null;

  // Look up the plan by Stripe price ID
  let planId: string | null = null;
  if (firstPriceId) {
    const { data: plan } = await admin
      .from("diviner_plans")
      .select("id")
      .eq("stripe_price_id", firstPriceId)
      .maybeSingle();
    planId = plan?.id ?? null;
  }

  const mappedStatus = mapStripeStatusToDiviner(subscription.status);

  // Upsert the plan subscription row
  await admin.from("diviner_plan_subscriptions").upsert(
    {
      diviner_id: resolvedDivinerId,
      plan_id: planId,
      status: mappedStatus,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );

  // Upsert add-on items (any items beyond the first)
  const addonItems = items.slice(1);
  for (const item of addonItems) {
    const addonPriceId = item.price?.id;
    if (!addonPriceId) continue;

    const { data: addon } = await admin
      .from("diviner_plan_addons")
      .select("id")
      .eq("stripe_price_id", addonPriceId)
      .maybeSingle();

    if (!addon) continue;

    await admin.from("diviner_active_addons").upsert(
      {
        diviner_id: resolvedDivinerId,
        addon_id: addon.id,
        status: "active",
        stripe_subscription_item_id: item.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_item_id" }
    );
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const periodEnd = getSubscriptionPeriodEndIso(subscription) ?? now;

  await syncWeeklySubscriptionStatus(supabase, subscription, "cancelled");

  // Diviner legacy subscription cancelled
  await supabase
    .from("diviners")
    .update({ subscription_status: "cancelled", is_active: false })
    .eq("stripe_subscription_id", subscription.id);

  // Diviner SaaS plan subscription cancelled
  const { data: saasSubRow } = await supabase
    .from("diviner_plan_subscriptions")
    .select("id, diviner_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (saasSubRow) {
    await supabase
      .from("diviner_plan_subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", saasSubRow.id);

    await supabase
      .from("diviner_active_addons")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("diviner_id", saasSubRow.diviner_id);
  }

  // Community membership cancelled — fetch member before updating so we have email
  const { data: communityMember } = await supabase
    .from("community_members")
    .select("id, user_id, email, full_name, current_period_end")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (communityMember) {
    await supabase
      .from("community_members")
      .update({ membership_status: "cancelled" })
      .eq("id", communityMember.id);

    if (communityMember.user_id) {
      logActivity({
        userId: communityMember.user_id,
        eventCategory: 'subscription',
        eventType: 'subscription.cancelled',
        metadata: { stripeSubscriptionId: subscription.id },
      })
    }

    if (communityMember.email) {
      const subDelAny = subscription as unknown as { current_period_end?: number };
      const accessUntil = communityMember.current_period_end
        ? new Date(communityMember.current_period_end).toLocaleDateString(
            "en-US",
            { month: "long", day: "numeric", year: "numeric" }
          )
        : subDelAny.current_period_end
        ? new Date(subDelAny.current_period_end * 1000).toLocaleDateString(
            "en-US",
            { month: "long", day: "numeric", year: "numeric" }
          )
        : "the end of the current billing period";

      sendCommunitySubscriptionCancelled({
        to: communityMember.email,
        name: communityMember.full_name ?? "Member",
        accessUntil,
        rejoinUrl: `${process.env.NEXT_PUBLIC_APP_URL}/community/join`,
      }).catch(() => {});
    }
  }

  const { data: mysterySchoolStudent } = await supabase
    .from("mystery_school_students")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (mysterySchoolStudent) {
    await supabase
      .from("mystery_school_students")
      .update({
        status: "cancelled",
        paused_at: null,
        cancelled_at: now,
        access_expires_at: periodEnd,
      })
      .eq("id", mysterySchoolStudent.id);
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("diviners")
    .update({
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
    })
    .eq("stripe_account_id", account.id);

  if (error) {
    console.error("Failed to update Connect account status:", error);
  }
}

async function handleDivinerSignupPaymentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  const userId = paymentIntent.metadata?.user_id;
  const email = paymentIntent.metadata?.email;
  if (!userId) {
    console.warn(
      "[stripe/webhooks] diviner_signup payment_intent missing user_id metadata"
    );
    return;
  }

  const supabase = createAdminClient();

  // Mark the trainee as having paid. Idempotent — re-running with the same
  // payment_intent_id is a no-op.
  const { error: updateError } = await supabase
    .from("trainees")
    .update({
      training_status: "paid",
      payment_intent_id: paymentIntent.id,
      paid_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (updateError) {
    // Defensive: payment_intent_id / paid_at columns may not exist on
    // every environment yet. Don't fail the webhook — log and move on.
    console.warn(
      "[stripe/webhooks] diviner_signup trainees update warning:",
      updateError.message
    );
  }

  console.log(
    `[stripe/webhooks] diviner_signup payment succeeded user=${userId} email=${email ?? "?"} intent=${paymentIntent.id}`
  );
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  // Diviner signup payments use type=diviner_signup metadata. Route them to
  // the dedicated handler and return — they don't have bookingId.
  if (paymentIntent.metadata?.type === "diviner_signup") {
    await handleDivinerSignupPaymentSucceeded(paymentIntent);
    return;
  }

  const phoneSessionId =
    paymentIntent.metadata?.phone_session_id ??
    paymentIntent.metadata?.phoneSessionId;
  if (phoneSessionId) {
    const supabase = createAdminClient();
    const { data: phoneSession } = await supabase
      .from("phone_sessions")
      .select("id, diviner_id, client_id, booking_id, amount_charged")
      .eq("id", phoneSessionId)
      .maybeSingle();

    if (phoneSession) {
      await recordRevenueLedgerEntry({
        sourceType: "telephony",
        sourceReference: `phone-session:${phoneSession.id}`,
        sourceId: phoneSession.id,
        divinerId: phoneSession.diviner_id,
        clientId: phoneSession.client_id,
        grossAmountCents:
          Math.round(Number(phoneSession.amount_charged ?? 0) * 100) ||
          paymentIntent.amount,
        platformFeeCents:
          Number(paymentIntent.application_fee_amount ?? 0) ||
          Math.round(paymentIntent.amount * (PRICING.platformFeePercent / 100)),
        currency: paymentIntent.currency,
        metadata: {
          stripePaymentIntentId: paymentIntent.id,
          bookingId: phoneSession.booking_id ?? null,
        },
      });
    }
    return;
  }

  const bookingId = paymentIntent.metadata?.bookingId;
  const clientEmail = paymentIntent.metadata?.clientEmail;
  const affiliateCode = paymentIntent.metadata?.affiliateCode;
  const refCodeFromPi = paymentIntent.metadata?.refCode ?? null;
  if (!bookingId || !clientEmail) return;

  const supabase = createAdminClient();

  // Mark booking as confirmed + (defensive) persist ref_code if it wasn't
  // already stamped at booking creation time.
  await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      ...(refCodeFromPi ? { ref_code: refCodeFromPi } : {}),
    })
    .eq("id", bookingId);

  // ── Task 03: credit affiliate commission if this booking was attributed
  // via ?ref=. Idempotent (UNIQUE (booking_id) on campaign_conversions).
  try {
    const { creditAffiliateConversion } = await import("@/lib/affiliate-attribution");
    const { data: bookingForAttribution } = await supabase
      .from("bookings")
      .select("id, diviner_id, service_id, base_price, total_amount, ref_code, services(template_id)")
      .eq("id", bookingId)
      .single();

    if (bookingForAttribution?.ref_code) {
      const svc = bookingForAttribution.services as { template_id?: string | null } | { template_id?: string | null }[] | null;
      const templateId = Array.isArray(svc)
        ? svc[0]?.template_id ?? null
        : svc?.template_id ?? null;
      const amountCents =
        Number(bookingForAttribution.total_amount ?? bookingForAttribution.base_price ?? 0) * 100;

      await creditAffiliateConversion(supabase, {
        bookingId: bookingForAttribution.id as string,
        divinerId: bookingForAttribution.diviner_id as string,
        templateId,
        orderAmountCents: Math.round(amountCents),
        refCode: bookingForAttribution.ref_code as string,
      });
    }
  } catch (err) {
    // Never fail the webhook on commission errors — log and continue so
    // Stripe doesn't retry forever.
    console.error("[affiliate_conversion] credit failed", { bookingId, err });
  }

  // Fetch booking with related data for the email + calendar sync
  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, booking_token, scheduled_at, duration_minutes, base_price, call_pin, diviner_id, client_id, service_id, metadata, questionnaire_responses, services(id, name, slug, category, duration_minutes, requires_birth_data, intake_template_id, product_kind, is_subscription, requires_birth_time, requires_birth_city, requires_partner_data, pre_checkout_fields, post_checkout_fields), diviners(id, display_name, user_id, username, chime_phone_number), clients(id, email, full_name, user_id)"
    )
    .eq("id", bookingId)
    .single();

  if (!booking) return;

  // Resolve effective phone dial-in info (central+PIN vs per-diviner).
  // Gate is data-driven: if the booking has a PIN AND a central number
  // row is configured active, advertise that. Otherwise fall through to
  // the legacy per-diviner number naturally (both left null).
  let paidAdvertisedCentralNumber: string | null = null;
  let paidAdvertisedCallPin: string | null = null;
  const paidCallPin = (booking as Record<string, unknown>).call_pin as string | null | undefined;
  if (paidCallPin) {
    try {
      const central = await getActiveChimePhoneNumber(supabase as any);
      if (central) {
        paidAdvertisedCentralNumber = central.phoneNumber;
        paidAdvertisedCallPin = paidCallPin;
      }
    } catch (err) {
      console.warn(
        "[webhook:paid-booking] central-number lookup failed; falling back to per-diviner",
        err
      );
    }
  }

  const svc = (booking as Record<string, unknown>).services as {
    id: string;
    name: string;
    slug?: string | null;
    category?: string | null;
    duration_minutes: number;
    requires_birth_data?: boolean | null;
    intake_template_id?: string | null;
    product_kind?: string | null;
    is_subscription?: boolean | null;
    requires_birth_time?: boolean | null;
    requires_birth_city?: boolean | null;
    requires_partner_data?: boolean | null;
    pre_checkout_fields?: unknown;
    post_checkout_fields?: unknown;
  } | null;
  const div = (booking as Record<string, unknown>).diviners as {
    id: string;
    display_name: string;
    user_id: string;
    username?: string;
    chime_phone_number?: string | null;
  } | null;
  const clientRecord = (booking as Record<string, unknown>).clients as {
    id: string;
    email: string;
    full_name: string | null;
    user_id: string | null;
  } | null;
  const bookingMeta = (booking as Record<string, unknown>).metadata as {
    availability_title?: string;
    availability_description?: string;
  } | null;
  const eventTitle = bookingMeta?.availability_title ?? svc?.name;

  if (!svc || !div) return;

  const orderId = await ensureOrderForBooking(supabase, {
    bookingId,
    clientId:
      clientRecord?.id ??
      ((booking as Record<string, unknown>).client_id as string),
    divinerId: div.id,
    serviceId: svc.id ?? ((booking as Record<string, unknown>).service_id as string),
    service: svc,
    amountCents: paymentIntent.amount,
    currency: paymentIntent.currency ?? "usd",
    stripePaymentIntentId: paymentIntent.id,
    status: getOrderStatusForService(svc, true, { intakeCompleted: true }),
    paidAt: new Date().toISOString(),
  });

  if (affiliateCode) {
    await recordAffiliateCommission({
      affiliateCode,
      amountCents: paymentIntent.amount,
      orderRef: `booking:${bookingId}`,
      productType: "booking",
      divinerId: div.id,
    });
  }

  const orderReference = `booking:${bookingId}`;
  const affiliateCommissionCents =
    await getAffiliateCommissionTotalForOrderRef(orderReference);

  const bookingSplit = calculateMoneySplit({
    grossAmountCents:
      Number(paymentIntent.metadata?.grossAmountCents ?? paymentIntent.amount) ||
      paymentIntent.amount,
    platformFeePercent:
      Number(paymentIntent.metadata?.splitPlatformFeePercent ?? NaN) ||
      PRICING.platformFeePercent,
    affiliateCommissionCents,
    platformFeeRule:
      paymentIntent.metadata?.splitPlatformFeeRule ?? "payment_intent_platform_fee",
    affiliateRule:
      paymentIntent.metadata?.splitAffiliateRule ??
      (affiliateCode ? "affiliate_commission_rule" : "no_affiliate_share"),
    memberDiscountApplied: paymentIntent.metadata?.memberDiscount === "5%",
  });

  await recordRevenueLedgerEntry({
    sourceType: "booking",
    sourceReference: orderReference,
    sourceId: orderId,
    divinerId: div.id,
    clientId: clientRecord?.id ?? ((booking as Record<string, unknown>).client_id as string),
    productId: svc.id,
    grossAmountCents: bookingSplit.grossAmountCents,
    platformFeeCents: bookingSplit.platformFeeCents,
    affiliateCommissionCents: bookingSplit.affiliateCommissionCents,
    currency: paymentIntent.currency,
    metadata: {
      stripePaymentIntentId: paymentIntent.id,
      bookingId,
      orderId,
      splitTrace: bookingSplit.trace,
    },
  });

  // Calendar connection checks — createCalendarEvent handles lookup internally,
  // but we still need flags for Microsoft calendar
  const hasGoogleCalendar = true; // Always try — createCalendarEvent handles connection lookup
  const { data: msConnections } = await supabase
    .from("calendar_connections")
    .select("provider")
    .eq("owner_id", div.id);
  const { data: divinerCalPaid } = await supabase
    .from("diviners")
    .select("outlook_calendar_token")
    .eq("id", div.id)
    .single();
  const hasMicrosoftCalendar =
    msConnections?.some((connection) => connection.provider === "microsoft") ||
    !!(divinerCalPaid?.outlook_calendar_token);

  if (clientRecord?.user_id) {
    const amount = paymentIntent.amount / 100
    logActivity({
      userId: clientRecord.user_id,
      eventCategory: 'payment',
      eventType: 'payment.succeeded',
      metadata: { amount, bookingId, orderId, divinerId: booking.diviner_id },
    })
    logActivity({
      userId: clientRecord.user_id,
      eventCategory: 'booking',
      eventType: 'booking.created',
      metadata: {
        bookingId,
        divinerId: booking.diviner_id,
        serviceName: svc.name,
      },
    })
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const sessionLink = div?.username
    ? `${appUrl}/${div.username}/session/${bookingId}?token=${booking.booking_token}`
    : `${appUrl}/booking/${booking.booking_token}`;
  const portalOrderUrl = `${appUrl}/login?redirect=${encodeURIComponent(
    `/portal/orders/${orderId}`
  )}`;
  const startTime = new Date(booking.scheduled_at);
  const durationMins = booking.duration_minutes ?? svc.duration_minutes;
  const endTime = new Date(startTime.getTime() + durationMins * 60 * 1000);

  const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${svc.name} with ${div.display_name}`)}&dates=${startTime.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}/${endTime.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}&details=${encodeURIComponent(`Your reading session on AstrologyPro.\n\nJoin: ${sessionLink}`)}`;

  const emailParams = {
    clientEmail,
    divinerName: div.display_name,
    serviceName: svc.name,
    dateTime: startTime.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    sessionLink,
    duration: svc.duration_minutes,
    phoneNumber: div.chime_phone_number ?? undefined,
    centralPhoneNumber: paidAdvertisedCentralNumber ?? undefined,
    callPin: paidAdvertisedCallPin ?? undefined,
  };

  // Gather additional attendees from questionnaire_responses
  const paidQR = (booking as Record<string, unknown>).questionnaire_responses as Record<string, unknown> | null;
  const paidAdditionalAttendees: Array<{ email: string; name?: string }> = [];
  const paidSpEmail = paidQR?.secondPersonEmail as string | undefined;
  const paidSpName = paidQR?.secondPersonName as string | undefined;
  const paidSpAttending = paidQR?.secondPersonAttending as string | undefined;
  if (paidSpEmail && (paidSpAttending === "yes" || paidSpAttending === "maybe")) {
    paidAdditionalAttendees.push({ email: paidSpEmail, name: paidSpName || undefined });
  }
  const paidStoredAttendees = Array.isArray(paidQR?.attendees) ? (paidQR.attendees as Array<{ name?: string; email?: string }>) : [];
  for (const a of paidStoredAttendees) {
    if (a.email && a.email !== clientEmail && !paidAdditionalAttendees.some((x) => x.email === a.email)) {
      paidAdditionalAttendees.push({ email: a.email, name: a.name || undefined });
    }
  }

  // Send confirmation to primary client + all additional attendees
  const paidConfirmPromises = [
    sendBookingConfirmation(emailParams),
    sendBookingAccessInstructions({ ...emailParams, calendarLink }),
  ];
  for (const attendee of paidAdditionalAttendees) {
    paidConfirmPromises.push(
      sendBookingConfirmation({
        ...emailParams,
        clientEmail: attendee.email,
      })
    );
  }
  await Promise.all(paidConfirmPromises);

  // Send invoice to client (fire-and-forget)
  const paidAmount = paymentIntent.amount / 100;
  sendBookingInvoice({
    clientEmail,
    clientName: clientRecord?.full_name ?? clientEmail.split("@")[0],
    divinerName: div.display_name,
    serviceName: svc.name,
    dateTime: emailParams.dateTime,
    duration: durationMins,
    amount: Number(booking.base_price ?? paidAmount),
    totalPaid: paidAmount,
    bookingId,
    portalUrl: portalOrderUrl,
  }).catch((err) =>
    console.error("[Webhook] Failed to send booking invoice:", err)
  );

  // Notify diviner about the new booking (fire-and-forget)
  (async () => {
    try {
      // Get diviner's email from auth.users
      const { data: divinerAuth } = await supabase.auth.admin.getUserById(
        div.user_id
      );
      const divinerEmail = divinerAuth?.user?.email;
      if (!divinerEmail) return;

      const questionnaire = (booking as Record<string, unknown>)
        .questionnaire_responses as Record<string, string> | null;

      const toolkitSessionPath = getSessionLinkForBooking({
        bookingId,
        templateSlug: svc?.slug ?? null,
        category: svc?.category ?? null,
      });
      const toolkitSessionUrl = toolkitSessionPath
        ? `${appUrl}${toolkitSessionPath}`
        : null;

      await sendDivinerNewBookingNotification({
        divinerEmail,
        divinerName: div.display_name,
        clientName: clientRecord?.full_name ?? clientEmail.split("@")[0],
        clientEmail,
        serviceName: svc.name,
        dateTime: emailParams.dateTime,
        duration: durationMins,
        amount: paidAmount,
        bookingId,
        dashboardUrl: `${appUrl}/dashboard/bookings`,
        questionnaire: questionnaire
          ? {
              focusQuestion: questionnaire.focusQuestion,
              lifeArea: questionnaire.lifeArea,
            }
          : undefined,
        sessionUrl: toolkitSessionUrl,
      });
    } catch (err) {
      console.error("[Webhook] Failed to send diviner booking notification:", err);
    }
  })();

  // Push event to diviner's Google Calendar if connected
  if (hasGoogleCalendar) {
    createCalendarEvent(div.id, {
      title: `${eventTitle} — ${clientRecord?.full_name ?? clientEmail}`,
      description: buildCalendarDescription(
        bookingMeta?.availability_description ?? null,
        appUrl,
        booking.booking_token as string | undefined,
        {
          sessionLink,
          phoneNumber: div?.chime_phone_number,
          centralPhoneNumber: paidAdvertisedCentralNumber,
          callPin: paidAdvertisedCallPin,
        },
      ),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      clientEmail: clientRecord?.email ?? clientEmail,
      clientName: clientRecord?.full_name ?? undefined,
      additionalAttendees: paidAdditionalAttendees,
    })
      .then(({ eventId }) =>
        supabase
          .from("bookings")
          .update({ google_calendar_event_id: eventId })
          .eq("id", bookingId)
      )
      .catch((err) =>
        console.error("[Webhook] Failed to create Google Calendar event:", err)
      );
  }

  // Push event to diviner's Outlook Calendar if connected (non-blocking)
  if (hasMicrosoftCalendar) {
    createMsCalendarEvent(div.id, {
      id: bookingId,
      scheduled_at: startTime.toISOString(),
      duration_minutes: durationMins,
      client: {
        full_name: clientRecord?.full_name ?? undefined,
        email: clientRecord?.email ?? clientEmail,
      },
      service: { name: svc.name },
      daily_room_url: sessionLink,
    })
      .then((msEventId) => {
        if (msEventId) {
          return supabase
            .from("bookings")
            .update({ outlook_calendar_event_id: msEventId })
            .eq("id", bookingId);
        }
      })
      .catch((err) =>
        console.error("[Webhook] Failed to create Outlook Calendar event:", err)
      );
  }
}

// ─── Diviner SaaS invoice handler ────────────────────────────────────────────

async function handleDivinerInvoice(
  invoice: Stripe.Invoice,
  isPaid: boolean
): Promise<void> {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : (invoice.customer as Stripe.Customer | null)?.id ?? null;

  if (!customerId) return;

  const admin = createAdminClient();

  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!diviner) return;

  const invoiceAny = invoice as unknown as {
    period_start?: number;
    period_end?: number;
  };

  const periodStart = invoiceAny.period_start
    ? new Date(invoiceAny.period_start * 1000).toISOString()
    : null;
  const periodEnd = invoiceAny.period_end
    ? new Date(invoiceAny.period_end * 1000).toISOString()
    : null;

  const invoiceUrl =
    (invoice as unknown as { hosted_invoice_url?: string | null })
      .hosted_invoice_url ?? null;
  const pdfUrl =
    (invoice as unknown as { invoice_pdf?: string | null }).invoice_pdf ?? null;

  await admin.from("diviner_invoices").upsert(
    {
      diviner_id: diviner.id,
      stripe_invoice_id: invoice.id,
      amount_cents: invoice.amount_due,
      status: isPaid ? "paid" : "open",
      invoice_url: invoiceUrl,
      pdf_url: pdfUrl,
      description: invoice.description ?? null,
      period_start: periodStart,
      period_end: periodEnd,
      paid_at: isPaid ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_invoice_id" }
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        await handleDivinerInvoice(event.data.object as Stripe.Invoice, true);
        break;
      case "invoice.payment_succeeded":
        await handleDivinerInvoice(event.data.object as Stripe.Invoice, true);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice
        );
        await handleDivinerInvoice(event.data.object as Stripe.Invoice, false);
        break;
      case "customer.subscription.created":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;
      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(`Error handling ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
