import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  provisionChimePhoneNumber,
  releaseChimePhoneNumber,
} from "@/lib/chime-voice";

export const dynamic = "force-dynamic";

// Provisioning polls for order completion for up to 90 s (30 attempts × 3 s).
// The default Next.js Route Handler timeout on Vercel Hobby is 60 s — set
// maxDuration = 120 to allow headroom (requires Vercel Pro or Enterprise).
export const maxDuration = 120; // seconds

/**
 * POST /api/chime/voice/provision-number
 * Admin-only: provision a Chime PSTN phone number for a diviner.
 *
 * Provisioning is a long-running operation (up to 90 s) because it must:
 *   1. Order the phone number
 *   2. Poll GetPhoneNumberOrder until status = "Successful"
 *   3. Fetch the real phone number ARN
 *   4. Create a SIP Rule to route inbound calls to the SMA
 *
 * Errors follow RFC 9457 Problem Details shape.
 * Mirrors /api/twilio/provision-number.
 */
export async function POST(request: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const adminEmail = await getAdminUser();
  if (!adminEmail) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/401",
        title: "Unauthorized",
        status: 401,
        detail: "Admin authentication required",
      },
      { status: 401 }
    );
  }

  // ── Input validation ──────────────────────────────────────────────────────
  let divinerId: string | undefined;
  try {
    const body = await request.json();
    divinerId = body?.divinerId;
  } catch {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Unprocessable Content",
        status: 422,
        detail: "Request body must be valid JSON with a divinerId field",
      },
      { status: 422 }
    );
  }

  if (!divinerId || typeof divinerId !== "string") {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Unprocessable Content",
        status: 422,
        detail: "Missing or invalid divinerId",
        fields: { divinerId: "Required string" },
      },
      { status: 422 }
    );
  }

  // ── Verify diviner exists and has no existing Chime number ────────────────
  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, chime_phone_number")
    .eq("id", divinerId)
    .single();

  if (!diviner) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/404",
        title: "Not Found",
        status: 404,
        detail: `Diviner ${divinerId} not found`,
      },
      { status: 404 }
    );
  }

  if (diviner.chime_phone_number) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/409",
        title: "Conflict",
        status: 409,
        detail: "Diviner already has a Chime phone number",
        phoneNumber: diviner.chime_phone_number,
      },
      { status: 409 }
    );
  }

  // ── Provision (long-running — up to 90 s) ─────────────────────────────────
  try {
    const result = await provisionChimePhoneNumber(divinerId);

    return NextResponse.json(
      {
        phoneNumber: result.phoneNumber,
        phoneArn: result.phoneArn,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Chime provision number error:", error);

    const detail =
      error instanceof Error
        ? error.message
        : "Failed to provision phone number";

    // Distinguish order-polling failures for observability
    const isOrderTimeout =
      error instanceof Error && error.message.includes("ended with status");

    return NextResponse.json(
      {
        type: "https://httpstatuses.io/500",
        title: isOrderTimeout
          ? "Phone Number Order Did Not Complete"
          : "Internal Server Error",
        status: 500,
        detail,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chime/voice/provision-number
 * Admin-only: release a Chime PSTN phone number from a diviner.
 *
 * Release steps (handled inside releaseChimePhoneNumber):
 *   1. Delete the SIP Rule so inbound routing is removed
 *   2. Delete the phone number from the Chime account
 *   3. Clear chime_phone_number, chime_sma_phone_arn, chime_sip_rule_id on diviner
 *
 * Errors follow RFC 9457 Problem Details shape.
 */
export async function DELETE(request: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const adminEmail = await getAdminUser();
  if (!adminEmail) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/401",
        title: "Unauthorized",
        status: 401,
        detail: "Admin authentication required",
      },
      { status: 401 }
    );
  }

  // ── Input validation ──────────────────────────────────────────────────────
  let divinerId: string | undefined;
  try {
    const body = await request.json();
    divinerId = body?.divinerId;
  } catch {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Unprocessable Content",
        status: 422,
        detail: "Request body must be valid JSON with a divinerId field",
      },
      { status: 422 }
    );
  }

  if (!divinerId || typeof divinerId !== "string") {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Unprocessable Content",
        status: 422,
        detail: "Missing or invalid divinerId",
        fields: { divinerId: "Required string" },
      },
      { status: 422 }
    );
  }

  // ── Verify diviner exists and has a Chime number ──────────────────────────
  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, chime_phone_number")
    .eq("id", divinerId)
    .single();

  if (!diviner) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/404",
        title: "Not Found",
        status: 404,
        detail: `Diviner ${divinerId} not found`,
      },
      { status: 404 }
    );
  }

  if (!diviner.chime_phone_number) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/409",
        title: "Conflict",
        status: 409,
        detail: "Diviner does not have a Chime phone number",
      },
      { status: 409 }
    );
  }

  // ── Release ───────────────────────────────────────────────────────────────
  try {
    await releaseChimePhoneNumber(divinerId);
    return NextResponse.json({ released: true });
  } catch (error) {
    console.error("Chime release number error:", error);
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/500",
        title: "Internal Server Error",
        status: 500,
        detail:
          error instanceof Error
            ? error.message
            : "Failed to release phone number",
      },
      { status: 500 }
    );
  }
}
