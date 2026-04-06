import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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
  const googleChannelId = req.headers.get("x-goog-channel-id"); // we store divinerId here

  if (googleChannelId && googleResourceState) {
    if (googleResourceState === "sync") {
      return NextResponse.json({ ok: true }); // sync acknowledgement
    }
    // Event changed — re-fetch and reconcile
    // For now: log and return OK. Full reconciliation requires storing channel→diviner map.
    console.log("[calendar/webhook] Google event change:", {
      googleChannelId,
      googleResourceState,
    });
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
        // Find booking by outlook_calendar_event_id and mark as needing attention
        const admin = createAdminClient();
        const { data: booking } = await admin
          .from("bookings")
          .select("id, status")
          .eq("outlook_calendar_event_id", eventId)
          .maybeSingle();

        if (booking && booking.status === "confirmed") {
          // Log — do NOT auto-cancel, as the diviner may have deleted it by mistake
          console.log(
            "[calendar/webhook] Outlook event deleted for booking:",
            booking.id
          );
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
