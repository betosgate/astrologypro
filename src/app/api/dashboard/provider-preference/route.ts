import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/provider-preference
 * Returns the current diviner's video and phone provider preferences.
 * Used by PhoneWidgetLoader to decide which widget to render.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: diviner } = await supabase
      .from("diviners")
      .select("video_provider, phone_provider")
      .eq("user_id", user.id)
      .single();

    if (!diviner) {
      return NextResponse.json(
        { videoProvider: "daily", phoneProvider: "twilio" },
        { status: 200 }
      );
    }

    return NextResponse.json({
      videoProvider: diviner.video_provider ?? "daily",
      phoneProvider: diviner.phone_provider ?? "twilio",
    });
  } catch {
    return NextResponse.json(
      { videoProvider: "daily", phoneProvider: "twilio" },
      { status: 200 }
    );
  }
}
