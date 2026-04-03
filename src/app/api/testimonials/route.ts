import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, divinerId, rating, text, serviceName } = body;

    if (!divinerId || !rating || !text) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // If bookingId provided, look up client name
    let clientName: string | null = null;
    let clientId: string | null = null;

    if (bookingId) {
      const { data: booking } = await admin
        .from("bookings")
        .select("client_id, clients(full_name)")
        .eq("id", bookingId)
        .single();

      if (booking) {
        clientId = booking.client_id;
        const client = booking.clients as any;
        clientName = client?.full_name ?? null;
      }
    }

    const { error } = await admin.from("testimonials").insert({
      diviner_id: divinerId,
      client_id: clientId,
      client_name: clientName ?? "Anonymous",
      booking_id: bookingId ?? null,
      rating,
      text,
      service_type: serviceName ?? null,
      status: "pending",
    });

    if (error) {
      console.error("[Testimonials] Insert error:", error);
      return NextResponse.json(
        { error: "Failed to save review" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
