import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import * as crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Authenticated route that generates a Twilio Access Token for the browser Voice SDK.
 * Diviners use this token to receive incoming calls via Twilio Client in the browser.
 *
 * Requires env vars:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_API_KEY_SID      (create at console.twilio.com/account/keys)
 *   TWILIO_API_KEY_SECRET
 *   TWILIO_TWIML_APP_SID   (optional — for outgoing calls)
 *
 * Returns 503 if keys not configured; the widget silently hides itself.
 */
export async function GET() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKeySid = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  const twimlAppSid = process.env.TWILIO_TWIML_APP_SID ?? "";

  if (!accountSid || !apiKeySid || !apiKeySecret) {
    return NextResponse.json(
      {
        error: "token_unavailable",
        message: "Voice token service is not configured.",
      },
      { status: 503 }
    );
  }

  // Require authenticated Supabase session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Look up the diviner record for this user
  const admin = createAdminClient();
  const { data: diviner, error: divinerError } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (divinerError || !diviner) {
    return NextResponse.json(
      { error: "Only diviners can request a voice token" },
      { status: 403 }
    );
  }

  const identity = `diviner-${diviner.id}`;
  const now = Math.floor(Date.now() / 1000);
  const ttl = 3600;

  // JWT header — Twilio requires cty: "twilio-fpa;v=1"
  const header = {
    alg: "HS256" as const,
    typ: "JWT",
    cty: "twilio-fpa;v=1",
  };

  // Voice grant
  const voiceGrant: Record<string, unknown> = {
    incoming: { allow: true },
  };
  if (twimlAppSid) {
    voiceGrant.outgoing = { application_sid: twimlAppSid };
  }

  // Payload
  const payload = {
    jti: `${apiKeySid}-${now}`,
    iss: apiKeySid,
    sub: accountSid,
    nbf: now,
    exp: now + ttl,
    grants: {
      identity,
      voice: voiceGrant,
    },
  };

  const token = buildJwt(header, payload, apiKeySecret);

  return NextResponse.json({ token, identity });
}

function b64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildJwt(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  secret: string
): string {
  const signingInput = `${b64url(header)}.${b64url(payload)}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(signingInput)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `${signingInput}.${signature}`;
}
