import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

// VAPID keys identify our server to push services (Google, Apple, Mozilla)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:support@astrologypro.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  url?: string;
  phoneSessionId?: string;
  requireInteraction?: boolean;
}

/**
 * Send a Web Push notification to all of a diviner's subscribed devices.
 * Automatically cleans up expired/invalid subscriptions.
 */
export async function sendPushToDiv(
  divinerId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number; cleaned: number }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("[web-push] VAPID keys not configured — skipping push");
    return { sent: 0, failed: 0, cleaned: 0 };
  }

  const admin = createAdminClient();

  // Fetch all push subscriptions for this diviner
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("diviner_id", divinerId);

  if (!subscriptions || subscriptions.length === 0) {
    console.log("[web-push] No subscriptions for diviner:", divinerId);
    return { sent: 0, failed: 0, cleaned: 0 };
  }

  const payloadString = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  let cleaned = 0;
  const expiredIds: string[] = [];

  // Send to all devices in parallel
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payloadString,
          { TTL: 60 } // Notification expires after 60 seconds (call may be gone)
        );

        // Update last_used_at
        await admin
          .from("push_subscriptions")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", sub.id);

        return { status: "sent" as const, id: sub.id };
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        // 404 or 410 = subscription expired/unsubscribed, clean it up
        if (statusCode === 404 || statusCode === 410) {
          expiredIds.push(sub.id);
          return { status: "expired" as const, id: sub.id };
        }
        console.error(
          "[web-push] Failed to send to endpoint:",
          sub.endpoint.slice(0, 60),
          "error:",
          err
        );
        return { status: "failed" as const, id: sub.id };
      }
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      if (result.value.status === "sent") sent++;
      else if (result.value.status === "expired") cleaned++;
      else failed++;
    } else {
      failed++;
    }
  }

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    await admin
      .from("push_subscriptions")
      .delete()
      .in("id", expiredIds);
    console.log("[web-push] Cleaned", expiredIds.length, "expired subscriptions");
  }

  console.log(
    `[web-push] diviner=${divinerId} sent=${sent} failed=${failed} cleaned=${cleaned}`
  );
  return { sent, failed, cleaned };
}
