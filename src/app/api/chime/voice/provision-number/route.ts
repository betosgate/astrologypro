import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { provisionChimePhoneNumber } from "@/lib/chime-voice";

export const dynamic = "force-dynamic";

/**
 * POST /api/chime/voice/provision-number
 * Admin-only: provision a Chime PSTN phone number for a diviner.
 * Mirrors /api/twilio/provision-number.
 */
export async function POST(request: NextRequest) {
  try {
    const adminEmail = await getAdminUser();
    if (!adminEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { divinerId } = await request.json();

    if (!divinerId) {
      return NextResponse.json(
        { error: "Missing divinerId" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify diviner exists and doesn't already have a Chime number
    const { data: diviner } = await admin
      .from("diviners")
      .select("id, chime_phone_number")
      .eq("id", divinerId)
      .single();

    if (!diviner) {
      return NextResponse.json(
        { error: "Diviner not found" },
        { status: 404 }
      );
    }

    if (diviner.chime_phone_number) {
      return NextResponse.json(
        { error: "Diviner already has a Chime phone number" },
        { status: 409 }
      );
    }

    const result = await provisionChimePhoneNumber(divinerId);

    return NextResponse.json({
      phoneNumber: result.phoneNumber,
      phoneArn: result.phoneArn,
    });
  } catch (error) {
    console.error("Chime provision number error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to provision phone number",
      },
      { status: 500 }
    );
  }
}
