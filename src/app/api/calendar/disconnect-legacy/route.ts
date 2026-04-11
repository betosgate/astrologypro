import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider } = await request.json();

  if (!provider || !["google", "microsoft"].includes(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  const admin = createAdminClient();
  const column =
    provider === "google"
      ? "google_calendar_token"
      : "outlook_calendar_token";

  const { error } = await admin
    .from("diviners")
    .update({ [column]: null })
    .eq("user_id", user.id);

  if (error) {
    console.error("[disconnect-legacy] Error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect legacy calendar" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
