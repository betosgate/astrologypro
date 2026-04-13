import { createAdminClient } from "@/lib/supabase/admin";
import { buildEmailHtml, infoCard } from "@/lib/email-base";
import { sendEmail } from "@/lib/email";

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
}

interface DivinerRow {
  display_name: string | null;
  username: string | null;
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
  const manageUrl = `${APP_URL}/portal/subscriptions`;

  let sentCount = 0;

  for (const subscriber of subscribers) {
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
      console.error(
        `[weekly-deliveries] failed to send delivery ${delivery.id} to ${subscriber.email}`,
        error
      );
    }
  }

  return sentCount;
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
      .select("id, email, name")
      .eq("diviner_id", params.divinerId)
      .eq("status", "active"),
  ]);

  const subscribers = (subscribersResult.data ?? []) as SubscriberRow[];
  if (!divinerResult.data || subscribers.length === 0) {
    return 0;
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

  for (const delivery of (deliveries ?? []) as DeliveryRow[]) {
    const [divinerResult, subscribersResult] = await Promise.all([
      admin
        .from("diviners")
        .select("display_name, username")
        .eq("id", delivery.diviner_id)
        .single(),
      admin
        .from("weekly_subscription_subscribers")
        .select("id, email, name")
        .eq("diviner_id", delivery.diviner_id)
        .eq("status", "active"),
    ]);

    const diviner = divinerResult.data as DivinerRow | null;
    const subscribers = (subscribersResult.data ?? []) as SubscriberRow[];

    if (!diviner) {
      console.error(
        `[weekly-deliveries] delivery ${delivery.id} skipped because diviner was not found`
      );
      continue;
    }

    const sentCount = await sendDeliveryToSubscribers({
      delivery,
      diviner,
      subscribers,
    });

    const { error: updateError } = await admin
      .from("weekly_subscription_deliveries")
      .update({
        status: "sent",
        sent_at: now,
        recipient_count: sentCount,
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
    sent += sentCount;
  }

  return {
    processed,
    sent,
  };
}
