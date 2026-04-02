import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateShareId } from "@/lib/format";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Verify webhook authenticity if secret is configured
    const webhookSecret = process.env.DAILY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get("x-webhook-signature");
      if (!signature || signature !== webhookSecret) {
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(body);
    const eventType: string = payload.type;

    if (eventType === "recording.ready-to-download") {
      const roomName: string | undefined = payload.payload?.room_name;
      const recordingUrl: string | undefined =
        payload.payload?.download_link ?? payload.payload?.url;

      if (!roomName || !recordingUrl) {
        console.error("Missing room_name or recording URL in webhook payload");
        return NextResponse.json({ received: true });
      }

      const admin = createAdminClient();
      const shareId = generateShareId();

      const { error } = await admin
        .from("bookings")
        .update({
          recording_url: recordingUrl,
          recording_share_id: shareId,
        })
        .eq("daily_room_name", roomName);

      if (error) {
        console.error("Failed to update booking with recording:", error);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Daily webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
