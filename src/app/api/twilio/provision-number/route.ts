import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { provisionPhoneNumber } from "@/lib/twilio-voice";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a diviner
    const { data: diviner, error: divinerError } = await supabase
      .from("diviners")
      .select("id, twilio_phone_number")
      .eq("user_id", user.id)
      .single();

    if (divinerError || !diviner) {
      return NextResponse.json(
        { error: "Only diviners can provision phone numbers" },
        { status: 403 }
      );
    }

    if (diviner.twilio_phone_number) {
      return NextResponse.json(
        { error: "You already have a phone number provisioned" },
        { status: 400 }
      );
    }

    const result = await provisionPhoneNumber(diviner.id);

    return NextResponse.json({ phoneNumber: result.phoneNumber });
  } catch (error) {
    console.error("[Twilio Provision] Error:", error);
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
