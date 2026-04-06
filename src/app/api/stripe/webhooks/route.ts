import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";
import {
  sendBookingConfirmation,
  sendBookingAccessInstructions,
  sendGiftCertificateToRecipient,
  sendGiftCertificateConfirmation,
  sendCommunityPaymentFailed,
  sendCommunitySubscriptionCancelled,
  sendMysterySchoolEnrollmentConfirmation,
} from "@/lib/email";
import { createCalendarEvent } from "@/lib/google-calendar";

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

async function handleCommunityCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient();
  const userId = session.metadata?.userId;
  const membershipType = session.metadata?.membershipType;
  const planType = session.metadata?.planType ?? "individual";
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : (session.subscription as any)?.id;

  if (!userId || !membershipType) return;

  const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
  const email = authUser?.email ?? "";
  const fullName = (authUser?.user_metadata?.full_name ?? authUser?.user_metadata?.name ?? null) as string | null;

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
      },
      { onConflict: "user_id" }
    )
    .select("id")
    .single();

  // Provision mystery school student record on enrollment
  if (membershipType === "mystery_school") {
    const entryQuarter = session.metadata?.entry_quarter ?? null;
    const entryYearRaw = session.metadata?.entry_year;
    const entryYear = entryYearRaw ? parseInt(entryYearRaw, 10) : null;
    const enrollmentDate = new Date().toISOString();

    // Idempotent upsert — repeated webhook delivery is safe
    const { error: studentError } = await supabase
      .from("mystery_school_students")
      .upsert(
        {
          user_id: userId,
          community_member_id: member?.id ?? null,
          enrolled_at: enrollmentDate,
          enrollment_date: enrollmentDate,
          training_status: "foundation",
          entry_quarter: entryQuarter,
          entry_year: entryYear,
          stripe_subscription_id: subscriptionId ?? null,
          one_time_fee_paid: true,
          one_time_fee_amount: 97.00,
          status: "active",
        },
        { onConflict: "user_id" }
      );

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

    // If this was a PM → MS upgrade, ensure the community_members row reflects
    // the new membership type (it was already set above via the upsert, but
    // explicitly confirm in case a pre-existing row conflicted).
    const upgradeFromPm = session.metadata?.upgrade_from_pm === "true";
    if (upgradeFromPm && member?.id) {
      await supabase
        .from("community_members")
        .update({ membership_type: "mystery_school", membership_status: "active" })
        .eq("id", member.id);
    }
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Route gift certificate checkouts to their own handler
  if (session.metadata?.type === "gift_certificate") {
    return handleGiftCheckoutCompleted(session);
  }

  // Route community subscription checkouts
  if (session.metadata?.type === "community") {
    return handleCommunityCheckoutCompleted(session);
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
      .select("id, email, full_name, membership_status")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (communityMember) {
      // Keep access active — just alert the member
      await supabase
        .from("community_members")
        .update({ membership_status: "active" })
        .eq("id", communityMember.id);

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
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const adminClient = createAdminClient();
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : (subscription.customer as Stripe.Customer).id;

  const { data: member } = await adminClient
    .from("community_members")
    .select("id, user_id, email, membership_status")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!member) return;

  const newStatus = subscription.status;
  const mappedStatus =
    newStatus === "active"
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
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  const supabase = createAdminClient();

  // Diviner subscription cancelled
  await supabase
    .from("diviners")
    .update({ subscription_status: "cancelled", is_active: false })
    .eq("stripe_subscription_id", subscription.id);

  // Community membership cancelled — fetch member before updating so we have email
  const { data: communityMember } = await supabase
    .from("community_members")
    .select("id, email, full_name, current_period_end")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (communityMember) {
    await supabase
      .from("community_members")
      .update({ membership_status: "cancelled" })
      .eq("id", communityMember.id);

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

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  const bookingId = paymentIntent.metadata?.bookingId;
  const clientEmail = paymentIntent.metadata?.clientEmail;
  if (!bookingId || !clientEmail) return;

  const supabase = createAdminClient();

  // Mark booking as confirmed
  await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", bookingId);

  // Fetch booking with related data for the email + calendar sync
  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, scheduled_at, duration_minutes, diviner_id, client_id, services(name, duration_minutes), diviners(id, display_name, google_calendar_connected), clients(email, full_name)"
    )
    .eq("id", bookingId)
    .single();

  if (!booking) return;

  const svc = (booking as Record<string, unknown>).services as {
    name: string;
    duration_minutes: number;
  } | null;
  const div = (booking as Record<string, unknown>).diviners as {
    id: string;
    display_name: string;
    google_calendar_connected: boolean;
  } | null;
  const clientRecord = (booking as Record<string, unknown>).clients as {
    email: string;
    full_name: string | null;
  } | null;

  if (!svc || !div) return;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const sessionLink = `${appUrl}/session/${bookingId}`;
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
  };

  await Promise.all([
    sendBookingConfirmation(emailParams),
    sendBookingAccessInstructions({ ...emailParams, calendarLink }),
  ]);

  // Push event to diviner's Google Calendar if connected
  if (div.google_calendar_connected) {
    createCalendarEvent(div.id, {
      title: `${svc.name} — ${clientRecord?.full_name ?? clientEmail}`,
      description: `Client: ${clientEmail}\nSession link: ${sessionLink}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      clientEmail: clientRecord?.email ?? clientEmail,
      clientName: clientRecord?.full_name ?? undefined,
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
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice
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
