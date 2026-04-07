import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Called by the session-room client when a participant gives recording consent
 * and joins the Daily.co room.  Marks diviner_joined_at or client_joined_at on
 * the booking so the no-show cron can determine who was present.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, role } = await request.json();

    if (!bookingId || !role) {
      return NextResponse.json({ error: "Missing bookingId or role" }, { status: 400 });
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();

    const field =
      role === "diviner" ? "diviner_joined_at" : "client_joined_at";

    await admin
      .from("bookings")
      .update({ [field]: now })
      .eq("id", bookingId)
      .is(field, null); // only set once per session

    // If both parties have now joined, stamp confirmed_at
    const otherField =
      role === "diviner" ? "client_joined_at" : "diviner_joined_at";

    const { data: bookingRaw } = await admin
      .from("bookings")
      .select("id, confirmed_at, " + otherField)
      .eq("id", bookingId)
      .single();

    const booking = bookingRaw as unknown as Record<string, string | null> | null;

    if (booking && !booking["confirmed_at"] && booking[otherField]) {
      await admin
        .from("bookings")
        .update({ confirmed_at: now, billing_status: "pending" })
        .eq("id", bookingId);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[participant-joined]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
