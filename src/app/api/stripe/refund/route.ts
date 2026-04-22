import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";
import { issueBookingRefund } from "@/lib/booking-refund";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

/**
 * Issue a refund for a booking. Only the diviner who owns the booking
 * or an admin can call this endpoint directly. Idempotent via the shared
 * `issueBookingRefund` pipeline — calling twice for the same booking
 * returns `alreadyRefunded=true` with the existing refund details.
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

    const { bookingId, reason } = await request.json();
    const adminUser = await getAdminUser();

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing bookingId" },
        { status: 400 }
      );
    }

    const { data: diviner } = await supabase
      .from("diviners")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!diviner && !adminUser) {
      return NextResponse.json(
        { error: "Only diviners or admins can issue refunds" },
        { status: 403 }
      );
    }

    const admin = createAdminClient();
    const { data: bookingOwner } = await admin
      .from("bookings")
      .select("diviner_id")
      .eq("id", bookingId)
      .maybeSingle();

    if (!bookingOwner) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (!adminUser && bookingOwner.diviner_id !== diviner?.id) {
      return NextResponse.json(
        { error: "You can only refund your own bookings" },
        { status: 403 }
      );
    }

    const result = await issueBookingRefund({
      bookingId,
      initiatedByUserId: user.id,
      initiatedByRole: adminUser ? "admin" : "diviner",
      reason,
    });

    if (result.alreadyRefunded) {
      return NextResponse.json(
        {
          error: "This booking has already been refunded",
          alreadyRefunded: true,
          amount: result.refundAmount,
          refundedAt: result.refundedAt,
          refundReason: result.refundReason,
        },
        { status: 400 }
      );
    }

    if (result.noPayment) {
      return NextResponse.json(
        { error: "No payment found for this booking" },
        { status: 400 }
      );
    }

    if (!result.issued) {
      return NextResponse.json(
        { error: result.error ?? "Failed to process refund" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      refundId: result.refundId,
      amount: result.refundAmount,
      refundedAt: result.refundedAt,
    });
  } catch (error) {
    console.error("[Stripe Refund] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process refund",
      },
      { status: 500 }
    );
  }
}
