import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPaymentIntent } from "@/lib/stripe/connect";
import { PRICING } from "@/lib/constants";

interface BookingPaymentBody {
  divinerId: string;
  serviceId: string;
  scheduledAt: string;
  clientEmail: string;
  clientName: string;
  clientPhone?: string;
  questionnaire: Record<string, string | undefined>;
  affiliateCode?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BookingPaymentBody = await request.json();

    const {
      divinerId,
      serviceId,
      scheduledAt,
      clientEmail,
      clientName,
      clientPhone,
      questionnaire,
      affiliateCode,
    } = body;

    // Validate required fields
    if (!divinerId || !serviceId || !scheduledAt || !clientEmail || !clientName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch diviner with their Stripe Connect account
    const { data: diviner } = await supabase
      .from("diviners")
      .select("id, stripe_account_id, display_name")
      .eq("id", divinerId)
      .eq("is_active", true)
      .single();

    if (!diviner) {
      return NextResponse.json(
        { error: "Diviner not found" },
        { status: 404 }
      );
    }

    if (!diviner.stripe_account_id) {
      return NextResponse.json(
        { error: "Diviner has not set up payments yet" },
        { status: 400 }
      );
    }

    // Fetch the service
    const { data: service } = await supabase
      .from("services")
      .select("id, name, price, duration_minutes")
      .eq("id", serviceId)
      .eq("diviner_id", divinerId)
      .eq("is_active", true)
      .single();

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Upsert client record by email
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .upsert(
        {
          email: clientEmail,
          full_name: clientName,
          phone: clientPhone ?? null,
          diviner_id: divinerId,
        },
        { onConflict: "email,diviner_id" }
      )
      .select("id")
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Failed to create client record" },
        { status: 500 }
      );
    }

    // Calculate end time
    const startTime = new Date(scheduledAt);
    const endTime = new Date(
      startTime.getTime() + service.duration_minutes * 60 * 1000
    );

    // Create booking record with pending status
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        diviner_id: divinerId,
        client_id: client.id,
        service_id: serviceId,
        scheduled_at: scheduledAt,
        end_at: endTime.toISOString(),
        status: "pending",
        price: service.price,
        questionnaire,
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    // Handle affiliate tracking
    if (affiliateCode) {
      const { data: affiliate } = await supabase
        .from("affiliates")
        .select("id")
        .eq("code", affiliateCode)
        .single();

      if (affiliate) {
        await supabase.from("affiliate_referrals").insert({
          affiliate_id: affiliate.id,
          booking_id: booking.id,
          diviner_id: divinerId,
        });
      }
    }

    // Calculate platform fee
    const platformFee =
      (service.price * PRICING.platformFeePercent) / 100;

    // Create Stripe PaymentIntent with destination charge
    const paymentIntent = await createPaymentIntent({
      amount: service.price,
      connectedAccountId: diviner.stripe_account_id,
      platformFeeAmount: platformFee,
      metadata: {
        bookingId: booking.id,
        divinerId,
        serviceId,
        clientEmail,
      },
    });

    // Update booking with payment intent ID
    await supabase
      .from("bookings")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("id", booking.id);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      bookingId: booking.id,
    });
  } catch (err) {
    console.error("Booking payment error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
