import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGoogleCredentials } from "@/lib/calendar/provider-credentials";

export const dynamic = "force-dynamic";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * Refresh a diviner's Google access token using their stored refresh token.
 * Client credentials come from google_api_keys (admin-managed) with env
 * var fallback via getGoogleCredentials().
 */
async function getGoogleAccessToken(ownerId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("calendar_connections")
    .select("refresh_token")
    .eq("owner_id", ownerId)
    .eq("provider", "google")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.refresh_token) return null;

  const creds = await getGoogleCredentials();
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      refresh_token: data.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;
  const tokens = await res.json();
  return tokens.access_token ?? null;
}

/**
 * Reconcile Google Calendar changes for an owner.
 * Fetches recent events and checks if any linked booking's event was cancelled/deleted.
 */
async function reconcileGoogleEvents(ownerId: string): Promise<void> {
  const accessToken = await getGoogleAccessToken(ownerId);
  if (!accessToken) {
    console.warn("[calendar/webhook] Could not get access token for owner:", ownerId);
    return;
  }

  const supabase = createAdminClient();

  // Fetch confirmed bookings for this owner that have a Google event ID
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, google_calendar_event_id, status")
    .eq("owner_id", ownerId)
    .eq("status", "confirmed")
    .not("google_calendar_event_id", "is", null);

  if (!bookings?.length) return;

  // Check each linked event
  for (const booking of bookings) {
    const eventId = booking.google_calendar_event_id;
    if (!eventId) continue;

    try {
      const eventRes = await fetch(
        `${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (eventRes.status === 404 || eventRes.status === 410) {
        // Event was deleted externally
        console.log(
          "[calendar/webhook] Google event deleted externally for booking:",
          booking.id
        );
        await supabase
          .from("bookings")
          .update({ status: "cancelled_by_diviner" }) // TODO: generic status
          .eq("id", booking.id);
        continue;
      }

      if (eventRes.ok) {
        const event = await eventRes.json();
        if (event.status === "cancelled") {
          console.log(
            "[calendar/webhook] Google event cancelled for booking:",
            booking.id
          );
          await supabase
            .from("bookings")
            .update({ status: "cancelled_by_diviner" })
            .eq("id", booking.id);
        }
      }
    } catch (err) {
      console.error(
        "[calendar/webhook] Error checking Google event for booking:",
        booking.id,
        err
      );
    }
  }
}

/**
 * POST /api/webhooks/calendar
 * Receives push notifications from Google Calendar (channel watch) and
 * Microsoft Graph (subscription). Updates booking status if an event
 * is deleted or significantly moved externally.
 *
 * Google sends X-Goog-Channel-ID, X-Goog-Resource-State headers.
 * Microsoft sends a validation token on first setup; subsequent POSTs have JSON body.
 */
export async function POST(req: NextRequest) {
  const supabase = createAdminClient();

  // Microsoft Graph subscription validation (one-time handshake)
  const validationToken = req.nextUrl.searchParams.get("validationToken");
  if (validationToken) {
    return new NextResponse(validationToken, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Google Calendar push notification
  const googleResourceState = req.headers.get("x-goog-resource-state");
  const googleChannelId = req.headers.get("x-goog-channel-id");

  if (googleChannelId && googleResourceState) {
    if (googleResourceState === "sync") {
      return NextResponse.json({ ok: true }); // sync acknowledgement
    }

    // Look up the channel to find the diviner
    const { data: channel } = await supabase
      .from("calendar_webhook_channels")
      .select("diviner_id")
      .eq("channel_id", googleChannelId)
      .maybeSingle();

    if (channel?.diviner_id) {
      await reconcileGoogleEvents(channel.diviner_id);
    } else {
      console.warn(
        "[calendar/webhook] Unknown Google channel_id:",
        googleChannelId
      );
    }

    return NextResponse.json({ ok: true });
  }

  // Microsoft Graph change notification
  let body: {
    value?: Array<{ changeType: string; resourceData?: { id?: string } }>;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  if (body.value?.length) {
    for (const notification of body.value) {
      if (
        notification.changeType === "deleted" &&
        notification.resourceData?.id
      ) {
        const eventId = notification.resourceData.id;
        // Find booking by outlook_calendar_event_id and mark as cancelled
        const { data: booking } = await supabase
          .from("bookings")
          .select("id, status")
          .eq("outlook_calendar_event_id", eventId)
          .maybeSingle();

        if (booking && booking.status === "confirmed") {
          console.log(
            "[calendar/webhook] Outlook event deleted for booking:",
            booking.id
          );
          await supabase
            .from("bookings")
            .update({ status: "cancelled_by_diviner" })
            .eq("id", booking.id);
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}

// Google Calendar sends a GET for validation sometimes
export async function GET(req: NextRequest) {
  const validationToken = req.nextUrl.searchParams.get("validationToken");
  if (validationToken) {
    return new NextResponse(validationToken, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return NextResponse.json({ ok: true });
}
