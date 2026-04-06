import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;

function twilioHeaders(): HeadersInit {
  const credentials = Buffer.from(
    `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`
  ).toString("base64");
  return {
    Authorization: `Basic ${credentials}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

/**
 * Notify route — triggers an outbound call to the diviner when a client
 * enters their queue. Protected by CRON_SECRET bearer token.
 */
export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { diviner_id, queue_name, client_call_sid } = body as {
      diviner_id: string;
      queue_name: string;
      client_call_sid: string;
    };

    if (!diviner_id || !queue_name) {
      return NextResponse.json(
        { error: "Missing diviner_id or queue_name" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: diviner, error } = await supabase
      .from("diviners")
      .select("id, phone_mobile, phone_answer_mode, twilio_phone_number")
      .eq("id", diviner_id)
      .single();

    if (error || !diviner) {
      return NextResponse.json({ error: "Diviner not found" }, { status: 404 });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const fromNumber = process.env.TWILIO_PHONE_NUMBER!;
    const dequeueUrl = `${appUrl}/api/twilio/voice/dequeue?diviner_id=${diviner_id}`;
    const statusCallbackUrl = `${appUrl}/api/twilio/voice/status`;

    const mode: string = diviner.phone_answer_mode ?? "both";
    const methods: string[] = [];

    const callsUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;

    // Notify via mobile call
    if (
      (mode === "mobile" || mode === "both") &&
      diviner.phone_mobile
    ) {
      const body = new URLSearchParams({
        To: diviner.phone_mobile,
        From: fromNumber,
        Url: dequeueUrl,
        StatusCallback: statusCallbackUrl,
        StatusCallbackMethod: "POST",
      });

      const res = await fetch(callsUrl, {
        method: "POST",
        headers: twilioHeaders(),
        body: body.toString(),
      });

      if (res.ok) {
        methods.push("mobile");
      } else {
        const errText = await res.text();
        console.error("[Twilio Notify] Mobile call failed:", errText);
      }
    }

    // Notify via browser (Twilio Client SDK)
    if (mode === "browser" || mode === "both") {
      const browserBody = new URLSearchParams({
        To: `client:diviner-${diviner_id}`,
        From: fromNumber,
        Url: dequeueUrl,
      });

      const res = await fetch(callsUrl, {
        method: "POST",
        headers: twilioHeaders(),
        body: browserBody.toString(),
      });

      if (res.ok) {
        methods.push("browser");
      } else {
        const errText = await res.text();
        console.error("[Twilio Notify] Browser call failed:", errText);
      }
    }

    console.log(
      `[Twilio Notify] Diviner ${diviner_id} notified via: ${methods.join(", ")} (client_call_sid: ${client_call_sid})`
    );

    return NextResponse.json({ notified: true, methods });
  } catch (error) {
    console.error("[Twilio Notify] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
