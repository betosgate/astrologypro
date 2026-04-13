import { createAdminClient } from "@/lib/supabase/admin";
import { buildEmailHtml, infoCard } from "@/lib/email-base";
import { sendEmail } from "@/lib/email";
import { createWeeklySubscriptionManageToken } from "@/lib/weekly-subscription-manage-token";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

interface DeliveryRow {
  id: string;
  diviner_id: string;
  subject: string;
  content: string;
  scheduled_for: string;
}

interface SubscriberRow {
  id: string;
  email: string;
  name: string | null;
  email_opt_out?: boolean | null;
}

interface DivinerRow {
  display_name: string | null;
  username: string | null;
}

interface DeliverySendResult {
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  lastError: string | null;
}

function buildWeeklyDeliveryHtml(params: {
  divinerName: string;
  subject: string;
  content: string;
  manageUrl: string;
}) {
  const { divinerName, subject, content, manageUrl } = params;

  const formattedContent = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p style="margin:0 0 16px;color:#d4d4d8;">${block}</p>`)
    .join("");

  return buildEmailHtml({
    title: subject,
    preheader: `Your weekly update from ${divinerName}`,
    content: `
      <p style="margin:0 0 16px;color:#a1a1aa;">Your weekly update from <strong style="color:#f4f4f5;">${divinerName}</strong> is here.</p>
      ${formattedContent || infoCard("Your diviner has shared a new weekly update.")}
      ${infoCard(`Manage your subscription or preferences in your portal: <a href="${manageUrl}" style="color:#c9a84c;">${manageUrl}</a>`)}
    `,
    ctaText: "Open My Portal",
    ctaUrl: manageUrl,
    footer: `You are receiving this because you subscribed to weekly updates from ${divinerName}. <a href="${manageUrl}" style="color:#71717a;text-decoration:underline;">Manage subscription</a><br/>AstrologyPro &mdash; Run Your Divination Business`,
  });
}

async function sendDeliveryToSubscribers(params: {
  delivery: DeliveryRow;
  diviner: DivinerRow;
  subscribers: SubscriberRow[];
}) {
  const { delivery, diviner, subscribers } = params;
  const divinerName = diviner.display_name ?? "Your Diviner";
  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  let lastError: string | null = null;

  for (const subscriber of subscribers) {
    if (subscriber.email_opt_out) {
      skippedCount += 1;
      continue;
    }

    const token = createWeeklySubscriptionManageToken({
      subscriberId: subscriber.id,
      email: subscriber.email,
    });
    const manageUrl = `${APP_URL}/subscriptions/manage?token=${encodeURIComponent(token)}`;

    try {
      await sendEmail({
        to: subscriber.email,
        subject: delivery.subject,
        html: buildWeeklyDeliveryHtml({
          divinerName,
          subject: delivery.subject,
          content: delivery.content,
          manageUrl,
        }),
      });
      sentCount += 1;
    } catch (error) {
      failedCount += 1;
      lastError =
        error instanceof Error ? error.message : "Unknown email send error";
      console.error(
        `[weekly-deliveries] failed to send delivery ${delivery.id} to ${subscriber.email}`,
        error
      );
    }
  }

  return {
    sentCount,
    failedCount,
    skippedCount,
    lastError,
  } satisfies DeliverySendResult;
}

export async function sendImmediateWeeklyDelivery(params: {
  divinerId: string;
  subject: string;
  content: string;
}) {
  const admin = createAdminClient();

  const [divinerResult, subscribersResult] = await Promise.all([
    admin
      .from("diviners")
      .select("display_name, username")
      .eq("id", params.divinerId)
      .single(),
    admin
      .from("weekly_subscription_subscribers")
      .select("id, email, name, email_opt_out")
      .eq("diviner_id", params.divinerId)
      .eq("status", "active"),
  ]);

  const subscribers = (subscribersResult.data ?? []) as SubscriberRow[];
  if (!divinerResult.data || subscribers.length === 0) {
    return {
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
      lastError: divinerResult.data ? null : "Diviner not found.",
    } satisfies DeliverySendResult;
  }

  return sendDeliveryToSubscribers({
    delivery: {
      id: "immediate-send",
      diviner_id: params.divinerId,
      subject: params.subject,
      content: params.content,
      scheduled_for: new Date().toISOString(),
    },
    diviner: divinerResult.data as DivinerRow,
    subscribers,
  });
}

export async function processScheduledWeeklyDeliveries(limit = 20) {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: deliveries, error } = await admin
    .from("weekly_subscription_deliveries")
    .select("id, diviner_id, subject, content, scheduled_for")
    .eq("status", "scheduled")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  let processed = 0;
  let sent = 0;
  let failed = 0;

  for (const delivery of (deliveries ?? []) as DeliveryRow[]) {
    const [divinerResult, subscribersResult] = await Promise.all([
      admin
        .from("diviners")
        .select("display_name, username")
        .eq("id", delivery.diviner_id)
        .single(),
      admin
        .from("weekly_subscription_subscribers")
        .select("id, email, name, email_opt_out")
        .eq("diviner_id", delivery.diviner_id)
        .eq("status", "active"),
    ]);

    const diviner = divinerResult.data as DivinerRow | null;
    const subscribers = (subscribersResult.data ?? []) as SubscriberRow[];

    if (!diviner) {
      const failureMessage = "Delivery skipped because the diviner profile could not be found.";
      console.error(
        `[weekly-deliveries] delivery ${delivery.id} skipped because diviner was not found`
      );
      await admin
        .from("weekly_subscription_deliveries")
        .update({
          status: "failed",
          attempted_at: now,
          failed_at: now,
          last_error: failureMessage,
          updated_at: now,
        })
        .eq("id", delivery.id)
        .eq("status", "scheduled");
      failed += 1;
      continue;
    }

    const result = await sendDeliveryToSubscribers({
      delivery,
      diviner,
      subscribers,
    });

    const nextStatus =
      result.sentCount > 0 || subscribers.length === 0 ? "sent" : "failed";

    const { error: updateError } = await admin
      .from("weekly_subscription_deliveries")
      .update({
        status: nextStatus,
        sent_at: nextStatus === "sent" ? now : null,
        attempted_at: now,
        failed_at: nextStatus === "failed" ? now : null,
        recipient_count: result.sentCount,
        failed_recipient_count: result.failedCount,
        last_error: result.lastError,
        updated_at: now,
      })
      .eq("id", delivery.id)
      .eq("status", "scheduled");

    if (updateError) {
      console.error(
        `[weekly-deliveries] failed to mark delivery ${delivery.id} as sent`,
        updateError
      );
      continue;
    }

    processed += 1;
    sent += result.sentCount;
    if (nextStatus === "failed") {
      failed += 1;
    }
  }

  return {
    processed,
    sent,
    failed,
  };
}
