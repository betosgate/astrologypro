import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// This route is a placeholder for future follow-up template management.
// The follow_up_sequences table is an instance log — sequences are created
// automatically by the cron job when bookings complete.
// This endpoint returns the diviner's follow-up log for use by other clients.

export async function GET(request: NextRequest) {
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
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!diviner) {
      return NextResponse.json({ error: "No diviner found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

    const { data, error } = await supabase
      .from("follow_up_sequences")
      .select(
        "id, step, scheduled_at, sent_at, email_type, created_at, booking_id, client_id"
      )
      .eq("diviner_id", diviner.id)
      .order("scheduled_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Fetch follow_ups error:", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
