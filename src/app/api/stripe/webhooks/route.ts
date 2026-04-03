import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";
import {
  sendBookingConfirmation,
  sendBookingAccessInstructions,
} from "@/lib/email";
import { createCalendarEvent } from "@/lib/google-calendar";

export const runtime = "nodejs";

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
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
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("diviners")
    .update({ subscription_status: "cancelled", is_active: false })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Failed to deactivate diviner on subscription deleted:", error);
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
      .then(({ eventId }) => {
        supabase
          .from("bookings")
          .update({ google_calendar_event_id: eventId })
          .eq("id", bookingId)
          .then(() => {});
      })
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
