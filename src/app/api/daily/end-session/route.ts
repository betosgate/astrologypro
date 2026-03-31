import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRICING } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, actualDurationMinutes } = await request.json();

    if (!bookingId || actualDurationMinutes == null) {
      return NextResponse.json(
        { error: "Missing bookingId or actualDurationMinutes" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Fetch booking with service info
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("id, diviner_id, amount, duration, services(duration_minutes)")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Verify the user is the diviner
    const { data: diviner } = await admin
      .from("diviners")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!diviner || diviner.id !== booking.diviner_id) {
      return NextResponse.json(
        { error: "Only the diviner can end a session" },
        { status: 403 }
      );
    }

    // Calculate overage
    const scheduledDuration =
      (booking.services as any)?.duration_minutes ?? booking.duration ?? 60;
    const overageMinutes = Math.max(
      0,
      actualDurationMinutes - scheduledDuration
    );
    const overageAmount = Math.round(
      overageMinutes * PRICING.overagePerMinute * 100
    ); // in cents
    const totalAmount = (booking.amount ?? 0) + overageAmount;

    // Update booking to completed
    const { error: updateError } = await admin
      .from("bookings")
      .update({
        status: "completed",
        actual_duration_minutes: Math.round(actualDurationMinutes),
        overage_amount: overageAmount,
        total_amount: totalAmount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (updateError) {
      console.error("Failed to update booking:", updateError);
      return NextResponse.json(
        { error: "Failed to complete session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "completed",
      actualDurationMinutes: Math.round(actualDurationMinutes),
      overageMinutes,
      overageAmount,
      totalAmount,
    });
  } catch (error) {
    console.error("End session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
